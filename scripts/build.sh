#!/bin/bash

# Netlify Build Script for Recruily
# This script ensures proper Node.js version and dependency installation

echo "🔧 Starting custom build process..."

# Display Node and npm versions
echo "📋 Current Node.js version: $(node --version)"
echo "📋 Current npm version: $(npm --version)"

# Verify required Node version
NODE_VERSION=$(node --version)
if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "❌ ERROR: Node.js version $NODE_VERSION is not supported"
    echo "ℹ️  Required: Node.js 20.x"
    exit 1
fi

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --force

# Verify chalk is installed
echo "🎨 Verifying chalk installation..."
if npm list chalk > /dev/null 2>&1; then
    echo "✅ Chalk is properly installed"
else
    echo "❌ Chalk is missing, installing..."
    npm install chalk@4.1.2
fi

# Test chalk import
echo "🧪 Testing chalk import..."
node -e "const chalk = require('chalk'); console.log(chalk.green('✅ Chalk test successful'))" || {
    echo "❌ Chalk import test failed"
    exit 1
}

# Run the actual build
echo "🏗️ Running Next.js build..."
npm run build

echo "✅ Build completed successfully!"