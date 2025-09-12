# Single Potluck Restore Script
# This script creates exactly ONE potluck with all the required data

param(
    [string]$ApiUrl = "https://potluck-signup-7eed.onrender.com"
)

Write-Host "🔄 Creating single potluck with all data..." -ForegroundColor Green

try {
    # First, clear any existing data
    Write-Host "Clearing existing data..." -ForegroundColor Red
    try {
        Invoke-WebRequest -Uri "$ApiUrl/reset" -Method DELETE -UseBasicParsing | Out-Null
        Write-Host "✅ Existing data cleared" -ForegroundColor Green
        Start-Sleep -Seconds 5  # Wait for reset to complete
    }
    catch {
        Write-Warning "Could not clear existing data: $_"
    }

    # Create the single potluck with menu items
    $potluckData = @{
        name = "Potluck Party"
        date = "2025-09-15"
        menuItems = @(
            "sambaar",
            "tomoto chutney", 
            "plain rice",
            "curd",
            "papad",
            "gravy curry",
            "chapati",
            "flavored rice (Pulav/lemon/tamarind/tomato rice)",
            "desert",
            "fruits"
        )
    } | ConvertTo-Json -Depth 3

    Write-Host "Creating potluck..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri "$ApiUrl/potlucks" -Method POST -Body $potluckData -ContentType "application/json" -UseBasicParsing
    $newPotluck = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Created potluck ID: $($newPotluck.id)" -ForegroundColor Green

    # Add all guests
    $guests = @(
        @{ name = "Somil"; family_count = 1 },
        @{ name = "Kiran"; family_count = 1 },
        @{ name = "Arpita"; family_count = 1 },
        @{ name = "Teja"; family_count = 1 },
        @{ name = "Lakshman"; family_count = 1 },
        @{ name = "Sachin"; family_count = 1 },
        @{ name = "Sheetal"; family_count = 1 },
        @{ name = "Dhanashree"; family_count = 1 },
        @{ name = "Yogini"; family_count = 1 },
        @{ name = "Surya"; family_count = 4 }
    )

    Write-Host "Adding guests..." -ForegroundColor Cyan
    foreach ($guest in $guests) {
        $guestBody = @{
            name = $guest.name
            family_count = $guest.family_count
        } | ConvertTo-Json
        
        try {
            $guestResponse = Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($newPotluck.id)/guests" -Method POST -Body $guestBody -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
            Write-Host "  ✅ Added: $($guest.name) (family: $($guest.family_count))" -ForegroundColor White
        }
        catch {
            # Guest might already exist, try to continue
            Write-Host "  ⚠️ Guest $($guest.name) might already exist: $_" -ForegroundColor Yellow
        }
    }

    # Restore Surya's dish selections (from original backup data)
    Write-Host "Restoring Surya's dish selections..." -ForegroundColor Cyan
    $suryaDishes = @(
        @{ dish_id = 1; quantity = 1 },  # sambaar
        @{ dish_id = 2; quantity = 1 },  # tomoto chutney
        @{ dish_id = 3; quantity = 1 },  # plain rice
        @{ dish_id = 4; quantity = 1 },  # curd
        @{ dish_id = 5; quantity = 1 }   # papad
    )

    foreach ($dish in $suryaDishes) {
        $dishBody = @{
            name = "Surya"
            dish_id = $dish.dish_id
            quantity = $dish.quantity
        } | ConvertTo-Json
        
        try {
            Invoke-WebRequest -Uri "$ApiUrl/potlucks/$($newPotluck.id)/guests" -Method POST -Body $dishBody -ContentType "application/json" -UseBasicParsing | Out-Null
            Write-Host "  ✅ Restored dish selection for Surya (dish ID: $($dish.dish_id))" -ForegroundColor Gray
        }
        catch {
            Write-Warning "  ❌ Failed to restore dish selection: $_"
        }
    }

    Write-Host "🎉 Successfully created single potluck with all data!" -ForegroundColor Green
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "  - Potluck ID: $($newPotluck.id)" -ForegroundColor White
    Write-Host "  - Name: $($newPotluck.name)" -ForegroundColor White
    Write-Host "  - Date: $($newPotluck.date)" -ForegroundColor White
    Write-Host "  - Menu Items: 10" -ForegroundColor White
    Write-Host "  - Guests: 10" -ForegroundColor White
    Write-Host "  - Surya dish selections: 5" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🌐 App URL: https://potluck-signup.vercel.app/potluck/$($newPotluck.id)" -ForegroundColor Yellow

}
catch {
    Write-Error "❌ Failed to create potluck: $_"
    exit 1
}