# Create exactly one potluck with all data
$ApiUrl = "https://potluck-signup-7eed.onrender.com"

Write-Host "Creating single potluck with complete data..." -ForegroundColor Cyan

try {
    # Get existing potlucks to delete them
    Write-Host "Getting existing potlucks..." -ForegroundColor Yellow
    $existingPotlucks = Invoke-RestMethod -Uri "$ApiUrl/potlucks" -Method GET
    
    Write-Host "Found $($existingPotlucks.Count) existing potlucks" -ForegroundColor White
    
    # Delete each existing potluck
    foreach ($potluck in $existingPotlucks) {
        Write-Host "Deleting potluck: $($potluck.name)" -ForegroundColor Yellow
        Invoke-RestMethod -Uri "$ApiUrl/potlucks/$($potluck.id)" -Method DELETE
    }
    Write-Host "All existing potlucks deleted" -ForegroundColor Green

    # Create one new potluck
    Write-Host "Creating new potluck..." -ForegroundColor Cyan
    $potluckData = @{
        name = "Community Potluck"
        date = "2024-12-28"
        description = "Join us for a wonderful community potluck dinner!"
        location = "Community Center"
    } | ConvertTo-Json
    
    $newPotluck = Invoke-RestMethod -Uri "$ApiUrl/potlucks" -Method POST -Body $potluckData -ContentType "application/json"
    $potluckId = $newPotluck.id
    Write-Host "Created potluck ID: $potluckId" -ForegroundColor Green

    # Add menu items
    Write-Host "Adding menu items..." -ForegroundColor Cyan
    $menuItems = @("sambaar", "tomoto chutney", "plain rice", "curd", "papad", "pongal", "vada", "chutney", "payasam", "pickle")
    
    foreach ($item in $menuItems) {
        $menuData = @{
            dish = $item
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$ApiUrl/potlucks/$potluckId/menu" -Method POST -Body $menuData -ContentType "application/json"
        Write-Host "  Added: $item" -ForegroundColor White
    }

    # Add guests
    Write-Host "Adding guests..." -ForegroundColor Cyan
    $guests = @("Somil", "Kiran", "Arpita", "Teja", "Lakshman", "Sachin", "Sheetal", "Dhanashree", "Yogini", "Surya")
    
    foreach ($guestName in $guests) {
        $familyCount = if ($guestName -eq "Surya") { 4 } else { 1 }
        $guestData = @{
            name = $guestName
            family_count = $familyCount
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$ApiUrl/potlucks/$potluckId/guests" -Method POST -Body $guestData -ContentType "application/json"
        Write-Host "  Added: $guestName (Family: $familyCount)" -ForegroundColor White
    }

    # Add Surya's dishes
    Write-Host "Adding Surya's dish selections..." -ForegroundColor Cyan
    $allGuests = Invoke-RestMethod -Uri "$ApiUrl/potlucks/$potluckId/guests" -Method GET
    $suryaGuest = $allGuests | Where-Object { $_.name -eq "Surya" }
    $suryaGuestId = $suryaGuest.id
    
    $allMenuItems = Invoke-RestMethod -Uri "$ApiUrl/potlucks/$potluckId/menu" -Method GET
    $suryaDishes = @("sambaar", "tomoto chutney", "plain rice", "curd", "papad")
    
    foreach ($dishName in $suryaDishes) {
        $menuItem = $allMenuItems | Where-Object { $_.dish -eq $dishName }
        if ($menuItem) {
            $dishData = @{
                dish_id = $menuItem.id
                quantity = 1
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$ApiUrl/potlucks/$potluckId/guests/$suryaGuestId/dishes" -Method POST -Body $dishData -ContentType "application/json"
            Write-Host "  Surya selected: $dishName" -ForegroundColor White
        }
    }

    Write-Host ""
    Write-Host "Successfully created single potluck!" -ForegroundColor Green
    Write-Host "Potluck ID: $potluckId" -ForegroundColor Cyan
    Write-Host "Name: $($newPotluck.name)" -ForegroundColor White
    Write-Host "Date: $($newPotluck.date)" -ForegroundColor White
    Write-Host "Menu Items: 10" -ForegroundColor White
    Write-Host "Guests: 10" -ForegroundColor White
    Write-Host "Surya dish selections: 5" -ForegroundColor White
    Write-Host ""
    Write-Host "App URL: https://potluck-signup.vercel.app/potluck/$potluckId" -ForegroundColor Yellow

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}