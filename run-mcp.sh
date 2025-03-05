#!/bin/bash

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the MCP server with the full path
node "$DIR/server/cursor-mcp-stdio.js"