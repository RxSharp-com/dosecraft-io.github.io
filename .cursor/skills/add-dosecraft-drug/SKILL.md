---
name: add-dosecraft-drug
description: Add a new Dosecraft / Infusion Arcade drug by editing drugCatalog.js and reusing an existing game mechanic. Use when the user asks to add a medication, drug, or therapy to Dosecraft.
---

# Add a Dosecraft drug

Dosecraft is a patient-facing infusion companion game (static HTML/JS on GitHub Pages), not a quiz app.

**Single source of truth:** `drugCatalog.js` → `window.DOSECRAFT_DRUGS`, `window.DOSECRAFT_DRUG_GROUPS`, `window.DOSECRAFT_MECHANIC_TILES`.

Homepage (`index.html`) and game (`game.html` → `InfusionArcade.js`) load the catalog via `<script src="drugCatalog.js">`. Do not duplicate drug arrays elsewhere.

`InfusionArcade.jsx` is **stale / not runtime-loaded** — do not sync it.

## Before editing

1. Confirm current branch and working tree (`git branch --show-current`, `git status --short`).
2. If uncommitted changes exist, stop and report them.
3. Create branch: `feature/add-<drug-slug>` (lowercase, e.g. `feature/add-cefazolin-iv`).
4. Read `drugCatalog.js` and `docs/add-drug-checklist.md`.
5. If already on an add-drug feature branch, do not create a nested branch.

## Scope rules

- **Do not** add npm tooling, `package.json`, or a build step.
- **Do not** change Companion Mode, timer persistence (`dc_*` localStorage), replay, routing, service-worker code/comment blocks, or game engines unless a **new mechanic** is explicitly approved.
- **Prefer** editing `drugCatalog.js` only.
- **Avoid** `InfusionArcade.js`, `index.html`, `game.html` unless catalog loading is broken or a new mechanic is required.

## Mechanic mapping

| Pharmacology / mechanism | `gameType` | `mechanicTemplate` | `mode` | Extra fields |
|---|---|---|---|---|
| Beta-lactam / PBP / cell-wall cross-linking inhibition | `breakout` | `breakout` | `WALL BREAKER` | `paddleLabel`, `brickLabel`, `bgGradient` |
| Glycopeptide or lipoglycopeptide / D-Ala-D-Ala binding | `vanco` | `vanco` | `BLOCK ATTACK` | `paddleLabel`, `bgGradient` |
| Daptomycin-like membrane depolarization / disruption | `dapto` | `dapto` | `MEMBRANE BREACH` | `bgGradient` |
| IVIG / SCIG / immune modulation | `ivig` | `ivig` | `IMMUNE DEFENSE` | `bgGradient`, `ivigNote` |
| Tetracycline / 30S ribosome protein-synthesis blockade | `tetracycline` | `tetracycline` | `PROTEIN BLOCKER` | `paddleLabel`, `bgGradient` |

If no existing mechanic fits, **stop** and propose a new mechanic — do not force a bad fit.

Reference implementations in catalog: Penicillin G (`breakout`), Dalvance (`vanco`), Doxycycline (`tetracycline`).

## Implementation steps

1. Pick the closest `gameType` from the table above.
2. Assign `id`: next unused integer (check max `id` in `DOSECRAFT_DRUGS`).
3. Add one `drug({ ... })` entry to `window.DOSECRAFT_DRUGS` (use the template below).
4. Append the new `id` to the correct `drugIds` array in `window.DOSECRAFT_DRUG_GROUPS` (ID-based — never use array index positions).
5. Set `displayName` / `name` as the **URL routing key** (`game.html?drug=<displayName>`). Keep stable; match brand/display name used on homepage cards.
6. Align `groupName` with the group's `label` where practical.
7. Write patient-friendly copy. No dosing schedules, cure claims, efficacy claims, or patient-specific medical advice.
8. Set `pharmacistReviewNotes` for workflow only — **never** render to patients.
9. Run `node --check drugCatalog.js` if Node is available. Do not invent build checks if no `package.json`.

## Drug object template

Add inside `window.DOSECRAFT_DRUGS` using the existing `drug()` helper:

```javascript
drug({
  id: 15,
  displayName: "Brand Name",
  genericName: "generic name",
  brandName: "Brand Name",
  className: "Drug class",
  groupName: "Penicillin Antibiotics",  // match DOSECRAFT_DRUG_GROUPS.label/homepageLabel where practical
  gameType: "breakout",
  mechanicTemplate: "breakout",
  drugColor: "#00d4c8",
  bgGradient: ["#021a18", "#04302c"],
  mode: "WALL BREAKER",
  tagline: "Short homepage tagline",
  paddleLabel: "BRAND",       // breakout / vanco only
  brickLabel: "Wall Section", // breakout only
  description: "What is this therapy for? (patient-friendly, narrow indications)",
  howItWorks: "Plain-language mechanism tied to the game visual.",
  encouragement: "Your [drug] infusion is … right now.",
  winMessage: "Round-complete message.",
  ivigNote: "Optional — IVIG/SCIG route note only.",
  pharmacistReviewNotes: "Internal: indication scope, mechanism accuracy, naming.",
}),
```

The `drug()` helper sets aliases: `name` = `displayName`, `generic` = `genericName`, `color` = `drugColor`.

## Group update template

```javascript
// In window.DOSECRAFT_DRUG_GROUPS — append id to drugIds only:
{ id: "penicillin", label: "Penicillin Antibiotics", homepageLabel: "Penicillin", color: "#00d4c8", drugIds: [1, 13, 15] },
```

Do **not** edit `DOSECRAFT_MECHANIC_TILES` when reusing an existing mechanic.

## Manual browser tests

1. Homepage attract: medication count reflects `DOSECRAFT_DRUGS.length`.
2. Homepage select: new drug card appears under the correct group.
3. Card click → `game.html?drug=<displayName>` loads the right drug intro.
4. In-game menu: drug appears under the correct `DOSECRAFT_DRUG_GROUPS` label.
5. intro → howToPlay → playing uses the expected `gameType` mechanic.
6. Companion Mode and infusion timer still persist across refresh.
7. Back navigation and replay unchanged.

## Final response format

Always end with:

- **Branch**
- **Files changed**
- **Drug added**
- **Existing mechanic reused**
- **Group updated** (which `DOSECRAFT_DRUG_GROUPS` entry / `drugIds`)
- **Assumptions**
- **Pharmacist-review items**
- **Checks run**
- **Manual browser tests** (checklist above)
- **Whether changes remain uncommitted**
