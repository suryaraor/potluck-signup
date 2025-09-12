@echo off
cls
echo.
echo ================================================
echo   🔄 POTLUCK APP RESTART SCRIPT
echo ================================================
echo.

echo 🛑 Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel%==0 (
    echo    ✅ Node.js processes stopped
) else (
    echo    ⚠️  No Node.js processes found
)

echo.
echo 🛑 Freeing up ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
echo    ✅ Ports freed

echo.
echo ⏳ Waiting for cleanup...
timeout /t 3 /nobreak >nul

echo.
echo 📊 Checking database...
if exist "c:\apps\potluck-signup\backend\potluck.db" (
    echo    ✅ Database file found
) else (
    echo    ⚠️  Database will be created when backend starts
)

echo.
echo 🚀 Starting Backend Server...
cd /d "c:\apps\potluck-signup\backend"
start "Potluck Backend" /min npm start
echo    ✅ Backend starting on port 3001

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Starting Frontend Server...
cd /d "c:\apps\potluck-signup\frontend"
start "Potluck Frontend" /min npm start
echo    ✅ Frontend starting on port 3000

echo.
echo ⏳ Waiting for frontend to compile...
timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   🎉 POTLUCK APP RESTART COMPLETE!
echo ================================================
echo.
echo 📊 Status:
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:3000
echo.
echo 🌐 Your app should be available at:
echo    http://localhost:3000
echo.
echo 📝 Both servers are running in minimized windows
echo 📝 Check Task Manager if you need to stop them
echo.

set /p openBrowser="🌐 Open app in browser? (y/n): "
if /i "%openBrowser%"=="y" start http://localhost:3000

echo.
echo ✨ Script completed successfully!
cd /d "c:\apps\potluck-signup"
pause