// Hooks are provided globally by the React CDN + game.html preamble
// (useState, useEffect, useRef, useCallback are declared at the top of game.html)

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

const DRUGS = [
  {
    id: 1, gameType: "breakout", name: "Zosyn", generic: "Piperacillin-Tazobactam",
    drugColor: "#00d4c8", bgGradient: ["#021a18", "#04302c"],
    paddleLabel: "ZOSYN",
    description: "Zosyn is a powerful antibiotic used to treat serious infections of the lungs, abdomen, skin, kidneys, and bloodstream — especially when a single antibiotic may not be enough.",
    howItWorks: "Zosyn travels through your bloodstream and attacks the outer wall of bacteria, causing it to collapse. Without their protective wall, the bacteria cannot survive.",
    encouragement: "Your Zosyn infusion is actively fighting the infection right now.",
    brickLabel: "Wall Section", winMessage: "Bacterial walls have collapsed. Infection is being cleared.",
  },
  {
    id: 2, gameType: "breakout", name: "Ancef", generic: "Cefazolin",
    drugColor: "#4f8ef7", bgGradient: ["#020d1f", "#041830"],
    paddleLabel: "ANCEF",
    description: "Ancef (cefazolin) is commonly used to treat skin and soft tissue infections, bone infections, and to prevent infections around surgery.",
    howItWorks: "Ancef targets and destroys the structural wall that bacteria need to survive. As each wall section breaks down, the bacteria can no longer maintain their shape and die.",
    encouragement: "Your Ancef infusion is breaking down bacterial defenses right now.",
    brickLabel: "Wall Section", winMessage: "Bacterial walls destroyed. Your infection is clearing.",
  },
  {
    id: 3, gameType: "breakout", name: "Rocephin", generic: "Ceftriaxone",
    drugColor: "#6366f1", bgGradient: ["#07041f", "#0e0830"],
    paddleLabel: "ROCEPHIN",
    description: "Rocephin (ceftriaxone) is widely used to treat pneumonia, meningitis, urinary tract infections, Lyme disease, and many bloodstream infections.",
    howItWorks: "Rocephin circulates through your body and disrupts the construction of bacterial cell walls. Bacteria cannot repair or rebuild their walls and are eliminated.",
    encouragement: "Your Rocephin infusion is working to clear your infection.",
    brickLabel: "Wall Section", winMessage: "Infection clearing. Rocephin has done its work.",
  },
  {
    id: 4, gameType: "breakout", name: "Maxipime", generic: "Cefepime",
    drugColor: "#818cf8", bgGradient: ["#05041f", "#0a0830"],
    paddleLabel: "MAXIPIME",
    description: "Maxipime (cefepime) is a broad-spectrum antibiotic used for serious infections of the lungs, urinary tract, skin, and bloodstream.",
    howItWorks: "Maxipime targets and dismantles the cell walls that protect bacteria. Once the wall is gone, bacteria cannot survive and the infection begins to clear.",
    encouragement: "Your Maxipime infusion is actively clearing the infection.",
    brickLabel: "Wall Section", winMessage: "Bacterial walls cleared. Maxipime is working.",
  },
  {
    id: 5, gameType: "breakout", name: "Invanz", generic: "Ertapenem",
    drugColor: "#f59e0b", bgGradient: ["#1a0f00", "#2e1a00"],
    paddleLabel: "INVANZ",
    description: "Invanz (ertapenem) is a once-daily antibiotic used to treat complicated infections of the abdomen, pelvis, lungs, skin, and urinary tract.",
    howItWorks: "Invanz penetrates deep into infected tissue and destroys the protective outer walls of bacteria. Once compromised, bacteria cannot survive.",
    encouragement: "Your Invanz infusion is penetrating the infection and destroying bacteria.",
    brickLabel: "Wall Section", winMessage: "Deep infection clearing. Invanz is working.",
  },
  {
    id: 6, gameType: "breakout", name: "Merrem", generic: "Meropenem",
    drugColor: "#fb923c", bgGradient: ["#1a0800", "#2e1000"],
    paddleLabel: "MERREM",
    description: "Merrem (meropenem) is used for serious infections including pneumonia, meningitis, abdominal infections, and infections caused by resistant bacteria.",
    howItWorks: "Merrem rapidly targets and collapses the protective walls of bacteria throughout your body. It is one of the most powerful antibiotics available.",
    encouragement: "Your Merrem infusion is fighting hard against your infection right now.",
    brickLabel: "Wall Section", winMessage: "Serious infection being cleared. Merrem is working.",
  },
  {
    id: 7, gameType: "vanco", name: "Vancomycin", generic: "Vancomycin",
    drugColor: "#c084fc", bgGradient: ["#0e0a1a", "#1a0d2e"],
    description: "Vancomycin is used to treat serious infections caused by gram-positive bacteria, including MRSA — a type of staph infection resistant to many other antibiotics.",
    howItWorks: "Vancomycin latches onto the building blocks that bacteria use to construct their outer wall, blocking construction entirely. Without new wall material, bacteria weaken and die.",
    encouragement: "Your vancomycin infusion is blocking bacterial construction right now.",
    winMessage: "Bacterial wall construction blocked. Infection is clearing.",
  },
  {
    id: 8, gameType: "dapto", name: "Cubicin", generic: "Daptomycin",
    drugColor: "#eab308", bgGradient: ["#0f0a00", "#1e1400"],
    description: "Cubicin (daptomycin) is used to treat serious skin infections and bloodstream infections caused by gram-positive bacteria, including MRSA and VRE.",
    howItWorks: "Cubicin works by punching holes in the outer membrane of bacteria, causing them to lose the ions they need to survive. This rapidly kills the bacteria without harming your own cells.",
    encouragement: "Your Cubicin infusion is punching through bacterial membranes right now.",
    winMessage: "Bacterial membranes breached. Infection is being eliminated.",
  },
  // ── IVIG / SCIG ───────────────────────────────────────────────────────────
  {
    id: 9, gameType: "ivig", name: "Bivigam", generic: "Immune Globulin Intravenous (Human) 10%",
    drugColor: "#f4a261", bgGradient: ["#1a0e00", "#2e1a04"],
    description: "Bivigam is an intravenous immunoglobulin (IVIG) therapy used primarily for people whose immune systems cannot produce enough antibodies on their own — a condition called primary immunodeficiency. By infusing concentrated antibodies from healthy donors, Bivigam gives your immune system the tools it needs to fight infections.",
    howItWorks: "Bivigam delivers a concentrated supply of IgG antibodies — the same antibodies healthy immune systems produce — directly into your bloodstream. These borrowed antibodies neutralize pathogens and help calm immune responses that may be misfiring. Because the dose must be large enough to flood your entire system, the infusion takes several hours.",
    encouragement: "The antibodies in your Bivigam infusion are actively protecting you right now.",
    winMessage: "Your immune system has been reinforced. Bivigam's borrowed antibodies are neutralizing threats and restoring balance.",
    ivigNote: "Bivigam is given directly into a vein (intravenously), allowing antibodies to reach your bloodstream quickly and in high concentration.",
  },
  {
    id: 10, gameType: "ivig", name: "Panzyga", generic: "Immune Globulin Intravenous (Human) 10%",
    drugColor: "#e76f51", bgGradient: ["#1a0800", "#2e1000"],
    description: "Panzyga is an IVIG therapy used for primary immunodeficiency and certain autoimmune conditions. It provides high-concentration IgG antibodies sourced from thousands of healthy plasma donors, giving your immune system a powerful borrowed defense.",
    howItWorks: "Panzyga floods your bloodstream with IgG antibodies that do two important jobs: they neutralize bacteria, viruses, and toxins that your own immune system may not be able to handle, and they help regulate an overactive immune response by occupying receptors that would otherwise trigger autoimmune attacks on your own tissues.",
    encouragement: "Your Panzyga infusion is reinforcing your immune system as you sit here.",
    winMessage: "Pathogens neutralized and immune signals rebalanced. Panzyga has done its work.",
    ivigNote: "Panzyga is given intravenously. The slow infusion rate is intentional — it gives your body time to adjust to the incoming antibodies safely.",
  },
  {
    id: 11, gameType: "ivig", name: "Octagam", generic: "Immune Globulin Intravenous (Human) 5% / 10%",
    drugColor: "#e9c46a", bgGradient: ["#1a1400", "#2e2200"],
    description: "Octagam is an IVIG therapy used for primary immunodeficiency and certain autoimmune conditions. It delivers purified IgG antibodies to strengthen your immune response and help regulate immune activity that may be harming your own tissues.",
    howItWorks: "Octagam works in two ways. First, it provides antibodies your immune system is missing, allowing your body to recognize and destroy pathogens. Second, the high concentration of IgG floods immune receptors, crowding out the signals that cause the immune system to mistakenly attack the body's own cells.",
    encouragement: "Your Octagam infusion is working on two fronts — protecting and rebalancing your immune system.",
    winMessage: "Immune system strengthened and autoimmune signals crowded out. Octagam has completed its work.",
    ivigNote: "Octagam is available in two concentrations (5% and 10%). Your care team has selected the right formulation and rate for you specifically.",
  },
  {
    id: 12, gameType: "ivig", name: "Hyqvia", generic: "Immune Globulin 10% with Recombinant Human Hyaluronidase",
    drugColor: "#2a9d8f", bgGradient: ["#001a18", "#002e2a"],
    description: "Hyqvia is a unique subcutaneous immunoglobulin (SCIG) therapy. Unlike traditional IVIG given through a vein, Hyqvia is given under the skin. It contains both IgG antibodies and an enzyme (hyaluronidase) that temporarily opens pathways in the tissue, allowing a large dose of antibodies to be absorbed steadily into the bloodstream.",
    howItWorks: "The hyaluronidase enzyme in Hyqvia gently loosens the tissue under your skin, creating space for the antibodies to spread and absorb gradually. This slow, steady absorption means the antibodies enter your bloodstream over a longer period — mimicking how your immune system would naturally maintain antibody levels.",
    encouragement: "Your Hyqvia dose is steadily absorbing and building your antibody levels right now.",
    winMessage: "Antibodies successfully absorbed. Hyqvia has steadily reinforced your immune defenses.",
    ivigNote: "Hyqvia is given subcutaneously (under the skin), not into a vein. The enzyme it contains temporarily opens tissue pathways so a full therapeutic dose can absorb gradually — a gentler process than traditional IV infusion.",
  },
];

function buildBricks() {
  const bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({ x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD), y: BRICK_OFFSET_Y + row * (BRICK_H + BRICK_PAD), w: BRICK_W, h: BRICK_H, alive: true });
  return bricks;
}

function getLanes() {
  return Array.from({ length: LANE_COUNT }, (_, i) =>
    BRICK_OFFSET_X + i * ((CANVAS_W - BRICK_OFFSET_X * 2 - PRECURSOR_W) / (LANE_COUNT - 1))
  );
}

function buildMembrane() {
  const segW = 42, gap = 4, count = Math.floor((CANVAS_W - 32) / (segW + gap));
  return Array.from({ length: count }, (_, i) => ({
    x: 16 + i * (segW + gap), y: MEM_Y - MEM_THICKNESS / 2,
    w: segW, h: MEM_THICKNESS, inserted: false, flash: 0, oligoFlash: 0,
  }));
}

function buildCaIons() {
  return Array.from({ length: 6 }, (_, i) => ({
    x: 80 + i * 60, y: 70 + Math.random() * 80,
    vx: (Math.random() - 0.5) * 2.0, vy: (Math.random() - 0.5) * 2.0,
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

function InfusionArcade() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const pointerRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const splashTimerRef = useRef(null);

  const [screen, setScreen] = useState("menu");
  const [drugIdx, setDrugIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [splashVisible, setSplashVisible] = useState(false);
  const [infusionLogoUrl, setInfusionLogoUrl] = useState(null);
  const [sharprxLogoUrl, setSharprxLogoUrl] = useState(null);

  // ── INFUSION SESSION STATE ────────────────────────────────────────────────
  // "mode" tracks the companion layer, separate from "screen" (game screens)
  // mode: "active" | "companion" | "complete"
  const [infusionMode, setInfusionMode] = useState("active");
  const [infusionDurationMinutes, setInfusionDurationMinutes] = useState(60);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [infusionProgress, setInfusionProgress] = useState(0);
  const infusionTickRef = useRef(null);

  // Milestone message derived from infusion progress (0–1)
  function getMilestoneMessage(pct) {
    if (pct >= 1)    return "Infusion complete.";
    if (pct >= 0.75) return "Final stretch.";
    if (pct >= 0.50) return "Halfway there.";
    if (pct >= 0.25) return "Treatment is progressing.";
    return "Infusion underway.";
  }

  // Start the real-time infusion clock (runs in companion mode)
  function startInfusionClock(startTime, durationMinutes) {
    clearInterval(infusionTickRef.current);
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

  // Called when the arcade round finishes (replaces direct setScreen("win"))
  function handleRoundComplete() {
    cancelAnimationFrame(animRef.current);
    if (infusionMode === "active" && sessionStartTime) {
      // Session already running — go straight to companion
      setScreen("companion");
    } else {
      // No session started yet — show the win screen as before
      setScreen("win");
    }
  }

  // Clean up the interval on unmount
  useEffect(() => {
    return () => clearInterval(infusionTickRef.current);
  }, []);

  const drug = DRUGS[drugIdx];
  const col = drug.drugColor;

  const INFUSION_LOGO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AADy+0lEQVR42uz9d7gl13XeCf/WrqoTbuy+nQO6kRqRAAgiEsyURIlKpmxJtiRaGtmyZVseaexxGqfx+LM9/mYsezwOM5LnURxJtjJFiSIpZpAESYAEARA5NBqd080nVdhr/ai6955TZ1c4F5Cmvuepi6ef...";
  const SHARPRX_LOGO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAEAAElEQVR42uz9d7gl13XeCf/WrqoTbuy+nQO6kRqRAAgiEsyURIlKpmxJtiRaGtmyZVseaexxGqfx+LM9/mYsezwOM5LnURxJtjJFiSIpZpAESYAEARA5NBqd080nVdhr/ai6955TZ1c4F5Cmvuepi6ef...";

  useEffect(() => {
    setInfusionLogoUrl(INFUSION_LOGO_DATA);
    setSharprxLogoUrl(SHARPRX_LOGO_DATA);
  }, []);

  const showSplashThen = useCallback((cb) => {
    setSplashVisible(true);
    clearTimeout(splashTimerRef.current);
    splashTimerRef.current = setTimeout(() => { setSplashVisible(false); cb(); }, 2000);
  }, []);

  const startDrug = useCallback((idx) => {
    setDrugIdx(idx);
    stateRef.current = null;
    showSplashThen(() => {
      const d = DRUGS[idx];
      if (d.gameType === "breakout") {
        stateRef.current = { gameType: "breakout", paddle: { x: CANVAS_W / 2 - PADDLE_W / 2, y: CANVAS_H - 52 }, targetPaddleX: CANVAS_W / 2 - PADDLE_W / 2, ball: { x: CANVAS_W / 2, y: CANVAS_H - 76, vx: 0, vy: 0 }, bricks: buildBricks(), launched: false, particles: [], totalBricks: BRICK_COLS * BRICK_ROWS, clearedBricks: 0 };
      } else if (d.gameType === "vanco") {
        stateRef.current = { gameType: "vanco", vancoX: CANVAS_W / 2 - VANCO_W / 2, targetVancoX: CANVAS_W / 2 - VANCO_W / 2, vancoY: CANVAS_H - 76, precursors: [], particles: [], spawnTimer: 0, spawnRate: 100, speed: 1.3, blocked: 0, total: 0, goal: 24 };
      } else if (d.gameType === "dapto") {
        stateRef.current = { gameType: "dapto", daptoX: CANVAS_W / 2 - DAPTO_W / 2, daptoY: 140, targetDaptoX: CANVAS_W / 2 - DAPTO_W / 2, targetDaptoY: 140, caIons: buildCaIons(), membrane: buildMembrane(), particles: [], caCollected: 0, inserted: 0, wave: 0, waveTransition: 0 };
      } else if (d.gameType === "ivig") {
        stateRef.current = {
          gameType: "ivig",
          ivigWave: 0, // 0 = neutralization, 1 = receptor blockade
          waveTransition: 0, waveTransitionMsg: "",
          // Wave 1 state
          shooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2,
          targetShooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2,
          projectiles: [],
          pathogens: buildIvigPathogens(0),
          shootCooldown: 0,
          neutralized: 0, totalPathogens: 21,
          // Wave 2 state
          receptors: buildReceptorGrid(),
          igGBalls: [], // floating IgG balls player guides
          igGX: CANVAS_W / 2, igGY: CANVAS_H - 80,
          targetIgGX: CANVAS_W / 2, targetIgGY: CANVAS_H - 80,
          occupied: 0, totalReceptors: IVIG_ROWS * IVIG_COLS,
          blockSpawnTimer: 0, blockSpawnRate: 60,
          particles: [],
        };
      }
      setProgress(0);
      setScreen("intro");
    });
  }, [showSplashThen]);

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
      else if (s.gameType === "ivig") {
        if (s.ivigWave === 0) s.targetShooterX = Math.max(0, Math.min(CANVAS_W - IVIG_SHOOTER_W, pos.x - IVIG_SHOOTER_W / 2));
        else { s.targetIgGX = Math.max(20, Math.min(CANVAS_W - 20, pos.x)); s.targetIgGY = Math.max(34, Math.min(CANVAS_H - 20, pos.y)); }
      }
    };
    const onTap = (clientX, clientY) => {
      const pos = getPos(clientX, clientY);
      const s = stateRef.current; if (!s) return;
      if (s.gameType === "breakout" && !s.launched) {
        const dx = pos.x - s.ball.x, dy = pos.y - s.ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy); if (dist < 1) return;
        const speed = 4.8;
        let vx = (dx / dist) * speed, vy = (dy / dist) * speed;
        if (vy > -0.8) vy = -speed * 0.85;
        const spd = Math.sqrt(vx * vx + vy * vy);
        s.ball.vx = (vx / spd) * speed; s.ball.vy = (vy / spd) * speed; s.launched = true;
      }
      // IVIG wave 1: tap fires a projectile
      if (s.gameType === "ivig" && s.ivigWave === 0 && s.shootCooldown <= 0) {
        const sx = s.shooterX + IVIG_SHOOTER_W / 2;
        const sy = CANVAS_H - 52;
        s.projectiles.push({ x: sx, y: sy, vx: 0, vy: -6, alive: true });
        s.shootCooldown = 18;
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
      // custom label for ivig progress bar
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
    function tickBreakout(s) {
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
            spawnP(s, brick.x + brick.w / 2, brick.y + brick.h / 2, dc, 10, 5); break;
          }
        }
        tickP(s);
      }
      if (s.bricks.every(b => !b.alive)) { handleRoundComplete(); return false; }
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
    function tickVanco(s) {
      s.vancoX += (s.targetVancoX - s.vancoX) * 0.3;
      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnRate && s.total < 48) {
        s.spawnTimer = 0; s.total++;
        const lanes = getLanes(), lane = lanes[Math.floor(Math.random() * LANE_COUNT)];
        const px = Math.max(4, Math.min(CANVAS_W - PRECURSOR_W - 4, lane + (Math.random() - 0.5) * 20));
        s.precursors.push({ x: px, y: -PRECURSOR_H, speed: s.speed + (Math.random() - 0.5) * 0.25, bound: false, missed: false, flash: 0, opacity: 1 });
      }
      const wallY = CANVAS_H - 90;
      for (const pre of s.precursors) {
        if (pre.bound || pre.missed) { pre.opacity -= 0.045; continue; }
        pre.y += pre.speed; if (pre.flash > 0) pre.flash--;
        if (pre.x < s.vancoX + VANCO_W && pre.x + PRECURSOR_W > s.vancoX && pre.y < s.vancoY + VANCO_H && pre.y + PRECURSOR_H > s.vancoY) {
          pre.bound = true; s.blocked++;
          setProgress(Math.min(1, s.blocked / s.goal));
          spawnP(s, pre.x + PRECURSOR_W / 2, pre.y + PRECURSOR_H / 2, dc, 12, 5);
        }
        if (pre.y > wallY && !pre.bound && !pre.missed) { pre.missed = true; spawnP(s, pre.x + PRECURSOR_W / 2, wallY, "rgba(255,100,100,0.8)", 4, 2); }
      }
      s.precursors = s.precursors.filter(p => p.opacity > 0 && p.y < CANVAS_H + 20);
      tickP(s);
      if (s.total >= 48 && s.precursors.every(p => p.bound || p.missed || p.opacity <= 0)) { handleRoundComplete(); return false; }
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
      ctx.fillStyle = "#1a003a"; ctx.font = `bold 10px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("VANCOMYCIN", s.vancoX + VANCO_W / 2, s.vancoY + VANCO_H / 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `12px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Slide to intercept building blocks before they reach the wall", CANVAS_W / 2, CANVAS_H - 38);
      drawHUD(pct, `Infection clearing: ${Math.round(pct * 100)}%`); return true;
    }

    // ── DAPTOMYCIN ────────────────────────────────────────────────────────────
    function advanceDaptoWave(s) {
      s.wave++; if (s.wave >= TOTAL_WAVES) { handleRoundComplete(); return false; }
      s.membrane = buildMembrane(); s.caIons = buildCaIons(); s.caCollected = 0; s.waveTransition = 120; return true;
    }
    function tickDapto(s) {
      s.daptoX += (s.targetDaptoX - s.daptoX) * 0.3; s.daptoY += (s.targetDaptoY - s.daptoY) * 0.3;
      if (s.waveTransition > 0) {
        s.waveTransition--;
        drawBg();
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = dc; ctx.font = `bold 20px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Bacteria clearing…", CANVAS_W / 2, CANVAS_H / 2 - 40);
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `15px ${SANS}`; ctx.fillText(WAVE_MESSAGES[s.wave] || "", CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `12px ${SANS}`; ctx.fillText(WAVE_NARRATION[s.wave] || "", CANVAS_W / 2, CANVAS_H / 2 + 34);
        drawWatermark(); return true;
      }
      s.caIons = s.caIons.filter(c => !c.collected);
      if (s.caIons.length < 5) s.caIons.push({ x: 60 + Math.random() * (CANVAS_W - 120), y: 60 + Math.random() * 90, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, r: CA_R, collected: false });
      for (const ca of s.caIons) {
        ca.x += ca.vx; ca.y += ca.vy;
        if (ca.x - ca.r < 0) { ca.x = ca.r; ca.vx *= -1; } if (ca.x + ca.r > CANVAS_W) { ca.x = CANVAS_W - ca.r; ca.vx *= -1; }
        if (ca.y - ca.r < 38) { ca.y = 38 + ca.r; ca.vy *= -1; } if (ca.y + ca.r > MEM_Y - 60) { ca.y = MEM_Y - 60; ca.vy *= -1; }
        const dx = ca.x - (s.daptoX + DAPTO_W / 2), dy = ca.y - (s.daptoY + DAPTO_H / 2);
        if (Math.sqrt(dx * dx + dy * dy) < DAPTO_W + ca.r && !ca.collected && s.caCollected < CA_MAX) { ca.collected = true; s.caCollected++; spawnP(s, ca.x, ca.y, "#fef08a", 8, 3); }
      }
      const activated = s.caCollected >= 2;
      for (const seg of s.membrane) {
        if (seg.inserted) { if (seg.oligoFlash > 0) seg.oligoFlash--; continue; }
        if (seg.flash > 0) { seg.flash--; continue; }
        const cx = s.daptoX + DAPTO_W / 2, cy = s.daptoY + DAPTO_H;
        if (cx > seg.x && cx < seg.x + seg.w && cy >= seg.y - 8 && cy <= seg.y + seg.h + 4) {
          if (!activated) { seg.flash = 16; }
          else {
            seg.inserted = true; spawnP(s, seg.x + seg.w / 2, seg.y, dc, 14, 5);
            for (let i = 0; i < 5; i++) s.particles.push({ x: seg.x + seg.w / 2, y: seg.y + seg.h / 2, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 4, life: 40, maxLife: 40, color: "#86efac", r: 5 });
            const idx = s.membrane.indexOf(seg);
            [-1, 1, -2, 2].forEach(off => { const nb = s.membrane[idx + off]; if (nb && !nb.inserted) { nb.oligoFlash = 18; setTimeout(() => { if (!nb.inserted) { nb.inserted = true; spawnP(s, nb.x + nb.w / 2, nb.y, dc + "88", 6, 3); } }, Math.abs(off) * 200 + 200); } });
            if (s.caCollected > 0) s.caCollected = Math.max(0, s.caCollected - 1);
          }
        }
      }
      tickP(s);
      const insertedCount = s.membrane.filter(seg => seg.inserted).length;
      const waveProgress = Math.min(1, insertedCount / (s.membrane.length * 0.6));
      const overallPct = Math.min(1, (s.wave / TOTAL_WAVES) + (waveProgress / TOTAL_WAVES));
      setProgress(overallPct);
      if (insertedCount / s.membrane.length >= 0.6) { if (advanceDaptoWave(s) === false) return false; }
      drawBg();
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = `10px ${SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Bloodstream — calcium zone", 12, 52);
      ctx.textAlign = "right"; ctx.fillStyle = dc + "cc"; ctx.font = `bold 10px ${SANS}`; ctx.fillText(WAVE_MESSAGES[s.wave] || "", CANVAS_W - 12, 52);
      const memY0 = MEM_Y - MEM_THICKNESS / 2;
      ctx.save();
      const mg = ctx.createLinearGradient(0, memY0, 0, memY0 + MEM_THICKNESS);
      mg.addColorStop(0, "#1a3a1a"); mg.addColorStop(0.5, "#0d2010"); mg.addColorStop(1, "#1a3a1a");
      ctx.fillStyle = mg; ctx.fillRect(0, memY0, CANVAS_W, MEM_THICKNESS);
      ctx.strokeStyle = "rgba(100,200,100,0.2)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, memY0); ctx.lineTo(CANVAS_W, memY0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, memY0 + MEM_THICKNESS); ctx.lineTo(CANVAS_W, memY0 + MEM_THICKNESS); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `bold 10px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("Bacterial Membrane", CANVAS_W / 2, memY0 - 8);
      for (const seg of s.membrane) {
        let fillC, strokeC, glowC;
        if (seg.inserted) { fillC = "#1a3a0a"; strokeC = "#44ff88"; glowC = "#44ff88"; }
        else if (seg.oligoFlash > 0) { fillC = "#2a5a14"; strokeC = "#88ff44"; glowC = "#88ff44"; seg.oligoFlash--; }
        else { fillC = dc + "22"; strokeC = dc + "88"; glowC = dc; }
        ctx.save(); ctx.shadowBlur = seg.flash > 0 ? 16 : (seg.inserted ? 12 : 5); ctx.shadowColor = seg.flash > 0 ? "#fff5" : glowC;
        drawRoundRect(ctx, seg.x + 1, seg.y + 2, seg.w - 2, seg.h - 4, 5); ctx.fillStyle = fillC; ctx.fill(); ctx.strokeStyle = strokeC; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        if (seg.inserted) { ctx.fillStyle = "#44ff8899"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("✓", seg.x + seg.w / 2, seg.y + MEM_THICKNESS / 2); }
      }
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `10px ${SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Inside bacteria", 12, MEM_Y + MEM_THICKNESS / 2 + 20);
      drawP(s);
      for (const ca of s.caIons) {
        if (ca.collected) continue;
        ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = "#fef08a"; ctx.fillStyle = "#fef08a";
        ctx.beginPath(); ctx.arc(ca.x, ca.y, ca.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        ctx.fillStyle = "#78350f"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Ca²⁺", ca.x, ca.y);
      }
      const caP = Math.min(1, s.caCollected / CA_MAX);
      ctx.save(); ctx.shadowBlur = 14 + caP * 24; ctx.shadowColor = dc;
      const dg = ctx.createRadialGradient(s.daptoX + DAPTO_W / 2, s.daptoY + DAPTO_H / 2, 4, s.daptoX + DAPTO_W / 2, s.daptoY + DAPTO_H / 2, DAPTO_W / 2);
      dg.addColorStop(0, dc); dg.addColorStop(1, dc + "77");
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(s.daptoX + DAPTO_W / 2, s.daptoY + DAPTO_H / 2, DAPTO_W / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = dc; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#1c0800"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("CUBICIN", s.daptoX + DAPTO_W / 2, s.daptoY + DAPTO_H / 2 - 5);
      ctx.font = `7px ${SANS}`; ctx.fillStyle = "#1c080088"; ctx.fillText(`Ca²⁺ ${s.caCollected}/${CA_MAX}`, s.daptoX + DAPTO_W / 2, s.daptoY + DAPTO_H / 2 + 7);
      for (let i = 0; i < CA_MAX; i++) {
        const px = s.daptoX + DAPTO_W / 2 - (CA_MAX / 2) * 12 + i * 12 + 6, py = s.daptoY + DAPTO_H + 14;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = i < s.caCollected ? "#fbbf24" : "rgba(255,255,255,0.18)"; ctx.fill();
      }
      for (let w = 0; w < TOTAL_WAVES; w++) {
        const dotX = CANVAS_W / 2 - (TOTAL_WAVES - 1) * 18 + w * 36, dotY = CANVAS_H - 50;
        ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        ctx.fillStyle = w < s.wave ? dc : (w === s.wave ? dc + "66" : "rgba(255,255,255,0.15)"); ctx.fill();
        ctx.fillStyle = w < s.wave ? "#000" : "rgba(255,255,255,0.5)"; ctx.font = `bold 8px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(w + 1, dotX, dotY);
      }
      ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.font = `12px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      if (!activated) ctx.fillText("Drag through Ca²⁺ to activate Cubicin", CANVAS_W / 2, CANVAS_H - 36);
      else ctx.fillText("Drag Cubicin into the membrane to punch through", CANVAS_W / 2, CANVAS_H - 36);
      drawHUD(overallPct, `Infection clearing: ${Math.round(overallPct * 100)}%`); return true;
    }

    // ── IVIG ─────────────────────────────────────────────────────────────────
    function tickIvig(s) {
      // ── Wave transition screen ──────────────────────────────────────────────
      if (s.waveTransition > 0) {
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

      // ── IVIG Wave 1: Space Invaders (neutralization) ────────────────────────
      if (s.ivigWave === 0) {
        s.shooterX += (s.targetShooterX - s.shooterX) * 0.3;
        if (s.shootCooldown > 0) s.shootCooldown--;

        // Move pathogens
        let edgeHit = false;
        for (const p of s.pathogens) {
          if (!p.alive) continue;
          p.x += p.vx;
          if (p.x < PATHOGEN_W / 2 || p.x > CANVAS_W - PATHOGEN_W / 2) edgeHit = true;
        }
        if (edgeHit) {
          for (const p of s.pathogens) {
            if (!p.alive) continue;
            p.vx *= -1; p.y += 14;
          }
        }
        // Randomly fire back (chance per frame)
        for (const p of s.pathogens) {
          if (!p.alive) continue;
          p.vy = Math.max(p.vy, 0.18 + s.neutralized * 0.004);
          p.y += p.vy;
          if (p.flash > 0) p.flash--;
        }

        // Move projectiles
        for (const proj of s.projectiles) {
          proj.y += proj.vy;
          if (proj.y < 34) { proj.alive = false; continue; }
          // Hit test
          for (const p of s.pathogens) {
            if (!p.alive || !proj.alive) continue;
            const dx = proj.x - p.x, dy = proj.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < PATHOGEN_W / 2 + 6) {
              proj.alive = false; p.alive = false; s.neutralized++;
              spawnP(s, p.x, p.y, PATHOGEN_COLORS[p.type], 14, 5);
              spawnP(s, p.x, p.y, dc, 8, 4);
            }
          }
        }
        s.projectiles = s.projectiles.filter(pr => pr.alive && pr.y > 0);

        // Check if pathogens reached the bottom (player cells)
        for (const p of s.pathogens) {
          if (!p.alive) continue;
          if (p.y > CANVAS_H - 80) { p.alive = false; s.neutralized++; spawnP(s, p.x, p.y, "#ff4444", 10, 4); }
        }

        const allGone = s.pathogens.every(p => !p.alive);
        const pct = Math.min(1, s.neutralized / s.totalPathogens) * 0.5; // wave 1 is first half of progress
        setProgress(pct);

        if (allGone) {
          // Transition to wave 2
          s.ivigWave = 1;
          s.waveTransition = 160;
          return true;
        }

        // ── Draw wave 1 ──────────────────────────────────────────────────────
        drawBg();

        // Subtle grid lines suggesting bloodstream
        ctx.save(); ctx.strokeStyle = dc + "11"; ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 34); ctx.lineTo(x, CANVAS_H - 35); ctx.stroke(); }
        ctx.restore();

        // Draw pathogens
        for (const p of s.pathogens) {
          if (!p.alive) continue;
          const pCol = PATHOGEN_COLORS[p.type];
          ctx.save();
          if (p.flash > 0) { ctx.shadowBlur = 20; ctx.shadowColor = "#fff"; }
          else { ctx.shadowBlur = 10; ctx.shadowColor = pCol; }
          drawPathogen(ctx, p.x, p.y, PATHOGEN_W / 2, pCol, 8 + p.type * 2);
          ctx.restore();
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `bold 7px ${SANS}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(PATHOGEN_LABELS[p.type], p.x, p.y);
        }

        // Draw projectiles (Y-shaped IgG)
        for (const proj of s.projectiles) {
          ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = dc;
          drawYShape(ctx, proj.x, proj.y, 18, dc);
          ctx.restore();
        }

        // Draw shooter (IgG dispenser)
        const sx = s.shooterX, sy = CANVAS_H - 52;
        ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = dc;
        const sg = ctx.createLinearGradient(sx, sy, sx, sy + IVIG_SHOOTER_H);
        sg.addColorStop(0, dc); sg.addColorStop(1, dc + "99");
        drawRoundRect(ctx, sx, sy, IVIG_SHOOTER_W, IVIG_SHOOTER_H, 8);
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = "#fff4"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        ctx.fillStyle = "#000"; ctx.font = `bold 8px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("IgG Antibodies", sx + IVIG_SHOOTER_W / 2, sy + IVIG_SHOOTER_H / 2);
        // Draw Y icon on shooter
        drawYShape(ctx, sx + IVIG_SHOOTER_W / 2, sy - 18, 14, dc);

        // Bottom cell barrier
        ctx.save(); ctx.fillStyle = dc + "18"; ctx.fillRect(0, CANVAS_H - 35, CANVAS_W, 35);
        ctx.strokeStyle = dc + "44"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, CANVAS_H - 35); ctx.lineTo(CANVAS_W, CANVAS_H - 35); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = dc + "88"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Your cells — protect them", CANVAS_W / 2, CANVAS_H - 22);

        drawP(s); tickP(s);

        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `11px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText("Slide to aim · Tap to fire IgG antibodies", CANVAS_W / 2, CANVAS_H - 38);

        // Wave badge
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = `bold 9px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText(IVIG_WAVE_TITLES[0], CANVAS_W - 10, 52);

        drawHUD(pct, `Neutralized: ${s.neutralized}/${s.totalPathogens}`);
        return true;
      }

      // ── IVIG Wave 2: Receptor Blockade (grid flood-fill) ──────────────────
      if (s.ivigWave === 1) {
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

        // ── Draw wave 2 ──────────────────────────────────────────────────────
        drawBg();

        // Background label
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

          // Draw Y symbol if occupied
          if (r.state === "occupied") {
            drawYShape(ctx, cx, cy, rr * 0.8, dc + "cc");
          }
        }

        // Draw player IgG ball
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
      let cont;
      if (s.gameType === "breakout") cont = tickBreakout(s);
      else if (s.gameType === "vanco") cont = tickVanco(s);
      else if (s.gameType === "dapto") cont = tickDapto(s);
      else cont = tickIvig(s);
      if (cont !== false) animRef.current = requestAnimationFrame(loop);
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

  const SharpRXBadge = () => (
    <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
      SharpRX Interactive
    </div>
  );

  const BigBtn = ({ label, onClick, primary = false }) => (
    <button onClick={onClick} style={{
      background: primary ? col : "rgba(255,255,255,0.1)",
      color: primary ? "#080010" : "rgba(255,255,255,0.85)",
      border: primary ? "none" : "1.5px solid rgba(255,255,255,0.25)",
      padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700,
      fontFamily: SANS, cursor: "pointer", touchAction: "manipulation",
      boxShadow: primary ? `0 0 28px ${col}66` : "none", letterSpacing: 0.5,
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >{label}</button>
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
    const groups = [
      { label: "Penicillin Antibiotics", color: "#00d4c8", drugs: [DRUGS[0]] },
      { label: "Cephalosporin Antibiotics", color: "#6366f1", drugs: [DRUGS[1], DRUGS[2], DRUGS[3]] },
      { label: "Carbapenem Antibiotics", color: "#f59e0b", drugs: [DRUGS[4], DRUGS[5]] },
      { label: "Vancomycin", color: "#c084fc", drugs: [DRUGS[6]] },
      { label: "Cubicin (Daptomycin)", color: "#eab308", drugs: [DRUGS[7]] },
      { label: "Immunoglobulin Therapy (IVIG / SCIG)", color: "#f4a261", drugs: [DRUGS[8], DRUGS[9], DRUGS[10], DRUGS[11]] },
    ];
    return (
      <div style={{ background: "linear-gradient(160deg,#060a14,#0a0814)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: "#f0f4ff", padding: "24px 16px" }}>
        <div style={{ maxWidth: 500, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 6px", color: "#ffffff", fontFamily: SERIF, letterSpacing: 1 }}>Infusion Arcade</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>Select your medication to see it working</p>
          </div>
          {groups.map(grp => grp.drugs.length > 0 && (
            <div key={grp.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: grp.color + "bb", marginBottom: 10, textTransform: "uppercase", borderBottom: `1px solid ${grp.color}30`, paddingBottom: 6 }}>{grp.label}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {grp.drugs.map(d => (
                  <button key={d.id} onClick={() => startDrug(DRUGS.indexOf(d))} style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${d.drugColor}44`, color: "#ffffff", padding: "14px 18px", borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: SANS, touchAction: "manipulation" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.drugColor, boxShadow: `0 0 8px ${d.drugColor}`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: d.drugColor }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{d.generic}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }}>Tap your medication · Slide to play · Just your treatment working</div>
          <SharpRXBadge />
        </div>
      </div>
    );
  }

  if (screen === "intro") return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: col + "99", marginBottom: 6, textTransform: "uppercase" }}>{drug.gameType === "ivig" ? "Your immunoglobulin therapy" : "Your medication"}</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 4px", textShadow: `0 0 24px ${col}66` }}>{drug.name}</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{drug.generic}</div>
        </div>
        {drug.gameType === "ivig" && drug.ivigNote && (
          <div style={{ background: col + "14", border: `1.5px solid ${col}44`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 13, color: col + "dd", lineHeight: 1.6 }}>
            💉 {drug.ivigNote}
          </div>
        )}
        <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: col + "aa", marginBottom: 8, textTransform: "uppercase" }}>What is this therapy for?</div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", margin: 0 }}>{drug.description}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: col + "aa", marginBottom: 8, textTransform: "uppercase" }}>How does it work?</div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", margin: 0 }}>{drug.howItWorks}</p>
        </div>
        {drug.gameType === "ivig" && (
          <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col}22`, borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>How to play</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: col }}>Wave 1:</strong> Slide to aim, tap to fire IgG antibodies at incoming pathogens.<br />
              <strong style={{ color: col }}>Wave 2:</strong> Drag your IgG ball across receptor sites to occupy them before autoimmune signals do.
            </p>
          </div>
        )}
        <div style={{ background: col + "18", border: `1.5px solid ${col}55`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: col, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>✦ {drug.encouragement}</p>
        </div>

        {/* ── INFUSION DURATION PICKER ─────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: col + "aa", marginBottom: 10, textTransform: "uppercase" }}>Infusion session length</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[30, 60, 120, 180].map(mins => (
              <button key={mins}
                onClick={() => setInfusionDurationMinutes(mins)}
                style={{
                  flex: "1 1 calc(25% - 8px)", padding: "10px 4px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: SANS, touchAction: "manipulation",
                  background: infusionDurationMinutes === mins ? col + "33" : "rgba(255,255,255,0.07)",
                  border: infusionDurationMinutes === mins ? `1.5px solid ${col}` : "1.5px solid rgba(255,255,255,0.15)",
                  color: infusionDurationMinutes === mins ? col : "rgba(255,255,255,0.55)",
                }}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8, textAlign: "center" }}>
            Choose the length that matches your infusion today.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <BigBtn label={`Start session →`} onClick={() => {
            const now = Date.now();
            setSessionStartTime(now);
            setInfusionProgress(0);
            setInfusionMode("active");
            startInfusionClock(now, infusionDurationMinutes);
            setScreen("playing");
          }} primary />
          <BigBtn label="← Back" onClick={() => window.location.href = "index.html"} />
        </div>
        <SharpRXBadge />
      </div>
    </div>
  );

  if (screen === "win") return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: col, fontFamily: SERIF, textShadow: `0 0 24px ${col}66`, marginBottom: 8 }}>{drug.name} is working</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 28, lineHeight: 1.7 }}>{drug.winMessage}</p>
        {drug.gameType === "ivig" && (
          <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: col + "aa", marginBottom: 8, textTransform: "uppercase" }}>Why does this infusion take so long?</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              {drug.name === "Hyqvia"
                ? "Hyqvia absorbs slowly and steadily through the tissue under your skin. The extended time allows the full therapeutic dose to enter your system gradually and safely — which is actually one of its advantages over traditional IV infusion."
                : "Your body needs a large enough quantity of IgG antibodies to truly flood the system — neutralizing pathogens AND occupying enough receptor sites to have a meaningful effect. That volume takes time to infuse safely. The slow rate is intentional: it gives your body time to adjust to the incoming antibodies without side effects."
              }
            </p>
          </div>
        )}
        <div style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${col}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: col + "aa", marginBottom: 8, textTransform: "uppercase" }}>Remember</div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: 0 }}>{drug.howItWorks} Your care team has chosen {drug.name} specifically for you. {drug.gameType === "ivig" ? "Regular infusions help maintain protective antibody levels over time." : "Complete your full course of treatment for the best outcome."}</p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <BigBtn label="Play again" onClick={() => startDrug(drugIdx)} primary />
          <BigBtn label="Choose another medication" onClick={() => window.location.href = "index.html"} />
        </div>
        <SharpRXBadge />
      </div>
    </div>
  );


  // ── COMPANION MODE SCREEN ──────────────────────────────────────────────────
  if (screen === "companion" || screen === "complete") {
    const pct = infusionProgress;
    const milestone = getMilestoneMessage(pct);
    const minutesTotal = infusionDurationMinutes;
    const minutesElapsed = Math.round(pct * minutesTotal);
    const minutesLeft = Math.max(0, minutesTotal - minutesElapsed);
    const isComplete = screen === "complete" || pct >= 1;

    // Animated drip particles — purely decorative
    const bagFill = Math.max(0, 1 - pct); // bag drains as infusion progresses

    return (
      <div style={{ ...pageStyle, padding: "24px 16px" }}>
        <style>{`@keyframes dripDrop { 0%,100% { transform: translateY(0); opacity:1; } 60% { transform: translateY(6px); opacity:0.3; } }`}</style>
        <div style={{ maxWidth: 440, width: "100%" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: col + "88", marginBottom: 4, textTransform: "uppercase" }}>
              {isComplete ? "Session complete" : "Infusion companion"}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: col, fontFamily: SERIF, margin: "0 0 4px", textShadow: `0 0 20px ${col}55` }}>
              {drug.name}
            </h2>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{drug.generic}</div>
          </div>

          {/* IV Bag drain indicator */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ position: "relative", width: 72, height: 110 }}>
              {/* Bag outline */}
              <svg viewBox="0 0 72 110" width="72" height="110" style={{ position: "absolute", top: 0, left: 0 }}>
                {/* Bag body */}
                <rect x="8" y="14" width="56" height="76" rx="12" fill="none" stroke={col + "55"} strokeWidth="2" />
                {/* Bag fill — shrinks from bottom as infusion progresses */}
                <rect
                  x="9" y={14 + 76 * (1 - bagFill)} width="54"
                  height={76 * bagFill} rx="10"
                  fill={col + "33"}
                  style={{ transition: "height 1s ease, y 1s ease" }}
                />
                {/* Bag cap */}
                <rect x="28" y="6" width="16" height="10" rx="4" fill={col + "66"} />
                {/* Drip tube */}
                <line x1="36" y1="90" x2="36" y2="110" stroke={col + "55"} strokeWidth="2.5" strokeDasharray="3,3" />
                {/* Drip drop (only when not complete) — animated via CSS keyframes */}
                {!isComplete && (
                  <circle cx="36" cy="107" r="3" fill={col + "cc"} style={{ animation: "dripDrop 2s ease-in-out infinite" }} />
                )}
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>INFUSION PROGRESS</span>
              <span style={{ fontSize: 11, color: col + "cc", fontWeight: 700 }}>{Math.round(pct * 100)}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 6,
                background: `linear-gradient(90deg, ${col}99, ${col})`,
                width: `${Math.round(pct * 100)}%`,
                transition: "width 1s ease",
                boxShadow: `0 0 10px ${col}66`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{minutesElapsed}m elapsed</span>
              {!isComplete && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>~{minutesLeft}m remaining</span>}
            </div>
          </div>

          {/* Milestone message */}
          <div style={{ background: col + "14", border: `1px solid ${col}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 16, color: col, fontWeight: 600, lineHeight: 1.5 }}>{milestone}</div>
            {!isComplete && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
                {drug.name} is working in the background. Take a break — or play another round.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            {!isComplete && (
              <BigBtn
                label="▶ Play another round"
                onClick={() => {
                  stateRef.current = null;
                  setProgress(0);
                  showSplashThen(() => {
                    const d = DRUGS[drugIdx];
                    if (d.gameType === "breakout") {
                      stateRef.current = { gameType: "breakout", paddle: { x: CANVAS_W / 2 - PADDLE_W / 2, y: CANVAS_H - 52 }, targetPaddleX: CANVAS_W / 2 - PADDLE_W / 2, ball: { x: CANVAS_W / 2, y: CANVAS_H - 76, vx: 0, vy: 0 }, bricks: buildBricks(), launched: false, particles: [], totalBricks: BRICK_COLS * BRICK_ROWS, clearedBricks: 0 };
                    } else if (d.gameType === "vanco") {
                      stateRef.current = { gameType: "vanco", vancoX: CANVAS_W / 2 - VANCO_W / 2, targetVancoX: CANVAS_W / 2 - VANCO_W / 2, vancoY: CANVAS_H - 76, precursors: [], particles: [], spawnTimer: 0, spawnRate: 100, speed: 1.3, blocked: 0, total: 0, goal: 24 };
                    } else if (d.gameType === "dapto") {
                      stateRef.current = { gameType: "dapto", daptoX: CANVAS_W / 2 - DAPTO_W / 2, daptoY: 140, targetDaptoX: CANVAS_W / 2 - DAPTO_W / 2, targetDaptoY: 140, caIons: buildCaIons(), membrane: buildMembrane(), particles: [], caCollected: 0, inserted: 0, wave: 0, waveTransition: 0 };
                    } else if (d.gameType === "ivig") {
                      stateRef.current = { gameType: "ivig", ivigWave: 0, waveTransition: 0, waveTransitionMsg: "", shooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2, targetShooterX: CANVAS_W / 2 - IVIG_SHOOTER_W / 2, projectiles: [], pathogens: buildIvigPathogens(0), shootCooldown: 0, neutralized: 0, totalPathogens: 21, receptors: buildReceptorGrid(), igGBalls: [], igGX: CANVAS_W / 2, igGY: CANVAS_H - 80, targetIgGX: CANVAS_W / 2, targetIgGY: CANVAS_H - 80, occupied: 0, totalReceptors: IVIG_ROWS * IVIG_COLS, blockSpawnTimer: 0, blockSpawnRate: 60, particles: [] };
                    }
                    setScreen("playing");
                  });
                }}
                primary
              />
            )}
            {isComplete && (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Your session is done. Let your care team know how you're feeling.
                </p>
              </div>
            )}
            <BigBtn label="← Back to menu" onClick={() => {
              clearInterval(infusionTickRef.current);
              setInfusionMode("active");
              setSessionStartTime(null);
              setInfusionProgress(0);
              window.location.href = "index.html";
            }} />
          </div>

          <SharpRXBadge />
        </div>
      </div>
    );
  }

  // ── PLAYING SCREEN — canvas + infusion progress strip ─────────────────────
  return (
    <div style={{ ...pageStyle, padding: 8 }}>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: "block", borderRadius: 14, border: `2px solid ${col}33`, boxShadow: `0 0 40px ${col}22`, maxWidth: "100%", touchAction: "none" }} />

      {/* Infusion session progress strip — shown whenever a session is running */}
      {sessionStartTime && (
        <div style={{ marginTop: 10, maxWidth: CANVAS_W, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase" }}>Infusion session</span>
            <span style={{ fontSize: 10, color: col + "99" }}>{Math.round(infusionProgress * 100)}% · {getMilestoneMessage(infusionProgress)}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 4 }}>
            <div style={{ height: "100%", borderRadius: 4, background: col + "88", width: `${Math.round(infusionProgress * 100)}%`, transition: "width 5s linear" }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
        <button onClick={() => { cancelAnimationFrame(animRef.current); window.location.href = "index.html"; }} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: SANS, touchAction: "manipulation" }}>← Menu</button>
        <button onClick={() => { cancelAnimationFrame(animRef.current); setScreen("intro"); }} style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${col}44`, color: col, padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: SANS, touchAction: "manipulation" }}>ℹ About {drug.name}</button>
        {sessionStartTime && (
          <button onClick={() => { cancelAnimationFrame(animRef.current); setScreen("companion"); }} style={{ background: col + "22", border: `1px solid ${col}66`, color: col, padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: SANS, touchAction: "manipulation" }}>⏸ Session</button>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: "center", letterSpacing: 2, textTransform: "uppercase" }}>SharpRX Interactive</div>
    </div>
  );
}
