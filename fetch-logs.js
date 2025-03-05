// save as fetch-logs.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3333,
  path: '/mcp',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.log(
    JSON.stringify({
      content: `Error fetching logs: ${e.message}`,
    })
  );
});

req.end();
