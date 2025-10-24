@echo off
echo.
echo ======================================
echo  Quantum Blockchain Genesis Setup
echo ======================================
echo.

echo Checking Node.js installation...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm installation...
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm with Node.js
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Creating environment file...
if not exist .env (
    copy .env.example .env
    echo Environment file created. Please review .env for configuration.
)

echo.
echo ======================================
echo  Setup Complete!
echo ======================================
echo.
echo To start the application:
echo   npm start
echo.
echo To start in development mode:
echo   npm run dev
echo.
echo To run tests:
echo   npm test
echo.
echo Web interface will be available at:
echo   http://localhost:3000
echo.
echo Genesis Bitcoin Address:
echo   bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h
echo.
echo "behold light and it is good"
echo.
pause