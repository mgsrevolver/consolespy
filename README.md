# ConsoleSpy

> **Archived August 2026.** ConsoleSpy piped browser console logs into an AI coding agent back when there was no supported way to do that. There are now several, shipped by the browser and model vendors themselves. Use one of those instead — see below. The code stays up for reference; it is no longer maintained.

## Use these instead

| Tool | Notes |
| --- | --- |
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Google's official server. Console messages with source-mapped stack traces, plus network, performance, and DOM inspection. |
| [Chrome DevTools auto-connect](https://developer.chrome.com/docs/devtools/agents/use-cases/auto-connect) | Chrome 144+. Attaches the MCP server to the Chrome you already have open, with a per-session permission prompt. No debug port, no separate profile. |
| [Claude in Chrome](https://code.claude.com/docs/en/chrome) | Anthropic's extension plus native messaging bridge. Run `claude --chrome` and the agent reads console output from your real, logged-in browser. Requires a paid Anthropic plan. |
| [Safari MCP server](https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/) | Apple's equivalent for WebKit, shipped July 2026. |

## What this was

In March 2025, MCP was about four months old and agents were effectively blind to the browser: you debugged by copy-pasting console output into a chat window. ConsoleSpy closed that loop with three pieces — a Chrome extension that hooked `console.*` in the active tab, a local Express collector on port 3333, and an MCP server exposing those logs to Cursor over SSE.

## Why it's archived

The specific thing ConsoleSpy did that alternatives couldn't was capture logs **passively, from the real browser profile you were already signed into**. That mattered more over time, not less: Chrome 136 blocked remote debugging on default profiles, so every tool built on the Chrome DevTools Protocol had to launch a throwaway profile with none of your sessions in it. An extension didn't have that problem.

That gap is now closed from both directions. Chrome 144's auto-connect grants a debugging session against your live browser behind a permission dialog, and Claude in Chrome does it through a native messaging bridge with no port and no MCP configuration at all. Both are first-party, both cover far more than console logs, and neither asks you to run two processes.

## What I'd do differently

- **Configuration by find-and-replace.** Port 3333 was hardcoded in four files, and the README's advice was to grep for it. One config value, read once, would have cost nothing.
- **Two processes and an SSE bridge.** The collector and the MCP server ran separately, glued together with `supergateway`. Plain stdio would have removed both the second process and the manual client setup.
- **Coupled to one editor instead of the protocol.** The package was named `console-to-cursor-mcp`. MCP's whole point is that the client is interchangeable; the naming and docs should have reflected that.

One problem from 2025 does remain unsolved, and it's the interesting one: console and network output floods an agent's context window. Anthropic's own docs now advise telling the agent which patterns to look for, "since logs can be verbose." Capture was the easy half. Triage — deduplicating by stack signature, diffing against a clean baseline, surfacing only what changed since the last edit — is still mostly manual.

## License

[MIT](LICENSE)
