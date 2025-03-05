// Direct console message using the original console.log
(function () {
  const origLog = console.log;
  origLog('CONSOLE CAPTURE SCRIPT LOADED');

  // Check if we can access the window object properly
  origLog(
    'Window access check:',
    typeof window !== 'undefined' ? 'OK' : 'FAILED'
  );

  // Check if fetch is available
  origLog('Fetch API check:', typeof fetch !== 'undefined' ? 'OK' : 'FAILED');
})();

// Check if script is already running
if (window.__consoleCaptureMcp) {
  console.log('Console capture already active');
} else {
  // Mark as running
  window.__consoleCaptureMcp = true;
  console.log('Console capture activated');

  // Add after the "Console capture activated" log
  console.log('Testing direct connection to MCP server...');
  fetch('http://localhost:3333/test', {
    method: 'GET',
  })
    .then((response) => {
      console.log('Direct connection successful:', response.status);
    })
    .catch((err) => {
      console.error('Direct connection failed:', err.message);
    });

  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  let logs = [];
  let sessionId = Date.now().toString();

  // Override console methods
  console.log = function () {
    logs.push({
      type: 'log',
      content: Array.from(arguments),
      timestamp: new Date(),
    });
    sendLogs(); // Send immediately for real-time
    return originalConsole.log.apply(console, arguments);
  };

  console.error = function () {
    logs.push({
      type: 'error',
      content: Array.from(arguments),
      timestamp: new Date(),
    });
    sendLogs(); // Send immediately
    return originalConsole.error.apply(console, arguments);
  };

  console.warn = function () {
    logs.push({
      type: 'warn',
      content: Array.from(arguments),
      timestamp: new Date(),
    });
    sendLogs(); // Send immediately
    return originalConsole.warn.apply(console, arguments);
  };

  // Send logs to MCP server
  function sendLogs() {
    // Use originalConsole.log instead of console.log to avoid recursion
    originalConsole.log('Attempting to send logs to MCP server...');

    fetch('http://localhost:3333/console-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logs: logs.slice(-1), // Just send the latest log
        sessionId: sessionId,
        url: window.location.href,
      }),
    })
      .then((response) => {
        originalConsole.log('MCP server response:', response.status);
      })
      .catch((err) => {
        originalConsole.error('Failed to send logs to MCP:', err);
      });
  }

  // Listen for disable message
  window.addEventListener('message', function (event) {
    if (event.data.type === 'CONSOLE_CAPTURE_DISABLE') {
      // Restore original console
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    }
  });
}
