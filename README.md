# Iterate

Iterate is a local-first Chrome extension that turns rough ideas into structured specifications and AI-ready prompts.

## Product principles

- Runs in the user's browser; no Iterate-owned backend or project database.
- Bring your own API key for OpenAI, Google Gemini, or Anthropic Claude.
- Projects and uploaded images remain in browser-local storage (IndexedDB); small settings use `chrome.storage.local`.
- Images are sent to an AI provider only after explicit user confirmation.
- No analytics or telemetry in v1.
- No automatic provider fallback.
- Chrome Manifest V3, React, TypeScript, Vite, and Tailwind CSS.

## Status

Planning is complete through the product PRD. Development is beginning with the browser extension foundation. See `docs/PRD.md` and `docs/ARCHITECTURE.md`.

## Development

Development instructions will be added as the application foundation is established.
