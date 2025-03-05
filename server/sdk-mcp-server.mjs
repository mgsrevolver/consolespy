// Note the .mjs extension for ES modules
import { McpServer } from '@modelcontextprotocol/sdk';
import http from 'http';

// Create a new MCP server
const server = new McpServer({
  name: 'console-spy',
  version: '1.0.0',
});

// Define the getConsoleLogs tool
server.tool(
  'getConsoleLogs',
  'Get console logs from the browser',
  {}, // No parameters needed
  async () => {
    // Fetch logs from original MCP server
    return new Promise((resolve, reject) => {
      http
        .get('http://localhost:3333/mcp', (mcpRes) => {
          let responseData = '';

          mcpRes.on('data', (chunk) => {
            responseData += chunk;
          });

          mcpRes.on('end', () => {
            try {
              const logs = JSON.parse(responseData);
              resolve({ content: logs.content });
            } catch (error) {
              reject(new Error('Failed to parse logs: ' + error.message));
            }
          });
        })
        .on('error', (error) => {
          reject(new Error('Failed to fetch logs: ' + error.message));
        });
    });
  }
);

// Start the server
server.listen();
