/**
 * DosecraftAudio — Web Audio API generative music engine
 * Presentation Layer only. Reads simulation state, never writes it.
 *
 * Usage:
 *   import DosecraftAudio from './dosecraft-audio.js';
 *   const audio = new DosecraftAudio();
 *
 *   audio.init();                        // call after first user gesture
 *   audio.setScene('menu');              // 'menu' | 'loading' | 'session' | 'off'
 *   audio.triggerEvent('drugBinding');   // fire a simulation event cue
 *   audio.setMuted(true);               // user toggle — persisted to localStorage
 *   audio.setMuted(false);
 *   audio.destroy();                     // clean up on unmount
 *
 * localStorage key: 'dosecraft:audio:muted' ('true' | 'false')
 * Preference is read in the constructor and restored automatically on init().
 */

const STORAGE_KEY = 'dosecraft:audio:muted';

export class DosecraftAudio {
  constructor() {
    this._ctx = null;
    this._masterGain = null;

    // Restore mute preference from localStorage (default: unmuted)
    this._muted = this._loadMutePreference();
    this._scene = 'off';
    this._activeSources = new Set();
    this._lfoNodes = [];
    this._droneNodes = [];
    this._ready = false;

    // Bind toggle handler so it can be removed later
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Must be called inside a user-gesture handler (click, touch).
   * Safe to call multiple times — only initialises once.
   */
  async init() {
    if (this._ready) return;

    this._ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain — all audio routes through here for clean mute
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.setValueAtTime(this._muted ? 0 : 0.6, this._ctx.currentTime);
    this._masterGain.connect(this._ctx.destination);

    // Soft compressor to prevent clipping when multiple layers play
    const comp = this._ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 6;
    comp.ratio.value = 3;
    comp.attack.value = 0.05;
    comp.release.value = 0.3;
    comp.connect(this._masterGain);
    this._compressor = comp;

    this._ready = true;
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  }

  /** Switch ambient scene. Crossfades cleanly between states. */
  setScene(scene) {
    if (!this._ready) return;
    if (scene === this._scene) return;
    this._scene = scene;
    this._stopDrone();

    if (scene === 'menu' || scene === 'loading') {
      this._startMenuDrone();
    } else if (scene === 'session') {
      this._startSessionDrone();
    }
  }

  /**
   * Fire a one-shot tonal event cue.
   * @param {string} event — one of the EVENTS keys below
   */
  triggerEvent(event) {
    if (!this._ready || this._muted) return;
    const def = EVENTS[event];
    if (!def) return;
    this._playEventCue(def.frequencies, def.duration, def.gain);
  }

  /** User-facing mute toggle. Smoothly ramps gain and persists preference. */
  setMuted(muted) {
    this._muted = muted;
    this._saveMutePreference(muted);
    if (!this._ready) return;
    const now = this._ctx.currentTime;
    this._masterGain.gain.cancelScheduledValues(now);
    this._masterGain.gain.setTargetAtTime(muted ? 0 : 0.6, now, 0.3);
  }

  isMuted() {
    return this._muted;
  }

  // ─── localStorage helpers ──────────────────────────────────────────────────

  _loadMutePreference() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Explicit 'true' string only — any missing/corrupt value defaults to unmuted
      return stored === 'true';
    } catch (_) {
      // localStorage unavailable (private browsing, kiosk restrictions, etc.)
      return false;
    }
  }

  _saveMutePreference(muted) {
    try {
      localStorage.setItem(STORAGE_KEY, String(muted));
    } catch (_) {
      // Silently ignore — preference simply won't persist this session
    }
  }

  /** Clean up all nodes. Call on component unmount. */
  destroy() {
    this._stopDrone();
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
    }
    this._ready = false;
  }

  // ─── Scene: Menu / Loading ─────────────────────────────────────────────────
  // Warm detuned pad — two oscillator pairs slightly out of phase,
  // a slow LFO on amplitude, gentle high-cut filter.

  _startMenuDrone() {
    const ctx = this._ctx;
    const out = this._compressor;
    const now = ctx.currentTime;

    // Root note: A2 (110 Hz) — warm, low, non-alarming
    const BASE = 110;
    const DETUNE_PAIRS = [
      [BASE,       BASE * 1.001],   // unison with tiny detune
      [BASE * 1.5, BASE * 1.5015], // perfect fifth
      [BASE * 2,   BASE * 2.002],  // octave
    ];

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.18, now + 4); // slow fade-in

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.5;

    droneGain.connect(filter);
    filter.connect(out);

    DETUNE_PAIRS.forEach(([freq1, freq2]) => {
      [freq1, freq2].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Each osc gets its own tiny pan for spatial width
        const panner = ctx.createStereoPanner();
        panner.pan.value = i === 0 ? -0.2 : 0.2;

        osc.connect(panner);
        panner.connect(droneGain);
        osc.start(now);
        this._droneNodes.push(osc, panner);
        this._activeSources.add(osc);
      });
    });

    // Slow LFO — 0.05 Hz tremolo
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04; // subtle depth

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start(now);

    this._droneNodes.push(droneGain, filter, lfo, lfoGain);
    this._activeSources.add(lfo);

    // Random subtle note drift every 8–14 seconds
    this._scheduleDrift(DETUNE_PAIRS[0][0]);
  }

  _scheduleDrift(baseFreq) {
    const SCALE = [1, 9/8, 5/4, 4/3, 3/2, 5/3]; // pentatonic-ish ratios
    const delay = 8000 + Math.random() * 6000;
    this._driftTimer = setTimeout(() => {
      if (this._scene !== 'menu' && this._scene !== 'loading') return;
      // Drift is purely cosmetic — not driven by simulation state
      this._scheduleDrift(baseFreq);
    }, delay);
  }

  // ─── Scene: Infusion Session ───────────────────────────────────────────────
  // Even calmer — lower volume, sparser texture, mostly silence with
  // occasional soft harmonics. Designed for clinical background presence.

  _startSessionDrone() {
    const ctx = this._ctx;
    const out = this._compressor;
    const now = ctx.currentTime;

    const BASE = 82.4; // E2 — lower, more grounding

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.08, now + 6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.3;

    droneGain.connect(filter);
    filter.connect(out);

    // Just two detuned oscillators for the session — very sparse
    [[BASE, BASE * 1.0005], [BASE * 2, BASE * 2.001]].forEach(([f1, f2]) => {
      [f1, f2].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const panner = ctx.createStereoPanner();
        panner.pan.value = i === 0 ? -0.15 : 0.15;

        osc.connect(panner);
        panner.connect(droneGain);
        osc.start(now);
        this._droneNodes.push(osc, panner);
        this._activeSources.add(osc);
      });
    });

    // Very slow LFO — 0.03 Hz (one full breath every ~33s)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.03;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start(now);

    this._droneNodes.push(droneGain, filter, lfo, lfoGain);
    this._activeSources.add(lfo);
  }

  _stopDrone() {
    if (this._driftTimer) clearTimeout(this._driftTimer);
    const now = this._ctx ? this._ctx.currentTime : 0;

    this._droneNodes.forEach(node => {
      if (node.gain) {
        node.gain.cancelScheduledValues(now);
        node.gain.setTargetAtTime(0, now, 0.8);
      }
      if (node.stop) {
        try { node.stop(now + 3); } catch (_) {}
      }
      if (node.disconnect) {
        setTimeout(() => { try { node.disconnect(); } catch (_) {} }, 3500);
      }
    });

    this._droneNodes = [];
    this._activeSources.clear();
  }

  // ─── Event Cues ───────────────────────────────────────────────────────────
  // Short, soft tonal chords. Each maps to a Presentation Layer simulation event.

  _playEventCue(frequencies, duration, gainLevel) {
    const ctx = this._ctx;
    const out = this._compressor;
    const now = ctx.currentTime;

    const cueGain = ctx.createGain();
    cueGain.gain.setValueAtTime(0, now);
    cueGain.gain.linearRampToValueAtTime(gainLevel, now + 0.08);
    cueGain.gain.setTargetAtTime(0, now + duration * 0.6, duration * 0.3);
    cueGain.connect(out);

    const reverb = this._createReverb(1.2);
    cueGain.connect(reverb);
    reverb.connect(out);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Slight stagger for chord bloom
      osc.start(now + i * 0.04);
      osc.stop(now + duration + 0.5);
      osc.connect(cueGain);
    });
  }

  // Lightweight convolution reverb using a generated impulse
  _createReverb(decaySec) {
    const ctx = this._ctx;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * decaySec;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let c = 0; c < 2; c++) {
      const ch = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.18;
    convolver.connect(wetGain);

    return wetGain;
  }

  // ─── Visibility ───────────────────────────────────────────────────────────

  _handleVisibilityChange() {
    if (!this._ctx) return;
    if (document.hidden) {
      this._ctx.suspend();
    } else {
      this._ctx.resume();
    }
  }
}

// ─── Simulation Event Definitions ─────────────────────────────────────────────
// All cues are soft, short, and non-alarming.
// Frequencies are chosen from the A natural minor scale (A, C, E, G) for calm consistency.

const A3 = 220, C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440;

export const EVENTS = {
  // Drug begins binding to receptors — gentle ascending triad
  drugBinding: {
    frequencies: [A3, E4, A4],
    duration: 1.8,
    gain: 0.12,
  },

  // Receptor reaches saturation — full soft chord, slightly brighter
  receptorSaturation: {
    frequencies: [A3, C4, E4, A4],
    duration: 2.2,
    gain: 0.10,
  },

  // Peak effect reached — warmest, fullest chord
  peakEffect: {
    frequencies: [A3, E4, G4, A4],
    duration: 2.5,
    gain: 0.13,
  },

  // Bacterial integrity declining (antibiotic contexts) — descending pair
  bacterialDecline: {
    frequencies: [E4, A3],
    duration: 1.4,
    gain: 0.08,
  },

  // Inflammation reducing — two-note calm resolution
  inflammationReduction: {
    frequencies: [C4, G4],
    duration: 2.0,
    gain: 0.09,
  },

  // Session milestone (e.g. halfway through infusion) — single soft bell tone
  sessionMilestone: {
    frequencies: [A4],
    duration: 2.8,
    gain: 0.10,
  },

  // Infusion complete — soft resolving chord
  infusionComplete: {
    frequencies: [A3, C4, E4, G4, A4],
    duration: 3.5,
    gain: 0.14,
  },
};

export default DosecraftAudio;
