@echo off
title rblink.chat — Launcher
echo ========================================================
echo        🚀 STARTING RBLINK.CHAT COLLABORATION PLATFORM
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

echo [3/3] Launching rblink.chat server on http://localhost:3001 ...
start "" http://localhost:3001
npm start

pause
