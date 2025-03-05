// Save as test-tool-call.js
const http = require('http');

console.log('Sending tool call to http://localhost:8765/tool-call');

const toolCall = {
  jsonrpc: '2.0',
  method: 'runTool',
  id: 'test-1',
  params: {
    name: 'getConsoleLogs',
    arguments: {},
  },
};

const req = http.request('http://localhost:8765/tool-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});

req.on('response', (res) => {
  console.log('Response status:', res.statusCode);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response data:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify(toolCall));
req.end();
