#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';

// Define the Console Spy tool
const CONSOLE_SPY_TOOL = {
  name: 'getConsoleLogs',
  description: 'Get console logs from the browser',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Create the server
const server = new Server(
  {
    name: 'console-spy-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing requests
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CONSOLE_SPY_TOOL],
}));

// Handle tool call requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'getConsoleLogs') {
    try {
      // Fetch logs from original MCP server
      const logs = await fetchConsoleLogs();
      return {
        content: [
          {
            type: 'text',
            text: logs.content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching console logs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
});

// Function to fetch console logs
async function fetchConsoleLogs() {
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
            resolve(logs);
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

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Console Spy MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
