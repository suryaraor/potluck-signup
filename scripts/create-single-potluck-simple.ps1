# Create exactly one potluck with all data
$ApiUrl = "https://potluck-signup-7eed.onrender.com"

Write-Host "Creating single potluck with complete data..." -ForegroundColor Cyan

try {
    # Clear existing data
    Write-Host "Clearing existing data..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$ApiUrl/api/clear-all-data" -Method POST -ContentType "application/json"
    Write-Host "Data cleared successfully" -ForegroundColor Green

    # Create one potluck
    Write-Host "Creating potluck..." -ForegroundColor Cyan
    $potluckData = @{
        name = "Community Potluck"
        date = "2024-12-28"
        description = "Join us for a wonderful community potluck dinner!"
        location = "Community Center"
    } | ConvertTo-Json
    
    $newPotluck = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks" -Method POST -Body $potluckData -ContentType "application/json"
    $potluckId = $newPotluck.id
    Write-Host "Created potluck ID: $potluckId" -ForegroundColor Green

    # Add menu items
    Write-Host "Adding menu items..." -ForegroundColor Cyan
    $menuItems = @("sambaar", "tomoto chutney", "plain rice", "curd", "papad", "pongal", "vada", "chutney", "payasam", "pickle")
    
    foreach ($item in $menuItems) {
        $menuData = @{
            potluck_id = $potluckId
            name = $item
            category = "Main"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$ApiUrl/api/menu-items" -Method POST -Body $menuData -ContentType "application/json"
        Write-Host "Added: $item" -ForegroundColor White
    }

    # Add guests
    Write-Host "Adding guests..." -ForegroundColor Cyan
    $guests = @("Somil", "Kiran", "Arpita", "Teja", "Lakshman", "Sachin", "Sheetal", "Dhanashree", "Yogini", "Surya")
    
    foreach ($guestName in $guests) {
        $familyCount = if ($guestName -eq "Surya") { 4 } else { 1 }
        $guestData = @{
            potluck_id = $potluckId
            name = $guestName
            email = "$($guestName.ToLower())@example.com"
            family_count = $familyCount
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$ApiUrl/api/guests" -Method POST -Body $guestData -ContentType "application/json"
        Write-Host "Added: $guestName (Family: $familyCount)" -ForegroundColor White
    }

    # Add Surya's dishes
    Write-Host "Adding Surya's dish selections..." -ForegroundColor Cyan
    $allGuests = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks/$potluckId/guests" -Method GET
    $suryaGuest = $allGuests | Where-Object { $_.name -eq "Surya" }
    $suryaGuestId = $suryaGuest.id
    
    $allMenuItems = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks/$potluckId/menu-items" -Method GET
    $suryaDishes = @("sambaar", "tomoto chutney", "plain rice", "curd", "papad")
    
    foreach ($dishName in $suryaDishes) {
        $menuItem = $allMenuItems | Where-Object { $_.name -eq $dishName }
        if ($menuItem) {
            $dishData = @{
                guest_id = $suryaGuestId
                menu_item_id = $menuItem.id
                quantity = 1
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$ApiUrl/api/guest-dishes" -Method POST -Body $dishData -ContentType "application/json"
            Write-Host "Surya selected: $dishName" -ForegroundColor White
        }
    }

    Write-Host ""
    Write-Host "Successfully created single potluck!" -ForegroundColor Green
    Write-Host "Potluck ID: $potluckId" -ForegroundColor Cyan
    Write-Host "App URL: https://potluck-signup.vercel.app/potluck/$potluckId" -ForegroundColor Yellow

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}