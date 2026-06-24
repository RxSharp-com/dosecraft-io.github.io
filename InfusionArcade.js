// Hooks are provided globally by the React CDN + game.html preamble
// (useState, useEffect, useRef, useCallback are declared at the top of game.html)
// SFX is declared and loaded in game.html — available globally here.

const CANVAS_W = 480;
const CANVAS_H = 560;
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Trebuchet MS', Arial, sans-serif";

const PADDLE_W = 110, PADDLE_H = 16, BALL_R = 10;
const VANCO_W = 90, VANCO_H = 40;
const DAPTO_W = 56, DAPTO_H = 56;
const CA_R = 15, CA_MAX = 4;
const MEM_Y = 295, MEM_THICKNESS = 38;
const BRICK_COLS = 8, BRICK_ROWS = 5;
const BRICK_W = 52, BRICK_H = 24, BRICK_PAD = 4;
const BRICK_OFFSET_X = 16, BRICK_OFFSET_Y = 58;
const PRECURSOR_W = 80, PRECURSOR_H = 44;
const LANE_COUNT = 5;
const TOTAL_WAVES = 3;

// IVIG constants
const IVIG_COLS = 8, IVIG_ROWS = 6;
const IVIG_CELL_W = 52, IVIG_CELL_H = 42, IVIG_CELL_PAD = 5;
const IVIG_GRID_OFFSET_X = 16, IVIG_GRID_OFFSET_Y = 58;
const IVIG_SHOOTER_W = 70, IVIG_SHOOTER_H = 28;
const PATHOGEN_W = 36, PATHOGEN_H = 36;
const IVIG_TOTAL_WAVES = 2;

// Tetracycline / ribosome shield constants
const TETRA_RIBO_Y = Math.round(CANVAS_H * 0.52);
const TETRA_OUTER_R = 200;
const TETRA_ENTRY_R = 72;
const TETRA_RING_R = 88;
const TETRA_SHIELD_ARC = Math.PI * 0.385; // ~30% smaller than original 0.55 arc
const TETRA_CARGO_R = 11;
const TETRA_GOAL = 22;
const TETRA_PROD_CAP = 10;
const TETRA_SHIELD_HIT_R = TETRA_RING_R;

function lerpAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

function angleInArc(angle, center, halfArc) {
  let diff = angle - center;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfArc;
}

// ── SIGNAL SWEEP (IVIG Wave 0) constants ──────────────────────────────────────
const SS_PLAYER_W   = 60;   // player guide ship width
const SS_PLAYER_H   = 22;   // player guide ship height
const SS_PLAYER_Y   = CANVAS_H - 70; // player Y position (near bottom)
const SS_PULSE_R    = 5;    // calm pulse radius
const SS_PULSE_SPD  = 7;    // calm pulse upward speed
const SS_SIGNAL_R   = 14;   // signal particle radius
const SS_PICKUP_R   = 12;   // antibody pickup radius
const SS_PROGRESS_GOAL = 40; // signals calmed needed to complete phase
const SS_COOLDOWN   = 22;   // frames between pulse fires (normal)
const SS_WIDE_COOLDOWN = 14; // frames between fires (antibody boost: wide)
const SS_FORMATION_ROWS = 3;
const SS_FORMATION_COLS = 6;

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw a Y-shaped IgG antibody icon
function drawYShape(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = "round";
  // stem
  ctx.beginPath(); ctx.moveTo(cx, cy + size * 0.1); ctx.lineTo(cx, cy - size * 0.3); ctx.stroke();
  // left arm
  ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.3); ctx.lineTo(cx - size * 0.38, cy - size * 0.72); ctx.stroke();
  // right arm
  ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.3); ctx.lineTo(cx + size * 0.38, cy - size * 0.72); ctx.stroke();
  // binding tips
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx - size * 0.38, cy - size * 0.72, size * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + size * 0.38, cy - size * 0.72, size * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy + size * 0.1, size * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Draw a pathogen (spiky circle)
function drawPathogen(ctx, cx, cy, r, color, spikes = 8) {
  ctx.save();
  ctx.fillStyle = color + "44";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.65;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Draw a receptor site (hexagonal)
function drawReceptor(ctx, cx, cy, r, fillColor, strokeColor) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

const DRUGS = window.DOSECRAFT_DRUGS || [];
const DRUG_GROUPS = window.DOSECRAFT_DRUG_GROUPS || [];

function drugsForGroup(group) {
  const drugs = group.drugIds.map(id => DRUGS.find(d => d.id === id)).filter(Boolean);
  if (window.DOSECRAFT_filterEnabledDrugs) return window.DOSECRAFT_filterEnabledDrugs(drugs);
  return drugs;
}

const MECHANIC_LABEL = {
  breakout: "Wall Breaker",
  vanco: "Block Attack",
  dapto: "Membrane Breach",
  ivig: "Immune Defense",
  tetracycline: "Protein Blocker",
};

function mechanicTagForDrug(d) {
  if (!d) return "";
  return MECHANIC_LABEL[d.gameType] || "";
}

function loadGameSpeedSetting() {
  try {
    const s = localStorage.getItem("dosecraftGameSpeed");
    if (s === "relaxed" || s === "fast" || s === "normal") return s;
  } catch (e) {}
  return "normal";
}

function saveGameSpeedSetting(speed) {
  try { localStorage.setItem("dosecraftGameSpeed", speed); } catch (e) {}
}

function gameSpeedMultiplier(speed) {
  if (speed === "relaxed") return 0.85;
  if (speed === "fast") return 1.2;
  return 1;
}


// ── BRICK LAYOUTS ─────────────────────────────────────────────────────────────
// Each layout function returns an array of brick objects.
// buildBricks() picks one at random so every breakout round looks different.

function brickAt(col, row) {
  return {
    x: BRICK_OFFSET_X + col * (BRICK_W + BRICK_PAD),
    y: BRICK_OFFSET_Y + row * (BRICK_H + BRICK_PAD),
    w: BRICK_W, h: BRICK_H, alive: true,
  };
}

// Layout A — classic full grid (original)
function bricksFullGrid() {
  const b = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      b.push(brickAt(c, r));
  return b;
}

// Layout B — checkerboard: every other brick missing
function bricksCheckerboard() {
  const b = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      if ((r + c) % 2 === 0) b.push(brickAt(c, r));
  return b;
}

// Layout C — diamond / pyramid shape
function bricksDiamond() {
  const b = [];
  const center = (BRICK_COLS - 1) / 2;
  for (let r = 0; r < BRICK_ROWS; r++) {
    const spread = BRICK_ROWS - 1 - r; // wider at top
    const start = Math.round(center - spread);
    const end   = Math.round(center + spread);
    for (let c = Math.max(0, start); c <= Math.min(BRICK_COLS - 1, end); c++)
      b.push(brickAt(c, r));
  }
  return b;
}

// Layout D — two separated clusters (left block + right block)
function bricksTwoClusters() {
  const b = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < 3; c++)         b.push(brickAt(c, r));     // left cluster
    for (let c = BRICK_COLS - 3; c < BRICK_COLS; c++) b.push(brickAt(c, r)); // right cluster
  }
  return b;
}

// Layout E — fortress: hollow rectangle with filled corners
function bricksFortress() {
  const b = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++) {
      const isEdge = r === 0 || r === BRICK_ROWS - 1 || c === 0 || c === BRICK_COLS - 1;
      if (isEdge) b.push(brickAt(c, r));
    }
  return b;
}

// Layout F — random scatter: ~60% of bricks present, random positions
function bricksScatter() {
  const b = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      if (Math.random() < 0.62) b.push(brickAt(c, r));
  // guarantee at least 16 bricks so the round is meaningful
  if (b.length < 16) return bricksFullGrid();
  return b;
}

const BRICK_LAYOUTS = [
  bricksFullGrid,
  bricksCheckerboard,
  bricksDiamond,
  bricksTwoClusters,
  bricksFortress,
  bricksScatter,
];

function buildBricks() {
  // Pick a random layout each time — gives each breakout round a different shape
  const layoutFn = BRICK_LAYOUTS[Math.floor(Math.random() * BRICK_LAYOUTS.length)];
  return layoutFn();
}

function getLanes() {
  return Array.from({ length: LANE_COUNT }, (_, i) =>
    BRICK_OFFSET_X + i * ((CANVAS_W - BRICK_OFFSET_X * 2 - PRECURSOR_W) / (LANE_COUNT - 1))
  );
}

// ── DAPTOMYCIN BUILDERS ───────────────────────────────────────────────────────

// Builds 6 membrane zones. Each zone tracks its phase independently:
//   intact -> inserting (collecting molecule hits) -> clustering (hold to oligomerize)
//   -> pore (K+ ions stream out) -> done
function buildMembraneZones() {
  const totalW = CANVAS_W - 32;
  const zoneW  = Math.floor(totalW / DAPTO_ZONE_COUNT);
  return Array.from({ length: DAPTO_ZONE_COUNT }, (_, i) => ({
    id:            i,
    x:             16 + i * zoneW,
    width:         i === DAPTO_ZONE_COUNT - 1 ? totalW - i * zoneW : zoneW,
    y:             MEM_Y - MEM_THICKNESS / 2,
    h:             MEM_THICKNESS,
    stage:         "intact",       // intact | inserting | clustering | pore | done
    insertions:    0,              // 0..DAPTO_INSERTIONS_NEEDED
    clusterTimer:  0,              // counts up while player is parked here
    flashTimer:    0,
    repairTimer:   0,              // > 0 means a repair patch is active
    vulnerable:    false,          // pulseWeakness: accepts hits without charge
    kIons:         [],             // K+ ions streaming out of this pore
  }));
}

// Spawns floating Ca²⁺ ions in the upper play area.
function buildCaIons() {
  return Array.from({ length: 4 }, (_, i) => ({
    x: 70 + i * 90, y: 60 + Math.random() * 100,
    vx: (Math.random() - 0.5) * 1.8,
    vy: (Math.random() - 0.5) * 1.8,
    r: CA_R, collected: false,
  }));
}

// ── IVIG state builders ───────────────────────────────────────────────────────
function buildIvigPathogens(wave) {
  // Wave 1: pathogens descend from top
  const rows = wave === 0 ? 3 : 0;
  const cols = 7;
  const pathogens = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pathogens.push({
        x: 30 + c * 62, y: 58 + r * 52,
        vx: (r % 2 === 0 ? 1 : -1) * (0.6 + r * 0.15),
        vy: 0.18, alive: true,
        flash: 0, type: r % 3, // 0=bacteria, 1=virus, 2=toxin
      });
    }
  }
  return pathogens;
}

function buildReceptorGrid() {
  // Wave 2: 6x8 grid of receptor sites
  const cells = [];
  const startX = IVIG_GRID_OFFSET_X;
  const startY = IVIG_GRID_OFFSET_Y + 10;
  for (let row = 0; row < IVIG_ROWS; row++) {
    for (let col = 0; col < IVIG_COLS; col++) {
      cells.push({
        x: startX + col * (IVIG_CELL_W + IVIG_CELL_PAD),
        y: startY + row * (IVIG_CELL_H + IVIG_CELL_PAD),
        w: IVIG_CELL_W, h: IVIG_CELL_H,
        state: "open",     // open | blocked | occupied
        blockTimer: 0,
        occupiedFlash: 0,
        row, col,
      });
    }
  }
  return cells;
}

function buildIgGProjectiles() { return []; }

// ── SIGNAL SWEEP builders (IVIG Wave 0) ───────────────────────────────────────

// Builds one formation: a grid of signal particles that enter from off-screen top.
// Each particle has a "home" position in the formation and starts above the canvas.
// status: "entering" | "formation" | "diving" | "calmed"
function buildSignalFormation() {
  const signals = [];
  const gridW = SS_FORMATION_COLS * 52;
  const startX = (CANVAS_W - gridW) / 2 + 26;
  for (let row = 0; row < SS_FORMATION_ROWS; row++) {
    for (let col = 0; col < SS_FORMATION_COLS; col++) {
      const homeX = startX + col * 52;
      const homeY = 80 + row * 48;
      signals.push({
        x:      homeX,
        y:      -40 - row * 48 - Math.random() * 30, // staggered entry
        homeX,
        homeY,
        vx:     0,
        vy:     0,
        status: "entering",  // entering | formation | diving | calmed
        diveTimer: 0,        // counts up; triggers dive at threshold
        diveVx: 0,
        diveVy: 0,
        type:   (row + col) % 3, // visual variety 0/1/2
        flashTimer: 0,
      });
    }
  }
  return signals;
}

// Picks an antibody pickup effect at random.
function randomPickupEffect() {
  const effects = ["widePulse", "shield", "fastFire"];
  return effects[Math.floor(Math.random() * effects.length)];
}

// Creates one antibody pickup drifting down from the top.
function spawnAntibodyPickup() {
  return {
    x:      40 + Math.random() * (CANVAS_W - 80),
    y:      -SS_PICKUP_R,
    vy:     0.7 + Math.random() * 0.5,
    effect: randomPickupEffect(),
    alive:  true,
  };
}

const WAVE_MESSAGES = ["Wave 1 of 3 — First bacteria", "Wave 2 of 3 — More bacteria present", "Wave 3 of 3 — Final clearance"];
const WAVE_NARRATION = ["Cubicin is entering the bloodstream and seeking out bacteria.", "Cubicin keeps working — punching through more bacterial membranes.", "Cubicin delivers the final blow — bacteria cannot survive."];

const IVIG_WAVE_TITLES = [
  "Wave 1 — Neutralizing Threats",
  "Wave 2 — Blocking Autoimmune Signals",
];
const IVIG_WAVE_NARRATION = [
  "IgG antibodies are flooding your bloodstream, seeking out and neutralizing pathogens.",
  "The flood of IgG antibodies now occupies immune receptor sites — crowding out signals that could trigger your immune system to attack your own tissues.",
];
const IVIG_WAVE_TRANSITION_TEXT = "Antibodies don't just fight infection — in autoimmune conditions, the flood of IgG also calms a misfiring immune system by occupying the very receptors that trigger attacks on healthy tissue.";

const PATHOGEN_COLORS = ["#ff6b6b", "#ff9f43", "#ee5a24"];
const PATHOGEN_LABELS = ["Bacteria", "Virus", "Toxin"];

// ── DAPTOMYCIN PHASE-BASED CONSTANTS ─────────────────────────────────────────
const DAPTO_ZONE_COUNT        = 6;     // membrane zones
const DAPTO_MAX_CHARGE        = 3;     // Ca2+ charge slots
const DAPTO_INSERTIONS_NEEDED = 3;     // hits needed before oligomerization begins
const DAPTO_CLUSTER_FRAMES    = 120;   // frames of contact to complete clustering (~2s)
const DAPTO_KION_SPEED        = 1.6;   // K+ ion fall speed (px/frame)
const DAPTO_KION_DRAIN        = 0.004; // membrane potential lost per K+ ion that exits
const DAPTO_REPAIR_FRAMES     = 300;   // frames between repair spawns (normal)
const DAPTO_REPAIR_FRAMES_PP  = 160;   // frames between repair spawns (patchPressure)
const DAPTO_ROUND_STYLES      = ["chargeStrike", "patchPressure", "pulseWeakness", "chainLeak"];
// Zone stages: "intact" -> "inserting" -> "clustering" -> "pore" -> "done"

// ── ROUND VARIATION SYSTEM ────────────────────────────────────────────────────
// Each round randomly picks one pattern and one objective.
// Patterns adjust spawn rate and movement speed via multipliers.
// Objectives give the player a simple goal to notice — they don't block winning.
//
// To add a new pattern: copy any entry below and adjust spawnMult / speedMult.
// To add a new objective: copy any entry below and adjust the label.
// The actual checking logic is in applyRoundVariation() further down.

const ROUND_PATTERNS = [
  { id: "steady",     label: "Steady Flow",     spawnMult: 1.0,  speedMult: 1.0  },
  { id: "burst",      label: "Burst Wave",      spawnMult: 1.35, speedMult: 0.9  },
  { id: "fastLight",  label: "Fast & Light",    spawnMult: 0.8,  speedMult: 1.25 },
  { id: "slowHeavy",  label: "Slow & Heavy",    spawnMult: 1.2,  speedMult: 0.75 },
  { id: "staggered",  label: "Staggered",       spawnMult: 1.1,  speedMult: 1.05 },
];

// Objectives are purely cosmetic goals — they do not change win conditions.
// label: shown in the HUD. gameTypes: which game types this objective applies to.
const ROUND_OBJECTIVES = [
  { id: "intercept",  label: "Block 8 builders",        gameTypes: ["vanco"] },
  { id: "clearAll",   label: "Clear every wall section", gameTypes: ["breakout"] },
  { id: "noMiss",     label: "Let nothing past",         gameTypes: ["vanco"] },
  { id: "breach",     label: "Breach the membrane",      gameTypes: ["dapto"] },
  { id: "flood",      label: "Flood the receptors",      gameTypes: ["ivig"] },
  { id: "sweep",      label: "Calm the signal field",     gameTypes: ["ivig"] },
  { id: "stall",      label: "Stall protein production",  gameTypes: ["tetracycline"] },
  { id: "sealEntry",  label: "Seal the ribosome entry",   gameTypes: ["tetracycline"] },
  { id: "steady",     label: "Hold steady",              gameTypes: ["breakout","vanco","dapto","ivig","tetracycline"] },
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Returns a pattern and an objective appropriate for this game type.
// roundCount (0-based) drives a gentle ramp: +5% speed per completed round, capped at +30%.
function pickRoundSetup(gameType, roundCount) {
  const pattern = pickRandom(ROUND_PATTERNS);
  const eligible = ROUND_OBJECTIVES.filter(o => o.gameTypes.includes(gameType));
  const objective = pickRandom(eligible.length ? eligible : ROUND_OBJECTIVES);
  // Gentle ramp: each completed round adds a small speed bump, max 1.3×
  const rampMult = Math.min(1.3, 1 + roundCount * 0.05);
  return { pattern, objective, rampMult };
}

// ─────────────────────────────────────────────────────────────────────────────

function InfusionArcade({ initialDrug, returnHome = false }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const pointerRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const splashTimerRef = useRef(null);
  // gameplayFrozenRef: read by the RAF loop (closure can't read React state).
  // Kept in sync with isPaused || showTutorial via useEffect below.
  const gameplayFrozenRef = useRef(false);

  // If a drug name was passed via URL param, find its index (default 0)
  const initialIdx = initialDrug
    ? Math.max(0, DRUGS.findIndex(d => d.name.toLowerCase() === initialDrug.toLowerCase()))
    : 0;

  const [screen, setScreen] = useState("menu");
  const [drugIdx, setDrugIdx] = useState(initialIdx);
  const [progress, setProgress] = useState(0);
  const [splashVisible, setSplashVisible] = useState(false);

  // ── MUSIC STATE ───────────────────────────────────────────────────────────
  // Mirrors MUSIC.getEnabled() so the toggle button re-renders correctly.
  const [musicEnabled, setMusicEnabledState] = useState(() => MUSIC.getEnabled());
  const [sfxEnabled, setSfxEnabledState] = useState(() => (typeof SFX !== "undefined" && SFX.getEnabled ? SFX.getEnabled() : true));
  const [gameSpeed, setGameSpeedState] = useState(() => loadGameSpeedSetting());
  const [showSettings, setShowSettings] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showAboutPanel, setShowAboutPanel] = useState(false);

  function closeOverlays() {
    setShowSettings(false);
    setShowNav(false);
    setShowAboutPanel(false);
  }

  function toggleMusic() {
    const next = !MUSIC.getEnabled();
    MUSIC.setEnabled(next);
    setMusicEnabledState(next);
    // If turning on, immediately start the right track for the current screen
    if (next) {
      MUSIC.unlockAudio();
      const trackFor = {
        menu: "menu", intro: "intro", howToPlay: "intro",
        roundComplete: "intro", companion: "companion", complete: "companion", playing: "intro",
      };
      const key = trackFor[screen];
      if (key) MUSIC.fadeToTrack(key);
    }
  }

  function toggleSfx() {
    if (typeof SFX === "undefined" || !SFX.setEnabled) return;
    const next = !SFX.getEnabled();
    SFX.setEnabled(next);
    setSfxEnabledState(next);
  }

  function setGameSpeed(speed) {
    setGameSpeedState(speed);
    saveGameSpeedSetting(speed);
  }

  // ── INFUSION SESSION STATE ────────────────────────────────────────────────
  // Separated from game round state — infusion timer persists across rounds.
  // localStorage keys: dc_startTime, dc_durationMins, dc_endTime
  //
  // mode: "active" (session running) | "complete" (session ended)
  // sessionActive: true once the timer has started for this session

  function loadSessionFromStorage() {
    try {
      const start = parseInt(localStorage.getItem("dc_startTime") || "0", 10);
      const dur   = parseInt(localStorage.getItem("dc_durationMins") || "0", 10);
      const end   = parseInt(localStorage.getItem("dc_endTime") || "0", 10);
      if (start && dur && end) return { start, dur, end };
    } catch (e) {}
    return null;
  }

  function saveSessionToStorage(start, dur, end) {
    try {
      localStorage.setItem("dc_startTime", String(start));
      localStorage.setItem("dc_durationMins", String(dur));
      localStorage.setItem("dc_endTime", String(end));
    } catch (e) {}
  }

  function clearSessionFromStorage() {
    try {
      localStorage.removeItem("dc_startTime");
      localStorage.removeItem("dc_durationMins");
      localStorage.removeItem("dc_endTime");
    } catch (e) {}
  }

  const [infusionMode, setInfusionMode] = useState("active");
  const [infusionDurationMinutes, setInfusionDurationMinutes] = useState(60);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [infusionProgress, setInfusionProgress] = useState(0);
  const infusionTickRef = useRef(null);

  // ── PAUSE STATE ───────────────────────────────────────────────────────────
  // isPaused: true = game frozen, pause overlay visible.
  // pausePanel: which sub-panel is shown inside the overlay.
  const [isPaused, setIsPaused] = useState(false);
  const [pausePanel, setPausePanel] = useState("main"); // "main" | "about" | "howToPlay"

  // ── TUTORIAL OVERLAY STATE ────────────────────────────────────────────────
  // showTutorial: true = overlay visible on top of the playing screen.
  // Keyed per gameType+wave so IVIG wave 0 and wave 1 each show once.
  // The overlay can also be re-opened any time via the pause menu.
  const [showTutorial, setShowTutorial] = useState(false);

  // Sync the ref the RAF loop reads — runs after every render where either changes.
  useEffect(() => {
    gameplayFrozenRef.current = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

  // Returns a localStorage key for the tutorial. For IVIG, includes the
  // current wave so Wave 0 seen ≠ Wave 1 seen.
  function getTutorialKey(gameType, wave) {
    const waveSuffix = (gameType === "ivig" && wave !== undefined && wave !== null)
      ? `_wave${wave}` : "";
    return `dosecraft_tutorial_seen_${(gameType || "").replace(/[^a-z0-9]/gi, "_")}${waveSuffix}`;
  }

  function openTutorial() { setShowTutorial(true); }

  function closeTutorial(gameType, wave) {
    try { localStorage.setItem(getTutorialKey(gameType, wave), "true"); } catch (e) {}
    setShowTutorial(false);
  }
  // roundCount: how many rounds have been completed this session (drives ramp)
  // roundSetup: the pattern + objective chosen at the start of each round
  const [roundCount, setRoundCount] = useState(0);
  const [roundSetup, setRoundSetup] = useState(null);
  const [shareNotif, setShareNotif] = useState(false);

  // Milestone message derived from infusion progress (0–1)
  function getMilestoneMessage(pct) {
    if (pct >= 1)    return "Infusion complete.";
    if (pct >= 0.75) return "Final stretch.";
    if (pct >= 0.50) return "Halfway there.";
    if (pct >= 0.25) return "Treatment is progressing.";
    return "Infusion underway.";
  }

  // Start or resume the real-time infusion clock.
  // Accepts raw startTime (ms epoch) and durationMinutes.
  // Saves to localStorage so a page refresh can resume the session.
  function startInfusionClock(startTime, durationMinutes) {
    clearInterval(infusionTickRef.current);
    const endTime = startTime + durationMinutes * 60 * 1000;
    saveSessionToStorage(startTime, durationMinutes, endTime);
    infusionTickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / (durationMinutes * 60 * 1000));
      setInfusionProgress(pct);
      if (pct >= 1) {
        clearInterval(infusionTickRef.current);
        setInfusionMode("complete");
        setScreen("complete");
      }
    }, 5000); // update every 5 seconds — gentle, no battery drain
  }

  // Resume a persisted session from localStorage on mount
  useEffect(() => {
    const saved = loadSessionFromStorage();
    if (saved) {
      const now = Date.now();
      const elapsed = now - saved.start;
      const pct = Math.min(1, elapsed / (saved.dur * 60 * 1000));
      setInfusionDurationMinutes(saved.dur);
      setSessionStartTime(saved.start);
      setSessionEndTime(saved.end);
      setInfusionProgress(pct);
      setSessionActive(true);
      if (pct >= 1) {
        setInfusionMode("complete");
        // Don't auto-navigate; let the user see the intro first
      } else {
        setInfusionMode("active");
        startInfusionClock(saved.start, saved.dur);
      }
    }
    return () => clearInterval(infusionTickRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MUSIC: switch track when screen changes ───────────────────────────────
  // Track map: menu → menu loop | intro/howToPlay/roundComplete → intro loop
  //            companion/complete → companion loop | playing → intro loop (quieter)
  useEffect(() => {
    const trackFor = {
      menu:          "menu",
      intro:         "intro",
      howToPlay:     "intro",
      roundComplete: "intro",
      companion:     "companion",
      complete:      "companion",
      playing:       "intro",
    };
    const key = trackFor[screen];
    if (key) MUSIC.fadeToTrack(key);
  }, [screen]);

  // ── MOBILE SCROLL LOCK ────────────────────────────────────────────────────
  // Add .game-active to <body> only while playing so that touch drags control
  // the game instead of scrolling the page. Removed on every other screen so
  // menus and companion can scroll normally.
  useEffect(() => {
    if (screen === "playing") {
      document.body.classList.add("game-active");
    } else {
      document.body.classList.remove("game-active");
    }
    return () => document.body.classList.remove("game-active");
  }, [screen]);

  // Show tutorial overlay automatically the first time each game type is played.
  // For IVIG, also re-shows when the wave advances (wave 0 seen ≠ wave 1 seen).
  // Checks localStorage so it only fires once per device per game type+wave.
  // Does not affect session timer, round state, or drug state.
  const currentIvigWave = stateRef.current?.ivigWave ?? 0;
  useEffect(() => {
    if (screen !== "playing") return;
    const wave = drug.gameType === "ivig" ? (stateRef.current?.ivigWave ?? 0) : undefined;
    const key = getTutorialKey(drug.gameType, wave);
    let seen = false;
    try { seen = localStorage.getItem(key) === "true"; } catch (e) {}
    if (!seen) setShowTutorial(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentIvigWave]);

  // Called when an arcade round finishes — NEVER resets the infusion timer.
  function handleRoundComplete() {
    cancelAnimationFrame(animRef.current);
    SFX.play("level_complete");
    trackEvent('level_completed', { level: roundCount + 1, medication: DRUGS[drugIdx].name });
    setRoundCount(c => c + 1);
    // Always go to the round-complete screen; companion data shown there.
    setScreen("roundComplete");
  }

  // End the infusion session intentionally (user-initiated only)
  function endInfusionSession() {
    clearInterval(infusionTickRef.current);
    clearSessionFromStorage();
    setSessionActive(false);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setInfusionProgress(0);
    setInfusionMode("active");
  }

  // Auto-select drug from URL param — skips the in-game menu entirely
  useEffect(() => {
    if (initialDrug) {
      const drug = DRUGS[initialIdx];
      if (drug && window.DOSECRAFT_isMedicationEnabled && !window.DOSECRAFT_isMedicationEnabled(drug.id)) {
        setScreen("menu");
        return;
      }
      startDrug(initialIdx);
    }
  }, []); // intentionally runs once on mount only

  const drug = DRUGS[drugIdx];
  const col = drug.drugColor;

  // (Logo image URLs removed — not currently rendered in any screen)

  const showSplashThen = useCallback((cb) => {
    setSplashVisible(true);
    clearTimeout(splashTimerRef.current);
    splashTimerRef.current = setTimeout(() => { setSplashVisible(false); cb(); }, 2000);
  }, []);

  const startDrug = useCallback((idx, options) => {
    options = options || {};
    const restartPlaying = options.restartPlaying === true;
    setDrugIdx(idx);
    stateRef.current = null;

    const d = DRUGS[idx];
    if (!restartPlaying) trackEvent('medication_selected', { medication: d.name });
    const setup = pickRoundSetup(d.gameType, roundCount);
    setRoundSetup(setup);

    const { spawnMult, speedMult } = setup.pattern;
    const speed = speedMult * setup.rampMult * gameSpeedMultiplier(loadGameSpeedSetting());

      if (d.gameType === "breakout") {
        // Ball speed scales with the speed multiplier (base 4.8 → up to ~6)
        const ballSpeed = 4.8 * speed;
        const bricks = buildBricks(); // layout is random each round
        stateRef.current = {
          gameType: "breakout",
          paddle: { x: CANVAS_W / 2 - PADDLE_W / 2, y: CANVAS_H - 52 },
          targetPaddleX: CANVAS_W / 2 - PADDLE_W / 2,
          ball: { x: CANVAS_W / 2, y: CANVAS_H - 76, vx: 0, vy: 0 },
          bricks, launched: false, particles: [],
          totalBricks: bricks.length, // use actual count, not fixed COLS*ROWS
          clearedBricks: 0,
          ballSpeed,
        };
      } else if (d.gameType === "vanco") {
        // spawnRate (frames between spawns) shrinks when spawnMult is high = faster spawning
        // base spawnRate is 100; divide by spawnMult so higher mult = more frequent
        const spawnRate = Math.round(100 / spawnMult);
        stateRef.current = {
          gameType: "vanco",
          vancoX: CANVAS_W / 2 - VANCO_W / 2, targetVancoX: CANVAS_W / 2 - VANCO_W / 2,
          vancoY: CANVAS_H - 76, precursors: [], particles: [],
          spawnTimer: 0, spawnRate, speed: 1.3 * speed,
          blocked: 0, total: 0, goal: 24,
        };
      } else if (d.gameType === "dapto") {
        const roundStyle = DAPTO_ROUND_STYLES[Math.floor(Math.random() * DAPTO_ROUND_STYLES.length)];
        const ions = buildCaIons().map(c => ({ ...c, vx: c.vx * speed, vy: c.vy * speed }));
        stateRef.current = {
          gameType: "dapto",
          // Player molecule
          daptoX: CANVAS_W / 2 - DAPTO_W / 2, daptoY: 140,
          targetDaptoX: CANVAS_W / 2 - DAPTO_W / 2, targetDaptoY: 140,
          // Calcium charge
          charge: 0,
          caIons: ions,
          caSpawnTimer: 0,
          // Membrane zones (phase-based)
          zones: buildMembraneZones(),
          // Depolarization meter: starts at 1.0, drains to 0 via K+ ions
          membranePotential: 1.0,
          // Repair patches
          repairSpawnTimer: 0,
          repairSpawnRate: roundStyle === "patchPressure" ? DAPTO_REPAIR_FRAMES_PP : DAPTO_REPAIR_FRAMES,
          // Round variation
          roundStyle,
          pulseTimer: 0,
          pulseTarget: -1,
          // Compat fields
          particles: [],
          wave: 0,
          waveTransition: 0,
        };
      } else if (d.gameType === "tetracycline") {
        const spawnRate = Math.round(90 / spawnMult);
        stateRef.current = {
          gameType: "tetracycline",
          ribosomeX: CANVAS_W / 2,
          ribosomeY: TETRA_RIBO_Y,
          shieldAngle: -Math.PI / 2,
          targetShieldAngle: -Math.PI / 2,
          cargo: [],
          particles: [],
          spawnTimer: 0,
          spawnRate,
          speed: 1.35 * speed,
          stalled: 0,
          goal: TETRA_GOAL,
          production: 0,
          productionCap: TETRA_PROD_CAP,
          chainSegments: 0,
          nudgeMsg: "",
          nudgeTimer: 0,
          prodFlash: 0,
        };
      } else if (d.gameType === "ivig") {
        // Wave 0: Signal Sweep — Galaga-inspired formation shooter
        // Wave 1: Receptor Blockade (unchanged)
        const blockSpawnRate = Math.round(60 / spawnMult);
        stateRef.current = {
          gameType: "ivig",
          ivigWave: 0, waveTransition: 0, waveTransitionMsg: "",

          // ── Wave 0: Signal Sweep ──────────────────────────────────────────
          // Player guide ship
          ssPlayerX: CANVAS_W / 2 - SS_PLAYER_W / 2,
          ssTargetX: CANVAS_W / 2 - SS_PLAYER_W / 2,
          ssPlayerSpeed: 5 * speed,
          // Calm pulses fired by player
          ssPulses: [],
          ssCooldown: 0,
          // Active signal particles (one formation at a time; new spawned when cleared)
          ssSignals: buildSignalFormation(),
          ssFormationDir: 1,      // 1 = moving right, -1 = left
          ssFormationSpeed: 0.6 * speed,
          ssFormationTimer: 0,    // frames since last formation direction check
          ssDivePool: [],         // indices of signals currently diving
          ssDiveTimer: 0,         // countdown to next dive attempt
          ssDiveInterval: Math.round(180 / speed), // frames between dive attempts
          // Antibody pickups
          ssPickups: [],
          ssPickupTimer: 0,
          ssPickupInterval: 300,  // frames between pickup spawns
          // Active boosts
          ssBoost: null,          // null | { type, framesLeft }
          ssShieldFlash: 0,       // > 0 = flash when shield absorbs a hit
          // Progress
          ssCalmed: 0,            // signals calmed/cleared so far
          ssGoal: SS_PROGRESS_GOAL,
          // Wave 1 compat fields (receptor blockade — untouched)
          shooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2,
          targetShooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2,
          projectiles: [],
          pathogens: [],
          shootCooldown: 0, neutralized: 0, totalPathogens: 21,
          receptors: buildReceptorGrid(),
          igGBalls: [], igGX: CANVAS_W / 2, igGY: CANVAS_H - 80,
          targetIgGX: CANVAS_W / 2, targetIgGY: CANVAS_H - 80,
          occupied: 0, totalReceptors: IVIG_ROWS * IVIG_COLS,
          blockSpawnTimer: 0, blockSpawnRate,
          particles: [],
        };
      }
      setProgress(0);
      if (restartPlaying) {
        setShowTutorial(false);
        setIsPaused(false);
        showSplashThen(() => setScreen("playing"));
      } else {
        // Go directly to intro — no splash here.
        // Splash fires from the intro button, just before entering playing.
        setScreen("intro");
      }
  }, [roundCount, showSplashThen]);

  // Pointer control
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const getPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left) * (CANVAS_W / rect.width), y: (clientY - rect.top) * (CANVAS_H / rect.height) };
    };
    const onMove = (clientX, clientY) => {
      const pos = getPos(clientX, clientY);
      pointerRef.current = pos;
      const s = stateRef.current; if (!s) return;
      if (s.gameType === "breakout") s.targetPaddleX = Math.max(0, Math.min(CANVAS_W - PADDLE_W, pos.x - PADDLE_W / 2));
      else if (s.gameType === "vanco") s.targetVancoX = Math.max(0, Math.min(CANVAS_W - VANCO_W, pos.x - VANCO_W / 2));
      else if (s.gameType === "dapto") { s.targetDaptoX = Math.max(0, Math.min(CANVAS_W - DAPTO_W, pos.x - DAPTO_W / 2)); s.targetDaptoY = Math.max(38, Math.min(MEM_Y - DAPTO_H - 4, pos.y - DAPTO_H / 2)); }
      else if (s.gameType === "tetracycline") {
        s.targetShieldAngle = Math.atan2(pos.y - s.ribosomeY, pos.x - s.ribosomeX);
      }
      else if (s.gameType === "ivig") {
        if (s.ivigWave === 0) {
          // Wave 0: Signal Sweep — move player ship left/right only
          s.ssTargetX = Math.max(0, Math.min(CANVAS_W - SS_PLAYER_W, pos.x - SS_PLAYER_W / 2));
        } else {
          // Wave 1: Receptor blockade — free drag
          s.targetIgGX = Math.max(20, Math.min(CANVAS_W - 20, pos.x));
          s.targetIgGY = Math.max(34, Math.min(CANVAS_H - 20, pos.y));
        }
      }
    };
    const onTap = (clientX, clientY) => {
      const pos = getPos(clientX, clientY);
      const s = stateRef.current; if (!s) return;
      if (s.gameType === "breakout" && !s.launched) {
        const dx = pos.x - s.ball.x, dy = pos.y - s.ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy); if (dist < 1) return;
        const speed = s.ballSpeed || 4.8; // use pattern-varied speed if set
        let vx = (dx / dist) * speed, vy = (dy / dist) * speed;
        if (vy > -0.8) vy = -speed * 0.85;
        const spd = Math.sqrt(vx * vx + vy * vy);
        s.ball.vx = (vx / spd) * speed; s.ball.vy = (vy / spd) * speed; s.launched = true;
      }
      // IVIG wave 0: tap fires a calm pulse
      if (s.gameType === "ivig" && s.ivigWave === 0 && s.ssCooldown <= 0) {
        const cx = s.ssPlayerX + SS_PLAYER_W / 2;
        const wide = s.ssBoost && s.ssBoost.type === "widePulse";
        if (wide) {
          // Fire three pulses spread slightly
          s.ssPulses.push({ x: cx - 14, y: SS_PLAYER_Y, vy: -SS_PULSE_SPD, r: SS_PULSE_R, alive: true });
          s.ssPulses.push({ x: cx,      y: SS_PLAYER_Y, vy: -SS_PULSE_SPD, r: SS_PULSE_R, alive: true });
          s.ssPulses.push({ x: cx + 14, y: SS_PLAYER_Y, vy: -SS_PULSE_SPD, r: SS_PULSE_R, alive: true });
        } else {
          s.ssPulses.push({ x: cx, y: SS_PLAYER_Y, vy: -SS_PULSE_SPD, r: SS_PULSE_R, alive: true });
        }
        s.ssCooldown = s.ssBoost && s.ssBoost.type === "fastFire" ? SS_WIDE_COOLDOWN : SS_COOLDOWN;
      }
    };
    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onMouseDown = (e) => onTap(e.clientX, e.clientY);
    const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchStart = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); onTap(e.touches[0].clientX, e.touches[0].clientY); };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => { canvas.removeEventListener("mousemove", onMouseMove); canvas.removeEventListener("mousedown", onMouseDown); canvas.removeEventListener("touchmove", onTouchMove); canvas.removeEventListener("touchstart", onTouchStart); };
  }, [screen]);

  // Game loop
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const d = DRUGS[drugIdx];
    const dc = d.drugColor;

    function drawBg() {
      const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      g.addColorStop(0, d.bgGradient[0]); g.addColorStop(1, d.bgGradient[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    function drawWatermark() {
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = `bold 9px ${SANS}`;
      ctx.textAlign = "center"; ctx.fillText("SharpRX Interactive", CANVAS_W / 2, CANVAS_H - 4);
    }
    function drawProgressBar(pct) {
      const barX = 16, barY = CANVAS_H - 22, barW = CANVAS_W - 32, barH = 10;
      ctx.fillStyle = "rgba(255,255,255,0.12)"; drawRoundRect(ctx, barX, barY, barW, barH, 5); ctx.fill();
      if (pct > 0) {
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, dc + "cc"); grad.addColorStop(1, dc);
        ctx.fillStyle = grad; drawRoundRect(ctx, barX, barY, Math.max(10, barW * pct), barH, 5); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `bold 10px ${SANS}`;
      ctx.textAlign = "center"; ctx.fillText(`Immune defense: ${Math.round(pct * 100)}%`, CANVAS_W / 2, barY - 6);
    }
    function drawHUD(pct, labelOverride) {
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, CANVAS_W, 34);
      ctx.fillStyle = dc; ctx.font = `bold 13px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(d.name, 12, 21);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `10px ${SANS}`; ctx.textAlign = "right";
      const enc = d.encouragement.length > 42 ? d.encouragement.slice(0, 42) + "…" : d.encouragement;
      ctx.fillText(enc, CANVAS_W - 10, 21);

      // ── Round variation: show pattern label (left) and objective (right) ──
      // Uses a subtle second row just below the main HUD bar.
      if (roundSetup) {
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 34, CANVAS_W, 18);
        ctx.font = `9px ${SANS}`; ctx.textAlign = "left";
        ctx.fillStyle = dc + "99";
        ctx.fillText("◈ " + roundSetup.pattern.label, 12, 46);
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.textAlign = "right";
        ctx.fillText("Goal: " + roundSetup.objective.label, CANVAS_W - 10, 46);
      }

      const barX = 16, barY = CANVAS_H - 22, barW = CANVAS_W - 32, barH = 10;
      ctx.fillStyle = "rgba(255,255,255,0.12)"; drawRoundRect(ctx, barX, barY, barW, barH, 5); ctx.fill();
      if (pct > 0) {
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, dc + "cc"); grad.addColorStop(1, dc);
        ctx.fillStyle = grad; drawRoundRect(ctx, barX, barY, Math.max(10, barW * pct), barH, 5); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `bold 10px ${SANS}`;
      ctx.textAlign = "center"; ctx.fillText(labelOverride || (d.gameType === "ivig" ? `Immune defense: ${Math.round(pct * 100)}%` : `Infection clearing: ${Math.round(pct * 100)}%`), CANVAS_W / 2, barY - 6);
      drawWatermark();
    }
    function spawnP(s, x, y, color, count = 8, speed = 4) {
      for (let i = 0; i < count; i++) s.particles.push({ x, y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed - 1, life: 40, maxLife: 40, color, r: 2 + Math.random() * 3 });
    }
    function tickP(s) {
      s.particles = s.particles.filter(p => p.life > 0);
      s.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--; });
    }
    function drawP(s) {
      s.particles.forEach(p => { ctx.save(); ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.shadowBlur = 6; ctx.shadowColor = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    }

    // ── BREAKOUT ──────────────────────────────────────────────────────────────
    function tickBreakout(s, frozen) {
      if (!frozen) {
      s.paddle.x += (s.targetPaddleX - s.paddle.x) * 0.28;
      if (!s.launched) { s.ball.x = s.paddle.x + PADDLE_W / 2; s.ball.y = s.paddle.y - BALL_R - 3; }
      else {
        s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;
        if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx = Math.abs(s.ball.vx); }
        if (s.ball.x + BALL_R > CANVAS_W) { s.ball.x = CANVAS_W - BALL_R; s.ball.vx = -Math.abs(s.ball.vx); }
        if (s.ball.y - BALL_R < 34) { s.ball.y = 34 + BALL_R; s.ball.vy = Math.abs(s.ball.vy); }
        const p = s.paddle;
        if (s.ball.vy > 0 && s.ball.y + BALL_R >= p.y && s.ball.y + BALL_R <= p.y + PADDLE_H + 8 && s.ball.x >= p.x - 4 && s.ball.x <= p.x + PADDLE_W + 4) {
          const rel = (s.ball.x - (p.x + PADDLE_W / 2)) / (PADDLE_W / 2);
          const angle = rel * 62 * (Math.PI / 180);
          const speed = Math.max(4.2, Math.min(6.5, Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2)));
          s.ball.vx = Math.sin(angle) * speed; s.ball.vy = -Math.cos(angle) * speed; s.ball.y = p.y - BALL_R - 1;
        }
        if (s.ball.y - BALL_R > CANVAS_H) { s.launched = false; s.ball.vx = 0; s.ball.vy = 0; }
        for (const brick of s.bricks) {
          if (!brick.alive) continue;
          if (s.ball.x + BALL_R > brick.x && s.ball.x - BALL_R < brick.x + brick.w && s.ball.y + BALL_R > brick.y && s.ball.y - BALL_R < brick.y + brick.h) {
            const ol = s.ball.x + BALL_R - brick.x, or2 = brick.x + brick.w - (s.ball.x - BALL_R), ot = s.ball.y + BALL_R - brick.y, ob = brick.y + brick.h - (s.ball.y - BALL_R);
            const mn = Math.min(ol, or2, ot, ob);
            if (mn === ol) { s.ball.vx = -Math.abs(s.ball.vx); s.ball.x = brick.x - BALL_R; }
            else if (mn === or2) { s.ball.vx = Math.abs(s.ball.vx); s.ball.x = brick.x + brick.w + BALL_R; }
            else if (mn === ot) { s.ball.vy = -Math.abs(s.ball.vy); s.ball.y = brick.y - BALL_R; }
            else { s.ball.vy = Math.abs(s.ball.vy); s.ball.y = brick.y + brick.h + BALL_R; }
            brick.alive = false; s.clearedBricks++;
            const pct = s.clearedBricks / s.totalBricks; setProgress(pct);
            SFX.play("beta_wall_hit");
            spawnP(s, brick.x + brick.w / 2, brick.y + brick.h / 2, dc, 10, 5); break;
          }
        }
        tickP(s);
      }
      } // end if (!frozen)
      if (!frozen && s.bricks.every(b => !b.alive)) { handleRoundComplete(); return false; }
      const pct = s.clearedBricks / s.totalBricks;
      drawBg();
      for (const brick of s.bricks) {
        if (!brick.alive) continue;
        ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = dc + "66";
        drawRoundRect(ctx, brick.x, brick.y, brick.w, brick.h, 5);
        ctx.fillStyle = dc + "33"; ctx.fill(); ctx.strokeStyle = dc + "99"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = `bold 8px ${SANS}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.brickLabel, brick.x + brick.w / 2, brick.y + brick.h / 2);
      }
      drawP(s);
      ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = dc;
      const pg = ctx.createLinearGradient(s.paddle.x, s.paddle.y, s.paddle.x, s.paddle.y + PADDLE_H);
      pg.addColorStop(0, dc); pg.addColorStop(1, dc + "aa");
      drawRoundRect(ctx, s.paddle.x, s.paddle.y, PADDLE_W, PADDLE_H, 8); ctx.fillStyle = pg; ctx.fill(); ctx.restore();
      ctx.fillStyle = "#000"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(d.paddleLabel, s.paddle.x + PADDLE_W / 2, s.paddle.y + PADDLE_H / 2);
      ctx.save(); ctx.shadowBlur = 24; ctx.shadowColor = dc; ctx.fillStyle = dc;
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (!s.launched) {
        const ptr = pointerRef.current, dx = ptr.x - s.ball.x, dy = ptr.y - s.ball.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) { ctx.save(); ctx.strokeStyle = dc + "66"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(s.ball.x, s.ball.y); ctx.lineTo(s.ball.x + (dx / dist) * 70, s.ball.y + (dy / dist) * 70); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `13px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("Tap to send " + d.name, CANVAS_W / 2, CANVAS_H - 38);
      }
      drawHUD(pct, `Infection clearing: ${Math.round(pct * 100)}%`); return true;
    }

    // ── VANCOMYCIN ────────────────────────────────────────────────────────────
    function tickVanco(s, frozen) {
      const wallY = CANVAS_H - 90;
      
      if (!frozen) {
      s.vancoX += (s.targetVancoX - s.vancoX) * 0.3;
      s.spawnTimer++;
      // Spawn indefinitely until the goal is reached — no hard cap
      if (s.spawnTimer >= s.spawnRate && s.blocked < s.goal) {
        s.spawnTimer = 0; s.total++;
        const lanes = getLanes(), lane = lanes[Math.floor(Math.random() * LANE_COUNT)];
        const px = Math.max(4, Math.min(CANVAS_W - PRECURSOR_W - 4, lane + (Math.random() - 0.5) * 20));
        s.precursors.push({ x: px, y: -PRECURSOR_H, speed: s.speed + (Math.random() - 0.5) * 0.25, bound: false, missed: false, flash: 0, opacity: 1 });
      }
      for (const pre of s.precursors) {
        if (pre.bound || pre.missed) { pre.opacity -= 0.045; continue; }
        pre.y += pre.speed; if (pre.flash > 0) pre.flash--;
        if (pre.x < s.vancoX + VANCO_W && pre.x + PRECURSOR_W > s.vancoX && pre.y < s.vancoY + VANCO_H && pre.y + PRECURSOR_H > s.vancoY) {
          pre.bound = true; s.blocked++;
          setProgress(Math.min(1, s.blocked / s.goal));
          SFX.play("vanco_intercept");
          spawnP(s, pre.x + PRECURSOR_W / 2, pre.y + PRECURSOR_H / 2, dc, 12, 5);
        }
        if (pre.y > wallY && !pre.bound && !pre.missed) { pre.missed = true; spawnP(s, pre.x + PRECURSOR_W / 2, wallY, "rgba(255,100,100,0.8)", 4, 2); }
      }
      s.precursors = s.precursors.filter(p => p.opacity > 0 && p.y < CANVAS_H + 20);
      tickP(s);
      // Win when the player has intercepted enough precursors to fill the bar
      if (s.blocked >= s.goal) { handleRoundComplete(); return false; }
      } // end if (!frozen)
      const pct = Math.min(1, s.blocked / s.goal);
      drawBg();
      ctx.save(); ctx.fillStyle = "rgba(255,80,80,0.07)"; ctx.fillRect(0, CANVAS_H - 90, CANVAS_W, 90);
      ctx.strokeStyle = "rgba(255,100,100,0.3)"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, wallY); ctx.lineTo(CANVAS_W, wallY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,120,120,0.6)"; ctx.font = `bold 10px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("Bacterial Cell Wall", CANVAS_W / 2, wallY + 16); ctx.restore();
      drawP(s);
      for (const pre of s.precursors) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pre.opacity); ctx.shadowBlur = pre.flash > 0 ? 20 : 10; ctx.shadowColor = pre.flash > 0 ? "#fff" : dc;
        drawRoundRect(ctx, pre.x, pre.y, PRECURSOR_W, PRECURSOR_H, 8); ctx.fillStyle = dc + "22"; ctx.fill(); ctx.strokeStyle = dc; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha = Math.min(1, pre.opacity); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Wall Building", pre.x + PRECURSOR_W / 2, pre.y + PRECURSOR_H / 2 - 6); ctx.fillText("Block", pre.x + PRECURSOR_W / 2, pre.y + PRECURSOR_H / 2 + 8); ctx.restore();
      }
      ctx.save(); ctx.shadowBlur = 26; ctx.shadowColor = dc;
      const vg = ctx.createLinearGradient(s.vancoX, s.vancoY, s.vancoX, s.vancoY + VANCO_H);
      vg.addColorStop(0, dc); vg.addColorStop(1, dc + "bb");
      drawRoundRect(ctx, s.vancoX, s.vancoY, VANCO_W, VANCO_H, 10); ctx.fillStyle = vg; ctx.fill(); ctx.strokeStyle = "#fff4"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#1a003a"; ctx.font = `bold 10px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.paddleLabel || d.name.toUpperCase(), s.vancoX + VANCO_W / 2, s.vancoY + VANCO_H / 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `12px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Slide to intercept building blocks before they reach the wall", CANVAS_W / 2, CANVAS_H - 38);
      drawHUD(pct, `Infection clearing: ${Math.round(pct * 100)}%`); return true;
    }

    // ── TETRACYCLINE — radial ribosome shield (protein factory blockade) ─────
    function tickTetracycline(s, frozen) {
      const rx = s.ribosomeX;
      const ry = s.ribosomeY;

      if (!frozen) {
        s.shieldAngle = lerpAngle(s.shieldAngle, s.targetShieldAngle, 0.22);
        s.spawnTimer++;
        if (s.spawnTimer >= s.spawnRate && s.stalled < s.goal) {
          s.spawnTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          s.cargo.push({
            angle,
            dist: TETRA_OUTER_R,
            speed: s.speed + (Math.random() - 0.5) * 0.3,
            blocked: false,
            absorbed: false,
            opacity: 1,
            flash: 0,
          });
        }

        for (const c of s.cargo) {
          if (c.deflectFrames > 0) {
            c.dist += c.deflectSpeed;
            c.deflectFrames--;
            c.opacity -= 0.06;
            if (c.flash > 0) c.flash--;
            continue;
          }
          if (c.blocked || c.absorbed) { c.opacity -= 0.05; continue; }
          c.dist -= c.speed;
          if (c.flash > 0) c.flash--;

          // Shield collision at the visible ring — not the inner ribosome
          if (c.dist <= TETRA_SHIELD_HIT_R + TETRA_CARGO_R * 0.5) {
            const blocked = angleInArc(c.angle, s.shieldAngle, TETRA_SHIELD_ARC / 2);
            if (blocked) {
              c.blocked = true;
              c.dist = TETRA_SHIELD_HIT_R + 4;
              c.deflectSpeed = 2.8;
              c.deflectFrames = 14;
              s.stalled++;
              const px = rx + Math.cos(c.angle) * TETRA_SHIELD_HIT_R;
              const py = ry + Math.sin(c.angle) * TETRA_SHIELD_HIT_R;
              c.flash = 10;
              setProgress(Math.min(1, s.stalled / s.goal));
              SFX.play("vanco_intercept");
              spawnP(s, px, py, dc, 14, 6);
              continue;
            }
          }

          // Miss: cargo reaches ribosome interior
          if (c.dist <= TETRA_ENTRY_R) {
            c.absorbed = true;
            s.production++;
            s.chainSegments = Math.min(12, s.chainSegments + 1);
            const px = rx + Math.cos(c.angle) * TETRA_ENTRY_R;
            const py = ry + Math.sin(c.angle) * TETRA_ENTRY_R;
            spawnP(s, px, py, "rgba(255,200,120,0.9)", 8, 4);
            if (s.production >= s.productionCap) {
              s.production = s.productionCap;
              s.prodFlash = 90;
              s.nudgeMsg = "Too much protein got through — keep rotating the shield to block more cargo.";
              s.nudgeTimer = 180;
            }
          }
        }
        if (s.prodFlash > 0) {
          s.prodFlash--;
          if (s.prodFlash === 0) {
            s.production = 0;
            s.chainSegments = Math.max(0, s.chainSegments - 3);
          }
        }
        s.cargo = s.cargo.filter(c => c.opacity > 0 && (c.dist < TETRA_OUTER_R + 30 || c.deflectFrames > 0));
        if (s.nudgeTimer > 0) s.nudgeTimer--;
        else s.nudgeMsg = "";
        tickP(s);
        if (s.stalled >= s.goal) { handleRoundComplete(); return false; }
      }

      const pct = Math.min(1, s.stalled / s.goal);
      drawBg();

      // Outer approach ring (subtle)
      ctx.save();
      ctx.strokeStyle = dc + "22";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(rx, ry, TETRA_OUTER_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Growing protein chain ribbon below ribosome
      const chainY = ry + 62;
      const chainStartX = rx - Math.min(s.chainSegments, 10) * 7;
      for (let i = 0; i < s.chainSegments; i++) {
        const cx = chainStartX + i * 14;
        ctx.save();
        ctx.fillStyle = "rgba(255,200,120,0.55)";
        ctx.strokeStyle = "rgba(255,200,120,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, chainY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (s.chainSegments > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = `9px ${SANS}`;
        ctx.textAlign = "center";
        ctx.fillText("Protein chain forming", rx, chainY + 18);
      }

      // Ribosome body
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = dc + "88";
      ctx.fillStyle = dc + "28";
      ctx.strokeStyle = dc + "cc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ry, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `bold 11px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("30S", rx, ry - 6);
      ctx.font = `8px ${SANS}`;
      ctx.fillStyle = dc + "dd";
      ctx.fillText("Ribosome", rx, ry + 10);
      ctx.restore();

      // Entry ring
      ctx.save();
      ctx.strokeStyle = dc + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ry, TETRA_RING_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Player shield arc on ring
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = dc;
      ctx.strokeStyle = dc;
      ctx.lineWidth = 13;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(rx, ry, TETRA_RING_R, s.shieldAngle - TETRA_SHIELD_ARC / 2, s.shieldAngle + TETRA_SHIELD_ARC / 2);
      ctx.stroke();
      ctx.restore();

      // Shield label at arc midpoint
      const labelR = TETRA_RING_R + 18;
      const lx = rx + Math.cos(s.shieldAngle) * labelR;
      const ly = ry + Math.sin(s.shieldAngle) * labelR;
      ctx.fillStyle = "#0a2a24";
      ctx.font = `bold 8px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.paddleLabel || "BLOCK", lx, ly);

      drawP(s);

      // Incoming cargo
      for (const c of s.cargo) {
        const px = rx + Math.cos(c.angle) * c.dist;
        const py = ry + Math.sin(c.angle) * c.dist;
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.opacity);
        if (c.deflectFrames > 0) {
          ctx.shadowBlur = 14;
          ctx.shadowColor = dc;
          ctx.fillStyle = dc + "66";
          ctx.strokeStyle = "#fff8";
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) {
            const frag = TETRA_CARGO_R * (0.35 + i * 0.2);
            ctx.beginPath();
            ctx.arc(px + (i - 1) * 5, py + (i - 1) * 3, frag, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          continue;
        }
        ctx.shadowBlur = c.flash > 0 ? 18 : 8;
        ctx.shadowColor = c.flash > 0 ? "#fff" : dc;
        ctx.fillStyle = c.blocked ? dc + "22" : dc + "44";
        ctx.strokeStyle = dc;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, TETRA_CARGO_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (!c.blocked) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = `bold 8px ${SANS}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("aa", px, py);
        }
        ctx.restore();
      }

      // Protein output meter — fills on misses; flashes full on try-again
      const prodPct = s.prodFlash > 0 ? 1 : Math.min(1, s.production / s.productionCap);
      const pmX = 16, pmY = 58, pmW = 110, pmH = 7;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      drawRoundRect(ctx, pmX, pmY, pmW, pmH, 3);
      ctx.fill();
      if (prodPct > 0) {
        ctx.fillStyle = s.prodFlash > 0 ? "rgba(255,140,80,0.9)" : "rgba(255,200,120,0.75)";
        drawRoundRect(ctx, pmX, pmY, Math.max(4, pmW * prodPct), pmH, 3);
        ctx.fill();
      }
      ctx.fillStyle = s.prodFlash > 0 ? "rgba(255,180,120,0.9)" : "rgba(255,255,255,0.45)";
      ctx.font = `8px ${SANS}`;
      ctx.textAlign = "left";
      ctx.fillText(s.prodFlash > 0 ? "Protein output — try again" : "Protein output", pmX, pmY - 4);

      const hint = s.nudgeMsg || "Drag around the ribosome to rotate the shield and block cargo";
      ctx.fillStyle = s.nudgeMsg ? dc + "cc" : "rgba(255,255,255,0.55)";
      ctx.font = `11px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(hint, CANVAS_W / 2, CANVAS_H - 38);

      drawHUD(pct, `Protein stalled: ${Math.round(pct * 100)}%`);
      return true;
    }

    // ── DAPTOMYCIN — phase-based: insertion -> oligomerization -> pore -> depolarization
    function tickDapto(s, frozen) {
      const playerCX = s.daptoX + DAPTO_W / 2;
  const playerBottom = s.daptoY + DAPTO_H;
  let playerOnZone = null;

      // Wave transition overlay (compat) — skip tick count during freeze
      if (!frozen && s.waveTransition > 0) {
        s.waveTransition--;
        drawBg();
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = dc; ctx.font = `bold 20px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Membrane depolarizing…", CANVAS_W / 2, CANVAS_H / 2 - 24);
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `13px ${SANS}`;
        ctx.fillText("Cubicin pores are opening.", CANVAS_W / 2, CANVAS_H / 2 + 14);
        drawWatermark(); return true;
      }

      if (!frozen) {
      // ── Move player ──────────────────────────────────────────────────────────
      s.daptoX += (s.targetDaptoX - s.daptoX) * 0.3;
      s.daptoY += (s.targetDaptoY - s.daptoY) * 0.3;

      // ── Ca2+ ion physics & collection ────────────────────────────────────────
      s.caSpawnTimer++;
      if (s.caSpawnTimer > 60) {
        s.caSpawnTimer = 0;
        if (s.caIons.filter(c => !c.collected).length < 3) {
          s.caIons.push({
            x: 60 + Math.random() * (CANVAS_W - 120), y: 55 + Math.random() * 90,
            vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.8,
            r: CA_R, collected: false,
          });
        }
      }
      for (const ca of s.caIons) {
        if (ca.collected) continue;
        ca.x += ca.vx; ca.y += ca.vy;
        if (ca.x - ca.r < 0)          { ca.x = ca.r;          ca.vx *= -1; }
        if (ca.x + ca.r > CANVAS_W)   { ca.x = CANVAS_W-ca.r; ca.vx *= -1; }
        if (ca.y - ca.r < 38)         { ca.y = 38+ca.r;        ca.vy *= -1; }
        if (ca.y + ca.r > MEM_Y - 60) { ca.y = MEM_Y-60;       ca.vy *= -1; }
        const dx = ca.x - (s.daptoX + DAPTO_W/2), dy = ca.y - (s.daptoY + DAPTO_H/2);
        if (Math.sqrt(dx*dx+dy*dy) < DAPTO_W/2 + ca.r && !ca.collected && s.charge < DAPTO_MAX_CHARGE) {
          ca.collected = true;
          s.charge++;
          SFX.play("dapto_collect");
          spawnP(s, ca.x, ca.y, "#fef08a", 8, 3);
        }
      }

      // ── pulseWeakness: one zone periodically accepts hits without charge ──────
      if (s.roundStyle === "pulseWeakness") {
        s.pulseTimer++;
        if (s.pulseTimer > 260) {
          s.pulseTimer = 0;
          if (s.pulseTarget >= 0 && s.zones[s.pulseTarget]) s.zones[s.pulseTarget].vulnerable = false;
          const eligible = s.zones.filter(z => z.stage !== "pore" && z.stage !== "done");
          if (eligible.length > 0) {
            const pick = eligible[Math.floor(Math.random() * eligible.length)];
            pick.vulnerable = true;
            s.pulseTarget = s.zones.indexOf(pick);
          }
        }
      }

      // ── Repair patch spawning ─────────────────────────────────────────────────
      // Repairs can knock one insertion off an inserting/clustering zone
      s.repairSpawnTimer++;
      if (s.repairSpawnTimer >= s.repairSpawnRate) {
        s.repairSpawnTimer = 0;
        const candidates = s.zones.filter(z => z.stage === "inserting" || z.stage === "clustering");
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          pick.repairTimer = 180; // repair patch lasts 3 seconds unless interrupted
        }
      }

      // ── Per-zone logic ───────────────────────────────────────────────────────

      for (const zone of s.zones) {        if (zone.flashTimer > 0) zone.flashTimer--;

        // Repair patch ticks down; if it fully elapses it removes one insertion
        if (zone.repairTimer > 0) {
          zone.repairTimer--;
          if (zone.repairTimer === 0 && zone.stage === "inserting" && zone.insertions > 0) {
            zone.insertions--;
            if (zone.insertions === 0) zone.stage = "intact";
            spawnP(s, zone.x + zone.width/2, zone.y, "#4ade80", 6, 3);
          }
          if (zone.repairTimer === 0 && zone.stage === "clustering") {
            // patchPressure: aggressive repair resets clustering
            if (s.roundStyle === "patchPressure") {
              zone.stage = "inserting";
              zone.clusterTimer = 0;
              zone.insertions = Math.max(0, zone.insertions - (s.roundStyle === "patchPressure" ? 2 : 1));
              if (zone.insertions === 0) zone.stage = "intact";
            }
          }
        }

        // K+ ions from open pores fall downward and drain membrane potential
        if (zone.stage === "pore" || zone.stage === "done") {
          // Spawn new K+ ions periodically while pore is open
          if (zone.stage === "pore" && Math.random() < 0.08) {
            zone.kIons.push({
              x: zone.x + 6 + Math.random() * (zone.width - 12),
              y: zone.y + zone.h,
              vy: DAPTO_KION_SPEED + Math.random() * 0.8,
              opacity: 1,
            });
          }
          for (const k of zone.kIons) {
            k.y += k.vy;
            k.opacity = Math.max(0, 1 - (k.y - (zone.y + zone.h)) / 90);
          }
          // Any K+ that exits the visible area drains potential
          const escaped = zone.kIons.filter(k => k.y > MEM_Y + MEM_THICKNESS/2 + 95);
          s.membranePotential = Math.max(0, s.membranePotential - escaped.length * DAPTO_KION_DRAIN);
          zone.kIons = zone.kIons.filter(k => k.y <= MEM_Y + MEM_THICKNESS/2 + 95);
        }

        // Player contact detection
        const inX = playerCX > zone.x && playerCX < zone.x + zone.width;
        const inY = playerBottom >= zone.y - 6 && playerBottom <= zone.y + zone.h + 4;
        if (!inX || !inY) {
          // Player left — clustering timer pauses (doesn't reset)
          continue;
        }

        playerOnZone = zone;

        if (zone.stage === "pore" || zone.stage === "done") continue;

        // Interrupt repair patch on contact
        if (zone.repairTimer > 0) {
          zone.repairTimer = 0;
          spawnP(s, zone.x + zone.width/2, zone.y, "#86efac", 8, 3);
        }

        // ── Stage: intact or inserting — charged hit inserts one molecule ──────
        if (zone.stage === "intact" || zone.stage === "inserting") {
          const canHit = s.charge > 0 || zone.vulnerable;
          if (canHit && zone.flashTimer === 0) {
            zone.insertions++;
            zone.flashTimer = 22;
            if (s.charge > 0) s.charge--;
            spawnP(s, zone.x + zone.width/2, zone.y + zone.h/2, dc, 10, 4);

            // chainLeak: neighbour gets a free partial insertion
            if (s.roundStyle === "chainLeak") {
              const idx = s.zones.indexOf(zone);
              [-1, 1].forEach(off => {
                const nb = s.zones[idx + off];
                if (nb && nb.stage !== "pore" && nb.stage !== "done" && nb.insertions < DAPTO_INSERTIONS_NEEDED) {
                  nb.insertions++;
                  if (nb.insertions >= DAPTO_INSERTIONS_NEEDED) { nb.stage = "clustering"; nb.clusterTimer = 0; }
                  else nb.stage = "inserting";
                  spawnP(s, nb.x + nb.width/2, nb.y + nb.h/2, dc + "88", 5, 3);
                }
              });
            }

            if (zone.insertions >= DAPTO_INSERTIONS_NEEDED) {
              zone.stage = "clustering";
              zone.clusterTimer = 0;
            } else {
              zone.stage = "inserting";
            }
          }
        }

        // ── Stage: clustering — hold position to oligomerize ──────────────────
        if (zone.stage === "clustering") {
          zone.clusterTimer++;
          if (zone.clusterTimer >= DAPTO_CLUSTER_FRAMES) {
            zone.stage = "pore";
            zone.kIons = [];
            spawnP(s, zone.x + zone.width/2, zone.y + zone.h/2, "#fff", 22, 7);
            spawnP(s, zone.x + zone.width/2, zone.y + zone.h/2, dc, 14, 5);
          }
        }
      }

      tickP(s);
      } // end if (!frozen)

      // ── Progress: depolarization meter drives win condition ──────────────────
      const pct = Math.min(1, 1 - s.membranePotential);
      if (!frozen) {
        setProgress(pct);
        if (s.membranePotential <= 0) { handleRoundComplete(); return false; }
      }

      // ════════════════════════════════════════════════════════════════════════
      // DRAW
      // ════════════════════════════════════════════════════════════════════════
      drawBg();

      // Top label
      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = `10px ${SANS}`;
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Bloodstream — calcium zone", 12, 52);
      const styleLabel = { chargeStrike:"Charge & Strike", patchPressure:"Patch Pressure", pulseWeakness:"Pulse Weakness", chainLeak:"Chain Leak" }[s.roundStyle] || "";
      ctx.textAlign = "right"; ctx.fillStyle = dc + "cc"; ctx.font = `bold 10px ${SANS}`;
      ctx.fillText(styleLabel, CANVAS_W - 12, 52);

      // Membrane background strip
      const memY0 = MEM_Y - MEM_THICKNESS / 2;
      ctx.save();
      const mg = ctx.createLinearGradient(0, memY0, 0, memY0 + MEM_THICKNESS);
      mg.addColorStop(0, "#1a3a1a"); mg.addColorStop(0.5, "#0d2010"); mg.addColorStop(1, "#1a3a1a");
      ctx.fillStyle = mg; ctx.fillRect(0, memY0, CANVAS_W, MEM_THICKNESS); ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = `bold 10px ${SANS}`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Bacterial Membrane", CANVAS_W / 2, memY0 - 8);

      // ── Draw zones ───────────────────────────────────────────────────────────
      for (const zone of s.zones) {
        const cx = zone.x + zone.width / 2;
        const cy = zone.y + zone.h / 2;

        // Zone fill/stroke by stage
        let fillC, strokeC, glowC;
        switch (zone.stage) {
          case "done":
          case "pore":
            fillC = "#0a1a0a"; strokeC = "#44ff8855"; glowC = "#44ff88"; break;
          case "clustering":
            fillC = "rgba(200,150,255,0.18)"; strokeC = "#c084fc"; glowC = "#c084fc"; break;
          case "inserting":
            fillC = dc + "22"; strokeC = dc + "cc"; glowC = dc; break;
          default: // intact
            fillC = "rgba(255,255,255,0.04)"; strokeC = zone.vulnerable ? "#fff" : dc + "44"; glowC = dc;
        }

        ctx.save();
        ctx.shadowBlur = zone.flashTimer > 0 ? 24 : (zone.stage === "clustering" ? 16 : 6);
        ctx.shadowColor = zone.flashTimer > 0 ? "#fff" : glowC;
        drawRoundRect(ctx, zone.x + 2, zone.y + 3, zone.width - 4, zone.h - 6, 5);
        ctx.fillStyle = fillC; ctx.fill();
        ctx.strokeStyle = strokeC; ctx.lineWidth = zone.stage === "clustering" ? 2.5 : 1.5; ctx.stroke();
        ctx.restore();

        // Insertion dots (shown in inserting + clustering stages)
        if (zone.stage === "inserting" || zone.stage === "clustering") {
          const dotSpacing = 14, totalDots = DAPTO_INSERTIONS_NEEDED;
          const dotsStartX = cx - ((totalDots - 1) * dotSpacing) / 2;
          for (let di = 0; di < totalDots; di++) {
            ctx.beginPath();
            ctx.arc(dotsStartX + di * dotSpacing, cy - 4, 5, 0, Math.PI * 2);
            ctx.fillStyle = di < zone.insertions ? dc : "rgba(255,255,255,0.15)"; ctx.fill();
          }
        }

        // Clustering progress arc
        if (zone.stage === "clustering") {
          const arcPct = zone.clusterTimer / DAPTO_CLUSTER_FRAMES;
          ctx.save();
          ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 3;
          ctx.shadowBlur = 10; ctx.shadowColor = "#c084fc";
          ctx.beginPath();
          ctx.arc(cx, cy + 7, 10, -Math.PI/2, -Math.PI/2 + arcPct * Math.PI * 2);
          ctx.stroke(); ctx.restore();
          ctx.fillStyle = "#c084fc"; ctx.font = `bold 8px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("clustering…", cx, cy + 20);
        }

        // Repair patch indicator
        if (zone.repairTimer > 0) {
          const rpct = zone.repairTimer / 180;
          ctx.save();
          ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 3;
          ctx.shadowBlur = 10; ctx.shadowColor = "#4ade80";
          ctx.beginPath();
          ctx.arc(cx, zone.y + 8, 8, -Math.PI/2, -Math.PI/2 + rpct * Math.PI * 2);
          ctx.stroke(); ctx.restore();
          ctx.fillStyle = "#4ade80"; ctx.font = `9px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("repairing", cx, zone.y + 8);
        }

        // Pore label
        if (zone.stage === "pore" || zone.stage === "done") {
          ctx.fillStyle = "#44ff8877"; ctx.font = `bold 10px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("pore open", cx, cy);
        }

        // Vulnerable indicator (pulseWeakness)
        if (zone.vulnerable && zone.stage !== "pore" && zone.stage !== "done") {
          ctx.fillStyle = "#fff"; ctx.font = `bold 8px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("exposed", cx, zone.y + zone.h - 6);
        }

        // K+ ions streaming below pore zones
        for (const k of zone.kIons) {
          ctx.save();
          ctx.globalAlpha = k.opacity;
          ctx.fillStyle = "#a5f3fc";
          ctx.shadowBlur = 8; ctx.shadowColor = "#a5f3fc";
          ctx.beginPath(); ctx.arc(k.x, k.y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#0e4f5c"; ctx.font = `bold 7px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("K+", k.x, k.y);
          ctx.restore();
        }
      }

      // Zone label below membrane
      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = `10px ${SANS}`;
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Inside bacteria", 12, MEM_Y + MEM_THICKNESS/2 + 20);

      // ── Ca2+ ions ────────────────────────────────────────────────────────────
      for (const ca of s.caIons) {
        if (ca.collected) continue;
        ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = "#fef08a";
        ctx.fillStyle = "#fef08a";
        ctx.beginPath(); ctx.arc(ca.x, ca.y, ca.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        ctx.fillStyle = "#78350f"; ctx.font = `bold 9px ${SANS}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Ca2+", ca.x, ca.y);
      }

      // ── Player Cubicin molecule ───────────────────────────────────────────────
      const fullyCharged = s.charge >= DAPTO_MAX_CHARGE;
      ctx.save();
      ctx.shadowBlur = 14 + (s.charge / DAPTO_MAX_CHARGE) * 24;
      ctx.shadowColor = fullyCharged ? "#fff" : dc;
      const dg = ctx.createRadialGradient(
        s.daptoX+DAPTO_W/2, s.daptoY+DAPTO_H/2, 4,
        s.daptoX+DAPTO_W/2, s.daptoY+DAPTO_H/2, DAPTO_W/2
      );
      dg.addColorStop(0, fullyCharged ? "#fff" : dc);
      dg.addColorStop(1, fullyCharged ? "#ffffff77" : dc + "77");
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(s.daptoX+DAPTO_W/2, s.daptoY+DAPTO_H/2, DAPTO_W/2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = fullyCharged ? "#fff" : dc; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#1c0800"; ctx.font = `bold 9px ${SANS}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("CUBICIN", s.daptoX+DAPTO_W/2, s.daptoY+DAPTO_H/2 - 5);

      // Charge dots under molecule
      for (let i = 0; i < DAPTO_MAX_CHARGE; i++) {
        const dotX = s.daptoX+DAPTO_W/2 - (DAPTO_MAX_CHARGE/2)*14 + i*14 + 7;
        const dotY = s.daptoY+DAPTO_H+12;
        ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI*2);
        ctx.fillStyle = i < s.charge ? "#fbbf24" : "rgba(255,255,255,0.18)"; ctx.fill();
      }
      ctx.fillStyle = dc; ctx.font = `bold 8px ${SANS}`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(`Charge: ${s.charge}/${DAPTO_MAX_CHARGE}`, s.daptoX+DAPTO_W/2, s.daptoY+DAPTO_H+26);

      // ── Membrane potential meter (right side) ────────────────────────────────
      const meterX = CANVAS_W - 22, meterY = 68, meterH = 160;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(meterX, meterY, 12, meterH);
      const potFill = s.membranePotential * meterH;
      const potColor = s.membranePotential > 0.5 ? "#4ade80" : s.membranePotential > 0.25 ? "#facc15" : "#f87171";
      ctx.fillStyle = potColor;
      ctx.shadowBlur = 8; ctx.shadowColor = potColor;
      ctx.fillRect(meterX, meterY + meterH - potFill, 12, potFill);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = `8px ${SANS}`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("MEM", meterX + 6, meterY - 4);
      ctx.fillText("POT", meterX + 6, meterY - 14);

      // ── Clustering hint: show if player is on a clustering zone ─────────────
      const onClustering = playerOnZone && playerOnZone.stage === "clustering";
      ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.font = `12px ${SANS}`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      if (onClustering)
        ctx.fillText("Hold here — Cubicin is clustering…", CANVAS_W/2, CANVAS_H - 36);
      else if (!fullyCharged)
        ctx.fillText("Collect Ca2+ then drag Cubicin into the membrane", CANVAS_W/2, CANVAS_H - 36);
      else
        ctx.fillText("Fully charged — insert into membrane, then hold to cluster", CANVAS_W/2, CANVAS_H - 36);

      drawP(s);
      drawHUD(pct, `Membrane depolarization: ${Math.round(pct * 100)}%`);
      return true;
    }

    // ── IVIG ─────────────────────────────────────────────────────────────────
    function tickIvig(s, frozen) {
      // ── Wave transition screen ──────────────────────────────────────────────
      if (!frozen && s.waveTransition > 0) {
        s.waveTransition--;
        drawBg();
        ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Big antibody Y symbol
        drawYShape(ctx, CANVAS_W / 2, CANVAS_H / 2 - 80, 60, dc);
        ctx.fillStyle = dc; ctx.font = `bold 17px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Neutralization complete!", CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.font = `13px ${SANS}`;
        // Word-wrap the transition text
        const words = IVIG_WAVE_TRANSITION_TEXT.split(" ");
        let line = "", lineY = CANVAS_H / 2 + 4;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > 400 && line !== "") { ctx.fillText(line, CANVAS_W / 2, lineY); line = word + " "; lineY += 20; }
          else line = test;
        }
        ctx.fillText(line, CANVAS_W / 2, lineY);
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = `11px ${SANS}`;
        ctx.fillText("Wave 2 starting — receptor blockade", CANVAS_W / 2, lineY + 38);
        drawWatermark(); return true;
      }

      // ── IVIG Wave 0: Signal Sweep (Galaga-inspired formation phase) ──────────
      if (s.ivigWave === 0) {

        if (!frozen) {
        // ── Player movement ──────────────────────────────────────────────────
        s.ssPlayerX += (s.ssTargetX - s.ssPlayerX) * 0.3;
        if (s.ssCooldown > 0) s.ssCooldown--;

        // ── Boost timer tick ─────────────────────────────────────────────────
        if (s.ssBoost) {
          s.ssBoost.framesLeft--;
          if (s.ssBoost.framesLeft <= 0) s.ssBoost = null;
        }
        if (s.ssShieldFlash > 0) s.ssShieldFlash--;

        // ── Formation movement ───────────────────────────────────────────────
        for (const sig of s.ssSignals) {
          if (sig.status === "calmed") continue;
          if (sig.flashTimer > 0) sig.flashTimer--;

          if (sig.status === "entering") {
            sig.y += 2.2; // drift down toward formation
            if (sig.y >= sig.homeY) { sig.y = sig.homeY; sig.status = "formation"; }
          } else if (sig.status === "formation") {
            // Follow formation drift
            sig.homeX += s.ssFormationSpeed * s.ssFormationDir;
            sig.x += (sig.homeX - sig.x) * 0.18;
            sig.y += (sig.homeY - sig.y) * 0.18;
          } else if (sig.status === "diving") {
            // Dive toward player
            sig.x += sig.diveVx;
            sig.y += sig.diveVy;
            // If it exits screen: return to formation (soft — no penalty)
            if (sig.y > CANVAS_H + 20 || sig.x < -30 || sig.x > CANVAS_W + 30) {
              sig.status = "formation";
              sig.x = sig.homeX;
              sig.y = sig.homeY;
              sig.diveVx = 0; sig.diveVy = 0;
            }
          }
        }

        // Formation bounce off walls
        s.ssFormationTimer++;
        const leftEdge  = s.ssSignals.filter(sig => sig.status === "formation").reduce((m, sig) => Math.min(m, sig.x), Infinity);
        const rightEdge = s.ssSignals.filter(sig => sig.status === "formation").reduce((m, sig) => Math.max(m, sig.x), -Infinity);
        if (rightEdge > CANVAS_W - SS_SIGNAL_R - 8) s.ssFormationDir = -1;
        if (leftEdge  < SS_SIGNAL_R + 8)            s.ssFormationDir =  1;

        // ── Dive attempts ────────────────────────────────────────────────────
        s.ssDiveTimer--;
        if (s.ssDiveTimer <= 0) {
          s.ssDiveTimer = s.ssDiveInterval;
          // Pick a random formation signal to dive
          const formationPool = s.ssSignals.filter(sig => sig.status === "formation");
          if (formationPool.length > 0) {
            const diver = formationPool[Math.floor(Math.random() * formationPool.length)];
            diver.status = "diving";
            // Aim slightly toward player center
            const targetX = s.ssPlayerX + SS_PLAYER_W / 2;
            const dx = targetX - diver.x;
            const dy = SS_PLAYER_Y - diver.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const diveSpd = 2.4 * (s.ssFormationSpeed / 0.6);
            diver.diveVx = (dx / dist) * diveSpd * 0.6 + (Math.random() - 0.5) * 0.8;
            diver.diveVy = Math.abs(dy / dist) * diveSpd;
          }
        }

        // ── Calm pulses vs signals ───────────────────────────────────────────
        for (const pulse of s.ssPulses) {
          if (!pulse.alive) continue;
          pulse.y += pulse.vy;
          if (pulse.y < 34) { pulse.alive = false; continue; }
          for (const sig of s.ssSignals) {
            if (sig.status === "calmed" || !pulse.alive) continue;
            const dx = pulse.x - sig.x, dy = pulse.y - sig.y;
            if (Math.sqrt(dx * dx + dy * dy) < SS_SIGNAL_R + pulse.r) {
              pulse.alive = false;
              sig.status = "calmed";
              s.ssCalmed++;
              spawnP(s, sig.x, sig.y, dc, 12, 4);
              spawnP(s, sig.x, sig.y, "#a5f3fc", 6, 3);
              setProgress(Math.min(0.5, s.ssCalmed / s.ssGoal * 0.5));
            }
          }
        }
        s.ssPulses = s.ssPulses.filter(p => p.alive);

        // ── Shield: absorb diving signal hits ────────────────────────────────
        const shieldActive = s.ssBoost && s.ssBoost.type === "shield";
        for (const sig of s.ssSignals) {
          if (sig.status !== "diving") continue;
          const px = s.ssPlayerX + SS_PLAYER_W / 2;
          const dx = sig.x - px, dy = sig.y - SS_PLAYER_Y;
          if (Math.sqrt(dx * dx + dy * dy) < SS_PLAYER_W / 2 + SS_SIGNAL_R) {
            if (shieldActive) {
              // Shield absorbs: signal calmed, shield flash
              sig.status = "calmed";
              s.ssCalmed++;
              s.ssShieldFlash = 18;
              spawnP(s, sig.x, sig.y, dc, 8, 3);
              setProgress(Math.min(0.5, s.ssCalmed / s.ssGoal * 0.5));
            } else {
              // No shield: signal passes through (soft fail — no life system, just visual)
              sig.status = "formation";
              sig.x = sig.homeX; sig.y = sig.homeY;
              sig.diveVx = 0; sig.diveVy = 0;
              spawnP(s, px, SS_PLAYER_Y, "#ff6b6b", 6, 3);
            }
          }
        }

        // ── Antibody pickup spawning + drift ─────────────────────────────────
        s.ssPickupTimer++;
        if (s.ssPickupTimer >= s.ssPickupInterval) {
          s.ssPickupTimer = 0;
          s.ssPickups.push(spawnAntibodyPickup());
        }
        for (const pk of s.ssPickups) {
          if (!pk.alive) continue;
          pk.y += pk.vy;
          if (pk.y > CANVAS_H + 20) { pk.alive = false; continue; }
          // Collect: player overlaps pickup
          const px = s.ssPlayerX + SS_PLAYER_W / 2;
          const dx = px - pk.x, dy = SS_PLAYER_Y - pk.y;
          if (Math.sqrt(dx * dx + dy * dy) < SS_PLAYER_W / 2 + SS_PICKUP_R) {
            pk.alive = false;
            s.ssBoost = { type: pk.effect, framesLeft: 300 }; // ~5 seconds
            s.ssCalmed = Math.min(s.ssGoal, s.ssCalmed + 2); // small bonus
            spawnP(s, pk.x, pk.y, "#fbbf24", 16, 5);
            setProgress(Math.min(0.5, s.ssCalmed / s.ssGoal * 0.5));
          }
        }
        s.ssPickups = s.ssPickups.filter(pk => pk.alive);

        // ── Respawn formation when all calmed ────────────────────────────────
        const allCalmed = s.ssSignals.every(sig => sig.status === "calmed");
        if (allCalmed && s.ssCalmed < s.ssGoal) {
          // Spawn a fresh formation — slightly faster each wave
          s.ssSignals = buildSignalFormation();
          s.ssFormationSpeed = Math.min(2.0, s.ssFormationSpeed + 0.1);
          s.ssDiveInterval  = Math.max(90, s.ssDiveInterval - 15);
        }

        const pct = Math.min(0.5, s.ssCalmed / s.ssGoal * 0.5);

        // ── Phase complete: transition to Wave 1 ─────────────────────────────
        if (!frozen && s.ssCalmed >= s.ssGoal) {
          s.ivigWave = 1;
          s.waveTransition = 160;
          return true;
        }
        } // end if (!frozen) wave 0 update

        // ── Draw Signal Sweep ────────────────────────────────────────────────
        drawBg();

        // Subtle field grid
        ctx.save(); ctx.strokeStyle = dc + "0d"; ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 52); ctx.lineTo(x, CANVAS_H - 30); ctx.stroke(); }
        for (let y = 55; y < CANVAS_H - 30; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }
        ctx.restore();

        // ── Draw signal particles ────────────────────────────────────────────
        for (const sig of s.ssSignals) {
          if (sig.status === "calmed") continue;
          const glow = sig.status === "diving" ? "#ff9f43" : (sig.type === 0 ? "#a78bfa" : sig.type === 1 ? "#67e8f9" : "#f472b6");
          ctx.save();
          ctx.shadowBlur = sig.flashTimer > 0 ? 22 : (sig.status === "diving" ? 18 : 10);
          ctx.shadowColor = sig.flashTimer > 0 ? "#fff" : glow;
          // Outer ring
          ctx.strokeStyle = glow;
          ctx.lineWidth = sig.status === "diving" ? 2.5 : 1.8;
          ctx.fillStyle = glow + "22";
          ctx.beginPath(); ctx.arc(sig.x, sig.y, SS_SIGNAL_R, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          // Inner pulsing core
          const coreR = SS_SIGNAL_R * (0.38 + 0.18 * Math.sin(Date.now() / 180 + sig.homeX));
          ctx.fillStyle = glow + "88";
          ctx.beginPath(); ctx.arc(sig.x, sig.y, coreR, 0, Math.PI * 2); ctx.fill();
          // Dive arrow on diving signals
          if (sig.status === "diving") {
            ctx.fillStyle = "#ff9f43"; ctx.font = `bold 10px ${SANS}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("▼", sig.x, sig.y);
          }
          ctx.restore();
        }

        // ── Draw calm pulses ─────────────────────────────────────────────────
        for (const pulse of s.ssPulses) {
          ctx.save();
          ctx.shadowBlur = 16; ctx.shadowColor = dc;
          ctx.fillStyle = dc + "cc";
          // Wide boost: draw as ring
          if (s.ssBoost && s.ssBoost.type === "widePulse") {
            ctx.strokeStyle = dc; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(pulse.x, pulse.y, pulse.r + 3, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        // ── Draw antibody pickups ─────────────────────────────────────────────
        for (const pk of s.ssPickups) {
          if (!pk.alive) continue;
          const pkColor = pk.effect === "widePulse" ? "#fbbf24" : pk.effect === "shield" ? "#4ade80" : "#c084fc";
          ctx.save();
          ctx.shadowBlur = 14; ctx.shadowColor = pkColor;
          ctx.fillStyle = pkColor + "33";
          ctx.strokeStyle = pkColor;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(pk.x, pk.y, SS_PICKUP_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          drawYShape(ctx, pk.x, pk.y, SS_PICKUP_R * 1.1, pkColor);
          ctx.restore();
          // Effect label
          const label = pk.effect === "widePulse" ? "WIDE" : pk.effect === "shield" ? "SHIELD" : "FAST";
          ctx.fillStyle = pkColor; ctx.font = `bold 7px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
          ctx.fillText(label, pk.x, pk.y + SS_PICKUP_R + 10);
        }

        // ── Draw player ship ─────────────────────────────────────────────────
        const px = s.ssPlayerX;
        const py = SS_PLAYER_Y;
        const shieldOn = (s.ssBoost && s.ssBoost.type === "shield") || s.ssShieldFlash > 0;
        ctx.save();
        ctx.shadowBlur = 22; ctx.shadowColor = shieldOn ? "#4ade80" : dc;
        // Hull
        const shipGrad = ctx.createLinearGradient(px, py, px, py + SS_PLAYER_H);
        shipGrad.addColorStop(0, shieldOn ? "#4ade80" : dc);
        shipGrad.addColorStop(1, shieldOn ? "#4ade8099" : dc + "88");
        ctx.fillStyle = shipGrad;
        // Ship body (pointed top)
        ctx.beginPath();
        ctx.moveTo(px + SS_PLAYER_W / 2, py - 10);        // nose
        ctx.lineTo(px + SS_PLAYER_W, py + SS_PLAYER_H);   // bottom-right
        ctx.lineTo(px + SS_PLAYER_W * 0.65, py + SS_PLAYER_H - 4); // right notch
        ctx.lineTo(px + SS_PLAYER_W / 2, py + SS_PLAYER_H + 2);    // center bottom
        ctx.lineTo(px + SS_PLAYER_W * 0.35, py + SS_PLAYER_H - 4); // left notch
        ctx.lineTo(px, py + SS_PLAYER_H);                 // bottom-left
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shieldOn ? "#4ade80" : "#fff4"; ctx.lineWidth = 1.5; ctx.stroke();
        // Shield ring
        if (shieldOn) {
          ctx.globalAlpha = s.ssShieldFlash > 0 ? 0.9 : 0.45;
          ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(px + SS_PLAYER_W / 2, py + SS_PLAYER_H / 2, SS_PLAYER_W * 0.7, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
        // Label
        ctx.fillStyle = "#000a"; ctx.font = `bold 7px ${SANS}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("IgG", px + SS_PLAYER_W / 2, py + SS_PLAYER_H / 2 + 2);

        // ── Active boost indicator ────────────────────────────────────────────
        if (s.ssBoost) {
          const boostLabels = { widePulse: "⟵ WIDE PULSE ⟶", shield: "✦ SHIELD ACTIVE", fastFire: "▸▸ FAST FIRE" };
          const boostColors = { widePulse: "#fbbf24", shield: "#4ade80", fastFire: "#c084fc" };
          const bLabel = boostLabels[s.ssBoost.type];
          const bColor = boostColors[s.ssBoost.type];
          const bPct = s.ssBoost.framesLeft / 300;
          ctx.save();
          // Boost bar
          const bx = 60, by = CANVAS_H - 36, bw = CANVAS_W - 120;
          ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(bx, by, bw, 5);
          ctx.fillStyle = bColor + "cc"; ctx.fillRect(bx, by, bw * bPct, 5);
          ctx.fillStyle = bColor; ctx.font = `bold 9px ${SANS}`;
          ctx.textAlign = "center"; ctx.fillText(bLabel, CANVAS_W / 2, by - 4);
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = `11px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
          ctx.fillText("Slide to aim · Tap to fire calm pulses", CANVAS_W / 2, CANVAS_H - 36);
        }

        // Wave badge
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText("Signal Sweep — Stabilize the Field", CANVAS_W - 10, 52);

        drawP(s); if (!frozen) tickP(s);
        const wave0pct = Math.min(0.5, s.ssCalmed / s.ssGoal * 0.5);
        drawHUD(wave0pct, `Stability: ${Math.round((s.ssCalmed / s.ssGoal) * 100)}%`);
        return true;
      }

      // ── IVIG Wave 2: Receptor Blockade (grid flood-fill) ──────────────────
      if (s.ivigWave === 1) {
        if (!frozen) {
        s.igGX += (s.targetIgGX - s.igGX) * 0.3;
        s.igGY += (s.targetIgGY - s.igGY) * 0.3;

        // Spawn autoimmune signals that try to occupy open receptors
        s.blockSpawnTimer++;
        if (s.blockSpawnTimer >= s.blockSpawnRate) {
          s.blockSpawnTimer = 0;
          // Pick a random open receptor and start blocking it
          const open = s.receptors.filter(r => r.state === "open");
          if (open.length > 0) {
            const target = open[Math.floor(Math.random() * open.length)];
            target.state = "blocking"; // will fully block after blockTimer reaches threshold
            target.blockTimer = 0;
          }
          // Gradually speed up signal spawning
          if (s.blockSpawnRate > 28) s.blockSpawnRate -= 0.4;
        }

        // Tick blocking receptors
        for (const r of s.receptors) {
          if (r.state === "blocking") {
            r.blockTimer++;
            if (r.blockTimer > 90) { r.state = "blocked"; r.blockTimer = 0; }
          }
          if (r.occupiedFlash > 0) r.occupiedFlash--;
        }

        // Player IgG ball tries to occupy receptors it touches
        const BALL_R2 = 18;
        for (const r of s.receptors) {
          if (r.state !== "open" && r.state !== "blocking") continue;
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          const dx = s.igGX - cx, dy = s.igGY - cy;
          if (Math.sqrt(dx * dx + dy * dy) < BALL_R2 + Math.min(r.w, r.h) / 2 + 6) {
            if (r.state === "open" || r.state === "blocking") {
              r.state = "occupied"; r.occupiedFlash = 20; s.occupied++;
              spawnP(s, cx, cy, dc, 12, 4);
            }
          }
        }

        const occupiedCount = s.receptors.filter(r => r.state === "occupied").length;
        const blockedCount = s.receptors.filter(r => r.state === "blocked").length;
        const pct = 0.5 + Math.min(0.5, (occupiedCount / s.totalReceptors) * 0.5);
        setProgress(pct);

        // Win when 70% of receptors are occupied by IgG
        if (occupiedCount / s.totalReceptors >= 0.7) {
          cancelAnimationFrame(animRef.current); handleRoundComplete(); return false;
        }

        // Lose condition: if more than 60% get fully blocked
        // (Just reset blocked receptors back to open — representing ongoing IgG flood)
        if (blockedCount / s.totalReceptors > 0.5) {
          for (const r of s.receptors) { if (r.state === "blocked") { r.state = "open"; r.blockTimer = 0; } }
        }

        tickP(s);
        } // end if (!frozen) wave 1 update

        // ── Draw wave 1 (Receptor Blockade) ─────────────────────────────────
        const occupiedCount = s.receptors.filter(r => r.state === "occupied").length;
        const blockedCount  = s.receptors.filter(r => r.state === "blocked").length;
        const pct = 0.5 + Math.min(0.5, (occupiedCount / s.totalReceptors) * 0.5);

        drawBg();
        ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = `10px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText("Immune receptor field — occupy sites before autoimmune signals do", CANVAS_W / 2, 52);

        // Draw receptor grid
        for (const r of s.receptors) {
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          const rr = Math.min(r.w, r.h) / 2 - 4;
          let fillC, strokeC, label, glow;

          if (r.state === "occupied") {
            fillC = dc + "44"; strokeC = dc; label = "IgG"; glow = dc;
          } else if (r.state === "blocked") {
            fillC = "#ff444444"; strokeC = "#ff4444"; label = "⚠"; glow = "#ff4444";
          } else if (r.state === "blocking") {
            const prog = r.blockTimer / 90;
            fillC = `rgba(255,${Math.round(100 - prog * 80)},${Math.round(100 - prog * 80)},0.3)`;
            strokeC = `rgba(255,${Math.round(150 - prog * 100)},${Math.round(150 - prog * 100)},0.8)`;
            label = "…"; glow = "#ff8844";
          } else {
            fillC = "rgba(255,255,255,0.06)"; strokeC = "rgba(255,255,255,0.2)"; label = ""; glow = "transparent";
          }

          ctx.save();
          if (r.occupiedFlash > 0) { ctx.shadowBlur = 22; ctx.shadowColor = dc; }
          else if (r.state !== "open") { ctx.shadowBlur = 8; ctx.shadowColor = glow; }
          drawReceptor(ctx, cx, cy, rr, fillC, strokeC);
          ctx.restore();

          if (label) {
            ctx.fillStyle = r.state === "occupied" ? dc : (r.state === "blocked" ? "#ff6666" : "#ffaa66");
            ctx.font = `bold ${r.state === "blocked" ? 14 : 9}px ${SANS}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(label, cx, cy);
          }

          if (r.state === "occupied") {
            drawYShape(ctx, cx, cy, rr * 0.8, dc + "cc");
          }
        }

        // Draw player IgG ball
        const BALL_R2 = 18;
        ctx.save(); ctx.shadowBlur = 28; ctx.shadowColor = dc;
        const igG = ctx.createRadialGradient(s.igGX, s.igGY, 2, s.igGX, s.igGY, BALL_R2);
        igG.addColorStop(0, dc); igG.addColorStop(1, dc + "55");
        ctx.fillStyle = igG;
        ctx.beginPath(); ctx.arc(s.igGX, s.igGY, BALL_R2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff6"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        drawYShape(ctx, s.igGX, s.igGY, BALL_R2 * 0.9, "#fff");
        ctx.fillStyle = dc; ctx.font = `bold 8px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText("IgG", s.igGX, s.igGY + BALL_R2 + 12);

        // Stats
        ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `bold 11px ${SANS}`; ctx.textAlign = "center";
        ctx.fillText(`IgG occupied: ${occupiedCount}  |  Autoimmune signals: ${blockedCount}`, CANVAS_W / 2, CANVAS_H - 38);

        drawP(s);

        // Wave badge
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText(IVIG_WAVE_TITLES[1], CANVAS_W - 10, 52);

        drawHUD(pct, `Receptors occupied: ${Math.round((occupiedCount / s.totalReceptors) * 100)}%`);
        return true;
      }
    }

    const loop = () => {
      const s = stateRef.current; if (!s) return;
      // gameplayFrozen: pause overlay OR tutorial overlay is open.
      // When frozen: draw current state but skip all update/collision/spawn logic.
      // The real infusion timer runs in a setInterval and is unaffected.
      const frozen = gameplayFrozenRef.current;
      let cont;
      if (s.gameType === "breakout") cont = tickBreakout(s, frozen);
      else if (s.gameType === "vanco")    cont = tickVanco(s, frozen);
      else if (s.gameType === "dapto")    cont = tickDapto(s, frozen);
      else if (s.gameType === "tetracycline") cont = tickTetracycline(s, frozen);
      else                                cont = tickIvig(s, frozen);
      // When frozen, always keep looping (cont may be undefined from draw-only path)
      if (frozen || cont !== false) animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen, drugIdx]);

  const pageStyle = {
    background: `linear-gradient(160deg, ${drug.bgGradient[0]}, ${drug.bgGradient[1]})`,
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    fontFamily: SANS, color: "#f0f4ff", padding: "20px 16px",
  };

  const SHARE_URL  = "https://dosecraft.io";
  const SHARE_TEXT = "I'm trying Dosecraft, an arcade-style game designed for infusion patients.\n\nThe project is still being developed, and feedback from players helps improve it for future patients.\n\nTry it here: https://dosecraft.io\nFeedback: https://forms.gle/p3a8bxjyhZxxT2gH9\n\nIf you have a few minutes, play a game and share your feedback.";

  function handleShare() {
    trackEvent('share_click');
    if (navigator.share) {
      navigator.share({ title: "Dosecraft", text: SHARE_TEXT, url: SHARE_URL }).catch(() => {});
    } else {
      navigator.clipboard.writeText(SHARE_URL).catch(() => {});
      setShareNotif(true);
      setTimeout(() => setShareNotif(false), 3500);
    }
  }

  function handleFeedback() {
    trackEvent('feedback_click');
    trackEvent('feedback_form_opened');
    window.open("https://forms.gle/tw2o3WgeSEccbifG7", "_blank");
  }

  function handleResetRound() {
    const playing = screen === "playing";
    const msg = playing
      ? "Restart this round? Your infusion timer will keep running on this device."
      : "Restart the current game setup? Your infusion timer will keep running on this device.";
    if (!window.confirm(msg)) return;
    closeOverlays();
    cancelAnimationFrame(animRef.current);
    if (playing) {
      startDrug(drugIdx, { restartPlaying: true });
    } else {
      startDrug(drugIdx);
    }
  }

  function handleResetInfusionTimer() {
    if (!window.confirm("Reset the infusion timer on this device? This clears your session progress here. Your care team's instructions still apply.")) return;
    closeOverlays();
    endInfusionSession();
    if (screen === "complete") setScreen("companion");
  }

  function getTopBarTitle() {
    if (screen === "menu") return "Infusion Arcade";
    if (screen === "playing") return drug.name;
    if (screen === "companion" || screen === "complete") return "Infusion companion";
    if (screen === "roundComplete") return "Round complete";
    return drug.name;
  }

  function makeBtnStyle(kind, accent) {
    const base = {
      fontFamily: SANS,
      cursor: "pointer",
      touchAction: "manipulation",
      borderRadius: 14,
      fontWeight: 700,
      width: "100%",
      minHeight: 52,
      fontSize: 17,
      letterSpacing: 0.3,
    };
    if (kind === "primary") {
      return Object.assign({}, base, {
        background: accent,
        color: "#080010",
        border: "none",
        padding: "16px 24px",
        boxShadow: `0 0 24px ${accent}55`,
        minHeight: 56,
        fontSize: 18,
      });
    }
    if (kind === "secondary") {
      return Object.assign({}, base, {
        background: "rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.92)",
        border: "2px solid rgba(255,255,255,0.28)",
        padding: "14px 22px",
      });
    }
    if (kind === "ghost") {
      return Object.assign({}, base, {
        background: "transparent",
        color: "rgba(255,255,255,0.55)",
        border: "1.5px solid rgba(255,255,255,0.22)",
        padding: "12px 18px",
        fontSize: 15,
        minHeight: 48,
      });
    }
    if (kind === "danger") {
      return Object.assign({}, base, {
        background: "transparent",
        color: "rgba(255,120,120,0.85)",
        border: "1px solid rgba(255,100,100,0.35)",
        padding: "12px 18px",
        fontSize: 15,
        minHeight: 48,
      });
    }
    if (kind === "icon") {
      return {
        background: "rgba(255,255,255,0.08)",
        border: "1.5px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.85)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: SANS,
        cursor: "pointer",
        touchAction: "manipulation",
        minHeight: 44,
        minWidth: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      };
    }
    return base;
  }

  const BigBtn = ({ label, onClick, primary = false, kind }) => (
    <button onClick={onClick} style={makeBtnStyle(kind || (primary ? "primary" : "secondary"), col)}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >{label}</button>
  );

  const drawerBackdrop = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10000,
  };

  const ArcadeTopBar = ({ compact }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
      maxWidth: compact ? CANVAS_W : 640,
      margin: "0 auto",
      padding: compact ? "8px 0 10px" : "0 0 16px",
      flexShrink: 0,
    }}>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => { setShowSettings(false); setShowAboutPanel(false); setShowNav(true); }}
        style={makeBtnStyle("icon", col)}
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>
      <div style={{
        flex: 1,
        textAlign: "center",
        fontSize: compact ? 14 : 15,
        fontWeight: 700,
        color: "rgba(255,255,255,0.75)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "0 4px",
      }}>
        {getTopBarTitle()}
      </div>
      <button
        type="button"
        aria-label="Open settings"
        onClick={() => { setShowNav(false); setShowAboutPanel(false); setShowSettings(true); }}
        style={makeBtnStyle("icon", col)}
      >
        <span aria-hidden="true">⚙</span>
        <span>Settings</span>
      </button>
    </div>
  );

  const SettingsPanel = () => !showSettings ? null : (
    <div style={drawerBackdrop} onClick={closeOverlays} role="presentation">
      <div
        role="dialog"
        aria-label="Settings"
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: "min(480px, 100%)", maxHeight: "85vh", overflowY: "auto",
          background: "linear-gradient(180deg,#0d1528,#060a14)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px 16px 0 0",
          padding: "20px 18px 28px", zIndex: 10001, fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Settings</h2>
          <button type="button" aria-label="Close settings" onClick={closeOverlays} style={makeBtnStyle("icon", col)}>Close</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <button type="button" onClick={toggleMusic} style={makeBtnStyle("secondary", col)}>
            {musicEnabled ? "🎵 Music on" : "🔇 Music off"}
          </button>
          <button type="button" onClick={toggleSfx} style={makeBtnStyle("secondary", col)}>
            {sfxEnabled ? "🔊 Sound effects on" : "🔈 Sound effects off"}
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>Game speed</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "relaxed", label: "Relaxed" },
              { id: "normal", label: "Normal" },
              { id: "fast", label: "Fast" },
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => setGameSpeed(opt.id)}
                style={{
                  flex: "1 1 30%", minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: SANS, touchAction: "manipulation",
                  background: gameSpeed === opt.id ? col + "33" : "rgba(255,255,255,0.07)",
                  border: gameSpeed === opt.id ? `2px solid ${col}` : "2px solid rgba(255,255,255,0.12)",
                  color: gameSpeed === opt.id ? col : "rgba(255,255,255,0.65)",
                }}
              >{opt.label}</button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 10, lineHeight: 1.5 }}>
            Game speed changes arcade pacing only. It does not change your infusion timer.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" onClick={handleResetRound} style={makeBtnStyle("ghost", col)}>Reset round</button>
          {sessionActive && (
            <button type="button" onClick={handleResetInfusionTimer} style={makeBtnStyle("danger", col)}>
              Reset infusion timer
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const NavDrawer = () => !showNav ? null : (
    <div style={drawerBackdrop} onClick={closeOverlays} role="presentation">
      <div
        role="dialog"
        aria-label="Navigation menu"
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: "min(320px, 88vw)",
          background: "linear-gradient(180deg,#0d1528,#060a14)",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          padding: "20px 16px 28px", zIndex: 10001, fontFamily: SANS, overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Navigation</h2>
          <button type="button" aria-label="Close navigation menu" onClick={closeOverlays} style={makeBtnStyle("icon", col)}>Close</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <BigBtn label="Medication menu" onClick={() => { closeOverlays(); setScreen("menu"); }} />
          {screen !== "menu" && (
            <BigBtn label="Current medication" onClick={() => { closeOverlays(); setScreen("intro"); }} />
          )}
          {(sessionActive || screen === "companion" || screen === "complete") && (
            <BigBtn label="Companion mode" onClick={() => {
              closeOverlays();
              if (sessionActive) setScreen("companion");
              else setScreen("intro");
            }} />
          )}
          <BigBtn label="About Dosecraft" onClick={() => { setShowNav(false); setShowAboutPanel(true); }} />
          <BigBtn label="Share feedback" onClick={() => { closeOverlays(); handleFeedback(); }} kind="ghost" />
          <ShareBtn label="Share Dosecraft" />
          {canReturnToHomeCompanion() && (
            <BigBtn label="Back to home companion" onClick={() => { closeOverlays(); goHomeCompanion(); }} />
          )}
        </div>
      </div>
    </div>
  );

  const AboutPanel = () => !showAboutPanel ? null : (
    <div style={drawerBackdrop} onClick={closeOverlays} role="presentation">
      <div
        role="dialog"
        aria-label="About Dosecraft"
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: "min(440px, 92vw)", maxHeight: "80vh", overflowY: "auto",
          background: "linear-gradient(180deg,#0d1528,#060a14)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16,
          padding: "22px 20px", zIndex: 10001, fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>About Dosecraft</h2>
          <button type="button" aria-label="Close about" onClick={closeOverlays} style={makeBtnStyle("icon", col)}>Close</button>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: "0 0 12px" }}>
          Dosecraft is an arcade-style companion for infusion patients. Games illustrate how medications work — they do not replace instructions from your care team.
        </p>
        {screen !== "menu" && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 8 }}>Current medication</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{drug.name}</div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", margin: "10px 0 0" }}>{drug.howItWorks || drug.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  const GlobalOverlays = () => (
    <>
      <SettingsPanel />
      <NavDrawer />
      <AboutPanel />
      <ShareNotif />
    </>
  );

  const ScreenShell = ({ children, bg, maxWidth, padTop }) => (
    <div style={{
      background: bg || `linear-gradient(160deg, ${drug.bgGradient ? drug.bgGradient[0] : "#060a14"}, ${drug.bgGradient ? drug.bgGradient[1] : "#0a0814"})`,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: SANS,
      color: "#f0f4ff",
      padding: padTop || "16px 16px 32px",
    }}>
      <div style={{ width: "100%", maxWidth: maxWidth || 640 }}>
        <ArcadeTopBar />
        {children}
      </div>
      <GlobalOverlays />
    </div>
  );

  const ShareBtn = ({ label = "Share Dosecraft" }) => (
    <button onClick={handleShare} style={Object.assign({}, makeBtnStyle("ghost", col), { marginTop: 0 })}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"}
    >{label}</button>
  );

  const ShareNotif = () => shareNotif ? (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: "rgba(6,10,20,0.97)", border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 10, padding: "14px 22px", textAlign: "center",
      fontFamily: SANS, zIndex: 9999, pointerEvents: "none",
      boxShadow: "0 0 18px rgba(0,200,255,0.15)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#00d4c8", marginBottom: 4 }}>LINK COPIED TO CLIPBOARD</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5 }}>SHARE WITH FRIENDS, FAMILY, OR OTHER PATIENTS</div>
    </div>
  ) : null;

  const SharpRXBadge = () => (
    <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
      SharpRX Interactive
    </div>
  );

  function canReturnToHomeCompanion() {
    if (typeof window.DOSECRAFT_isModuleEnabled === "function" && !window.DOSECRAFT_isModuleEnabled("homeInfusion")) {
      return false;
    }
    if (returnHome) return true;
    var store = window.DOSECRAFT_HOME_STORE;
    return store && typeof store.getPatientMode === "function" && store.getPatientMode() === "home";
  }

  function goHomeCompanion() {
    window.location.href = "index.html";
  }

  const HomeCompanionBackLink = () => (
    canReturnToHomeCompanion() ? (
      <button
        onClick={goHomeCompanion}
        style={{
          background: "transparent",
          border: "none",
          color: "#2a9d8f",
          fontSize: 15,
          fontWeight: 600,
          padding: "8px 0",
          marginBottom: 12,
          cursor: "pointer",
          fontFamily: SANS,
          touchAction: "manipulation",
          textAlign: "left",
          width: "100%",
        }}
      >
        ← Back to home companion
      </button>
    ) : null
  );

  const HomeCompanionBtn = ({ primary = false }) => (
    canReturnToHomeCompanion() ? (
      <BigBtn label="🏠 Back to home companion" onClick={goHomeCompanion} primary={primary} />
    ) : null
  );

  if (splashVisible) return (
    <div style={{ background: "#030812", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
      <style>{`@keyframes splashIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`}</style>
      <div style={{ textAlign: "center", animation: "splashIn 0.5s ease forwards" }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#00bfff", letterSpacing: 3 }}>SHARPRX</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", letterSpacing: 4, marginTop: 6 }}>INTERACTIVE</div>
      </div>
    </div>
  );

  if (screen === "menu") {
    // TODO: When enabledModules.infusionArcade is false, consider a companion-only
    // clinic path that skips canvas gameplay without breaking intro/timer flows.
    const groups = DRUG_GROUPS.map(grp => ({
      label: grp.label,
      color: grp.color,
      drugs: drugsForGroup(grp),
    }));
    return (
      <ScreenShell bg="linear-gradient(160deg,#060a14,#0a0814)" maxWidth={640}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 6px", color: "#ffffff", fontFamily: SERIF, letterSpacing: 1 }}>Infusion Arcade</h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: 0 }}>Select your medication to see it working</p>
          </div>
          {canReturnToHomeCompanion() && (
            <div style={{ marginBottom: 16 }}>
              <HomeCompanionBtn />
            </div>
          )}
          {groups.map(grp => grp.drugs.length > 0 && (
            <div key={grp.label} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 12, letterSpacing: 2, color: grp.color + "cc", marginBottom: 10,
                textTransform: "uppercase", borderBottom: `1px solid ${grp.color}30`, paddingBottom: 6,
                position: "sticky", top: 0, background: "rgba(6,10,20,0.92)", zIndex: 2, paddingTop: 4,
              }}>{grp.label}</div>
              <div style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              }}>
                {grp.drugs.map(d => (
                  <button key={d.id} onClick={() => startDrug(DRUGS.findIndex(x => x.id === d.id))} style={{
                    background: "rgba(255,255,255,0.06)", border: `1.5px solid ${d.drugColor}44`, color: "#ffffff",
                    padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    fontFamily: SANS, touchAction: "manipulation", minHeight: 88,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  >
                    <div style={{ fontSize: 17, fontWeight: 700, color: d.drugColor, lineHeight: 1.25 }}>{d.name}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.35 }}>{d.generic}</div>
                    {mechanicTagForDrug(d) && (
                      <div style={{
                        display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700,
                        letterSpacing: 0.5, textTransform: "uppercase", color: d.drugColor,
                        background: d.drugColor + "18", border: `1px solid ${d.drugColor}44`,
                        borderRadius: 6, padding: "3px 8px",
                      }}>{mechanicTagForDrug(d)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>Tap your medication · Slide to play · Just your treatment working</div>
          <SharpRXBadge />
      </ScreenShell>
    );
  }

  // ── SHARED: IV Bag SVG component — used on companion, round-complete, and playing strip ──
  const IVBagSVG = ({ pct, size = 90 }) => {
    const bagFill = Math.max(0, 1 - pct);
    const isComplete = pct >= 1;
    const h = Math.round(size * 1.53);
    return (
      <svg viewBox="0 0 72 110" width={size} height={h} style={{ display: "block" }}>
        <rect x="8" y="14" width="56" height="76" rx="12" fill="none" stroke={col + "55"} strokeWidth="2" />
        <rect x="9" y={14 + 76 * (1 - bagFill)} width="54" height={76 * bagFill} rx="10"
          fill={col + "33"} style={{ transition: "height 1s ease, y 1s ease" }} />
        <rect x="28" y="6" width="16" height="10" rx="4" fill={col + "66"} />
        <line x1="36" y1="90" x2="36" y2="110" stroke={col + "55"} strokeWidth="2.5" strokeDasharray="3,3" />
        {!isComplete && (
          <circle cx="36" cy="107" r="3" fill={col + "cc"} style={{ animation: "dripDrop 2s ease-in-out infinite" }} />
        )}
        {/* Percentage label inside bag */}
        <text x="36" y="58" textAnchor="middle" dominantBaseline="middle"
          fill={col} fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">
          {Math.round(pct * 100)}%
        </text>
      </svg>
    );
  };

  // ── INTRO SCREEN ───────────────────────────────────────────────────────────
  // Session duration picker only shows when no active session exists.
  if (screen === "intro") {
    const alreadyActive = sessionActive && infusionMode !== "complete";
    const minutesLeft = alreadyActive
      ? Math.max(0, Math.round((1 - infusionProgress) * infusionDurationMinutes))
      : null;

    return (
      <ScreenShell maxWidth={460}>
        <style>{`@keyframes dripDrop { 0%,100%{transform:translateY(0);opacity:1;} 60%{transform:translateY(6px);opacity:0.3;} }`}</style>

          <HomeCompanionBackLink />

          {/* Drug header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, color: col + "99", marginBottom: 8, textTransform: "uppercase" }}>
              {drug.gameType === "ivig" ? "Your immunoglobulin therapy" : "Your medication"}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 6px", textShadow: `0 0 24px ${col}66` }}>{drug.name}</h2>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.55)" }}>{drug.generic}</div>
          </div>

          {/* Resuming session banner — shown only when a session is already active */}
          {alreadyActive && (
            <div style={{ background: col + "22", border: `2px solid ${col}66`, borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <IVBagSVG pct={infusionProgress} size={48} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: col, marginBottom: 3 }}>Your infusion is still running</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)" }}>
                  {Math.round(infusionProgress * 100)}% complete · ~{minutesLeft}m remaining
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  Your timer will keep running while you play.
                </div>
              </div>
            </div>
          )}

          {drug.gameType === "ivig" && drug.ivigNote && (
            <div style={{ background: col + "14", border: `1.5px solid ${col}44`, borderRadius: 10, padding: "12px 18px", marginBottom: 16, fontSize: 15, color: col + "dd", lineHeight: 1.7 }}>
              💉 {drug.ivigNote}
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 10, textTransform: "uppercase" }}>What is this therapy for?</div>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.9)", margin: 0 }}>{drug.description}</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 10, textTransform: "uppercase" }}>How does it work?</div>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.9)", margin: 0 }}>{drug.howItWorks}</p>
          </div>

          <div style={{ background: col + "18", border: `1.5px solid ${col}55`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "center" }}>
            <p style={{ fontSize: 17, color: col, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>✦ {drug.encouragement}</p>
          </div>

          {/* Duration picker — only shown when starting a fresh session */}
          {!alreadyActive && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col}33`, borderRadius: 12, padding: "16px 18px", marginBottom: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 12, textTransform: "uppercase" }}>How long is your infusion today?</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[30, 60, 120, 180].map(mins => (
                  <button key={mins}
                    onClick={() => setInfusionDurationMinutes(mins)}
                    style={{
                      flex: "1 1 calc(25% - 10px)", padding: "14px 4px", borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: "pointer", fontFamily: SANS, touchAction: "manipulation",
                      background: infusionDurationMinutes === mins ? col + "33" : "rgba(255,255,255,0.07)",
                      border: infusionDurationMinutes === mins ? `2px solid ${col}` : "2px solid rgba(255,255,255,0.12)",
                      color: infusionDurationMinutes === mins ? col : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 10, textAlign: "center" }}>
                Ask your nurse if you're not sure how long your infusion runs.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <BigBtn
              label={alreadyActive ? "▶ Continue game" : "▶ Start session"}
              onClick={() => {
                if (!alreadyActive) {
                  const now = Date.now();
                  setSessionStartTime(now);
                  setSessionEndTime(now + infusionDurationMinutes * 60 * 1000);
                  setInfusionProgress(0);
                  setInfusionMode("active");
                  setSessionActive(true);
                  startInfusionClock(now, infusionDurationMinutes);
                }
                showSplashThen(() => setScreen("playing"));
              }}
              primary
            />
            <BigBtn label="Switch medication" onClick={() => setScreen("menu")} />
          </div>
          <SharpRXBadge />
      </ScreenShell>
    );
  }

  // ── HOW TO PLAY SCREEN — Phase 3 + 4 ──────────────────────────────────────
  // Shown before every round. Instructions are tailored per game type.
  // Does NOT touch the infusion timer.
  if (screen === "howToPlay") {
    const alreadyActive = sessionActive && infusionMode !== "complete";
    const minutesLeft = alreadyActive
      ? Math.max(0, Math.round((1 - infusionProgress) * infusionDurationMinutes))
      : null;

    const instructions = {
      breakout: {
        icon: "🧱",
        title: "Breach the Wall",
        steps: [
          { icon: "👆", text: "Slide your finger left or right to move the platform at the bottom of the screen." },
          { icon: "⚽", text: "The ball bounces off your platform. Aim it into the blocks above to knock them out." },
          { icon: "✦",  text: "Clear all the blocks to complete the round. The ball keeps moving — don't let it fall past you!" },
        ],
        hint: "Slide left and right",
      },
      vanco: {
        icon: "🔒",
        title: "Block the Builders",
        steps: [
          { icon: "👆", text: "Slide your finger left or right to move your medication blocker." },
          { icon: "🧱", text: "Building blocks will fall from above. Move your blocker to intercept them before they reach the bacterial wall at the bottom." },
          { icon: "✦",  text: "Block enough building blocks to complete the round." },
        ],
        hint: "Slide to intercept",
      },
      dapto: {
        icon: "💥",
        title: "Breach the Membrane",
        steps: [
          { icon: "👆", text: "Slide your finger to move the Cubicin molecule anywhere on screen." },
          { icon: "⚡", text: "Collect calcium ions (Ca²⁺) to build up charge, then press into the membrane zones to begin inserting." },
          { icon: "✦",  text: "Hold position to cluster molecules together and form pores — this depolarizes the membrane and clears the infection." },
        ],
        hint: "Slide to move · Hold on membrane zones",
      },
      ivig: {
        icon: "🛡",
        title: "Reinforce Your Immunity",
        steps: [
          { icon: "👆", text: "Phase 1: Slide left or right to aim your immune guide. Tap the screen to fire calm pulses at the signal particles moving in formation." },
          { icon: "✨", text: "Collect glowing antibody pickups for temporary boosts — wide spread, faster fire, or a shield." },
          { icon: "🛡",  text: "Phase 2: Drag your IgG antibody across the receptor field to occupy sites before autoimmune signals can block them." },
        ],
        hint: "Slide to aim · Tap to fire",
      },
      tetracycline: {
        icon: "🧬",
        title: "Block the Protein Factory",
        steps: [
          { icon: "👆", text: "Drag your finger around the ribosome to rotate the medication shield on the entry ring." },
          { icon: "⚛", text: "Amino-acid cargo approaches from all sides. Block it before it enters the ribosome protein factory." },
          { icon: "✦",  text: "Stall protein production by blocking enough cargo. If too much gets through, keep rotating the shield and try again." },
        ],
        hint: "Drag around the ribosome",
      },
    };

    const info = instructions[drug.gameType] || instructions.breakout;

    return (
      <ScreenShell maxWidth={460}>
        <style>{`
          @keyframes dripDrop { 0%,100%{transform:translateY(0);opacity:1;} 60%{transform:translateY(6px);opacity:0.3;} }
          @keyframes hintPulse { 0%,100%{opacity:0.5;transform:translateY(0);} 50%{opacity:1;transform:translateY(4px);} }
          @keyframes slideHint { 0%{transform:translateX(-18px);opacity:0.4;} 50%{transform:translateX(18px);opacity:1;} 100%{transform:translateX(-18px);opacity:0.4;} }
        `}</style>

          {/* Drug name + game title */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, color: col + "99", marginBottom: 6, textTransform: "uppercase" }}>Round {roundCount + 1}</div>
            <div style={{ fontSize: 34, marginBottom: 8 }}>{info.icon}</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 4px", textShadow: `0 0 20px ${col}66` }}>{info.title}</h2>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>{drug.name}</div>
          </div>

          {/* Session status strip — visible if a session is running */}
          {alreadyActive && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col}33`, borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <IVBagSVG pct={infusionProgress} size={38} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{Math.round(infusionProgress * 100)}% complete</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>~{minutesLeft}m remaining · timer keeps running while you play</div>
              </div>
            </div>
          )}

          {/* How to play steps */}
          <div style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 16, textTransform: "uppercase" }}>How to play</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {info.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 22, flexShrink: 0, width: 32, textAlign: "center" }}>{step.icon}</div>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: 0 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 4: Animated gesture hint */}
          <div style={{ background: col + "10", border: `1px solid ${col}28`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 10, textTransform: "uppercase" }}>Try it</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28, animation: "slideHint 2s ease-in-out infinite" }}>👆</span>
              <span style={{ fontSize: 15, color: col, fontWeight: 600 }}>{info.hint}</span>
            </div>
          </div>

          <BigBtn label="▶ Start round" onClick={() => setScreen("playing")} primary />
          <div style={{ marginTop: 10 }}>
            <BigBtn label="How this medication works" onClick={() => setScreen("intro")} />
          </div>
          <div style={{ marginTop: 10 }}>
            <BigBtn label="Switch medication" onClick={() => setScreen("menu")} />
          </div>
          <SharpRXBadge />
      </ScreenShell>
    );
  }

  // ── ROUND COMPLETE SCREEN — Phase 1 + 5 ──────────────────────────────────
  // Shown after every round. Infusion timer is NEVER reset here.
  if (screen === "roundComplete") {
    const pct = infusionProgress;
    const minutesTotal = infusionDurationMinutes;
    const minutesLeft = Math.max(0, Math.round((1 - pct) * minutesTotal));
    const milestone = getMilestoneMessage(pct);
    const isSessionComplete = pct >= 1 || infusionMode === "complete";

    return (
      <ScreenShell maxWidth={460} padTop="16px 16px 32px">
        <style>{`@keyframes dripDrop { 0%,100%{transform:translateY(0);opacity:1;} 60%{transform:translateY(6px);opacity:0.3;} }`}</style>

          <HomeCompanionBackLink />

          {/* Round complete header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
            <div style={{ fontSize: 12, letterSpacing: 4, color: col + "88", marginBottom: 6, textTransform: "uppercase" }}>Round complete</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 6px", textShadow: `0 0 20px ${col}55` }}>
              {drug.name} is working
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6 }}>{drug.winMessage}</p>
          </div>

          {/* ── Infusion companion block — Phase 5 ────────────────────────── */}
          {sessionActive && (
            <div style={{ background: col + "14", border: `2px solid ${col}55`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: 3, color: col + "99", marginBottom: 14, textTransform: "uppercase" }}>
                {isSessionComplete ? "Infusion complete" : "Your infusion is still running"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                <IVBagSVG pct={pct} size={80} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: col, lineHeight: 1 }}>{Math.round(pct * 100)}%</div>
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>of infusion delivered</div>
                  {!isSessionComplete && (
                    <div style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", marginTop: 8, fontWeight: 600 }}>
                      ~{minutesLeft} min remaining
                    </div>
                  )}
                  {isSessionComplete && (
                    <div style={{ fontSize: 15, color: col, marginTop: 8, fontWeight: 600 }}>
                      Your infusion is done ✦
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 12, overflow: "hidden", marginBottom: 10 }}>
                <div style={{
                  height: "100%", borderRadius: 8,
                  background: `linear-gradient(90deg, ${col}88, ${col})`,
                  width: `${Math.round(pct * 100)}%`,
                  transition: "width 1s ease",
                  boxShadow: `0 0 12px ${col}66`,
                }} />
              </div>

              <div style={{ fontSize: 15, color: col + "cc", fontWeight: 600, textAlign: "center" }}>{milestone}</div>
            </div>
          )}

          {/* No session active — show basic win info */}
          {!sessionActive && (
            <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 10, textTransform: "uppercase" }}>Remember</div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: 0 }}>
                {drug.howItWorks} Your care team has chosen {drug.name} specifically for you.
              </p>
            </div>
          )}

          {/* IVIG extended note */}
          {drug.gameType === "ivig" && (
            <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontSize: 12, letterSpacing: 3, color: col + "aa", marginBottom: 10, textTransform: "uppercase" }}>Why does this infusion take so long?</div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: 0 }}>
                {drug.name === "Hyqvia"
                  ? "Hyqvia absorbs slowly and steadily through the tissue under your skin. The extended time allows the full dose to enter your system gradually and safely."
                  : "Your body needs a large enough supply of IgG antibodies to truly flood the system. That volume takes time to infuse safely — the slow rate is intentional."}
              </p>
            </div>
          )}

          {/* Action buttons — timer never resets from these */}
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            {!isSessionComplete && (
              <BigBtn
                label="▶ Play another round"
                onClick={() => startDrug(drugIdx)}
                primary
              />
            )}
            {sessionActive && !isSessionComplete && (
              <BigBtn
                label="💧 Infusion companion"
                onClick={() => { trackEvent('companion_mode_opened'); setScreen("companion"); }}
              />
            )}
            <HomeCompanionBtn />
            <BigBtn label="Switch medication" onClick={() => setScreen("menu")} />
            <BigBtn label="How this medication works" onClick={() => setScreen("intro")} />
            {isSessionComplete && (
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 8px" }}>
                  Your session is done. Let your care team know how you're feeling.
                </p>
              </div>
            )}
          </div>

          <SharpRXBadge />
      </ScreenShell>
    );
  }

  // ── COMPANION / SESSION COMPLETE SCREEN ───────────────────────────────────
  if (screen === "companion" || screen === "complete") {
    const pct = infusionProgress;
    const milestone = getMilestoneMessage(pct);
    const minutesTotal = infusionDurationMinutes;
    const minutesElapsed = Math.round(pct * minutesTotal);
    const minutesLeft = Math.max(0, minutesTotal - minutesElapsed);
    const isComplete = screen === "complete" || pct >= 1;

    return (
      <ScreenShell maxWidth={460} padTop="16px 16px 32px">
        <style>{`@keyframes dripDrop { 0%,100%{transform:translateY(0);opacity:1;} 60%{transform:translateY(6px);opacity:0.3;} }`}</style>

          <HomeCompanionBackLink />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, color: col + "88", marginBottom: 6, textTransform: "uppercase" }}>
              {isComplete ? "Session complete" : "Infusion companion"}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 6px", textShadow: `0 0 20px ${col}55` }}>
              {drug.name}
            </h2>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)" }}>{drug.generic}</div>
          </div>

          {/* IV Bag — large, center */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <IVBagSVG pct={pct} size={100} />
          </div>

          {/* Big percent + time remaining */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: col, lineHeight: 1, textShadow: `0 0 30px ${col}66` }}>
              {Math.round(pct * 100)}%
            </div>
            <div style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              {isComplete ? "Infusion complete" : `~${minutesLeft} minutes remaining`}
            </div>
            <div style={{ fontSize: 15, color: col + "cc", marginTop: 4, fontWeight: 600 }}>{milestone}</div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 14, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 8,
                background: `linear-gradient(90deg, ${col}88, ${col})`,
                width: `${Math.round(pct * 100)}%`,
                transition: "width 1s ease",
                boxShadow: `0 0 14px ${col}66`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{minutesElapsed}m elapsed</span>
              {!isComplete && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>~{minutesLeft}m remaining</span>}
            </div>
          </div>

          {/* Encouragement + last round recap */}
          <div style={{ background: col + "14", border: `1px solid ${col}44`, borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 17, color: col, fontWeight: 600, lineHeight: 1.6 }}>
              {isComplete ? "Your infusion is finished." : drug.encouragement}
            </div>
            {!isComplete && (
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                {drug.name} is working in the background. Take a break or play another round.
              </div>
            )}
            {roundSetup && !isComplete && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: col + "88", letterSpacing: 1 }}>◈ {roundSetup.pattern.label}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>Goal: {roundSetup.objective.label}</span>
              </div>
            )}
          </div>

          {(() => {
            const homeCopy = window.DOSECRAFT_HOME_COPY;
            const homeStore = window.DOSECRAFT_HOME_STORE;
            const appt = homeStore && homeStore.getNextAppointmentDate(homeStore.loadSettings());
            if (!homeCopy) return null;
            return (
              <>
                {drug.gameType === "ivig" && (
                  <div style={{ background: "rgba(231,111,81,0.12)", border: "1px solid rgba(231,111,81,0.35)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, letterSpacing: 2, color: "#e76f51", textTransform: "uppercase", marginBottom: 10 }}>During infusion — tell your nurse if</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                      {(homeCopy.clinicReactionWarnings || []).map((item, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {appt && (
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 6 }}>Next lab / follow-up</div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{new Date(appt + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            {!isComplete && (
              <BigBtn label="▶ Play another round" onClick={() => startDrug(drugIdx)} primary />
            )}
            <HomeCompanionBtn primary={!isComplete} />
            {!isComplete && sessionActive && (
              <BigBtn label="Resume game" onClick={() => {
                if (stateRef.current) showSplashThen(() => setScreen("playing"));
                else setScreen("intro");
              }} />
            )}
            <BigBtn label="Switch medication" onClick={() => setScreen("menu")} />
            <BigBtn label="How this medication works" onClick={() => setScreen("intro")} />
            {isComplete && (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 8px" }}>
                  Your session is done. Let your care team know how you're feeling.
                </p>
              </div>
            )}
          </div>
          <SharpRXBadge />
      </ScreenShell>
    );
  }

  // ── PLAYING SCREEN — canvas + prominent infusion companion strip ──────────
  // Phase 5: strip is larger and clearly readable during play.

  // ── TUTORIAL CONTENT ────────────────────────────────────────────────────────
  // Keyed by gameType; IVIG has per-wave entries.
  // "what" = what to do. "why" = why it matters. Keep to 2–3 sentences max.
  const TUTORIAL_CONTENT = {
    breakout: {
      what: "Slide left or right to move the paddle. Bounce the dose into the bacterial wall.",
      why:  "Breaking the wall shows how this antibiotic weakens the bacteria's outer layer.",
    },
    vanco: {
      what: "Move the paddle to intercept the falling wall-building blocks before they reach the wall.",
      why:  "This shows how this antibiotic blocks bacteria from building strong cell walls.",
    },
    dapto: {
      what: "First, collect the calcium ions (Ca²⁺) floating in the bloodstream. Then move daptomycin onto a glowing membrane zone and hold it there until the circle fills completely — that creates a pore.",
      why:  "This shows how daptomycin uses calcium to punch holes in bacterial membranes, causing the bacteria to lose the ions they need to survive.",
    },
    ivig_wave0: {
      what: "Move and tap Fire to calm the immune signals sweeping across the screen.",
      why:  "This represents IVIG helping redirect an overactive immune response.",
    },
    ivig_wave1: {
      what: "Guide the IgG ball to touch open receptor sites before autoimmune signals block them. Occupy at least 70% of the grid to complete the round.",
      why:  "IVIG helps calm and redirect immune activity by flooding receptors — rather than simply attacking one target.",
    },
    tetracycline: {
      what: "Drag around the ribosome to rotate the shield. Block amino-acid cargo before it enters the protein factory.",
      why:  "This shows how tetracycline antibiotics block building pieces from entering the bacterial ribosome, slowing protein production.",
    },
  };

  // Pick the right tutorial entry. IVIG uses wave-aware keys.
  function getTutContent() {
    if (drug.gameType === "ivig") {
      const wave = stateRef.current?.ivigWave ?? 0;
      return TUTORIAL_CONTENT[wave === 0 ? "ivig_wave0" : "ivig_wave1"]
        || { what: "Play the game!", why: "Watch your medication work." };
    }
    return TUTORIAL_CONTENT[drug.gameType]
      || { what: "Play the game!", why: "Watch your medication work." };
  }
  const tut = getTutContent();

  // About text — use drug's own plain-language explanation from the Truth Layer.
  const aboutText = drug.howItWorks || drug.description || "Medication information not available for this drug.";

  // Shared overlay wrapper style
  const overlayWrap = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(3,8,18,0.92)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 50, borderRadius: 14,
    animation: "tutIn 0.25s ease forwards",
    // Prevent touch events on the overlay from reaching the canvas
    touchAction: "none",
  };
  const overlayCard = {
    maxWidth: 340, width: "90%", background: "#0d1a2e",
    border: `2px solid ${col}88`, borderRadius: 16, padding: "24px 20px",
    textAlign: "center", fontFamily: SANS,
    maxHeight: "90vh", overflowY: "auto",
  };
  const overlayBtn = (accent) => ({
    display: "block", width: "100%",
    background: (accent ? col : "rgba(255,255,255,0.08)") + (accent ? "33" : ""),
    border: `2px solid ${accent ? col : "rgba(255,255,255,0.2)"}`,
    color: accent ? col : "rgba(255,255,255,0.8)",
    padding: "14px 20px", borderRadius: 10, fontSize: 16, fontWeight: 700,
    cursor: "pointer", fontFamily: SANS, touchAction: "manipulation",
    marginBottom: 10,
  });
  const overlayBtnSm = {
    display: "block", width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.6)",
    padding: "11px 20px", borderRadius: 9, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: SANS, touchAction: "manipulation",
    marginBottom: 8,
  };

  // ── PAUSE HANDLERS ───────────────────────────────────────────────────────
  function handlePause() { setIsPaused(true); setPausePanel("main"); }
  function handleResume() { setIsPaused(false); setPausePanel("main"); }
  function handlePauseAbout() { setIsPaused(true); setPausePanel("about"); }
  function handlePauseHowToPlay() { setIsPaused(true); setPausePanel("howToPlay"); }
  function handleReturnToCompanion() {
    // Leaves the current round but preserves the infusion session entirely.
    setIsPaused(false);
    setScreen(sessionActive ? "companion" : "menu");
  }
  function handleEndRound() {
    // Ends only the arcade round. Session timer continues.
    setIsPaused(false);
    setScreen(sessionActive ? "companion" : "menu");
  }

  return (
    <div style={{ ...pageStyle, padding: 8, position: "relative" }}>
      <style>{`
        @keyframes dripDrop { 0%,100%{transform:translateY(0);opacity:1;} 60%{transform:translateY(6px);opacity:0.3;} }
        @keyframes tutIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
      `}</style>

      <ArcadeTopBar compact />
      <GlobalOverlays />

      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        style={{ display: "block", borderRadius: 14, border: `2px solid ${col}33`, boxShadow: `0 0 40px ${col}22`, maxWidth: "100%", touchAction: "none" }} />

      {/* ── TUTORIAL OVERLAY ────────────────────────────────────────────────
          Game is frozen (gameplayFrozenRef = true) while this is visible.
          "Got it" marks seen in localStorage and unfreezes gameplay.       */}
      {showTutorial && !isPaused && (
        <div style={overlayWrap}>
          <div style={overlayCard}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>
              {{ breakout: "🧱", vanco: "🔒", dapto: "💥", ivig: "🛡", tetracycline: "🧬" }[drug.gameType] || "🎮"}
            </div>
            <div style={{ fontSize: 13, letterSpacing: 3, color: col + "99", textTransform: "uppercase", marginBottom: 16 }}>How to play</div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, textAlign: "left" }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 6 }}>What to do</div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>{tut.what}</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 22, textAlign: "left" }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 6 }}>Why it matters</div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>{tut.why}</p>
            </div>

            <button
              onClick={() => {
                const wave = drug.gameType === "ivig" ? (stateRef.current?.ivigWave ?? 0) : undefined;
                closeTutorial(drug.gameType, wave);
              }}
              style={{ ...overlayBtn(true), marginBottom: 0 }}>
              Got it — let's play
            </button>
          </div>
        </div>
      )}

      {/* ── PAUSE OVERLAY ───────────────────────────────────────────────────
          Game is frozen while this is visible. Infusion timer keeps running.
          Three sub-panels: main | about | howToPlay                        */}
      {isPaused && (
        <div style={overlayWrap}>
          <div style={overlayCard}>

            {/* ── MAIN PAUSE PANEL ── */}
            {pausePanel === "main" && (<>
              <div style={{ fontSize: 22, marginBottom: 4 }}>⏸</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Game paused</div>
              {sessionActive && (
                <div style={{ fontSize: 12, color: col + "99", marginBottom: 20 }}>Your infusion timer is still running.</div>
              )}
              {!sessionActive && <div style={{ marginBottom: 20 }} />}

              <button style={overlayBtn(true)} onClick={handleResume}>▶ Resume</button>
              <button style={overlayBtnSm} onClick={handlePauseAbout}>About this drug</button>
              <button style={overlayBtnSm} onClick={handlePauseHowToPlay}>How to Play</button>
              {sessionActive && (
                <button style={overlayBtnSm} onClick={handleReturnToCompanion}>Return to Companion</button>
              )}
              {canReturnToHomeCompanion() && (
                <button style={overlayBtnSm} onClick={goHomeCompanion}>Back to home companion</button>
              )}
              <button style={{ ...overlayBtnSm, marginBottom: 0, color: "rgba(255,100,100,0.7)", borderColor: "rgba(255,100,100,0.25)" }}
                onClick={handleEndRound}>End Round</button>
            </>)}

            {/* ── ABOUT PANEL ── */}
            {pausePanel === "about" && (<>
              <div style={{ fontSize: 14, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 12 }}>About this drug</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: col, marginBottom: 14 }}>{drug.name}</div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{aboutText}</p>
              </div>
              <button style={overlayBtnSm} onClick={() => setPausePanel("main")}>← Back to pause menu</button>
              <button style={{ ...overlayBtn(true), marginBottom: 0 }} onClick={handleResume}>▶ Resume</button>
            </>)}

            {/* ── HOW TO PLAY PANEL ── */}
            {pausePanel === "howToPlay" && (<>
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {{ breakout: "🧱", vanco: "🔒", dapto: "💥", ivig: "🛡", tetracycline: "🧬" }[drug.gameType] || "🎮"}
              </div>
              <div style={{ fontSize: 14, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 16 }}>How to Play</div>

              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, textAlign: "left" }}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 6 }}>What to do</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>{tut.what}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: col + "99", textTransform: "uppercase", marginBottom: 6 }}>Why it matters</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>{tut.why}</p>
              </div>

              <button style={overlayBtnSm} onClick={() => setPausePanel("main")}>← Back to pause menu</button>
              <button style={{ ...overlayBtn(true), marginBottom: 0 }} onClick={handleResume}>▶ Resume</button>
            </>)}

          </div>
        </div>
      )}

      {/* Infusion companion strip */}
      {sessionActive && (
        <div style={{ marginTop: 12, maxWidth: CANVAS_W, width: "100%", background: col + "0f", border: `1px solid ${col}33`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IVBagSVG pct={infusionProgress} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{Math.round(infusionProgress * 100)}% delivered</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                  {infusionMode !== "complete"
                    ? `~${Math.max(0, Math.round((1 - infusionProgress) * infusionDurationMinutes))}m left`
                    : "Done ✦"}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 5, height: 7, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 5, background: col + "cc", width: `${Math.round(infusionProgress * 100)}%`, transition: "width 5s linear" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SINGLE PAUSE BUTTON ── replaces all old in-game nav buttons */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        <button
          onClick={handlePause}
          style={{
            background: "rgba(255,255,255,0.1)", border: `2px solid ${col}66`,
            color: col, padding: "13px 36px", borderRadius: 10,
            fontSize: 16, fontWeight: 700, cursor: "pointer",
            fontFamily: SANS, touchAction: "manipulation",
            minWidth: 140, letterSpacing: 1,
          }}>
          ⏸ Pause
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: "center", letterSpacing: 2, textTransform: "uppercase" }}>SharpRX Interactive</div>
    </div>
  );
}
