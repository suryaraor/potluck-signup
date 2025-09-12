# Potluck Data Backup & Restore

This script helps you backup and restore your potluck data in case of server issues or data loss.

## Usage

### 1. Create a Backup
```powershell
.\scripts\backup-restore-data.ps1 -Action backup
```
This creates a `potluck-backup.json` file with all your current data.

### 2. Check Current Status
```powershell
.\scripts\backup-restore-data.ps1 -Action status
```
Shows a summary of current potlucks, guests, and menu items.

### 3. Restore from Backup
```powershell
.\scripts\backup-restore-data.ps1 -Action restore
```
**⚠️ WARNING**: This will delete all existing data and restore from backup!

### Custom Backup File
```powershell
# Use a different backup file name
.\scripts\backup-restore-data.ps1 -Action backup -BackupFile "my-backup.json"
.\scripts\backup-restore-data.ps1 -Action restore -BackupFile "my-backup.json"
```

## Current Backup State (2025-09-12)

✅ **Potlucks**: 2 (both "Potluck Party" for 2025-09-15)
✅ **Total Guests**: 10 (Somil, Kiran, Arpita, Teja, Lakshman, Sachin, Sheetal, Dhanashree, Yogini, Surya)
✅ **Menu Items**: 20 (10 per potluck)
✅ **Dish Selections**: Surya has selected 5 dishes and has family count 4

## What Gets Backed Up

- ✅ Potluck names and dates
- ✅ All menu items for each potluck
- ✅ All guest names and family counts
- ✅ Guest dish selections and quantities
- ✅ Timestamp of backup creation

## When to Use

### Create Backups:
- Before making major changes
- After adding many guests/dishes
- Weekly for active potlucks
- Before server maintenance

### Restore from Backup:
- Server data lost due to restart
- Accidentally deleted data
- Database corruption
- Moving to new hosting service

## Troubleshooting

### Script Execution Policy Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### API Connection Issues
- Check if backend server is running: https://potluck-signup-7eed.onrender.com/potlucks
- Verify API URL in script is correct
- Check internet connection

### Backup File Issues
- Ensure you have write permissions in the directory
- Check disk space for backup file
- Backup files are in JSON format and human-readable

## Example Workflow

```powershell
# 1. Check current status
.\scripts\backup-restore-data.ps1 -Action status

# 2. Create backup before making changes
.\scripts\backup-restore-data.ps1 -Action backup

# 3. If data is lost later, restore it
.\scripts\backup-restore-data.ps1 -Action restore
```

## File Locations

- **Script**: `scripts/backup-restore-data.ps1`
- **Default Backup**: `potluck-backup.json` (in current directory)
- **Backend API**: https://potluck-signup-7eed.onrender.com
- **Frontend**: https://potluck-signup.vercel.app