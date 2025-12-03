@echo off
echo ==========================================
echo   Collaborative Paint App - Deployment
echo ==========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Check for Firebase CLI
call npm.cmd list -g firebase-tools >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Firebase CLI not found. Installing...
    call npm.cmd install -g firebase-tools
) else (
    echo [INFO] Firebase CLI is already installed.
)

echo.
echo [STEP 1] Login to Firebase
echo Please log in to your Google account in the browser window that opens.
echo.
call firebase login

echo.
echo [STEP 2] Initialize Project
echo If prompted, select "Use an existing project" and choose: kic1-ab4a0
echo.
:: We skip init if firebase.json exists, but we need to link the project
if not exist .firebaserc (
    call firebase use --add kic1-ab4a0 --alias default
)

echo.
echo [STEP 3] Deploying to Firebase Hosting...
echo.
call firebase deploy

echo.
echo ==========================================
echo   Deployment Complete!
echo ==========================================
pause
