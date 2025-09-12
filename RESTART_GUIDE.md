# Potluck Signup App - Restart Scripts

This folder contains multiple ways to restart your Potluck Signup application. Choose the method that works best for you.

## 🚀 Quick Start Options

### Option 1: PowerShell Script (Recommended)
```powershell
.\restart.ps1
```
**Features:**
- ✅ Comprehensive error checking
- ✅ Port availability verification  
- ✅ Colored status messages
- ✅ Automatic browser opening option
- ✅ Detailed progress reporting

### Option 2: Batch File (Simple)
```cmd
restart.bat
```
**Features:**
- ✅ Simple and fast
- ✅ Works on any Windows system
- ✅ Minimal dependencies
- ✅ Color-coded output

### Option 3: NPM Scripts
```bash
# Full restart with PowerShell script
npm run restart

# Simple stop and start
npm run restart-simple

# Start both servers concurrently
npm run dev

# Stop all Node processes
npm run stop

# Start only backend
npm run backend

# Start only frontend  
npm run frontend
```

## 📋 What Each Script Does

### Restart Sequence:
1. **Stop Phase:**
   - 🛑 Kills all Node.js processes
   - 🛑 Frees up ports 3000 and 3001
   - 🛑 Waits for cleanup

2. **Verify Phase:**
   - 📊 Checks database file exists
   - 📊 Verifies ports are available

3. **Start Phase:**
   - 🚀 Starts backend server (port 3001)
   - 🚀 Waits for backend to be ready
   - 🚀 Starts frontend server (port 3000)
   - 🚀 Waits for frontend compilation

4. **Success Phase:**
   - ✅ Verifies both servers are running
   - 🌐 Optionally opens browser
   - 📝 Displays access URLs

## 🔧 Troubleshooting

### If the scripts don't work:

1. **PowerShell Execution Policy Error:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Manual Port Cleanup:**
   ```cmd
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   taskkill /f /pid [PID_NUMBER]
   ```

3. **Check if servers are running:**
   - Backend: http://localhost:3001/potlucks
   - Frontend: http://localhost:3000

### Common Issues:
- **Port in use:** Script automatically handles this
- **Node not found:** Make sure Node.js is installed
- **Permission denied:** Run as Administrator if needed

## 📱 Access Your App

After successful restart:
- **Main App:** http://localhost:3000
- **API Endpoint:** http://localhost:3001
- **Database:** Located at `backend/potluck.db`

## 🎯 Pro Tips

- The PowerShell script provides the most detailed feedback
- Both servers run in minimized windows to keep your desktop clean
- Use `npm run stop` to quickly stop all servers
- Database is automatically created if it doesn't exist

---

**Happy Potlucking! 🥳**