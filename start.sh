#!/bin/bash

# Grenzwanderer3 - Quick Start Script
# This script helps you quickly set up and run the Grenzwanderer3 project

echo "🚀 Grenzwanderer3 - Starting development environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (version 18+) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "🔧 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Grenzwanderer3 Environment Variables
# Copy this file and customize for your environment

# Convex Backend (if using)
# CONVEX_URL=your-convex-url

# Development settings
NODE_ENV=development
EOF
    echo "✅ .env.local created"
fi

echo ""
echo "🎯 Starting development server..."
echo ""
echo "🌐 Your app will be available at: http://localhost:5173"
echo "📊 Build output: ./dist/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
