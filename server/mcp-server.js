console.log('Starting MCP server initialization...');

try {
  console.log('Loading express...');
  const express = require('express');
  console.log('Express loaded successfully');

  console.log('Loading cors...');
  const cors = require('cors');
  console.log('CORS loaded successfully');

  console.log('Creating express app...');
  const app = express();
  console.log('Express app created');

  const port = 3333;

  // In-memory storage for logs
  const sessions = {};
  const MAX_LOGS_PER_SESSION = 100;

  console.log('Setting up middleware...');
  app.use(cors());
  console.log('CORS middleware added');

  app.use(express.json({ limit: '1mb' }));
  console.log('JSON middleware added');

  // Add a simple root route with strict CSP
  app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    // Set strict Content-Security-Policy header
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; style-src 'unsafe-inline'"
    );

    res.send(`
      <html>
        <head>
          <title>Console to Cursor MCP</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            h1 { color: #333; }
            p { line-height: 1.6; }
            code { 
              background: #f4f4f4; 
              padding: 2px 5px; 
              border-radius: 3px; 
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <h1>Console to Cursor MCP</h1>
          <p>This server is running correctly. Available endpoints:</p>
          <ul>
            <li><code>/console-logs</code> - POST endpoint for receiving logs from browser extension</li>
            <li><code>/mcp</code> - GET endpoint for Cursor to retrieve logs</li>
            <li><code>/test</code> - GET endpoint for testing server connectivity</li>
          </ul>
        </body>
      </html>
    `);
  });

  console.log('Setting up /console-logs endpoint...');
  // Endpoint to receive logs from browser extension
  app.post('/console-logs', (req, res) => {
    console.log('Received request to /console-logs');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { logs, sessionId, url } = req.body;

      if (!logs || !sessionId || !url) {
        console.log('Missing required fields in request');
        return res
          .status(400)
          .json({ success: false, error: 'Missing required fields' });
      }

      console.log(`Received log from ${url}:`, logs);

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          logs: [],
          url: url,
          firstSeen: new Date(),
        };
      }

      // Add new logs
      sessions[sessionId].logs.push(...logs);

      // Trim if too many
      if (sessions[sessionId].logs.length > MAX_LOGS_PER_SESSION) {
        sessions[sessionId].logs = sessions[sessionId].logs.slice(
          -MAX_LOGS_PER_SESSION
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error processing /console-logs request:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  console.log('Setting up /mcp endpoint...');
  // MCP endpoint for Cursor
  app.get('/mcp', (req, res) => {
    try {
      const activeSession = Object.values(sessions).sort(
        (a, b) => new Date(b.firstSeen) - new Date(a.firstSeen)
      )[0];

      if (!activeSession) {
        return res.json({
          content:
            'No console logs captured. Toggle the Console to Cursor extension on your localhost tab.',
        });
      }

      // Format logs for Cursor
      const formattedLogs = activeSession.logs
        .map(
          (log) =>
            `[${log.timestamp}] ${log.type.toUpperCase()}: ${JSON.stringify(
              log.content
            )}`
        )
        .join('\n');

      res.json({
        content: `Console logs from ${activeSession.url}:\n\n${formattedLogs}`,
      });
    } catch (error) {
      console.error('Error processing /mcp request:', error);
      res.status(500).json({
        content: 'Error retrieving logs: ' + error.message,
      });
    }
  });

  console.log('Setting up /test endpoint...');
  // Test endpoint
  app.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ success: true, message: 'Server is running correctly' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  });

  // Start server with error handling
  console.log('Starting server...');
  const server = app
    .listen(port, () => {
      console.log(`MCP server running at http://localhost:${port}`);
    })
    .on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Try a different port.`);
        process.exit(1);
      } else {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
} catch (error) {
  console.error('ERROR DURING STARTUP:', error);
  process.exit(1);
}
