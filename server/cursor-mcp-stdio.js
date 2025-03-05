// Save as cursor-mcp-stdio.js
const http = require('http');
const readline = require('readline');

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Initialize with metadata
const metadata = {
  jsonrpc: '2.0',
  method: 'metadata',
  params: {
    tools: [
      {
        name: 'getConsoleLogs',
        description: 'Get console logs from the browser',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  },
};

// Send metadata
console.log(JSON.stringify(metadata));

// Listen for incoming messages
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);

    if (
      request.method === 'runTool' &&
      request.params &&
      request.params.name === 'getConsoleLogs'
    ) {
      console.error('Processing getConsoleLogs request with ID:', request.id);

      // Fetch logs from original MCP server
      http
        .get('http://localhost:3333/mcp', (mcpRes) => {
          let responseData = '';

          mcpRes.on('data', (chunk) => {
            responseData += chunk;
          });

          mcpRes.on('end', () => {
            try {
              const logs = JSON.parse(responseData);

              // Format logs in a more readable way
              const formattedLogs = logs.content
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => {
                  // Add some formatting to make it more readable
                  return line.replace(/\[(.*?)\]/, '**[$1]**');
                })
                .join('\n');

              // Send response with the same ID as the request
              const response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: formattedLogs,
                },
              };

              console.error('Sending response for request ID:', request.id);
              console.log(JSON.stringify(response));
            } catch (error) {
              console.error('Error parsing logs:', error);

              // Send error response with the same ID
              const errorResponse = {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: -32000,
                  message: 'Failed to parse logs: ' + error.message,
                },
              };

              console.log(JSON.stringify(errorResponse));
            }
          });
        })
        .on('error', (error) => {
          console.error('Error fetching logs:', error);

          // Send error response with the same ID
          const errorResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32001,
              message: 'Failed to fetch logs: ' + error.message,
            },
          };

          console.log(JSON.stringify(errorResponse));
        });
    }
  } catch (error) {
    console.error('Error processing request:', error);
  }
});

// Log errors to stderr (won't interfere with the protocol)
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
