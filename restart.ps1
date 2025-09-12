# Potluck Signup App Restart Script
# This script stops all running processes and restarts the application in the correct sequence

Write-Host "Potluck App Restart Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Get current directory
$currentDir = Get-Location
Write-Host "Working directory: $currentDir" -ForegroundColor Blue

# Function to kill process on specific port using netstat
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow
    
    try {
        # Get all TCP connections on the specified port using Get-NetTCPConnection if available
        try {
            $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($connections) {
                Write-Host "Found connections on port ${Port} using Get-NetTCPConnection" -ForegroundColor Gray
                $processIds = $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
                
                foreach ($pid in $processIds) {
                    if ($pid -and $pid -ne 0) {
                        try {
                            Write-Host "Killing process $pid on port $Port" -ForegroundColor Red
                            Stop-Process -Id $pid -Force -ErrorAction Stop
                            Write-Host "Successfully killed process $pid" -ForegroundColor Green
                        }
                        catch {
                            Write-Host "Failed to kill process ${pid}: $_" -ForegroundColor Yellow
                        }
                    }
                }
            } else {
                Write-Host "No connections found on port $Port using Get-NetTCPConnection" -ForegroundColor Green
            }
        }
        catch {
            # Fallback to netstat if Get-NetTCPConnection fails
            Write-Host "Fallback to netstat for port $Port..." -ForegroundColor Gray
            
            $netstatOutput = netstat -ano | Select-String ":$Port "
            
            if ($netstatOutput) {
                Write-Host "Found connections on port ${Port} using netstat:" -ForegroundColor Gray
                $netstatOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                
                $processIds = $netstatOutput | ForEach-Object { 
                    $line = $_.ToString()
                    $fields = $line -split '\s+'
                    if ($fields.Length -ge 5) { 
                        $pid = $fields[-1]  # Last field is usually the PID
                        if ($pid -match '^\d+$' -and $pid -ne "0") {
                            return [int]$pid
                        }
                    }
                } | Sort-Object -Unique
                
                if ($processIds) {
                    foreach ($pid in $processIds) {
                        try {
                            Write-Host "Killing process $pid on port $Port" -ForegroundColor Red
                            Stop-Process -Id $pid -Force -ErrorAction Stop
                            Write-Host "Successfully killed process $pid" -ForegroundColor Green
                        }
                        catch {
                            Write-Host "Failed to kill process ${pid}: $_" -ForegroundColor Yellow
                        }
                    }
                } else {
                    Write-Host "No valid process IDs found in netstat output" -ForegroundColor Yellow
                }
            } else {
                Write-Host "No process found on port $Port" -ForegroundColor Green
            }
        }
        
        # Wait and verify
        Start-Sleep -Seconds 3
        
        # Final verification
        try {
            $remainingConnections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($remainingConnections) {
                Write-Host "Warning: Some connections still exist on port $Port" -ForegroundColor Yellow
            } else {
                Write-Host "Port $Port is now free" -ForegroundColor Green
            }
        }
        catch {
            # If Get-NetTCPConnection fails, use netstat
            $remainingConnections = netstat -ano | Select-String ":$Port "
            if ($remainingConnections) {
                Write-Host "Warning: Some connections still exist on port $Port" -ForegroundColor Yellow
            } else {
                Write-Host "Port $Port is now free" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "Error checking port ${Port}: $_" -ForegroundColor Red
    }
}

# Function to test if server is responding
function Test-ServerResponse {
    param([string]$Url, [int]$TimeoutSec = 2)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Function to wait for server to be ready
function Wait-ForServer {
    param([string]$Url, [string]$Name, [int]$MaxAttempts = 30)
    
    Write-Host "Waiting for $Name to start at $Url..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        if (Test-ServerResponse -Url $Url) {
            Write-Host "$Name is ready!" -ForegroundColor Green
            return $true
        }
        
        Write-Host "   Attempt $i/$MaxAttempts - waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    Write-Host "$Name failed to start within expected time" -ForegroundColor Red
    return $false
}

# Kill existing processes
Write-Host ""
Write-Host "Cleaning up existing processes..." -ForegroundColor Magenta
Kill-ProcessOnPort -Port 3001
Kill-ProcessOnPort -Port 3000

# Additional cleanup - stop all node processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No Node.js processes found" -ForegroundColor Blue
}

Start-Sleep -Seconds 2

# Check database
Write-Host ""
Write-Host "Checking database..." -ForegroundColor Magenta
$dbPath = Join-Path $currentDir "backend\potluck.db"
if (Test-Path $dbPath) {
    Write-Host "Database file found: $dbPath" -ForegroundColor Green
} else {
    Write-Host "Database file not found - will be created on first run" -ForegroundColor Blue
}

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $currentDir "backend"
Set-Location $backendPath

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found in backend directory" -ForegroundColor Red
    Set-Location $currentDir
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start backend in background job with better error handling
$backendJob = Start-Job -ScriptBlock {
    param($BackendPath)
    Set-Location $BackendPath
    try {
        Write-Output "Starting backend server at $(Get-Date)"
        node index.js 2>&1
    }
    catch {
        Write-Output "Backend startup error: $_"
        throw $_
    }
} -ArgumentList $backendPath

# Give backend a moment to start
Start-Sleep -Seconds 5

# Check if backend job is still running
$jobState = Get-Job -Id $backendJob.Id
if ($jobState.State -eq "Failed") {
    Write-Host "Backend job failed to start. Error details:" -ForegroundColor Red
    $jobOutput = Receive-Job -Id $backendJob.Id
    Write-Host $jobOutput -ForegroundColor Red
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Set-Location $currentDir
    exit 1
}

# Wait for backend to be ready
if (Wait-ForServer -Url "http://localhost:3001/api/potlucks" -Name "Backend") {
    Write-Host "Backend is running on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "Backend failed to start. Checking job output..." -ForegroundColor Red
    $jobOutput = Receive-Job -Id $backendJob.Id
    if ($jobOutput) {
        Write-Host "Backend output:" -ForegroundColor Yellow
        Write-Host $jobOutput -ForegroundColor Gray
    }
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Set-Location $currentDir
    exit 1
}

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = Join-Path $currentDir "frontend"
Set-Location $frontendPath

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found in frontend directory" -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Set-Location $currentDir
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Double-check port 3000 is clear
Kill-ProcessOnPort -Port 3000

# Start frontend
Write-Host "Starting React development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API is running at http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start frontend (this will block until Ctrl+C)
try {
    npm start
}
finally {
    # Cleanup: Stop backend job when frontend stops
    Write-Host ""
    Write-Host "Stopping backend server..." -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    
    # Final cleanup of ports
    Kill-ProcessOnPort -Port 3001
    Kill-ProcessOnPort -Port 3000
    
    # Return to original directory
    Set-Location $currentDir
    
    Write-Host "All servers stopped" -ForegroundColor Green
}