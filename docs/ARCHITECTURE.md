# Iterate — Architecture Notes

## Runtime boundary
All product UI and core orchestration run inside extension-owned pages and trusted extension contexts. No Iterate service, backend API, hosted database, account service, or cloud sync is part of v1.

## Extension components
- Popup: quick capture and workspace launcher.
- Workspace tab: main React application.
- MV3 service worker: only background coordination that requires extension lifecycle privileges; never rely on in-memory state surviving suspension.
- Provider adapters: direct calls to user-selected provider APIs with tightly scoped host permissions.
- Local repositories: chrome.storage.local for small settings; IndexedDB for durable project data and blobs.

## Security boundaries
- Do not inject content scripts into arbitrary sites for core functionality.
- Keep API keys inside trusted extension contexts.
- Avoid logging request headers, keys, prompts, images, or user project content.
- Ask for explicit image transmission consent before provider upload.
- No telemetry in v1.
- Never switch providers without user action.

## Data flow
Idea and optional local image -> classification -> interview plan -> one-question-at-a-time interview -> structured project specification -> user approval -> prompt generation -> quality review -> user-selected output/export.

## Storage
Use versioned IndexedDB schema and explicit migrations. Use transactional writes for project changes and version checkpoints. Export/import must validate schema version and content before modifying existing data. Avoid storing large images in chrome.storage.local.

## Provider interface
Define a provider-neutral contract for text generation, structured output, image input capabilities, cancellation, normalized errors, and usage information when supplied by a provider. Keep model catalogue/capability metadata separate from core logic and verify current provider model support before release.
