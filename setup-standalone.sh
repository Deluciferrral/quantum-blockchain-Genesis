#!/bin/bash

echo ""
echo "======================================"
echo "  Quantum Blockchain Genesis Setup"
echo "  Standalone Version (No Node.js)"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "standalone/index.html" ]; then
    echo "ERROR: Please run this script from the quantum-blockchain-Genesis directory"
    echo "Make sure the standalone/ folder exists"
    exit 1
fi

echo "✅ Found standalone files"
echo ""

# Check for Python (for simple HTTP server)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found"
    echo "Please install Python to run the local server"
    echo ""
    echo "Alternative: Open standalone/index.html directly in your browser"
    echo "Note: Some features may not work due to CORS restrictions"
    exit 1
fi

echo "✅ Found Python: $PYTHON_CMD"
echo ""

# Create a simple launch script
cat > launch.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Quantum Blockchain Genesis..."
echo "🌐 Server will be available at: http://localhost:8000"
echo "📂 Serving from: standalone/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
cd standalone
python3 -m http.server 8000 2>/dev/null || python -m SimpleHTTPServer 8000
EOF

chmod +x launch.sh

# Create a Windows batch file too
cat > launch.bat << 'EOF'
@echo off
echo.
echo ======================================
echo  Quantum Blockchain Genesis Launch
echo ======================================
echo.
echo Starting local server...
echo Web interface: http://localhost:8000
echo Serving from: standalone/
echo.
echo Press Ctrl+C to stop the server
echo.
cd standalone
python -m http.server 8000 2>nul || python -m SimpleHTTPServer 8000
pause
EOF

echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "🎯 Quantum Blockchain Genesis is ready!"
echo ""
echo "🚀 To start the application:"
echo "   ./launch.sh        (Linux/Mac)"
echo "   launch.bat         (Windows)"
echo ""
echo "🌐 Then open your browser to:"
echo "   http://localhost:8000"
echo ""
echo "📂 Direct file access:"
echo "   Open standalone/index.html in your browser"
echo "   (Some features may be limited)"
echo ""
echo "🔮 Features available:"
echo "   ⛓️  Quantum Blockchain visualization"
echo "   💼 Wallet creation and management"
echo "   🏦 DeFi protocols (AMM, staking)"
echo "   🌉 Bitcoin bridge simulation"
echo "   ⚖️  Consensus and governance"
echo ""
echo "📍 Genesis Bitcoin Address:"
echo "   bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h"
echo ""
echo "💡 \"behold light and it is good\""
echo ""