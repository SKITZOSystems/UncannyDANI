# UncannyDANI Codex Execution Rules

## Scope
- Keep the project as a Vite + React single-page app.
- Preserve Cloudflare Pages compatibility.
- Keep all behavior self-contained in the repo.

## Architecture
- `src/App.jsx` orchestrates state and flow only.
- `src/components/Terminal.jsx` renders transcript output only.
- `src/components/PromptEngine.jsx` handles single-channel input only.
- `src/engine/psycheEngine.js` transforms session text into narrative output only.
- `src/engine/driftLogic.js` handles timing, cadence, and mutation rules only.
- `src/engine/memoryStore.js` stores session-scoped state only.

## State Rules
- Use React state, refs, and module-local memory only.
- Optional `sessionStorage` or `localStorage` is allowed only if explicitly needed.
- Do not add cross-session persistence unless asked.
- Do not add hidden tracking, external databases, or backend storage.

## UI Rules
- Keep a single prompt/input channel.
- Do not add branching menus, multi-screen flows, or extra dashboards.
- Preserve the terminal-first layout and the current boot-to-input transition.

## Narrative Rules
- Treat all system intelligence as fictional narrative simulation.
- Use stylized system messages, fake diagnostics, continuity effects, and linguistic mirroring only.
- Do not implement real psychological inference, diagnosis, or behavior analysis.
- Do not claim real surveillance, profiling, or evaluation of the user.

## Drift And Memory Rules
- Reinterpret existing session inputs only.
- Use delayed references, surface-level style mirroring, and session-scoped continuity illusions only.
- Do not add hidden cross-session memory or identity tracking.

## Performance Rules
- Avoid unnecessary renders and heavy polling.
- Keep timers and state updates minimal and intentional.
- Preserve build simplicity and static deployment readiness.

## Safety Rule
- If a change would blur narrative simulation into real-world inference, stop and keep it fictional and procedural.
