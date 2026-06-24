# Dosecraft add-drug checklist

Quick reference for adding a drug via `drugCatalog.js`. See `.cursor/skills/add-dosecraft-drug/SKILL.md` for full workflow.

## Pre-flight

- [ ] On a clean working tree
- [ ] Branch: `feature/add-<drug-slug>`
- [ ] Confirmed closest existing mechanic (do not invent a new one without approval)

## Catalog edits (`drugCatalog.js` only)

- [ ] New `drug({ ... })` in `window.DOSECRAFT_DRUGS` with unique `id`
- [ ] `displayName` set for URL routing (`game.html?drug=`)
- [ ] `gameType` and `mechanicTemplate` match chosen mechanic
- [ ] `mode`, `tagline`, `drugColor`, `bgGradient` set
- [ ] Patient copy: `description`, `howItWorks`, `encouragement`, `winMessage`
- [ ] `paddleLabel` if `breakout`, `vanco`, or `tetracycline`
- [ ] `ivigNote` if `ivig`
- [ ] `pharmacistReviewNotes` filled (workflow only — not shown to patients)
- [ ] New `id` appended to correct `DOSECRAFT_DRUG_GROUPS[].drugIds`

## Do not edit (unless new mechanic approved)

- `InfusionArcade.js` (game engines, tutorials, Companion Mode, timer)
- `index.html` / `game.html` (catalog already loaded)
- `sw.js` and service-worker comment blocks
- `InfusionArcade.jsx` (stale, not loaded)

## Mechanic quick map

| Mechanism | `gameType` | Example drug |
|---|---|---|
| Beta-lactam / PBP / cell wall | `breakout` | Penicillin G |
| Glycopeptide / D-Ala-D-Ala | `vanco` | Dalvance, Vancomycin |
| Membrane disruption | `dapto` | Cubicin |
| IVIG / SCIG | `ivig` | Bivigam, Hyqvia |
| Tetracycline / ribosome blockade | `tetracycline` | Doxycycline |

## Checks

```bash
node --check drugCatalog.js
```

No `package.json` — do not add npm build/lint steps.

## Manual browser tests

- [ ] Homepage card + group
- [ ] Deep link `?drug=<displayName>`
- [ ] In-game menu group
- [ ] intro → howToPlay → playing
- [ ] Companion Mode + timer persistence
- [ ] Back / replay

## Pharmacist review

- [ ] `description` indication scope
- [ ] `howItWorks` mechanism accuracy vs patient language
- [ ] `encouragement` / `winMessage` tone
- [ ] Brand vs generic naming
- [ ] No dosing, cure, or efficacy claims
