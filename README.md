# Console Spy MCP Server

This tool captures browser console logs and makes them available to Cursor IDE through the Model Context Protocol (MCP).

## Installation

### Server Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone or download this repository
3. Run the setup script:
   ```
   ./setup.sh
   ```

### Browser Extension

You need to install the Console to Cursor MCP browser extension:

- [Chrome Web Store Link](#) (Coming soon)
- [Firefox Add-ons Link](#) (Coming soon)

Alternatively, you can install the extension manually:

1. Download the extension ZIP file from the [releases page](#)
2. For Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right)
   - Click "Load unpacked" and select the extracted extension folder
3. For Firefox:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on" and select the extension ZIP file

## Usage

1. Start the servers:

   ```
   ./start-servers.sh
   ```

2. Open the project in Cursor IDE:

   - The MCP server will be automatically detected and configured thanks to the `.cursor/mcp.json` file
   - No manual configuration needed!

3. Enable the browser extension:

   - Simply click the extension icon in your browser toolbar to toggle it on/off
   - When active, the extension will automatically send console logs to `http://localhost:3333/console-logs`
   - There are no settings or configuration options in the extension itself

4. Use in Cursor:
   - Open the Composer
   - Ask the agent to get console logs, for example:
     "Please show me the console logs from my browser"

## Customizing the Port

By default, the console log server runs on port 3333. If you need to use a different port:

1. Edit the `server/mcp-server.js` file and change the port number:

   ```javascript
   const port = 3333; // Change this to your preferred port
   ```

2. Edit the extension's source code to use your custom port:

   - Locate the `content.js` file in the extension source
   - Change the server URL to match your custom port
   - Reload or reinstall the extension

3. Make sure to restart the servers after changing the port

## How It Works

This tool consists of:

1. A server that captures console logs from the browser extension
2. An MCP server that makes these logs available to Cursor
3. A simple browser extension that sends console logs to the server

The browser extension intercepts all console.log, console.warn, and console.error calls in your web applications and forwards them to the local server. The MCP server then makes these logs available to Cursor's AI assistant for analysis.

## Troubleshooting

- Make sure both servers are running
- Check that the browser extension is installed and enabled
- If you've changed the default port, make sure you've updated both the server and extension
- Try restarting the servers and Cursor
- Check the browser console for any extension errors

## Browser Support

The extension works with:

- Google Chrome (version 88+)
- Microsoft Edge (version 88+)
- Firefox (version 78+)

## License

MIT
