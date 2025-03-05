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

  // Check if script is already running
  if (window.__consoleCaptureMcp) {
    origLog('Console capture already active');
    return; // Exit early
  }

  // Mark as running
  window.__consoleCaptureMcp = true;
  origLog('Console capture activated');

  // Test connection to MCP server
  origLog('Testing direct connection to MCP server...');
  fetch('http://localhost:3333/test', {
    method: 'GET',
  })
    .then((response) => {
      origLog('Direct connection successful:', response.status);
      initializeDirectCapture(); // Only initialize after successful connection
    })
    .catch((err) => {
      origLog('Direct connection failed:', err.message);
    });

  function initializeDirectCapture() {
    // Create a session ID
    const sessionId = Date.now().toString();

    // Function to send a log directly to the MCP server
    function sendDirectLog(type, content) {
      const logEntry = {
        type: type,
        content: content,
        timestamp: new Date().toISOString(),
      };

      fetch('http://localhost:3333/console-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: [logEntry],
          sessionId: sessionId,
          url: window.location.href,
        }),
      })
        .then((response) => {
          if (response.ok) {
            origLog('Log sent successfully');
          } else {
            origLog('Failed to send log:', response.status);
          }
        })
        .catch((err) => {
          origLog('Error sending log:', err);
        });
    }

    // Create a global function that can be called from anywhere
    window.__sendMcpLog = function (type, ...args) {
      sendDirectLog(type, args);
    };

    // Find all buttons on the page
    const buttons = document.querySelectorAll('button');

    // Add our own logging to each button
    buttons.forEach((button, index) => {
      // Don't override onclick directly as it might be protected
      // Just add an event listener
      button.addEventListener('click', function () {
        sendDirectLog('log', [
          `Button clicked: ${
            button.textContent || button.id || 'Button ' + index
          }`,
        ]);
      });
    });

    // Inject our own test button if we're not on the MCP server page
    if (!document.getElementById('test-log')) {
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Direct Log';
      testButton.style.position = 'fixed';
      testButton.style.bottom = '10px';
      testButton.style.right = '10px';
      testButton.style.zIndex = '9999';
      testButton.style.padding = '10px';
      testButton.style.background = '#4CAF50';
      testButton.style.color = 'white';
      testButton.style.border = 'none';
      testButton.style.borderRadius = '4px';
      testButton.style.cursor = 'pointer';

      testButton.addEventListener('click', function () {
        sendDirectLog('log', [
          'Test log from injected button',
          new Date().toISOString(),
        ]);
        sendDirectLog('warn', ['Test warning from injected button']);
        sendDirectLog('error', ['Test error from injected button']);
        alert('Test logs sent directly! Check the MCP server.');
      });

      // Try to add the button, but handle CSP restrictions
      try {
        document.body.appendChild(testButton);
      } catch (e) {
        origLog('Could not inject test button due to CSP restrictions:', e);
      }
    }

    // Specifically look for the test button on the MCP server page
    const mcpTestButton = document.getElementById('test-log');
    if (mcpTestButton) {
      origLog('Found MCP test button, adding direct logging');

      // Add our own direct logging
      mcpTestButton.addEventListener('click', function () {
        sendDirectLog('log', [
          'Test log from MCP button click',
          new Date().toISOString(),
        ]);
        sendDirectLog('warn', ['Test warning from MCP button click']);
        sendDirectLog('error', ['Test error from MCP button click']);
      });
    }

    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any new buttons were added
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              // Element node
              // Look for buttons
              const buttons = node.querySelectorAll
                ? node.querySelectorAll('button')
                : [];
              buttons.forEach((button, index) => {
                // Add our direct logging
                button.addEventListener('click', function () {
                  sendDirectLog('log', [
                    `New button clicked: ${
                      button.textContent || button.id || 'Button ' + index
                    }`,
                  ]);
                });
              });
            }
          });
        }
      });
    });

    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Less noisy console detection
    let isCheckingConsole = false;
    let consoleOpenState = false;

    // Function to check if the console is open (less frequently)
    function checkConsoleState() {
      if (isCheckingConsole) return;

      isCheckingConsole = true;

      const startTime = performance.now();

      const endTime = performance.now();

      // If it took more than 20ms, devtools is probably open
      const newState = endTime - startTime > 20;

      // Only log if the state changed
      if (newState !== consoleOpenState) {
        consoleOpenState = newState;
        sendDirectLog('log', [
          `Console is now ${consoleOpenState ? 'open' : 'closed'}`,
        ]);
      }

      isCheckingConsole = false;
    }

    // Check console state less frequently
    setInterval(checkConsoleState, 5000);

    // Also try to capture errors
    window.addEventListener('error', function (event) {
      sendDirectLog('error', [
        'Uncaught error:',
        event.message,
        `at ${event.filename}:${event.lineno}:${event.colno}`,
      ]);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
      sendDirectLog('error', [
        'Unhandled promise rejection:',
        event.reason
          ? event.reason.message || String(event.reason)
          : 'Unknown reason',
      ]);
    });

    // Send an initial log to test the system
    sendDirectLog('log', ['ConsoleSpy initialized and working']);

    // Create a simple API for manually logging from the console
    window.mcpLog = function (message) {
      sendDirectLog('log', [message]);
      return 'Log sent to MCP server';
    };

    window.mcpWarn = function (message) {
      sendDirectLog('warn', [message]);
      return 'Warning sent to MCP server';
    };

    window.mcpError = function (message) {
      sendDirectLog('error', [message]);
      return 'Error sent to MCP server';
    };

    // Log instructions for manual logging
    origLog(
      'Manual logging available via window.mcpLog(), window.mcpWarn(), and window.mcpError()'
    );

    // Log that we've set up the direct capture
    origLog('Direct capture system activated');
  }
})();
