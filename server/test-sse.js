// Save as test-sse.js
const http = require('http');

console.log('Testing SSE connection to http://localhost:8765/sse');

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
  console.log('Headers:', res.headers);

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

req.end();

// Keep the connection open
console.log('Press Ctrl+C to exit');
