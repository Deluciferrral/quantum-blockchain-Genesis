#!/bin/bash

echo ""
echo "======================================"
echo "  Quantum Blockchain Genesis Setup"
echo "======================================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    echo "Please install npm with Node.js"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "Creating environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Environment file created. Please review .env for configuration."
fi

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "To start in development mode:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
echo "Web interface will be available at:"
echo "  http://localhost:3000"
echo ""
echo "Genesis Bitcoin Address:"
echo "  bc1qkm8plv5449r3t53dge6x6rmutk3wtkjlwczx8h"
echo ""
echo "\"behold light and it is good\""
echo ""