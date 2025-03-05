let active = false;
const MCP_ENDPOINT = 'http://localhost:3333/console-logs';

// Function to disable capture
function disableCapture() {
  window.postMessage({ type: 'CONSOLE_CAPTURE_DISABLE' }, '*');
  console.log('Console capture disabled');
}

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  active = !active;

  // Update icon to show state
  chrome.action.setIcon({
    path: active ? 'icons/icon-active.png' : 'icons/icon16.png',
  });

  // Show status to user
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const div = document.createElement('div');
      div.id = 'mcp-status-overlay';
      div.style.position = 'fixed';
      div.style.bottom = '20px';
      div.style.right = '20px';
      div.style.backgroundColor = 'rgba(0,0,0,0.7)';
      div.style.color = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.zIndex = '10000';
      div.style.transition = 'opacity 1s';
      div.textContent = window.__consoleCaptureMcp
        ? 'Console Capture: ACTIVE'
        : 'Console Capture: DISABLED';

      const existing = document.getElementById('mcp-status-overlay');
      if (existing) document.body.removeChild(existing);

      document.body.appendChild(div);
      setTimeout(() => (div.style.opacity = '0'), 3000);
    },
  });

  if (active) {
    // Inject the console capture script
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ['console-capture.js'],
      })
      .then(() => {
        console.log('Console capture script injected');
      })
      .catch((err) => {
        console.error('Failed to inject console capture script:', err);
      });
  } else {
    // Inject script to disable capturing
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: disableCapture,
    });
  }
});
