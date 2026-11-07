# Iterate

**Turn rough ideas into clear requirements, structured specifications, and AI-ready prompts.**

Iterate is a local-first Chrome extension for thinking through an idea before asking an AI to build, write, design, or research it. It guides users through an adaptive, one-question-at-a-time interview and keeps project data in the browser.

> **Project status:** Active development / pre-release. The current branch contains the local project workspace, provider settings, direct provider adapters, an adaptive interview, saved interview progress, background-in-tab continuity, and project status indicators. The full specification editor, prompt-generation studio, image analysis, automatic version history, and robust export/import workflow are not yet complete. Do not treat this repository as a finished production release.

## Contents

- [Why Iterate](#why-iterate)
- [Features](#features)
- [Current limitations](#current-limitations)
- [Technology](#technology)
- [Architecture and privacy](#architecture-and-privacy)
- [Supported AI providers](#supported-ai-providers)
- [Requirements](#requirements)
- [Install from source](#install-from-source)
- [Development](#development)
- [How to use](#how-to-use)
- [Data and troubleshooting](#data-and-troubleshooting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Why Iterate

A short prompt often hides important decisions: who the product is for, what problem it solves, which workflows matter, what constraints apply, and what a successful result looks like. Iterate is designed to surface those decisions before generating the final instructions.

The intended workflow is:

1. Capture a rough idea.
2. Answer a dynamic interview that adapts to the project.
3. Review and refine a structured specification.
4. Generate one or more prompts from that specification.
5. Revisit the project and keep its decisions organized.

## Features

### Available in the current development build

- Chrome Manifest V3 extension with a popup and full workspace.
- Dark, purple-accented glass interface.
- Local project creation, editing, search, listing, and deletion.
- IndexedDB-backed project storage.
- Bring Your Own Key settings for OpenAI, Google Gemini, and Anthropic.
- Automatic or manually selected model configuration.
- Direct browser-to-provider requests; no Iterate application server.
- Adaptive interview with one question per turn, multiple-choice options, custom answers, and a dynamic completion recommendation.
- Interview progress saved with the local project.
- Interview view remains mounted when navigating between workspace sections in the same open extension page.
- Project status labels such as Thinking, Question ready, Ready for review, and Needs attention.
- Timeout and provider error handling, plus a per-retry model switcher.

### Planned / incomplete

These items are product goals, not claims of functionality in the current build:

- Full specification editor with confirmed requirements, assumptions, and unresolved decisions.
- AI-assisted and manual specification editing with contradiction checks.
- Detailed specification quality review and automatic version history.
- Main prompt and task-specific prompt generation.
- Detailed, concise, structured, Markdown, JSON, developer brief, and custom output formats.
- Prompt quality checks and stale-prompt detection.
- Image attachment and AI image analysis with explicit send consent.
- Validated JSON project export/import and full data-management controls.
- Durable AI jobs that continue after the workspace tab is closed or Chrome is shut down.

## Current limitations

- AI generation requires an internet connection and a valid API key with provider billing/quota configured. API usage may cost money.
- Switching to another section of the same open workspace keeps the interview component mounted. This is **not** the same as a durable background job: closing the workspace tab, reloading the extension page, or shutting down Chrome can interrupt an in-flight request. Saved checkpoints can be reopened, but an unfinished network request is not guaranteed to complete in the background.
- Model IDs change and availability varies by provider, account, region, and API access. Manual model selection is provided for this reason. The app cannot guarantee that every suggested model is enabled for every account.
- Chrome extension local storage is not a hardware-backed secrets vault.
- The app is pre-release; validate behavior with test projects before relying on it for important work.

## Technology

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extensions Manifest V3
- IndexedDB for local project data
- `chrome.storage.local` for provider settings and API keys
- Fetch API for direct provider requests
- Lucide React icons

## Architecture and privacy

Iterate is designed to run inside the user's browser. There is no Iterate-owned backend, hosted project database, account system, or cloud synchronization service in v1.

**Data flow**

```text
User idea
   |
   v
Iterate extension workspace
   |
   +----> IndexedDB (local projects and interview checkpoints)
   |
   +----> chrome.storage.local (provider settings and API keys)
   |
   v
Selected AI provider (direct HTTPS request using user's API key)
   |
   v
Interview decision returned to the extension
   |
   v
Local project checkpoint
```

- Project data is stored in the browser profile's IndexedDB.
- Provider configuration and keys are stored in Chrome extension local storage.
- AI requests go directly to the provider selected by the user.
- Iterate does not receive or proxy provider keys or prompts through an Iterate server.
- No analytics or telemetry are intentionally included.
- No automatic provider fallback is performed.
- No website content is collected by content scripts as part of the core workflow.

## Supported AI providers

| Provider | API integration | Notes |
| --- | --- | --- |
| OpenAI | Chat Completions API | Use an API key from the OpenAI developer platform. |
| Google Gemini | Gemini generateContent API | Use an API key with Gemini API access. |
| Anthropic Claude | Messages API | Direct browser access requires Anthropic's browser-access header and is subject to provider policy. |

A ChatGPT subscription does **not** include OpenAI API credit. API access and billing are managed separately by each provider.

### Model selection

- **Automatic:** Iterate uses its configured default model for that provider.
- **Manual:** Enter a model ID supported by your provider account.
- **Change model:** When an interview request fails, select another saved provider/model for that retry. This does not silently change the default provider selection.
- **No fallback:** Iterate does not send your prompt to another provider unless you explicitly select that provider.

Model availability changes. Check the provider's current model documentation if a model returns a not-found or access error.

## Requirements

- Google Chrome or a Chromium-based browser with Manifest V3 support.
- Node.js 20 or newer (Node.js 22 LTS recommended).
- npm.
- An API key for at least one supported provider to use AI interview features.

## Install from source

1. Clone this repository:

   ```bash
   git clone https://github.com/shivamhans/iterate.git
   cd iterate
   ```

2. Switch to the development branch if you want the latest in-progress implementation:

   ```bash
   git checkout feature/iterate-mvp-foundation
   git pull origin feature/iterate-mvp-foundation
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the extension:

   ```bash
   npm run build
   ```

5. Load the built extension:

   - Open `chrome://extensions`.
   - Enable **Developer mode**.
   - Select **Load unpacked**.
   - Choose the generated `dist/` directory (not the repository root).
   - Pin Iterate from Chrome's Extensions menu if desired.

6. After source changes, run `npm run build`, then click **Reload** on the Iterate card in `chrome://extensions`. Refresh any already-open Iterate workspace page.

## Development

```bash
npm install
npm run dev        # Vite development server (web preview, not full extension runtime)
npm run typecheck  # TypeScript project checks
npm run build      # Type-check and production extension build
npm run preview    # Preview built web output
```

The production extension output is written to `dist/`. For extension-specific behavior (Chrome storage, notifications, popup, service worker), test the built extension in Chrome rather than relying only on the Vite development server.

## How to use

1. Open Iterate from the Chrome toolbar.
2. Open the full workspace.
3. Go to **AI providers**.
4. Add an API key for a provider, test the connection, save it, and select that provider.
5. Create a project with a short description of your idea.
6. Start the AI interview and answer the questions.
7. If a request fails, use **Try again** or **Change model**.
8. Return to **My projects** to reopen a saved interview checkpoint.

## Data and troubleshooting

### Where is my data stored?

- Projects and interview checkpoints: IndexedDB database `iterate-local`, object store `projects`.
- Provider settings and API keys: Chrome extension local storage key `iterate.provider-config`.

Data is scoped to the browser profile and extension origin. Clearing extension data, resetting the browser profile, or uninstalling the extension can remove local data. Back up important information before clearing browser data.

### Reset local data

For development testing, open the extension page's DevTools → **Application** → **Storage** and clear the extension's site data. This can remove both projects and provider settings. To preserve API keys, delete only the `projects` object store in IndexedDB.

### Common issues

- **Provider rejects a model (HTTP 404):** confirm the exact model ID is available to your API account, then use Change model or update the model under AI providers.
- **HTTP 401/403:** check the API key, account permissions, and provider access.
- **HTTP 429:** check rate limits, billing, and quota.
- **Request times out:** check connectivity and provider status, then retry or choose another model.
- **Extension API unavailable in Vite preview:** expected for APIs that require the Chrome extension runtime. Build and load `dist/` in Chrome.
- **Changes do not appear:** rebuild, reload the extension on `chrome://extensions`, and refresh the workspace tab.
- **Project list is empty after clearing data:** local project data was removed; the current release does not provide cloud recovery.

## Security

- Never commit API keys, tokens, or personal project data.
- Do not paste API keys into bug reports, screenshots, or public discussions.
- Keys in `chrome.storage.local` are not encrypted by Iterate and are not stored in a hardware-backed vault. Use a trusted, protected browser profile.
- Review each provider's data handling, retention, and billing terms before sending project information.
- Do not send confidential or regulated data unless you have confirmed the provider and your organization's policies permit it.
- Report suspected security vulnerabilities privately to the repository maintainer rather than opening a public issue containing exploit details.

## Contributing

Contributions, bug reports, and focused improvement proposals are welcome.

1. Open an issue describing the problem or proposed change.
2. Keep changes scoped and avoid introducing a backend, analytics, or automatic provider fallback without an explicit product decision.
3. Run `npm run typecheck` and `npm run build`.
4. Include clear reproduction steps and screenshots for UI changes.
5. Never include API keys, credentials, or private project data in commits.

## License

Iterate is licensed under the [MIT License](LICENSE).

---

Built for clearer thinking. **Iterate.**
