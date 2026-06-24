# AGENTS.md

## Cursor Cloud specific instructions

Dosecraft / Infusion Arcade is a **static, client-side PWA** (vanilla JS/HTML + React loaded from a CDN). There is **no package manager, lockfile, build step, or backend** — nothing to install. The update script is intentionally a no-op.

### Running it (development)

Serve the repo root over HTTP (not `file://`, which breaks audio `fetch()` and the service worker) from `/workspace`:

```bash
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/` — homepage / drug selection (`index.html`)
- `http://localhost:8000/game.html?drug=Zosyn` — deep-link straight into a drug's game

### Non-obvious gotchas

- **The game page (`game.html`) requires outbound internet** to `unpkg.com` (React, ReactDOM, Babel Standalone). It is transpiled in-browser via `<script type="text/babel">`; there is no precompile/bundling. `index.html` alone is vanilla JS and does not need the CDN.
- **Homepage navigation is two steps:** the landing "attract" screen requires clicking the blinking start text (calls `render('select')`) to reach the drug-selection grid; the category cards on the attract screen are not direct links. Drug cards then call `goToGame()` → `game.html?drug=<name>`.
- **`InfusionArcade.jsx` is the editable source; `InfusionArcade.js` is what the browser actually loads.** They are kept in sync manually — see `EDITS_TO_MAKE.md` for the conversion edits. Editing only the `.jsx` will not change runtime behavior.
- Companion Mode / infusion timer state persists in `localStorage` keys `dc_startTime`, `dc_durationMins`, `dc_endTime`.
- Adding a drug: edit `drugCatalog.js` only (see `.cursor/skills/add-dosecraft-drug/SKILL.md` and `docs/add-drug-checklist.md`).
- There is **no lint or automated test suite** in this repo. Validation is manual (serve + play in a browser). CI only runs a GitHub Pages Jekyll build/deploy (`.github/workflows/jekyll-gh-pages.yml`).
