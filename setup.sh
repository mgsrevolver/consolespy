#!/bin/bash
# Setup script for Console Spy MCP Server

echo "Setting up Console Spy MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install express cors http supergateway

# Make scripts executable
chmod +x start-servers.sh

echo "Setup complete! Run './start-servers.sh' to start the servers."