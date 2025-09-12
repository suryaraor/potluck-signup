@echo off
echo Starting Potluck App...
echo.

echo Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting Backend...
cd backend
start "Potluck Backend" node index.js
timeout /t 5 >nul

echo Starting Frontend...
cd ..\frontend
start "Potluck Frontend" npm start

echo.
echo Both servers are starting up...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul