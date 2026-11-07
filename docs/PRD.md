# Iterate — Product Requirements (v1)

## Vision
Turn incomplete ideas into complete, structured, actionable AI instructions. Iterate improves the thinking and requirements behind a prompt, not merely its wording.

## Platform and architecture
- Chrome-first extension using Manifest V3.
- React, TypeScript, Vite, Tailwind CSS.
- No Iterate-owned backend, hosted database, account system, or cloud sync.
- Direct HTTPS requests from trusted extension contexts to the selected AI provider.
- OpenAI, Google Gemini, and Anthropic Claude at launch.
- Bring Your Own Key; API keys are user supplied and stored locally.
- chrome.storage.local for settings and small metadata; IndexedDB for projects, conversations, specifications, prompts, history, and image blobs.
- Manual JSON export/import.
- Chrome Web Store and developer ZIP distribution.

## Experience
- Small popup for quick idea entry, starting an iteration, recent projects, and opening the workspace.
- Dedicated extension tab is the primary workspace.
- Dark premium interface inspired by the supplied references: near-black/navy surfaces, blue and purple ambient radial lighting, restrained violet/magenta accents, bold modern typography, subtle glass panels, low-contrast borders, and restrained motion.
- Responsive for narrow windows; desktop Chrome is the primary target.

## Interview engine
- Hybrid classification: AI proposes a category, user can change it, and classification can evolve.
- AI chooses question count dynamically; no arbitrary maximum.
- One question at a time.
- Multi-select and custom answer support; explain exclusive choices when logically required.
- Clarification, discovery, contradiction detection, sensible defaults, knowledge-level adaptation, proactive improvement suggestions, and risk/dependency identification.
- User can skip, go back/edit, add requirements, request explanations, request suggestions, and finish early.
- AI recommends completion; user approves.
- Dynamic project-specific checklist and section-based progress (no percentage).
- Distinguish confirmed requirements, suggestions, assumptions, and unresolved decisions. Never invent missing requirements.

## Specification engine
- Dynamic structure based on project type, with common sections as relevant.
- Manual and AI-assisted editing.
- Meaningful changes require user approval; preserve confirmed requirements.
- Structured source of truth separate from generated prompt artifacts.

## Prompt studio
- Main project prompt plus multiple task-specific prompts derived from the same specification.
- Seven formats: Detailed Prompt, Concise Prompt, Structured Specification, Markdown, JSON, Developer Brief, Custom Format.
- Detailed quality review covering clarity, completeness, consistency, specificity, context, constraints, deliverables, structure, and relevance.
- Validate JSON before marking it valid.
- Prompt edits do not silently mutate the source specification.

## Versioning and stale prompt handling
- Automatic meaningful checkpoints for specification and prompt artifacts.
- Compare and restore versions; restoring creates a new checkpoint.
- Specification changes do not mutate existing prompts.
- Detect prompts generated from older specification versions and offer one-click regeneration.

## Images
- PNG, JPG/JPEG, and WebP.
- Local preview and association with projects.
- Explicit confirmation before image or related context is sent to the selected provider.
- Explain which provider receives the image and link the action to provider data-handling policies.

## Privacy and security
- No analytics or telemetry in v1.
- No background collection of browsing activity or website content.
- No arbitrary content-script access to websites.
- Least-privilege permissions, only necessary provider API host access.
- Keys never appear in prompts, logs, errors, or content scripts.
- Local browser storage is not a hardware-backed secrets vault; disclose this limitation.
- No automatic provider switching.
- Users can delete individual projects and all local application data.
- Manual JSON backup and restore.

## Resilience
- Local editing and project viewing remain available offline.
- AI requires internet connectivity and may incur provider API charges.
- Handle invalid keys, rate limits, quota/billing errors, unavailable models, network interruption, malformed structured output, oversized uploads, storage quota exhaustion, interrupted requests, and browser restarts.
- Preserve existing project data on provider failures and retry safely without duplicating completed changes.
- Design MV3 service-worker workflows to tolerate suspension and restart; persist durable state.

## MVP acceptance
- Install and open as a Chrome extension without an Iterate backend.
- Configure and test supported provider keys.
- Start from popup or workspace.
- Adaptive interview and controls behave as specified.
- Structured specification can be edited and reviewed.
- Main and task-specific prompts can be generated in all seven formats.
- Detailed quality checks and JSON validation work.
- Version history, stale prompt detection, export/import work.
- Explicit image consent enforced.
- Local projects survive browser restarts.
- No telemetry and no automatic provider fallback.
