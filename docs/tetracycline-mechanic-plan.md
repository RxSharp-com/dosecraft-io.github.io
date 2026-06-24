# Tetracycline mechanic plan (radial ribosome shield)

**Status:** Implemented on `feature/add-tetracycline-mechanic` (`gameType: tetracycline`, drug: Doxycycline). Retained for design reference.

## Summary

| Item | Recommendation |
|---|---|
| `gameType` | `tetracycline` |
| `mechanicTemplate` | `tetracycline` |
| `mode` | `PROTEIN BLOCKER` |
| First drug (later) | Doxy / doxycycline |
| Core interaction | **Radial/orbital shield** around central ribosome — **not** a lane/paddle intercept |

**Metaphor:** Tetracycline binds the bacterial 30S ribosomal subunit and blocks aminoacyl-tRNA entry. Patient-facing: the drug blocks new building pieces from entering the bacterial protein factory, so protein production stalls.

## Distinctness from Vancomycin/Dalvance

### 1. Why this is not a glycopeptide reskin

| | Glycopeptide (`vanco`) | Tetracycline (`tetracycline`) |
|---|---|---|
| Biology | D-Ala-D-Ala / cell-wall assembly | 30S ribosome / tRNA entry |
| Layout | Cargo falls **down lanes** toward a **bottom wall** | Cargo approaches **from all sides** toward a **central ribosome** |
| Player | **Horizontal paddle** above a wall line | **Rotating shield segment** on an **entry ring** around the ribosome |
| Target visual | “Bacterial cell wall”, rectangular wall blocks | Ribosome factory, round aa/tRNA cargo, growing protein chain |
| Win feel | Block enough wall builders | Stall protein production by sealing the entry site |

Same engine primitives (spawn, collide, particles) may be reused; **layout, input, and metaphor must differ.**

### 2. Proposed control scheme

**Touch (primary):**
- Drag finger around the ribosome (or along the entry ring) → shield snaps to the nearest **arc angle** on the ring.
- Alternative: tap a quadrant/side of the ring to rotate shield ~90° (fallback only).

**Desktop:**
- Mouse move around ribosome center sets shield angle.
- Arrow keys ←/→ rotate shield in fixed steps (optional accessibility).

**Not allowed for MVP:** horizontal-only paddle at bottom (that is the vanco pattern).

### 3. Proposed canvas layout

```
        aa ↘     ↙ aa
              ╭─────╮
         aa → │ 30S │ ← aa        ← central ribosome (mid-canvas)
              │ rib │
              ╰─▓───╯             ← entry ring; ▓ = player shield arc
           protein chain grows
           below ribosome (ribbon)
```

- Ribosome: fixed center `(CANVAS_W/2, ~CANVAS_H*0.52)`.
- Entry ring: radius ~70px; shield covers ~60–90° arc.
- Cargo spawns on an outer orbit (radius ~200px) at random angles, moves **inward** along radial paths.
- Protein chain: horizontal ribbon **below** ribosome (not a bottom “wall”).
- No lane grid, no Tetris board, no wall line at canvas bottom.

### 4. State variables

```javascript
{
  gameType: "tetracycline",
  ribosomeX, ribosomeY,
  shieldAngle, targetShieldAngle,     // radians on entry ring
  shieldArcWidth,                     // radians covered by blockade
  ringRadius, entryRadius,
  cargo: [],                          // { angle, dist, speed, blocked, absorbed, opacity }
  spawnTimer, spawnRate,
  stalled, goal,                       // win progress
  production, productionCap,           // rises on misses
  chainSegments,                       // visual chain length
  particles: [],
  gentleNudgeTimer,                    // soft try-again hint cooldown
}
```

### 5. Win / try-again conditions

**Win:** `stalled >= goal` → `handleRoundComplete()` (protein production stalled).

**Try-again (gentle, in-round):** `production >= productionCap` before stall goal:
- Show calm overlay text: e.g. “Protein is still being made — rotate the shield to block more cargo.”
- Reset `production` partially (e.g. −30%) and continue — **no alarming failure screen**, no “infection spreading” language.
- Optional: brief slow-motion on next spawns.

Round does not hard-fail; companion/timer flow unchanged.

### 6. Minimal implementation approach

1. New `tickTetracycline(s, frozen)` in `InfusionArcade.js` only.
2. **Spawn:** pick random angle θ on outer ring; cargo `{ angle: θ, dist: outerR, radialSpeed }`.
3. **Move:** each frame `dist -= radialSpeed` (inward).
4. **Collision:** when cargo crosses entry ring, compare its angle to `shieldAngle ± shieldArcWidth/2`. Inside arc → block (dissolve + `stalled++`); outside → absorb (`production++`, `chainSegments++`).
5. **Input:** pointer position → `targetShieldAngle = atan2(dy, dx)`; lerp `shieldAngle` toward target.
6. **Draw:** ribosome body, rotating shield arc, inward-moving dots, chain ribbon, dual meters in HUD.
7. Wire: `startDrug`, pointer handler, game-loop branch, `instructions`, `TUTORIAL_CONTENT`, icon map — add `tetracycline` only.

Reuse **helpers only:** `drawRoundRect`, `drawBg`, `drawHUD`, `spawnP`/`tickP`, `setProgress`, `handleRoundComplete`, `frozen` pause — **not** `tickVanco` layout or horizontal paddle logic.

### 7. Fallback if radial control is too hard

**Tier B (still not vanco):** Shield occupies one of **4 fixed quadrants** on the ring; tap/click side of ribosome to rotate quadrant. Cargo still approaches radially from 8 directions.

**Tier C (last resort):** Entry ring split into **3 sectors** (top-left / top-right / bottom); player taps sector to move shield — still radial metaphor, still no horizontal bottom paddle.

**Reject:** Falling lanes + bottom paddle (vanco clone).

### 8. Manual tests — visual/mechanical distinction

- [ ] Ribosome is **center-screen**, not bottom wall
- [ ] Cargo approaches from **multiple angles**, not only top lanes
- [ ] Player action is **rotate/orbit shield**, not slide horizontal paddle
- [ ] No “cell wall”, “cross-link”, “D-Ala”, or brick imagery
- [ ] Blocked cargo **dissolves/sparks** at ring; missed cargo grows **protein chain**
- [ ] Side-by-side with Vancomycin: interaction and layout feel clearly different within 10 seconds
- [ ] No Tetris grid, tetrominoes, or line-clear behavior

---

## Where `gameType` is wired (unchanged from prior plan)

`drugCatalog.js` → `startDrug()` → pointer handlers → game-loop dispatch → `instructions` / `TUTORIAL_CONTENT` / `ROUND_OBJECTIVES` / HUD. Homepage uses `homeInfusionApp.js` + catalog; `game.html` loads catalog + `InfusionArcade.js`.

## `InfusionArcade.js` touch points (implementation)

1. Constants (`RIBO_R`, `RING_R`, `SHIELD_ARC`, cargo sizes)
2. `ROUND_OBJECTIVES` + `steady` include `tetracycline`
3. `startDrug()` tetracycline state init
4. Pointer handler: **angle from ribosome center** (not `targetVancoX`)
5. `tickTetracycline()` — radial spawn/collision/draw
6. Game-loop `else if` before IVIG fallback
7. `instructions.tetracycline`, `TUTORIAL_CONTENT.tetracycline`, icon `🧬`
8. Optional SFX in `game.html` (new or reuse non-wall sound)

**Do not modify** existing `tickVanco` / other engines, Companion Mode, timer, replay, routing, service worker.

## `drugCatalog.js` (after mechanic approved)

- Mechanic tile: `{ label: "Protein Blocker", icon: "🧬", color: "#14b8a6", desc: "Tetracycline antibiotics" }`
- Later: Doxy (`id: 16`), new group `Tetracycline Antibiotics`, `gameType: "tetracycline"`, `mode: "PROTEIN BLOCKER"`

## Skill update

After mechanic works, add row to `.cursor/skills/add-dosecraft-drug/SKILL.md` and `docs/add-drug-checklist.md`.

## Risks

| Risk | Mitigation |
|---|---|
| Still feels like vanco | Mandate radial layout + orbital input; review side-by-side |
| Radial touch awkward on small screens | Tier B quadrant fallback |
| Scope creep | One cargo shape, one ring, angle collision only |
| Tetris concern | Radial inward motion ≠ falling grid puzzle |

## Implementation order

1. `tickTetracycline` + wiring (no drug)
2. Playtest vs vanco for distinctness
3. Catalog tile + Doxy + skill update
4. Pharmacist review

## Pharmacist-review (Doxy, later)

Narrow indications; simple protein-factory copy; no dosing/cure/efficacy claims; `pharmacistReviewNotes` for 30S / aminoacyl-tRNA detail.
