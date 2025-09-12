# Potluck Data Backup & Restore Script
# Created: September 12, 2025
# This script can backup current data state and restore it if data is lost

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore", "status")]
    [string]$Action,
    
    [string]$BackupFile = "potluck-backup.json",
    [string]$ApiUrl = "https://potluck-signup-7eed.onrender.com"
)

function Get-CurrentDataState {
    Write-Host "Capturing current data state..." -ForegroundColor Green
    
    try {
        # Get all potlucks
        $potlucks = Invoke-WebRequest -Uri "$ApiUrl/potlucks" -UseBasicParsing | ConvertFrom-Json
        
        $dataState = @{
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            potlucks = @()
        }
        
        foreach ($potluck in $potlucks) {
            Write-Host "  Processing Potluck $($potluck.id): $($potluck.name)" -ForegroundColor Yellow
            
            # Get menu items
            $menu = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($potluck.id)/menu" -UseBasicParsing | ConvertFrom-Json
            
            # Get guests
            $guests = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($potluck.id)/guests" -UseBasicParsing | ConvertFrom-Json
            
            $potluckData = @{
                id = $potluck.id
                name = $potluck.name
                date = $potluck.date
                menu = $menu
                guests = $guests
            }
            
            $dataState.potlucks += $potluckData
        }
        
        return $dataState
    }
    catch {
        Write-Error "Failed to capture data state: $_"
        return $null
    }
}

function Save-BackupFile {
    param($DataState, $FilePath)
    
    try {
        $DataState | ConvertTo-Json -Depth 10 | Out-File -FilePath $FilePath -Encoding UTF8
        Write-Host "Backup saved to: $FilePath" -ForegroundColor Green
        
        # Display summary
        $potluckCount = $DataState.potlucks.Count
        $totalGuests = ($DataState.potlucks | ForEach-Object { $_.guests.Count } | Measure-Object -Sum).Sum
        $totalMenuItems = ($DataState.potlucks | ForEach-Object { $_.menu.Count } | Measure-Object -Sum).Sum
        
        Write-Host "Backup Summary:" -ForegroundColor Cyan
        Write-Host "  Potlucks: $potluckCount" -ForegroundColor White
        Write-Host "  Total Guests: $totalGuests" -ForegroundColor White
        Write-Host "  Total Menu Items: $totalMenuItems" -ForegroundColor White
        Write-Host "  Timestamp: $($DataState.timestamp)" -ForegroundColor White
    }
    catch {
        Write-Error "Failed to save backup: $_"
    }
}

function Restore-FromBackup {
    param($FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Error "Backup file not found: $FilePath"
        return
    }
    
    try {
        Write-Host "Loading backup from: $FilePath" -ForegroundColor Green
        $backupData = Get-Content $FilePath -Raw | ConvertFrom-Json
        
        Write-Host "Backup created: $($backupData.timestamp)" -ForegroundColor Yellow
        
        # Clear existing data first
        Write-Host "Clearing existing data..." -ForegroundColor Red
        try {
            Invoke-WebRequest -Uri "$ApiUrl/reset" -Method DELETE -UseBasicParsing | Out-Null
            Write-Host "Existing data cleared" -ForegroundColor Green
        }
        catch {
            Write-Warning "Could not clear existing data (API might not support reset): $_"
        }
        
        # Restore each potluck
        foreach ($potluck in $backupData.potlucks) {
            Write-Host "Restoring Potluck: $($potluck.name)" -ForegroundColor Cyan
            
            # Create potluck
            $potluckBody = @{
                name = $potluck.name
                date = $potluck.date
                menuItems = @($potluck.menu | ForEach-Object { $_.dish })
            } | ConvertTo-Json -Depth 3
            
            $newPotluck = Invoke-WebRequest -Uri "$ApiUrl/potlucks" -Method POST -Body $potluckBody -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
            $newPotluckId = $newPotluck.id
            
            Write-Host "  Created potluck with ID: $newPotluckId" -ForegroundColor Green
            
            # Add guests
            foreach ($guest in $potluck.guests) {
                $guestBody = @{
                    name = $guest.name
                    family_count = $guest.family_count
                } | ConvertTo-Json
                
                $newGuest = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$newPotluckId/guests" -Method POST -Body $guestBody -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
                Write-Host "    Added guest: $($guest.name)" -ForegroundColor White
                
                # Restore dish selections
                if ($guest.dish_ids -and $guest.dish_ids.Count -gt 0) {
                    for ($i = 0; $i -lt $guest.dish_ids.Count; $i++) {
                        $dishId = $guest.dish_ids[$i]
                        $quantity = if ($guest.quantities -and $i -lt $guest.quantities.Count) { $guest.quantities[$i] } else { 1 }
                        
                        $dishBody = @{
                            name = $guest.name
                            dish_id = $dishId
                            quantity = $quantity
                        } | ConvertTo-Json
                        
                        try {
                            Invoke-WebRequest -Uri "$ApiUrl/potlucks/$newPotluckId/guests" -Method POST -Body $dishBody -ContentType "application/json" -UseBasicParsing | Out-Null
                            $dishName = ($potluck.menu | Where-Object { $_.id -eq $dishId }).dish
                            Write-Host "      Restored dish selection: $dishName (qty: $quantity)" -ForegroundColor Gray
                        }
                        catch {
                            Write-Warning "      Failed to restore dish selection for $($guest.name): $_"
                        }
                    }
                }
            }
        }
        
        Write-Host "Restore completed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to restore from backup: $_"
    }
}

function Show-Status {
    Write-Host "Current Potluck Status" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    
    try {
        $potlucks = Invoke-WebRequest -Uri "$ApiUrl/potlucks" -UseBasicParsing | ConvertFrom-Json
        
        if ($potlucks.Count -eq 0) {
            Write-Host "No potlucks found" -ForegroundColor Red
            return
        }
        
        foreach ($potluck in $potlucks) {
            Write-Host "Potluck $($potluck.id): $($potluck.name) ($($potluck.date))" -ForegroundColor Yellow
            
            $menu = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($potluck.id)/menu" -UseBasicParsing | ConvertFrom-Json
            $guests = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($potluck.id)/guests" -UseBasicParsing | ConvertFrom-Json
            
            Write-Host "  Menu Items: $($menu.Count)" -ForegroundColor White
            Write-Host "  Guests: $($guests.Count)" -ForegroundColor White
            
            $signedUpGuests = $guests | Where-Object { $_.dish_ids -and $_.dish_ids.Count -gt 0 }
            Write-Host "  Guests with dish selections: $($signedUpGuests.Count)" -ForegroundColor Green
            
            Write-Host ""
        }
    }
    catch {
        Write-Error "Failed to get status: $_"
    }
}

# Main execution
switch ($Action) {
    "backup" {
        Write-Host "Starting backup process..." -ForegroundColor Green
        $dataState = Get-CurrentDataState
        if ($dataState) {
            Save-BackupFile -DataState $dataState -FilePath $BackupFile
        }
    }
    
    "restore" {
        Write-Host "Starting restore process..." -ForegroundColor Green
        Write-Host "WARNING: This will overwrite existing data!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure you want to continue? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Restore-FromBackup -FilePath $BackupFile
        } else {
            Write-Host "Restore cancelled" -ForegroundColor Yellow
        }
    }
    
    "status" {
        Show-Status
    }
}