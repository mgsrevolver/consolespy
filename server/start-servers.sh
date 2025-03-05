#!/bin/bash
# Start script for Console Spy MCP Server

echo "Starting Console Spy servers..."

# Start the console log capture server
echo "Starting console log capture server on port 3333..."
node server/mcp-server.js &
CONSOLE_PID=$!

# Wait for the console server to start
sleep 2

# Start the MCP server through Supergateway
echo "Starting MCP server through Supergateway on port 8766..."
npx supergateway --port 8766 --stdio "node server/console-spy-mcp.js" &
MCP_PID=$!

echo "Both servers are running!"
echo "Console log server: http://localhost:3333"
echo "MCP server: http://localhost:8766/sse"
echo ""
echo "To configure in Cursor:"
echo "1. Go to Settings > Features > MCP"
echo "2. Add a new MCP server with:"
echo "   Name: ConsoleSpy"
echo "   Type: sse"
echo "   URL: http://localhost:8766/sse"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
trap "kill $CONSOLE_PID $MCP_PID; exit" INT TERM
wait