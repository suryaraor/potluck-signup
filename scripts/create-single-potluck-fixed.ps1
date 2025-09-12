# Script to create exactly one potluck with all required data
# This ensures we only have one potluck instead of multiple duplicates

param(
    [string]$ApiUrl = "https://potluck-signup-7eed.onrender.com"
)

Write-Host "🧹 Creating single potluck with complete data..." -ForegroundColor Cyan

# Menu items array
$menuItems = @(
    "sambaar",
    "tomoto chutney", 
    "plain rice",
    "curd",
    "papad",
    "pongal",
    "vada",
    "chutney",
    "payasam",
    "pickle"
)

# Guest list
$guests = @(
    "Somil", "Kiran", "Arpita", "Teja", "Lakshman", 
    "Sachin", "Sheetal", "Dhanashree", "Yogini", "Surya"
)

try {
    # First clear all existing data
    Write-Host "🗑️ Clearing existing data..." -ForegroundColor Yellow
    
    $clearResponse = Invoke-RestMethod -Uri "$ApiUrl/api/clear-all-data" -Method POST -ContentType "application/json"
    Write-Host "✅ Data cleared successfully" -ForegroundColor Green

    # Create exactly one potluck
    Write-Host "🎉 Creating single potluck..." -ForegroundColor Cyan
    
    $potluckData = @{
        name = "Community Potluck"
        date = "2024-12-28"
        description = "Join us for a wonderful community potluck dinner!"
        location = "Community Center"
    }
    
    $newPotluck = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks" -Method POST -Body ($potluckData | ConvertTo-Json) -ContentType "application/json"
    $potluckId = $newPotluck.id
    
    Write-Host "✅ Created potluck: $($newPotluck.name) (ID: $potluckId)" -ForegroundColor Green

    # Add menu items
    Write-Host "🍽️ Adding menu items..." -ForegroundColor Cyan
    
    foreach ($item in $menuItems) {
        $menuData = @{
            potluck_id = $potluckId
            name = $item
            category = "Main"
        }
        
        $menuResult = Invoke-RestMethod -Uri "$ApiUrl/api/menu-items" -Method POST -Body ($menuData | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  ✓ Added: $item" -ForegroundColor White
    }

    # Add all guests
    Write-Host "👥 Adding guests..." -ForegroundColor Cyan
    
    foreach ($guestName in $guests) {
        $guestData = @{
            potluck_id = $potluckId
            name = $guestName
            email = "$($guestName.ToLower())@example.com"
            family_count = if ($guestName -eq "Surya") { 4 } else { 1 }
        }
        
        $guestResult = Invoke-RestMethod -Uri "$ApiUrl/api/guests" -Method POST -Body ($guestData | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  ✓ Added: $guestName (Family: $($guestData.family_count))" -ForegroundColor White
    }

    # Add Surya's dish selections (as they were in the original backup)
    Write-Host "🍛 Adding Surya's dish selections..." -ForegroundColor Cyan
    
    $suryaDishes = @("sambaar", "tomoto chutney", "plain rice", "curd", "papad")
    
    # Get Surya's guest ID
    $suryaGuest = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks/$potluckId/guests" -Method GET | Where-Object { $_.name -eq "Surya" }
    $suryaGuestId = $suryaGuest.id
    
    # Get menu items to map names to IDs
    $allMenuItems = Invoke-RestMethod -Uri "$ApiUrl/api/potlucks/$potluckId/menu-items" -Method GET
    
    foreach ($dishName in $suryaDishes) {
        $menuItem = $allMenuItems | Where-Object { $_.name -eq $dishName }
        if ($menuItem) {
            $dishData = @{
                guest_id = $suryaGuestId
                menu_item_id = $menuItem.id
                quantity = 1
            }
            
            $dishResult = Invoke-RestMethod -Uri "$ApiUrl/api/guest-dishes" -Method POST -Body ($dishData | ConvertTo-Json) -ContentType "application/json"
            Write-Host "  ✓ Surya selected: $dishName" -ForegroundColor White
        }
    }

    # Final success message
    Write-Host ""
    Write-Host "🎉 Successfully created single potluck with all data!" -ForegroundColor Green
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "  - Potluck ID: $($newPotluck.id)" -ForegroundColor White
    Write-Host "  - Name: $($newPotluck.name)" -ForegroundColor White
    Write-Host "  - Date: $($newPotluck.date)" -ForegroundColor White
    Write-Host "  - Menu Items: 10" -ForegroundColor White
    Write-Host "  - Guests: 10" -ForegroundColor White
    Write-Host "  - Surya dish selections: 5" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 App URL: https://potluck-signup.vercel.app/potluck/$($newPotluck.id)" -ForegroundColor Yellow

}
catch {
    Write-Host "❌ Error creating single potluck:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}