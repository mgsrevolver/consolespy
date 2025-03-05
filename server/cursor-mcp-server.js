// Save as cursor-mcp-server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const port = 8765;

app.use(cors());
app.use(express.json());

// SSE endpoint for Cursor
app.get('/sse', (req, res) => {
  console.log('SSE connection established');

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send initial comment to keep connection alive
  res.write(':\n\n');

  // Send metadata event
  const metadataEvent = {
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

  console.log('Sending metadata event');
  res.write(`data: ${JSON.stringify(metadataEvent)}\n\n`);

  // Set up keep-alive interval
  const keepAliveInterval = setInterval(() => {
    res.write(':\n\n'); // Send comment as heartbeat
    console.log('Sent heartbeat');
  }, 5000);

  // Set up a listener for tool calls
  const toolCallListener = (data) => {
    try {
      if (
        data.method === 'runTool' &&
        data.params &&
        data.params.name === 'getConsoleLogs'
      ) {
        console.log('Processing getConsoleLogs request with ID:', data.id);

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
                  id: data.id,
                  result: {
                    content: formattedLogs,
                  },
                };

                console.log('Sending response for request ID:', data.id);
                res.write(`data: ${JSON.stringify(response)}\n\n`);
              } catch (error) {
                console.error('Error parsing logs:', error);

                // Send error response with the same ID
                const errorResponse = {
                  jsonrpc: '2.0',
                  id: data.id,
                  error: {
                    code: -32000,
                    message: 'Failed to parse logs: ' + error.message,
                  },
                };

                res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
              }
            });
          })
          .on('error', (error) => {
            console.error('Error fetching logs:', error);

            // Send error response with the same ID
            const errorResponse = {
              jsonrpc: '2.0',
              id: data.id,
              error: {
                code: -32001,
                message: 'Failed to fetch logs: ' + error.message,
              },
            };

            res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
          });
      }
    } catch (error) {
      console.error('Error processing tool call:', error);
    }
  };

  // Register the tool call listener
  app.on('toolCall', toolCallListener);

  // Handle connection close
  req.on('close', () => {
    console.log('SSE connection closed');
    clearInterval(keepAliveInterval);
    app.removeListener('toolCall', toolCallListener);
  });
});

// Endpoint to receive tool calls
app.post('/tool-call', (req, res) => {
  console.log('Received tool call:', req.body);

  // Emit the tool call event
  app.emit('toolCall', req.body);

  // Acknowledge receipt
  res.status(202).json({ status: 'processing' });
});

// Add a manual trigger endpoint
app.get('/trigger-logs', (req, res) => {
  console.log('Manual trigger for logs');

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
          res.json(logs);
        } catch (error) {
          console.error('Error parsing logs:', error);
          res.status(500).json({ error: 'Failed to parse logs' });
        }
      });
    })
    .on('error', (error) => {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    });
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Console Spy MCP Server</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
          .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          button { padding: 10px; margin: 10px 0; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Console Spy MCP Server</h1>
        
        <div class="info">
          <h2>Server Status</h2>
          <p>✅ Server is running at http://localhost:${port}</p>
          <p>✅ SSE endpoint is available at http://localhost:${port}/sse</p>
        </div>
        
        <h2>Configuration in Cursor</h2>
        <p>To use this MCP server in Cursor, add it with these settings:</p>
        <pre>
Name: ConsoleSpy
Type: sse
URL: http://localhost:${port}/sse
        </pre>
        
        <h2>Available Tools</h2>
        <ul>
          <li><strong>getConsoleLogs</strong> - Get console logs from the browser</li>
        </ul>
        
        <h2>Test Console Logs</h2>
        <button id="test-log">Generate Test Log</button>
        <div id="log-output" style="margin-top: 20px; padding: 10px; background: #f4f4f4; border-radius: 5px; display: none;"></div>
        
        <script>
          // Log a test message
          console.log("ConsoleSpy initialized and working");
          
          // Add event listener to the button
          document.getElementById('test-log').addEventListener('click', function() {
            console.log("Test log from MCP button click", new Date().toISOString());
            console.warn("Test warning from MCP button click");
            console.error("Test error from MCP button click");
            
            // Fetch logs to display
            fetch('/trigger-logs')
              .then(response => response.json())
              .then(data => {
                const logOutput = document.getElementById('log-output');
                logOutput.textContent = data.content;
                logOutput.style.display = 'block';
              })
              .catch(error => {
                console.error('Error fetching logs:', error);
                alert('Error fetching logs: ' + error.message);
              });
          });
        </script>
      </body>
    </html>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`Console Spy MCP server running at http://localhost:${port}`);
  console.log(`SSE endpoint available at http://localhost:${port}/sse`);
});
