# Potluck Signup App Restart Script
# This script stops all running processes and restarts the application in the correct sequence

Write-Host "Potluck App Restart Script Starting..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false  # Port is free
    } catch {
        return $true   # Port is in use
    }
}

# Function to wait for a port to become available
function Wait-ForPortFree {
    param([int]$Port, [int]$TimeoutSeconds = 10)
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Test-Port $Port) -and (Get-Date) -lt $timeout) {
        Start-Sleep -Milliseconds 500
    }
}

# Function to wait for a port to be occupied (service started)
function Wait-ForPortOccupied {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    while (!(Test-Port $Port) -and (Get-Date) -lt $timeout) {
        Start-Sleep -Milliseconds 500
    }
}

# Step 1: Stop all Node.js processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "   No Node.js processes found or already stopped" -ForegroundColor DarkYellow
}

# Step 2: Stop any processes using our ports
Write-Host "Step 2: Freeing up ports 3000 and 3001..." -ForegroundColor Yellow

# Kill processes on port 3000 (frontend)
$port3000Processes = netstat -ano | findstr ":3000" | ForEach-Object { ($_ -split '\s+')[4] } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
foreach ($pid in $port3000Processes) {
    if ($pid -and $pid -ne "0") {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   Stopped process $pid using port 3000" -ForegroundColor Green
        } catch {
            Write-Host "   Could not stop process $pid" -ForegroundColor DarkYellow
        }
    }
}

# Kill processes on port 3001 (backend)
$port3001Processes = netstat -ano | findstr ":3001" | ForEach-Object { ($_ -split '\s+')[4] } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
foreach ($pid in $port3001Processes) {
    if ($pid -and $pid -ne "0") {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   Stopped process $pid using port 3001" -ForegroundColor Green
        } catch {
            Write-Host "   Could not stop process $pid" -ForegroundColor DarkYellow
        }
    }
}

# Wait for ports to be free
Write-Host "Waiting for ports to be released..." -ForegroundColor Cyan
Wait-ForPortFree -Port 3000 -TimeoutSeconds 10
Wait-ForPortFree -Port 3001 -TimeoutSeconds 10

# Step 3: Verify database file exists
Write-Host "Step 3: Checking database..." -ForegroundColor Yellow
$dbPath = "c:\apps\potluck-signup\backend\potluck.db"
if (Test-Path $dbPath) {
    Write-Host "   Database file found: $dbPath" -ForegroundColor Green
} else {
    Write-Host "   Database file not found: $dbPath" -ForegroundColor Red
    Write-Host "   Database will be created when backend starts" -ForegroundColor DarkYellow
}

# Step 4: Start Backend Server
Write-Host "Step 4: Starting Backend Server (port 3001)..." -ForegroundColor Yellow
Set-Location "c:\apps\potluck-signup\backend"
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized -PassThru
Start-Sleep -Seconds 3

# Wait for backend to start
Wait-ForPortOccupied -Port 3001 -TimeoutSeconds 30
if (Test-Port 3001) {
    Write-Host "   Backend server started successfully on port 3001" -ForegroundColor Green
} else {
    Write-Host "   Backend server failed to start on port 3001" -ForegroundColor Red
    Write-Host "   Check the backend logs for errors" -ForegroundColor DarkYellow
    exit 1
}

# Step 5: Start Frontend Server
Write-Host "Step 5: Starting Frontend Server (port 3000)..." -ForegroundColor Yellow
Set-Location "c:\apps\potluck-signup\frontend"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized -PassThru
Start-Sleep -Seconds 5

# Wait for frontend to start
Wait-ForPortOccupied -Port 3000 -TimeoutSeconds 60
if (Test-Port 3000) {
    Write-Host "   Frontend server started successfully on port 3000" -ForegroundColor Green
} else {
    Write-Host "   Frontend server failed to start on port 3000" -ForegroundColor Red
    Write-Host "   Check the frontend logs for errors" -ForegroundColor DarkYellow
    exit 1
}

# Step 6: Final verification and success message
Write-Host "Step 6: Final verification..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$backendRunning = Test-Port 3001
$frontendRunning = Test-Port 3000

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "POTLUCK APP RESTART COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Status Summary:" -ForegroundColor White
Write-Host "   Backend (port 3001):  $(if($backendRunning){'RUNNING'}else{'STOPPED'})" -ForegroundColor $(if($backendRunning){'Green'}else{'Red'})
Write-Host "   Frontend (port 3000): $(if($frontendRunning){'RUNNING'}else{'STOPPED'})" -ForegroundColor $(if($frontendRunning){'Green'}else{'Red'})
Write-Host ""
Write-Host "Access your app at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API endpoint at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Both servers are running in minimized windows" -ForegroundColor DarkYellow
Write-Host "To stop the app, run this script again or use Task Manager" -ForegroundColor DarkYellow
Write-Host "================================================" -ForegroundColor Cyan

# Return to original directory
Set-Location "c:\apps\potluck-signup"

# Optional: Open browser
$openBrowser = Read-Host "Would you like to open the app in your browser? (y/n)"
if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
    Start-Process "http://localhost:3000"
    Write-Host "Browser opened to http://localhost:3000" -ForegroundColor Green
}

Write-Host "Script completed successfully!" -ForegroundColor Green