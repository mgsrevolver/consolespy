# ConsoleSpy: An MCP Server for Cursor

A tool that captures browser console logs and makes them available in Cursor IDE through the Model Context Protocol (MCP).

## Overview

This tool consists of:

1. A server that captures console logs from your browser
2. An MCP server that makes these logs available to Cursor
3. A browser extension that sends console logs to the server

## Installation

### Server Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/mgsrevolver/consolespy.git
   cd consolespy
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the setup script to configure the MCP connection for Cursor:
   ```bash
   ./setup.sh
   ```

### Browser Extension Installation

1. Install the extension from the Chrome Web Store (coming soon)

   OR

   Load the extension in developer mode:

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the `extension` folder from this repository

## Usage

### Starting the Servers

1. Start the console log server:

   ```bash
   node mcp-server.js
   ```

2. In a separate terminal, start the MCP server:
   ```bash
   npx supergateway --port 8766 --stdio "node console-spy-mcp.js"
   ```

Alternatively, you can use the start script to launch both servers at once:

```bash
./start-servers.sh
```

### Configuring Cursor

After running the setup script, you still need to manually add the MCP server in Cursor:

1. Go to Settings > Features > MCP in Cursor
2. Add a new MCP server with:
   - Name: ConsoleSpy
   - Type: sse
   - URL: http://localhost:8766/sse

### Using the Extension

1. Click the extension icon in your browser to toggle it on/off
2. When enabled, all console logs from the current tab will be sent to the server
3. In Cursor, you can now access these logs through the MCP interface

## Customizing

### Changing the Console Log Server Port

If you need to use a different port for the console log server (default is 3333), you'll need to update the port in multiple places:

1. In `mcp-server.js`, change the port variable:

   ```javascript
   const port = 3333; // Change to your desired port
   ```

2. In `console-spy-mcp.js`, update the URL to match your new port:

   ```javascript
   const CONSOLE_SERVER_URL = 'http://localhost:3333/mcp'; // Change 3333 to your port
   ```

3. In the browser extension's `content.js`, update the server URL:

   ```javascript
   const serverUrl = 'http://localhost:3333/console-logs'; // Change 3333 to your port
   ```

4. If using `start-servers.sh`, update the port reference there as well.

**Important:** You must use the same port number in all locations. We recommend doing a global search for "3333" in the project files and replacing all instances with your desired port number to ensure consistency.

If you're testing locally with another application already using port 3333, changing this port is essential for the tool to work correctly.

## Troubleshooting

- Make sure both servers are running
- Verify the browser extension is enabled for the tab you're debugging
- Check that you've added the MCP server in Cursor's settings
- If logs aren't appearing, try refreshing the page or restarting the servers

## License

[MIT License](LICENSE)
