@echo off
echo.
echo ======================================
echo  Quantum Blockchain Genesis Setup
echo  Standalone Version (No Node.js)
echo ======================================
echo.

REM Check if we're in the right directory
if not exist "standalone\index.html" (
    echo ERROR: Please run this script from the quantum-blockchain-Genesis directory
    echo Make sure the standalone\ folder exists
    pause
    exit /b 1
)

echo ✅ Found standalone files
echo.

REM Check for Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :python_found
)

python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python3
    goto :python_found
)

echo ❌ Python not found
echo Please install Python to run the local server
echo.
echo Alternative: Open standalone\index.html directly in your browser
echo Note: Some features may not work due to CORS restrictions
pause
exit /b 1

:python_found
echo ✅ Found Python: %PYTHON_CMD%
echo.

REM Create launch script
echo @echo off > launch.bat
echo echo. >> launch.bat
echo echo ====================================== >> launch.bat
echo echo  Quantum Blockchain Genesis Launch >> launch.bat
echo echo ====================================== >> launch.bat
echo echo. >> launch.bat
echo echo Starting local server... >> launch.bat
echo echo Web interface: http://localhost:8000 >> launch.bat
echo echo Serving from: standalone/ >> launch.bat
echo echo. >> launch.bat
echo echo Press Ctrl+C to stop the server >> launch.bat
echo echo. >> launch.bat
echo cd standalone >> launch.bat
echo %PYTHON_CMD% -m http.server 8000 2^>nul ^|^| %PYTHON_CMD% -m SimpleHTTPServer 8000 >> launch.bat
echo pause >> launch.bat

echo ======================================
echo  Setup Complete!
echo ======================================
echo.
echo 🎯 Quantum Blockchain Genesis is ready!
echo.
echo 🚀 To start the application:
echo    launch.bat
echo.
echo 🌐 Then open your browser to:
echo    http://localhost:8000
echo.
echo 📂 Direct file access:
echo    Open standalone\index.html in your browser
echo    (Some features may be limited)
echo.
echo 🔮 Features available:
echo    ⛓️  Quantum Blockchain visualization
echo    💼 Wallet creation and management  
echo    🏦 DeFi protocols (AMM, staking)
echo    🌉 Bitcoin bridge simulation
echo    ⚖️  Consensus and governance
echo.
echo 📍 Genesis Bitcoin Address:
echo    bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h
echo.
echo 💡 "behold light and it is good"
echo.
pause