# Iterate

Iterate is a local-first Chrome extension that turns rough ideas into structured specifications and AI-ready prompts.

> **Current status:** UI foundation plus local project management. Users can create, view, edit, and delete projects; project records persist in the browser with IndexedDB. AI provider connections, the adaptive interview, specification editor, and prompt generation are not implemented yet.

## Product principles

- Runs in the user's browser; no Iterate-owned backend or application server.
- Bring your own API key for OpenAI, Google Gemini, or Anthropic Claude (provider integration is planned, not available yet).
- Projects and uploaded images are intended to remain in browser-local storage (IndexedDB); small settings use `chrome.storage.local`.
- Images will only be sent to an AI provider after explicit user confirmation.
- No analytics or telemetry in v1.
- No automatic provider fallback.
- Chrome Manifest V3, React, TypeScript, Vite, and Tailwind CSS.

## Test the current extension in Chrome

### 1. Get the code

Clone the repository:

```bash
git clone https://github.com/shivamhans/iterate.git
cd iterate
```

The current development work is on the `feature/iterate-mvp-foundation` branch. Switch to it:

```bash
git checkout feature/iterate-mvp-foundation
```

If you already cloned the repository, run:

```bash
git fetch origin
git checkout feature/iterate-mvp-foundation
git pull
```

### 2. Install dependencies

Install Node.js (use Node.js 22 or a compatible current LTS release), then run:

```bash
npm install
```

### 3. Build the extension

Run:

```bash
npm run build
```

Vite writes the production extension files into the `dist/` directory. Chrome must load the built directory, not the repository root.

### 4. Load it into Chrome

1. Open Google Chrome.
2. Visit `chrome://extensions`.
3. Turn **Developer mode** on (top-right).
4. Click **Load unpacked**.
5. Select the project's `dist` folder (the folder containing `manifest.json`).
6. Pin Iterate from the Extensions menu if you want quick access.
7. Click the Iterate toolbar icon to open the popup. Use its workspace action to open the main extension page.

### 5. After changing the code

Whenever you make source changes:

```bash
npm run build
```

Then return to `chrome://extensions` and click the **Reload** icon on the Iterate extension card. Refresh any already-open Iterate workspace tab as well.

### Optional: preview the UI during development

To run Vite's development preview:

```bash
npm run dev
```

Open the local URL printed in the terminal. This is useful for quick UI work, but it is **not** the actual Chrome extension runtime. Use the build-and-load steps above to test the extension itself.

### Troubleshooting

- **“Manifest file is missing or unreadable”** — make sure you selected `dist/`, not the project root.
- **Changes aren't visible** — run `npm run build`, reload the extension at `chrome://extensions`, then refresh the workspace tab.
- **Build fails** — check that Node.js and npm are installed, run `npm install` again, and inspect the first TypeScript/Vite error in the terminal.
- **Extension service worker errors** — open `chrome://extensions`, find Iterate, and click the service worker **Inspect** link if Chrome displays one.

## What you can test right now

- The visual direction, popup, workspace, and responsive navigation.
- Create a project from the dashboard, New iteration page, or New project button.
- Open **My projects** and confirm the project appears.
- Close the workspace tab, reopen Iterate, and confirm the project is still there.
- Click a project to edit its starting idea and save changes.
- Delete a project and confirm it disappears.
- Search projects by name.
- Confirm the dashboard's project and idea counts reflect saved projects.

Projects are stored in IndexedDB inside the extension's browser profile. Clearing Chrome's extension/site data or uninstalling the extension may remove local project data; export/backup is not implemented yet.

AI-key setup, provider calls, adaptive questioning, image analysis, specification editing, prompt generation, version history, and JSON backup/restore are still planned work. Do not enter a real API key yet.

## Architecture and product docs

- [Product requirements](docs/PRD.md)
- [Architecture notes](docs/ARCHITECTURE.md)

## Development scripts

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite UI development server |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run build` | Type-check and build the extension into `dist/` |
| `npm run preview` | Preview the built web output locally |

## Project principles

Iterate is designed to run client-side in the user's browser. AI features will make direct requests to the provider selected by the user, using their own API key. There will be no Iterate-owned backend, hosted project database, account system, or cloud sync in v1.
