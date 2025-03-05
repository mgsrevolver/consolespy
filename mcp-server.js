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

  // In-memory storage for logs with improved structure
  const sessions = {};
  const MAX_LOGS_PER_SESSION = 500; // Increased from 100

  console.log('Setting up middleware...');
  app.use(
    cors({
      origin: '*', // Allow all origins
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );
  console.log('CORS middleware added');

  app.use(express.json({ limit: '1mb' }));
  console.log('JSON middleware added');

  // Add a simple root route with strict CSP
  app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    // Set strict Content-Security-Policy header
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'"
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
            button {
              background: #4CAF50;
              border: none;
              color: white;
              padding: 10px 15px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
              border-radius: 4px;
            }
            .manual-logging {
              margin-top: 30px;
              padding: 15px;
              background: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 5px;
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
            <li><code>/view-logs</code> - GET endpoint for viewing logs in browser</li>
          </ul>
          
          <h2>Test Console Logging</h2>
          <p>Click the button below to test console logging:</p>
          <button id="test-log">Test Console Log</button>
          
          <div class="manual-logging">
            <h2>Manual Logging</h2>
            <p>If automatic console capture isn't working, you can use these manual logging functions:</p>
            <ul>
              <li><code>window.mcpLog("Your message here")</code> - Send a log message</li>
              <li><code>window.mcpWarn("Your warning here")</code> - Send a warning message</li>
              <li><code>window.mcpError("Your error here")</code> - Send an error message</li>
            </ul>
            <p>Example: Open your browser console and type <code>mcpLog("Hello from manual logging")</code></p>
          </div>
          
          <script>
            document.getElementById('test-log').addEventListener('click', function() {
              console.log('Test log from button click', new Date().toISOString());
              console.warn('Test warning from button click');
              console.error('Test error from button click');
              alert('Test logs sent! Check the /view-logs endpoint to see them.');
            });
          </script>
        </body>
      </html>
    `);
  });

  console.log('Setting up /console-logs endpoint...');
  // Endpoint to receive logs from browser extension
  app.post('/console-logs', (req, res) => {
    console.log('Received request to /console-logs');

    try {
      const { logs, sessionId, url } = req.body;

      if (!logs || !sessionId || !url) {
        console.log('Missing required fields in request');
        return res
          .status(400)
          .json({ success: false, error: 'Missing required fields' });
      }

      // Log the content for debugging
      logs.forEach((log) => {
        console.log(`Received ${log.type} log from ${url}:`, log.content);
      });

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          logs: [],
          url: url,
          firstSeen: new Date(),
          lastSeen: new Date(),
        };
      } else {
        sessions[sessionId].lastSeen = new Date();
      }

      // Add new logs
      sessions[sessionId].logs.push(...logs);

      // Trim if too many
      if (sessions[sessionId].logs.length > MAX_LOGS_PER_SESSION) {
        sessions[sessionId].logs = sessions[sessionId].logs.slice(
          -MAX_LOGS_PER_SESSION
        );
      }

      res.json({ success: true, logCount: sessions[sessionId].logs.length });
    } catch (error) {
      console.error('Error processing /console-logs request:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  console.log('Setting up /mcp endpoint...');
  // MCP endpoint for Cursor
  app.get('/mcp', (req, res) => {
    try {
      // Get all sessions sorted by last activity
      const allSessions = Object.values(sessions).sort(
        (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
      );

      if (allSessions.length === 0) {
        return res.json({
          content:
            'No console logs captured. Toggle the Console to Cursor extension on your localhost tab.',
        });
      }

      // Use the most recently active session
      const activeSession = allSessions[0];

      // Format logs for Cursor
      const formattedLogs = activeSession.logs
        .map(
          (log) =>
            `[${log.timestamp}] ${log.type.toUpperCase()}: ${JSON.stringify(
              log.content
            )}`
        )
        .join('\n');

      // Make sure we're returning the exact format Cursor expects
      res.json({
        content: `Console logs from ${activeSession.url} (${activeSession.logs.length} logs):\n\n${formattedLogs}`,
      });
    } catch (error) {
      console.error('Error processing /mcp request:', error);
      res.status(200).json({
        // Still return 200 with error message
        content: 'Error retrieving logs: ' + error.message,
      });
    }
  });

  // New endpoint to view logs in browser
  app.get('/view-logs', (req, res) => {
    try {
      // Get all sessions sorted by last activity
      const allSessions = Object.values(sessions).sort(
        (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
      );

      if (allSessions.length === 0) {
        return res.send(`
          <html>
            <head>
              <title>MCP Logs</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                .refresh { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>MCP Logs</h1>
              <div class="refresh">
                <button onclick="location.reload()">Refresh</button>
              </div>
              <p>No logs captured yet. Make sure the console capture script is running.</p>
              <p><a href="/">Back to home</a></p>
            </body>
          </html>
        `);
      }

      // Generate HTML for logs
      let html = `
        <html>
          <head>
            <title>MCP Logs</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h1, h2 { color: #333; }
              .refresh { margin-bottom: 20px; }
              .log-entry { margin-bottom: 5px; font-family: monospace; white-space: pre-wrap; }
              .log { color: black; }
              .warn { color: orange; }
              .error { color: red; }
              .info { color: blue; }
              .debug { color: gray; }
              .timestamp { color: #666; font-size: 0.8em; }
              .session { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
              .controls { margin-bottom: 20px; }
              .controls button { margin-right: 10px; }
              .log-content { max-height: 500px; overflow: auto; }
              .filter { margin-bottom: 15px; }
              .filter label { margin-right: 10px; }
              .nav { margin-bottom: 20px; }
              .nav a { margin-right: 15px; }
            </style>
          </head>
          <body>
            <h1>MCP Logs</h1>
            <div class="nav">
              <a href="/">Home</a>
              <a href="/test">Test Server</a>
            </div>
            <div class="refresh">
              <button onclick="location.reload()">Refresh</button>
              <span>(Auto-refreshes every 5 seconds)</span>
              <button onclick="window.location.href='/clear-logs'" style="margin-left: 20px; background-color: #f44336;">Clear All Logs</button>
            </div>
            <div class="filter">
              <label><input type="checkbox" class="filter-type" value="log" checked> Logs</label>
              <label><input type="checkbox" class="filter-type" value="warn" checked> Warnings</label>
              <label><input type="checkbox" class="filter-type" value="error" checked> Errors</label>
              <label><input type="checkbox" class="filter-type" value="info" checked> Info</label>
              <label><input type="checkbox" class="filter-type" value="debug" checked> Debug</label>
            </div>
      `;

      // Add each session
      allSessions.forEach((session, index) => {
        const firstSeen = new Date(session.firstSeen).toLocaleString();
        const lastSeen = new Date(session.lastSeen).toLocaleString();

        html += `
          <div class="session">
            <h2>Session ${index + 1}: ${session.url}</h2>
            <p>First seen: ${firstSeen} | Last seen: ${lastSeen} | Total logs: ${
          session.logs.length
        }</p>
            <div class="log-content">
        `;

        // Add logs
        if (session.logs.length === 0) {
          html += `<p>No logs in this session.</p>`;
        } else {
          session.logs.forEach((log) => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            let content;
            try {
              content = JSON.stringify(log.content, null, 2);
            } catch (e) {
              content = String(log.content);
            }
            html += `
              <div class="log-entry ${log.type}" data-type="${log.type}">
                <span class="timestamp">[${timestamp}]</span>
                <span class="${log.type}">${log.type.toUpperCase()}:</span>
                ${content}
              </div>
            `;
          });
        }

        html += `
            </div>
          </div>`;
      });

      html += `
            <script>
              // Auto-refresh every 5 seconds
              setTimeout(() => {
                location.reload();
              }, 5000);
              
              // Set up filtering
              document.querySelectorAll('.filter-type').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                  const type = this.value;
                  const checked = this.checked;
                  
                  document.querySelectorAll(\`.log-entry[data-type="\${type}"]\`).forEach(entry => {
                    entry.style.display = checked ? 'block' : 'none';
                  });
                });
              });
            </script>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('Error generating logs view:', error);
      res.status(500).send('Error generating logs view: ' + error.message);
    }
  });

  app.listen(port, () => {
    console.log(`MCP server is running on port ${port}`);
  });
} catch (error) {
  console.error('Error initializing MCP server:', error);
}
