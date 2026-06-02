# uncanny-dani

Starter Vite + React scaffold for the Uncanny DANI project.

## Codex Rules
- Keep the app as a Vite + React single-page experience.
- Keep all behavior self-contained in the repo.
- Preserve the terminal-first, single-input interaction model.
- Treat all system intelligence as fictional narrative simulation only.
- Do not add cross-session tracking, hidden databases, or backend dependencies.
- Keep UI, engine, and memory responsibilities separated.

## Session Controls
UncannyDANI supports in-session control commands entered into the terminal input.

### Reset / Reboot Commands
- `/reset` or `reset`: clears session memory and restarts the boot sequence.
- `/reboot` or `reboot`: alias for reset behavior.
- `/recalibrate`: soft reset with explicit system recalibration framing.

### Notes
- These commands only affect the current browser session.
- No persistent storage outside `sessionStorage` is modified.
- Reset does not reload the page; it re-enters the boot flow internally.

## Layout
- `deployment/`: deployment layer notes and environment specs
- `release/`: formal version definitions and acceptance checklists
- `changelog/`: compact version and evolution ledger
- `public/`: static assets for audio, fonts, and glitch visuals
- `src/components/`: UI and terminal experience modules
- `src/data/`: prompt and event data
- `src/engine/`: behavior and memory logic
- `src/styles/`: CRT and visual styling

## Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`

## Deployment
- Cloudflare Pages build command: `npm run build`
- Cloudflare Pages output directory: `dist`
- Docker is for build consistency and local preview only
