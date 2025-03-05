// Save as simulate-cursor.js
const http = require('http');

console.log('Simulating Cursor connection to http://localhost:8765/sse');

const req = http.request('http://localhost:8765/sse', {
  method: 'GET',
  headers: {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});

req.on('response', (res) => {
  console.log('Connected to SSE endpoint');
  console.log('Status:', res.statusCode);

  res.on('data', (chunk) => {
    console.log('Received data:', chunk.toString());
  });

  res.on('end', () => {
    console.log('Connection closed by server');
  });
});

req.on('error', (error) => {
  console.error('Error connecting to SSE endpoint:', error);
});

// Send a tool call after 3 seconds
setTimeout(() => {
  console.log('Sending tool call');

  const toolCall = {
    jsonrpc: '2.0',
    method: 'runTool',
    id: 'test-1',
    params: {
      name: 'getConsoleLogs',
      arguments: {},
    },
  };

  req.write(JSON.stringify(toolCall) + '\n');
}, 3000);

req.end();

console.log('Press Ctrl+C to exit');
