// Home Infusion Mode — React UI (loaded via Babel on index.html)

var HOME_PAGE_STYLE = {
  minHeight: "100vh",
  background: "linear-gradient(165deg, #0a1628 0%, #0d1f2d 100%)",
  color: "#f5f8fc",
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  fontSize: 18,
  lineHeight: 1.55,
  padding: "20px 16px 40px",
};

function HomeShell(props) {
  return (
    <div style={HOME_PAGE_STYLE}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>{props.children}</div>
    </div>
  );
}

function HomeBtn(props) {
  var accent = props.accentColor || "#2a9d8f";
  var primary = props.primary;
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        display: "block",
        width: "100%",
        minHeight: 52,
        padding: "14px 20px",
        marginBottom: 10,
        borderRadius: 12,
        border: primary ? "none" : "2px solid rgba(255,255,255,0.2)",
        background: primary ? accent : "rgba(255,255,255,0.08)",
        color: primary ? "#041018" : "#f5f8fc",
        fontSize: 17,
        fontWeight: 700,
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
        touchAction: "manipulation",
      }}
    >
      {props.children || props.label}
    </button>
  );
}

function HomeBack(props) {
  return (
    <button
      onClick={props.onClick}
      style={{
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.5)",
        fontSize: 15,
        padding: "8px 0",
        marginBottom: 12,
        cursor: "pointer",
      }}
    >
      ← {props.label || "Back"}
    </button>
  );
}

function validateCustomIntervalHoursInput(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return { valid: false, showError: false, value: null };
  }
  var str = String(raw).trim();
  if (!/^\d+$/.test(str)) {
    return { valid: false, showError: true, value: null };
  }
  var n = parseInt(str, 10);
  if (n < 1 || n > 72) {
    return { valid: false, showError: true, value: null };
  }
  return { valid: true, showError: false, value: n };
}

function defaultWizardMedDraft() {
  return {
    medicationId: null,
    medicationIsOther: false,
    medicationOtherName: "",
    displayName: "",
    infusionDurationMins: null,
    scheduleMode: "interval",
    intervalPreset: "every_24_hours",
    customIntervalHours: "",
    firstDoseTime: "08:00",
    timesFrequency: "once_daily",
    doseTimes: ["08:00", "20:00", "14:00"],
  };
}

function defaultWizardDraft(STORE) {
  return {
    version: 2,
    treatmentSet: Object.assign(STORE.defaultTreatmentSet(), { medications: [] }),
    doseSessionLog: [],
    activeInfusionTimer: null,
  };
}

function buildMedicationFromWizardDraft(medDraft, sortOrder, STORE) {
  var med = STORE.defaultMedication({ sortOrder: sortOrder });
  med.medicationId = medDraft.medicationId;
  med.medicationIsOther = !!medDraft.medicationIsOther;
  med.medicationOtherName = medDraft.medicationOtherName || "";
  med.displayName = medDraft.displayName || "";
  med.infusionDurationMins = medDraft.infusionDurationMins;

  if (medDraft.scheduleMode === "interval") {
    if (medDraft.intervalPreset === "custom") {
      var validated = validateCustomIntervalHoursInput(medDraft.customIntervalHours);
      med.schedule.frequency = "custom";
      med.schedule.customSchedule = Object.assign({}, med.schedule.customSchedule, {
        type: "every_x_hours",
        intervalHours: validated.value,
      });
      med.schedule.doseTimes = [medDraft.firstDoseTime || "08:00"];
    } else {
      med.schedule.frequency = medDraft.intervalPreset;
      med.schedule.doseTimes = [medDraft.firstDoseTime || "08:00"];
    }
  } else {
    med.schedule.frequency = medDraft.timesFrequency || "once_daily";
    if (medDraft.timesFrequency === "twice_daily") {
      med.schedule.doseTimes = (medDraft.doseTimes || []).slice(0, 2);
    } else if (medDraft.timesFrequency === "three_daily") {
      med.schedule.doseTimes = (medDraft.doseTimes || []).slice(0, 3);
    } else {
      med.schedule.doseTimes = [(medDraft.doseTimes && medDraft.doseTimes[0]) || "08:00"];
    }
  }
  return med;
}

function wizardMedStep1Valid(medDraft) {
  if (medDraft.medicationIsOther) {
    return (medDraft.medicationOtherName || "").trim().length > 0;
  }
  return medDraft.medicationId != null;
}

function wizardMedStep2Valid(medDraft) {
  if (medDraft.scheduleMode === "interval") {
    if (!medDraft.firstDoseTime) return false;
    if (medDraft.intervalPreset === "custom") {
      return validateCustomIntervalHoursInput(medDraft.customIntervalHours).valid;
    }
    return !!medDraft.intervalPreset;
  }
  var freq = medDraft.timesFrequency || "once_daily";
  var times = medDraft.doseTimes || [];
  if (freq === "once_daily") return !!(times[0] || "").trim();
  if (freq === "twice_daily") return !!(times[0] || "").trim() && !!(times[1] || "").trim();
  if (freq === "three_daily") {
    return !!(times[0] || "").trim() && !!(times[1] || "").trim() && !!(times[2] || "").trim();
  }
  return false;
}

function wizardStepIndicator(wizardScreen, wizardMedIndex, twoMedPath) {
  if (twoMedPath) {
    if (wizardMedIndex === 0) {
      if (wizardScreen >= 1 && wizardScreen <= 4) return "Step " + wizardScreen + " of 6";
      if (wizardScreen === 5) return "Step 5 of 6";
    } else {
      if (wizardScreen === 1) return "Step 5 of 6";
      if (wizardScreen === 2) return "Step 6 of 6";
      if (wizardScreen === 3) return "Step 6 of 6";
    }
    return "";
  }
  if (wizardScreen >= 1 && wizardScreen <= 4) return "Step " + wizardScreen + " of 4";
  return "";
}

  var timer = props.timer;
  var STORE = props.store;
  var COPY = props.copy;
  var col = props.accentColor || "#2a9d8f";
  var card = props.cardStyle;
  if (!timer || STORE.isTimerComplete(timer)) return null;
  void props.tick;
  var pct = Math.round(STORE.getTimerProgress(timer) * 100);
  var medName = timer.medicationName || "Medication";
  return (
    <div style={{ ...card, borderColor: col + "88", marginBottom: 14 }}>
      <div style={{ fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
        Currently infusing
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: col, marginBottom: 4 }}>{medName}</div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>{STORE.formatTimerRemaining(timer)}</div>
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: pct + "%", height: "100%", background: col, transition: "width 0.5s" }} />
      </div>
      <HomeBtn accentColor={col} label={"Play the " + medName + " game while this infusion runs"} onClick={props.onPlayGame} />
      <HomeBtn accentColor={col} label={"Read about " + medName} onClick={props.onMedInfo} />
      <HomeBtn accentColor={col} label="Line care steps" onClick={props.onLineCare} />
      <HomeBtn accentColor={col} label="Care team / call instructions" onClick={props.onWarnings} />
      <HomeBtn accentColor={col} primary label="Mark infusion complete" onClick={props.onComplete} />
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "4px 0 0", textAlign: "center" }}>
        {COPY.multiMedSafetyNote}
      </p>
    </div>
  );
}

function SessionInfusionCard(props) {
  var timer = props.timer;
  var STORE = props.store;
  var COPY = props.copy;
  var col = props.accentColor || "#2a9d8f";
  var medName = props.medicationName || "Medication";
  var running = timer && !STORE.isTimerComplete(timer);
  void props.tick;
  var pct = running ? Math.round(STORE.getTimerProgress(timer) * 100) : 0;
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      {running ? (
        <div>
          <div style={{ fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            Currently infusing
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: col, marginBottom: 4 }}>{medName}</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>{STORE.formatTimerRemaining(timer)}</div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: pct + "%", height: "100%", background: col, transition: "width 0.5s" }} />
          </div>
          <HomeBtn accentColor={col} label={"Play the " + medName + " game while this infusion runs"} onClick={props.onPlayGame} />
          <HomeBtn accentColor={col} label={"Read about " + medName} onClick={props.onMedInfo} />
          <HomeBtn accentColor={col} label="Line care steps" onClick={props.onLineCare} />
          <HomeBtn accentColor={col} label="Care team / call instructions" onClick={props.onWarnings} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "8px 0 0", textAlign: "center" }}>
            You can return to the dashboard while this infusion runs.
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Start the timer when {medName} begins flowing.
        </p>
      )}
    </div>
  );
}

function MedicationEducationPanel(props) {
  var drug = props.drug;
  var med = props.med;
  var getEd = props.getEd;
  var col = props.accentColor;
  var card = props.cardStyle;
  var label = props.labelStyle;
  var ed = drug ? getEd(drug) : getEd(null);
  var title = props.store.medicationLabel(med, props.allDrugs);
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: col }}>{title}</h2>
      {drug && <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>{drug.generic}</p>}
      <div style={card}>
        <div style={label}>What it's for</div>
        <p style={{ margin: 0 }}>{ed.plainLanguagePurpose}</p>
      </div>
      {ed.howItWorks && (
        <div style={card}>
          <div style={label}>How it works</div>
          <p style={{ margin: 0 }}>{ed.howItWorks}</p>
        </div>
      )}
      {ed.commonSideEffects && ed.commonSideEffects.length > 0 && (
        <div style={card}>
          <div style={label}>Common side effects</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {ed.commonSideEffects.map(function (x, i) { return <li key={i} style={{ marginBottom: 6 }}>{x}</li>; })}
          </ul>
        </div>
      )}
      {ed.howWeMonitor && ed.howWeMonitor.length > 0 && (
        <div style={card}>
          <div style={label}>How progress is monitored</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {ed.howWeMonitor.map(function (x, i) { return <li key={i} style={{ marginBottom: 6 }}>{x}</li>; })}
          </ul>
        </div>
      )}
      {ed.reassuranceNote && (
        <div style={{ ...card, borderColor: col + "44" }}>
          <p style={{ margin: 0, color: col }}>{ed.reassuranceNote}</p>
        </div>
      )}
    </div>
  );
}

function HomeInfusionApp() {
  var STORE = window.DOSECRAFT_HOME_STORE;
  var COPY = window.DOSECRAFT_HOME_COPY;
  var ALL_DRUGS = window.DOSECRAFT_DRUGS || [];
  var cfg = window.DOSECRAFT_getClinicConfig();
  var isModule = window.DOSECRAFT_isModuleEnabled;
  var HOME_DRUGS = STORE.homeAntibioticDrugs(ALL_DRUGS);
  var getEd = window.DOSECRAFT_getPatientEducation;

  var _useState = React.useState;
  var _useEffect = React.useEffect;
  var _useRef = React.useRef;

  var _screen = _useState(function () {
    var s = STORE.loadSettings();
    if (STORE.isSetupComplete(s)) return "dashboard";
    if (STORE.hasModeChoice()) return "setupWizard";
    return "setupWizard";
  });
  var screen = _screen[0], setScreen = _screen[1];

  var _settings = _useState(STORE.loadSettings());
  var settings = _settings[0], setSettings = _settings[1];

  var _wizardScreen = _useState(1);
  var wizardScreen = _wizardScreen[0], setWizardScreen = _wizardScreen[1];

  var _wizardMedIndex = _useState(0);
  var wizardMedIndex = _wizardMedIndex[0], setWizardMedIndex = _wizardMedIndex[1];

  var _wizardTwoMedPath = _useState(false);
  var wizardTwoMedPath = _wizardTwoMedPath[0], setWizardTwoMedPath = _wizardTwoMedPath[1];

  var _wizardDraft = _useState(function () { return defaultWizardDraft(STORE); });
  var wizardDraft = _wizardDraft[0], setWizardDraft = _wizardDraft[1];

  var _wizardMedDraft = _useState(defaultWizardMedDraft);
  var wizardMedDraft = _wizardMedDraft[0], setWizardMedDraft = _wizardMedDraft[1];

  var _tick = _useState(0);
  var tick = _tick[0], setTick = _tick[1];

  var _sashStep = _useState(0);
  var sashStep = _sashStep[0], setSashStep = _sashStep[1];

  var _activeSession = _useState(function () { return STORE.loadActiveSession(); });
  var activeSession = _activeSession[0], setActiveSession = _activeSession[1];

  var _sessionChecklist = _useState(false);
  var sessionChecklist = _sessionChecklist[0], setSessionChecklist = _sessionChecklist[1];

  var _sessionDoses = _useState([]);
  var sessionDoses = _sessionDoses[0], setSessionDoses = _sessionDoses[1];

  var _medInfoKey = _useState(null);
  var medInfoKey = _medInfoKey[0], setMedInfoKey = _medInfoKey[1];

  var activeTimer = STORE.getActiveInfusionTimer(settings);

  _useEffect(function () {
    if (!activeTimer || STORE.isTimerComplete(activeTimer)) return;
    var id = setInterval(function () {
      setTick(function (t) { return t + 1; });
    }, 1000);
    return function () { clearInterval(id); };
  }, [activeTimer && activeTimer.sessionId, activeTimer && activeTimer.status]);

  _useEffect(function () {
    if (screen !== "sash") return;
    var stored = STORE.loadActiveSession();
    if (!stored) return;
    setActiveSession(stored);
    var due = STORE.dueDosesFromSession(stored, settings);
    setSessionDoses(due);
    var steps = STORE.buildDoseSessionSteps(due, settings, COPY);
    var idx = STORE.findResumeStepIndex(steps, stored, STORE.getActiveInfusionTimer(settings));
    setSashStep(idx);
  }, [screen]);

  var companionOpenedRef = _useRef(false);
  var setupStartedRef = _useRef(false);
  var wizardStartedRef = _useRef(false);
  var appointmentCardViewedRef = _useRef(false);

  _useEffect(function () {
    if (!window.trackCompanionScreen || companionOpenedRef.current) return;
    companionOpenedRef.current = true;
    window.trackCompanionScreen("companion_opened", "dashboard", { mode: "home" });
    window.trackCompanionScreen("privacy_notice_viewed", "dashboard", { mode: "home" });
  }, []);

  _useEffect(function () {
    if (!window.trackCompanionScreen) return;
    if (screen === "setup" && !setupStartedRef.current) {
      setupStartedRef.current = true;
      window.trackCompanionScreen("companion_treatment_setup_started", "setup", { mode: "home" });
    }
    if (screen === "setupWizard" && wizardScreen === 1 && !wizardStartedRef.current) {
      wizardStartedRef.current = true;
      window.trackCompanionScreen("companion_setup_wizard_started", "setup_wizard", { mode: "home" });
    }
    if (screen === "sash") {
      window.trackCompanionScreen("companion_dose_walkthrough_started", "sash", { mode: "home" });
    }
    if (screen === "warnings") {
      window.trackCompanionScreen("warning_signs_viewed", "warnings", { mode: "home" });
    }
    if (screen === "lineCare") {
      window.trackCompanionScreen("line_care_viewed", "line_care", { mode: "home" });
    }
    if (screen === "medInfo") {
      window.trackCompanionScreen(
        activeTimer && !STORE.isTimerComplete(activeTimer)
          ? "companion_active_timer_med_info_opened"
          : "medication_info_viewed",
        "medication_info",
        { mode: "home" }
      );
    }
    if (screen === "appointment") {
      window.trackCompanionScreen("appointment_card_viewed", "appointment", { mode: "home" });
    }
    if (screen === "gameChooser") {
      window.trackCompanionScreen("arcade_opened_from_companion", "game_chooser", { mode: "home" });
    }
  }, [screen]);

  _useEffect(function () {
    if (!window.trackCompanionScreen || screen !== "dashboard") return;
    if (!isModule("appointmentReminders") || appointmentCardViewedRef.current) return;
    if (!STORE.isSetupComplete(settings)) return;
    appointmentCardViewedRef.current = true;
    window.trackCompanionScreen("appointment_card_viewed", "dashboard", { mode: "home" });
  }, [screen, settings]);

  function persist(next) {
    setSettings(next);
    STORE.saveSettings(next);
  }

  function treatmentSet() {
    return settings.treatmentSet || STORE.defaultTreatmentSet();
  }

  function medColor(med) {
    if (med && med.medicationId != null) {
      var d = ALL_DRUGS.find(function (x) { return x.id === med.medicationId; });
      if (d) return d.color;
    }
    if (cfg.branding && cfg.branding.primaryColor) return cfg.branding.primaryColor;
    return "#2a9d8f";
  }

  function primaryColor() {
    var infusing = STORE.getCurrentInfusingMedication(settings, ALL_DRUGS);
    if (infusing) return medColor(infusing);
    return medColor(STORE.getPrimaryMedication(settings));
  }

  function savedMedicationDisabled() {
    return window.DOSECRAFT_isSavedMedicationDisabled(settings);
  }

  function goToScreen(name) {
    if (name === "sash" && !isModule("sashGuide")) return;
    if (name === "appointment" && !isModule("appointmentReminders")) return;
    if (name === "medInfo" && !isModule("medicationEducation")) return;
    if (name === "lineCare" && !isModule("lineCare")) return;
    if (name === "additionalSettings") return setScreen("additionalSettings");
    setScreen(name);
  }

  function commitWizardMedToDraft() {
    setWizardDraft(function (d) {
      var meds = (d.treatmentSet.medications || []).slice();
      var built = buildMedicationFromWizardDraft(wizardMedDraft, wizardMedIndex + 1, STORE);
      if (meds.length > wizardMedIndex) meds[wizardMedIndex] = built;
      else meds.push(built);
      var next = Object.assign({}, d);
      next.treatmentSet = Object.assign({}, d.treatmentSet, { medications: meds });
      return next;
    });
  }

  function saveWizardDraft() {
    persist(wizardDraft);
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("companion_setup_completed", "setup_wizard", { mode: "home", completed: true });
      window.trackCompanionScreen("companion_treatment_setup_completed", "setup_wizard", { mode: "home", completed: true });
    }
    setScreen("dashboard");
  }

  function launchGameForMedication(med) {
    if (!isModule("infusionArcade")) return;
    if (!med) {
      window.location.href = "game.html?return=home";
      return;
    }
    var drug = med.medicationId != null
      ? ALL_DRUGS.find(function (x) { return x.id === med.medicationId; })
      : null;
    if (drug && !window.DOSECRAFT_isMedicationEnabled(drug.id)) {
      goToScreen("setup");
      return;
    }
    if (activeTimer && !STORE.isTimerComplete(activeTimer)) {
      if (window.trackCompanionScreen) {
        window.trackCompanionScreen("companion_active_timer_game_opened", "dashboard", { mode: "home" });
      }
    }
    if (drug) {
      window.location.href = "game.html?drug=" + encodeURIComponent(drug.name) + "&return=home";
    } else {
      window.location.href = "game.html?return=home";
    }
  }

  function goPlayGame() {
    if (!isModule("infusionArcade")) return;
    var infusing = STORE.getCurrentInfusingMedication(settings, ALL_DRUGS);
    if (infusing) {
      launchGameForMedication(infusing);
      return;
    }
    if (STORE.hasMultipleTreatmentMedications(settings)) {
      setScreen("gameChooser");
      return;
    }
    launchGameForMedication(STORE.getPrimaryMedication(settings));
  }

  function goClinicMode() {
    if (!isModule("clinicInfusion")) return;
    window.location.href = "game.html?return=home";
  }

  function openMedInfo(key) {
    setMedInfoKey(key || null);
    goToScreen("medInfo");
  }

  function markTimerComplete() {
    var timer = STORE.getActiveInfusionTimer(settings);
    if (!timer) return;
    STORE.completeInfusionTimer(settings);
    var next = STORE.loadSettings();
    setSettings(next);
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("companion_infusion_timer_completed", "dashboard", {
        mode: "home",
        duration_bucket: window.dosecraftCompanionDurationBucket
          ? window.dosecraftCompanionDurationBucket(timer.durationMins)
          : undefined,
      });
    }
  }

  function persistSession(session) {
    setActiveSession(session);
    STORE.saveActiveSession(session);
  }

  function startDoseSession(due) {
    var existing = STORE.loadActiveSession();
    if (existing && existing.dueDoseKeys && existing.dueDoseKeys.length === due.length) {
      persistSession(existing);
      setSessionDoses(due);
      setSessionChecklist(false);
      var steps = STORE.buildDoseSessionSteps(due, settings, COPY);
      var resume = STORE.findResumeStepIndex(steps, existing, STORE.getActiveInfusionTimer(settings));
      setSashStep(resume);
      goToScreen("sash");
      return;
    }
    var session = STORE.createActiveSession(due);
    persistSession(session);
    setSessionDoses(due);
    setSessionChecklist(false);
    var steps = STORE.buildDoseSessionSteps(due, settings, COPY);
    var resume = STORE.findResumeStepIndex(steps, session, STORE.getActiveInfusionTimer(settings));
    setSashStep(resume);
    goToScreen("sash");
  }

  function renderGlobalTimerBanner() {
    if (!STORE.shouldShowGlobalTimerBanner(screen)) return null;
    return <CompactTimerBanner {...timerBannerProps()} />;
  }

  function timerBannerProps() {
    return {
      timer: activeTimer,
      store: STORE,
      copy: COPY,
      accentColor: primaryColor(),
      cardStyle: card,
      tick: tick,
      onPlayGame: goPlayGame,
      onMedInfo: function () {
        if (activeTimer && activeTimer.medicationId) openMedInfo(activeTimer.medicationId);
        else openMedInfo(null);
      },
      onLineCare: function () { goToScreen("lineCare"); },
      onWarnings: function () { goToScreen("warnings"); },
      onComplete: markTimerComplete,
    };
  }

  var col = primaryColor();
  var card = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "18px 20px",
    marginBottom: 14,
  };
  var label = {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  };

  var FREQ_OPTIONS = [
    ["once_daily", "Once daily"],
    ["twice_daily", "Twice daily"],
    ["three_daily", "Three times daily"],
    ["every_8_hours", "Every 8 hours"],
    ["every_12_hours", "Every 12 hours"],
    ["every_24_hours", "Every 24 hours"],
    ["custom", "Custom schedule"],
  ];

  var WIZARD_INTERVAL_OPTIONS = [
    ["every_24_hours", "Every 24 hours"],
    ["every_12_hours", "Every 12 hours"],
    ["every_8_hours", "Every 8 hours"],
    ["custom", "Custom"],
  ];

  // ── SETUP WIZARD (first-time only) ─────────────────────────────────────────
  if (screen === "setupWizard") {
    var wz = COPY.wizard || {};
    var stepLabel = wizardStepIndicator(wizardScreen, wizardMedIndex, wizardTwoMedPath);
    var customHoursCheck = validateCustomIntervalHoursInput(wizardMedDraft.customIntervalHours);
    var showCustomHoursError = wizardMedDraft.scheduleMode === "interval"
      && wizardMedDraft.intervalPreset === "custom"
      && customHoursCheck.showError;

    function updateWizardMedDraft(patch) {
      setWizardMedDraft(function (m) { return Object.assign({}, m, patch); });
    }

    function wizardBack() {
      if (wizardScreen === 1 && wizardMedIndex === 1) {
        setWizardMedIndex(0);
        setWizardScreen(5);
        return;
      }
      if (wizardScreen > 1) setWizardScreen(wizardScreen - 1);
    }

    function wizardNextFromMed3() {
      commitWizardMedToDraft();
      if (wizardMedIndex === 1) {
        setWizardScreen(6);
        return;
      }
      setWizardScreen(4);
    }

    function wizardNext() {
      if (wizardScreen === 1 && wizardMedStep1Valid(wizardMedDraft)) setWizardScreen(2);
      else if (wizardScreen === 2 && wizardMedStep2Valid(wizardMedDraft)) setWizardScreen(3);
      else if (wizardScreen === 3 && wizardMedDraft.infusionDurationMins != null) wizardNextFromMed3();
      else if (wizardScreen === 4 && wizardDraft.treatmentSet.course.startDate) setWizardScreen(5);
    }

    var inputStyle = { width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 10 };
    var linkStyle = {
      background: "transparent",
      border: "none",
      color: col,
      fontSize: 15,
      padding: "4px 0 12px",
      cursor: "pointer",
      textDecoration: "underline",
      textAlign: "left",
    };

    if (wizardScreen === 6) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setWizardScreen(5); }} label="Back" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.saveTitle || "You're all set"}</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
            {wz.saveHint || "You can update your treatment anytime from Edit setup."}
          </p>
          <HomeBtn accentColor={col} primary label={wz.saveButton || "Save and continue"} onClick={saveWizardDraft} />
        </HomeShell>
      );
    }

    if (wizardScreen === 5) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setWizardScreen(4); }} label="Back" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.addAnotherTitle || "Add another medication?"}</h1>
          {stepLabel && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{stepLabel}</p>}
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
            {wz.addAnotherHint || "Some home infusion treatments include more than one IV medication."}
          </p>
          <HomeBtn
            accentColor={col}
            primary
            label={wz.addAnotherYes || "Yes, add another medication"}
            onClick={function () {
              setWizardTwoMedPath(true);
              setWizardMedIndex(1);
              setWizardMedDraft(defaultWizardMedDraft());
              setWizardScreen(1);
            }}
          />
          <HomeBtn
            accentColor={col}
            label={wz.addAnotherNo || "No, I'm done"}
            onClick={function () { setWizardScreen(6); }}
          />
        </HomeShell>
      );
    }

    if (wizardScreen === 4) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setWizardScreen(3); }} label="Back" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.startDateTitle || "Treatment start date"}</h1>
          {stepLabel && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{stepLabel}</p>}
          <div style={card}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>
              {wz.startDateLabel || "When did or will your treatment start?"}
            </label>
            <input
              type="date"
              value={wizardDraft.treatmentSet.course.startDate || ""}
              onChange={function (e) {
                var val = e.target.value;
                setWizardDraft(function (d) {
                  var next = Object.assign({}, d);
                  next.treatmentSet = Object.assign({}, d.treatmentSet);
                  next.treatmentSet.course = Object.assign({}, d.treatmentSet.course, { startDate: val });
                  return next;
                });
              }}
              style={inputStyle}
            />
          </div>
          <HomeBtn
            accentColor={col}
            primary
            label="Next"
            disabled={!wizardDraft.treatmentSet.course.startDate}
            onClick={wizardNext}
          />
        </HomeShell>
      );
    }

    if (wizardScreen === 3) {
      return (
        <HomeShell>
          <HomeBack onClick={wizardBack} label="Back" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.durationTitle || "Infusion duration"}</h1>
          {stepLabel && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{stepLabel}</p>}
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
            {wz.durationHint || "How long does each infusion usually take?"}
          </p>
          <div style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COPY.infusionDurationPresets.map(function (p) {
                var on = wizardMedDraft.infusionDurationMins === p.mins;
                return (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={function () { updateWizardMedDraft({ infusionDurationMins: p.mins }); }}
                    style={{
                      flex: "1 1 40%",
                      padding: 12,
                      borderRadius: 8,
                      border: on ? "2px solid " + col : "1px solid rgba(255,255,255,0.2)",
                      background: on ? col + "33" : "transparent",
                      color: "#fff",
                      fontSize: 15,
                      cursor: "pointer",
                      minHeight: 52,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <HomeBtn
            accentColor={col}
            primary
            label="Next"
            disabled={wizardMedDraft.infusionDurationMins == null}
            onClick={wizardNext}
          />
        </HomeShell>
      );
    }

    if (wizardScreen === 2) {
      var timesSlots = wizardMedDraft.timesFrequency === "twice_daily"
        ? [0, 1]
        : wizardMedDraft.timesFrequency === "three_daily"
          ? [0, 1, 2]
          : [0];
      return (
        <HomeShell>
          <HomeBack onClick={wizardBack} label="Back" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.scheduleTitle || "Dosing schedule"}</h1>
          {stepLabel && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{stepLabel}</p>}

          {wizardMedDraft.scheduleMode === "interval" && (
            <div style={card}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>Dose interval</label>
              <select
                value={wizardMedDraft.intervalPreset}
                onChange={function (e) { updateWizardMedDraft({ intervalPreset: e.target.value }); }}
                style={inputStyle}
              >
                {WIZARD_INTERVAL_OPTIONS.map(function (pair) {
                  return <option key={pair[0]} value={pair[0]}>{pair[1]}</option>;
                })}
              </select>

              {wizardMedDraft.intervalPreset === "custom" && (
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>
                    {wz.customHoursLabel || "Every how many hours?"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    inputMode="numeric"
                    value={wizardMedDraft.customIntervalHours}
                    onChange={function (e) {
                      updateWizardMedDraft({ customIntervalHours: e.target.value });
                    }}
                    style={Object.assign({}, inputStyle, showCustomHoursError ? { border: "2px solid #e76f51" } : {})}
                  />
                  {showCustomHoursError && (
                    <p style={{ fontSize: 14, color: "#e76f51", margin: "0 0 10px" }}>
                      {wz.customHoursError || "Please enter a number between 1 and 72."}
                    </p>
                  )}
                </div>
              )}

              <label style={{ display: "block", marginBottom: 8, fontSize: 16, marginTop: 8 }}>
                {wz.firstDoseTimeLabel || "Time of first dose"}
              </label>
              <input
                type="time"
                value={wizardMedDraft.firstDoseTime || "08:00"}
                onChange={function (e) { updateWizardMedDraft({ firstDoseTime: e.target.value }); }}
                style={inputStyle}
              />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                {wz.scheduleIntervalHint || COPY.intervalScheduleHint}
              </p>
              <button type="button" style={linkStyle} onClick={function () { updateWizardMedDraft({ scheduleMode: "times" }); }}>
                {wz.useSpecificTimes || "Use specific times instead"}
              </button>
            </div>
          )}

          {wizardMedDraft.scheduleMode === "times" && (
            <div style={card}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>How many times per day?</label>
              <select
                value={wizardMedDraft.timesFrequency}
                onChange={function (e) { updateWizardMedDraft({ timesFrequency: e.target.value }); }}
                style={inputStyle}
              >
                <option value="once_daily">Once daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="three_daily">Three times daily</option>
              </select>
              {timesSlots.map(function (idx) {
                var defaults = ["08:00", "20:00", "14:00"];
                var times = wizardMedDraft.doseTimes.slice();
                while (times.length <= idx) times.push(defaults[idx] || "08:00");
                return (
                  <div key={idx}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>Dose time {idx + 1}</label>
                    <input
                      type="time"
                      value={times[idx] || "08:00"}
                      onChange={function (e) {
                        var t = wizardMedDraft.doseTimes.slice();
                        t[idx] = e.target.value;
                        updateWizardMedDraft({ doseTimes: t });
                      }}
                      style={inputStyle}
                    />
                  </div>
                );
              })}
              <button type="button" style={linkStyle} onClick={function () { updateWizardMedDraft({ scheduleMode: "interval" }); }}>
                {wz.useIntervalInstead || "Use interval instead"}
              </button>
            </div>
          )}

          <HomeBtn
            accentColor={col}
            primary
            label="Next"
            disabled={!wizardMedStep2Valid(wizardMedDraft)}
            onClick={wizardNext}
          />
        </HomeShell>
      );
    }

    // wizardScreen === 1 — medication
    var medSelectValue = wizardMedDraft.medicationIsOther
      ? "other"
      : wizardMedDraft.medicationId != null
        ? String(wizardMedDraft.medicationId)
        : "";
    return (
      <HomeShell>
        {wizardMedIndex === 1 && <HomeBack onClick={wizardBack} label="Back" />}
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{wz.medicationTitle || "Choose your medication"}</h1>
        {stepLabel && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{stepLabel}</p>}
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
          {wz.medicationHint || "Select your home infusion medication."}
        </p>
        <div style={card}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>Medication</label>
          <select
            value={medSelectValue}
            onChange={function (e) {
              var v = e.target.value;
              if (v === "other") {
                updateWizardMedDraft({
                  medicationId: null,
                  medicationIsOther: true,
                  displayName: "",
                });
              } else if (v === "") {
                updateWizardMedDraft({
                  medicationId: null,
                  medicationIsOther: false,
                  medicationOtherName: "",
                  displayName: "",
                });
              } else {
                var drug = HOME_DRUGS.find(function (d) { return String(d.id) === v; });
                updateWizardMedDraft({
                  medicationId: parseInt(v, 10),
                  medicationIsOther: false,
                  medicationOtherName: "",
                  displayName: drug ? drug.name : "",
                });
              }
            }}
            style={inputStyle}
          >
            <option value="">Select medication</option>
            {HOME_DRUGS.map(function (d) {
              return <option key={d.id} value={d.id}>{d.name} ({d.generic})</option>;
            })}
            <option value="other">Other / not listed</option>
          </select>
          {wizardMedDraft.medicationIsOther && (
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 16 }}>
                {wz.medicationOtherLabel || "Medication name"}
              </label>
              <input
                type="text"
                value={wizardMedDraft.medicationOtherName || ""}
                onChange={function (e) { updateWizardMedDraft({ medicationOtherName: e.target.value }); }}
                style={inputStyle}
              />
            </div>
          )}
        </div>
        <HomeBtn
          accentColor={col}
          primary
          label="Next"
          disabled={!wizardMedStep1Valid(wizardMedDraft)}
          onClick={wizardNext}
        />
      </HomeShell>
    );
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen === "setup") {
    var ts = treatmentSet();
    function updateTreatmentSet(mutator) {
      var next = Object.assign({}, settings);
      next.treatmentSet = Object.assign({}, treatmentSet());
      mutator(next.treatmentSet);
      setSettings(next);
    }
    function setMeds(meds) {
      updateTreatmentSet(function (t) {
        t.medications = meds.map(function (m, i) {
          return Object.assign(STORE.defaultMedication({ sortOrder: i + 1 }), m);
        });
      });
    }
    function updateMed(index, patch) {
      var meds = STORE.getTreatmentMedications(settings).slice();
      meds[index] = Object.assign({}, meds[index], patch);
      if (patch.schedule) {
        meds[index].schedule = Object.assign({}, meds[index].schedule, patch.schedule);
      }
      setMeds(meds);
    }
    function toggleDrug(drug) {
      var meds = STORE.getTreatmentMedications(settings);
      var idx = meds.findIndex(function (m) { return m.medicationId === drug.id; });
      if (idx >= 0) {
        meds = meds.filter(function (m) { return m.medicationId !== drug.id; });
      } else {
        meds = meds.concat([STORE.defaultMedication({
          medicationId: drug.id,
          displayName: drug.name,
          sortOrder: meds.length + 1,
        })]);
      }
      setMeds(meds);
    }
    function moveMed(index, dir) {
      var meds = STORE.getTreatmentMedications(settings).slice();
      var target = index + dir;
      if (target < 0 || target >= meds.length) return;
      var tmp = meds[index];
      meds[index] = meds[target];
      meds[target] = tmp;
      setMeds(meds);
    }
    function saveSetup() {
      persist(settings);
      if (window.trackCompanionScreen) {
        window.trackCompanionScreen("companion_treatment_setup_completed", "setup", { mode: "home", completed: true });
      }
      setScreen("dashboard");
    }

    var selectedMeds = STORE.getTreatmentMedications(settings);

    return (
      <HomeShell>
        <HomeBack onClick={function () { setSettings(STORE.loadSettings()); setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Treatment setup</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 12, fontSize: 16 }}>{COPY.treatmentSetupIntro}</p>
        <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20, fontSize: 15 }}>{cfg.disclaimers.general || COPY.careTeamNote}</p>

        {savedMedicationDisabled() && (
          <div style={{ ...card, borderColor: "#f4a26188" }}>
            <p style={{ margin: 0, fontSize: 16 }}>
              A medication in your treatment is not available in this app configuration. Please update your selections below.
            </p>
          </div>
        )}

        <div style={card}>
          <div style={label}>Choose the medication(s) in your treatment</div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>Each medication may have its own dose times.</p>
          {HOME_DRUGS.map(function (d) {
            var on = selectedMeds.some(function (m) { return m.medicationId === d.id; });
            return (
              <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={on} onChange={function () { toggleDrug(d); }} style={{ width: 20, height: 20 }} />
                <span>{d.name} ({d.generic})</span>
              </label>
            );
          })}
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={selectedMeds.some(function (m) { return m.medicationIsOther; })}
              onChange={function () {
                var meds = selectedMeds.filter(function (m) { return !m.medicationIsOther; });
                if (!selectedMeds.some(function (m) { return m.medicationIsOther; })) {
                  meds.push(STORE.defaultMedication({ medicationIsOther: true, sortOrder: meds.length + 1 }));
                }
                setMeds(meds);
              }}
              style={{ width: 20, height: 20 }}
            />
            <span>Other / not listed</span>
          </label>
        </div>

        {selectedMeds.map(function (med, index) {
          var mcol = medColor(med);
          var schedule = med.schedule || STORE.defaultMedication().schedule;
          var freq = schedule.frequency || "once_daily";
          var timeSlots = freq === "once_daily" || freq === "every_24_hours" || freq === "every_8_hours" || freq === "every_12_hours"
            ? [0]
            : freq === "twice_daily" ? [0, 1] : freq === "three_daily" ? [0, 1, 2] : [0];
          return (
            <div key={STORE.medKey(med) + index} style={{ ...card, borderLeft: "4px solid " + mcol }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: mcol }}>{STORE.medicationLabel(med, ALL_DRUGS)}</div>
                {selectedMeds.length > 1 && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" disabled={index === 0} onClick={function () { moveMed(index, -1); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer" }}>↑</button>
                    <button type="button" disabled={index === selectedMeds.length - 1} onClick={function () { moveMed(index, 1); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer" }}>↓</button>
                  </div>
                )}
              </div>
              {med.medicationIsOther && (
                <input
                  type="text"
                  placeholder="Enter medication name"
                  value={med.medicationOtherName || ""}
                  onChange={function (e) { updateMed(index, { medicationOtherName: e.target.value }); }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 12 }}
                />
              )}
              {selectedMeds.length > 1 && index === 0 && (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                  Put medications in the order your care team told you to give them.
                </p>
              )}
              <div style={label}>Dose frequency</div>
              <select
                value={freq}
                onChange={function (e) {
                  updateMed(index, { schedule: Object.assign({}, schedule, { frequency: e.target.value }) });
                }}
                style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 12 }}
              >
                {FREQ_OPTIONS.map(function (pair) {
                  return <option key={pair[0]} value={pair[0]}>{pair[1]}</option>;
                })}
              </select>
              {freq !== "custom" && (
                <div>
                  <div style={label}>
                    {(freq === "every_8_hours" || freq === "every_12_hours" || freq === "every_24_hours")
                      ? "First dose time"
                      : "Dose time(s)"}
                  </div>
                  {(freq === "every_8_hours" || freq === "every_12_hours" || freq === "every_24_hours") && (
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                      {COPY.intervalScheduleHint}
                    </p>
                  )}
                  {timeSlots.map(function (idx) {
                    var defaults = ["08:00", "20:00", "14:00"];
                    var times = (schedule.doseTimes || ["08:00"]).slice();
                    while (times.length <= idx) times.push(defaults[idx] || "08:00");
                    return (
                      <input
                        key={idx}
                        type="time"
                        value={times[idx] || "08:00"}
                        onChange={function (e) {
                          var t = (schedule.doseTimes || ["08:00"]).slice();
                          t[idx] = e.target.value;
                          updateMed(index, { schedule: Object.assign({}, schedule, { doseTimes: t }) });
                        }}
                        style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 8 }}
                      />
                    );
                  })}
                </div>
              )}
              {freq === "custom" && (
                <div>
                  <div style={label}>Custom schedule type</div>
                  {[
                    ["weekdays", "Specific weekdays"],
                    ["every_x_hours", "Every X hours"],
                    ["every_other_day", "Every other day"],
                  ].map(function (pair) {
                    var cs = schedule.customSchedule || {};
                    return (
                      <label key={pair[0]} style={{ display: "block", marginBottom: 8 }}>
                        <input
                          type="radio"
                          checked={(cs.type || "weekdays") === pair[0]}
                          onChange={function () {
                            updateMed(index, {
                              schedule: Object.assign({}, schedule, {
                                customSchedule: Object.assign({}, cs, { type: pair[0] }),
                              }),
                            });
                          }}
                          style={{ marginRight: 10 }}
                        />
                        {pair[1]}
                      </label>
                    );
                  })}
                  {(schedule.customSchedule || {}).type === "every_x_hours" && (
                    <div style={{ marginTop: 10 }}>
                      <div style={label}>Every how many hours?</div>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={(schedule.customSchedule || {}).intervalHours || 12}
                        onChange={function (e) {
                          var cs = schedule.customSchedule || {};
                          updateMed(index, {
                            schedule: Object.assign({}, schedule, {
                              customSchedule: Object.assign({}, cs, { intervalHours: parseInt(e.target.value, 10) || 12 }),
                            }),
                          });
                        }}
                        style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 10 }}
                      />
                    </div>
                  )}
                  {((schedule.customSchedule || {}).type || "weekdays") === "weekdays" && (
                    <div style={{ marginTop: 10 }}>
                      <div style={label}>Weekdays</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                        {STORE.WEEKDAY_LABELS.map(function (name, wi) {
                          var cs = schedule.customSchedule || {};
                          var on = (cs.weekdays || []).indexOf(wi) >= 0;
                          return (
                            <button
                              key={wi}
                              type="button"
                              onClick={function () {
                                var w = (cs.weekdays || []).slice();
                                var pos = w.indexOf(wi);
                                if (pos >= 0) w.splice(pos, 1); else w.push(wi);
                                w.sort();
                                updateMed(index, {
                                  schedule: Object.assign({}, schedule, {
                                    customSchedule: Object.assign({}, cs, { weekdays: w }),
                                  }),
                                });
                              }}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: on ? "2px solid " + mcol : "1px solid rgba(255,255,255,0.2)",
                                background: on ? mcol + "33" : "transparent",
                                color: "#fff",
                                fontSize: 14,
                                cursor: "pointer",
                              }}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="time"
                        value={(schedule.doseTimes && schedule.doseTimes[0]) || "08:00"}
                        onChange={function (e) {
                          updateMed(index, { schedule: Object.assign({}, schedule, { doseTimes: [e.target.value] }) });
                        }}
                        style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div style={{ ...label, marginTop: 12 }}>Infusion duration</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COPY.infusionDurationPresets.map(function (p) {
                  var on = med.infusionDurationMins === p.mins;
                  return (
                    <button
                      key={p.mins}
                      type="button"
                      onClick={function () { updateMed(index, { infusionDurationMins: p.mins }); }}
                      style={{
                        flex: "1 1 40%",
                        padding: 12,
                        borderRadius: 8,
                        border: on ? "2px solid " + mcol : "1px solid rgba(255,255,255,0.2)",
                        background: on ? mcol + "33" : "transparent",
                        color: "#fff",
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={card}>
          <div style={label}>Therapy dates (shared)</div>
          <div style={{ marginBottom: 10 }}>Start date</div>
          <input type="date" value={ts.course.startDate || ""} onChange={function (e) {
            updateTreatmentSet(function (t) { t.course.startDate = e.target.value; });
          }} style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={{ marginBottom: 10 }}>End date (optional)</div>
          <input type="date" value={ts.course.endDate || ""} onChange={function (e) {
            updateTreatmentSet(function (t) { t.course.endDate = e.target.value; t.course.totalPlannedDays = null; });
          }} style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={{ marginBottom: 10 }}>Or total planned days</div>
          <input type="number" min={1} placeholder="e.g. 14" value={ts.course.totalPlannedDays || ""} onChange={function (e) {
            var v = e.target.value ? parseInt(e.target.value, 10) : null;
            updateTreatmentSet(function (t) {
              t.course.totalPlannedDays = v;
              if (v) t.course.endDate = "";
            });
          }} style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }} />
        </div>

        <HomeBtn accentColor={col} primary label="Save treatment setup" onClick={saveSetup} />
      </HomeShell>
    );
  }

  // ── GAME CHOOSER ───────────────────────────────────────────────────────────
  if (screen === "gameChooser") {
    var chooserMeds = STORE.getTreatmentMedications(settings);
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Which medication would you like to play?</h1>
        {chooserMeds.map(function (med) {
          var mcol = medColor(med);
          return (
            <HomeBtn
              key={STORE.medKey(med)}
              accentColor={mcol}
              label={STORE.medicationLabel(med, ALL_DRUGS)}
              onClick={function () { launchGameForMedication(med); }}
            />
          );
        })}
        {chooserMeds.length > 1 && (
          <HomeBtn
            accentColor={col}
            label="Surprise me"
            onClick={function () {
              var pick = chooserMeds[Math.floor(Math.random() * chooserMeds.length)];
              launchGameForMedication(pick);
            }}
          />
        )}
      </HomeShell>
    );
  }

  // ── SASH / DOSE WALKTHROUGH ────────────────────────────────────────────────
  if (screen === "sash") {
    if (!isModule("sashGuide")) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setScreen("dashboard"); }} />
          <p style={{ color: "rgba(255,255,255,0.65)" }}>The dose walkthrough is not available in this app configuration.</p>
        </HomeShell>
      );
    }

    var dueForSession = sessionDoses.length
      ? sessionDoses
      : activeSession
        ? STORE.dueDosesFromSession(activeSession, settings)
        : STORE.getDueMedicationDosesForNow(settings);
    var session = activeSession || STORE.createActiveSession(dueForSession);
    var steps = STORE.buildDoseSessionSteps(dueForSession, settings, COPY);
    var step = steps[sashStep] || steps[0];
    var progress = steps.length ? (sashStep + 1) / steps.length : 0;
    var stepTimer = step && step.medicationKey && activeTimer && activeTimer.medicationId === step.medicationKey
      ? activeTimer
      : null;
    void tick;

    function saveStepIndex(nextIndex) {
      var updated = Object.assign({}, session, { stepIndex: nextIndex });
      persistSession(updated);
      setSashStep(nextIndex);
    }

    function advanceStep() {
      if (sashStep < steps.length - 1) saveStepIndex(sashStep + 1);
      else setScreen("dashboard");
    }

    function startStepTimer() {
      if (!step || !step.medicationKey) return;
      var t = STORE.startInfusionTimerForMedication(settings, step.medicationKey, step.scheduledFor || null);
      setSettings(STORE.loadSettings());
      if (window.trackCompanionScreen) {
        window.trackCompanionScreen("companion_infusion_timer_started", "sash", {
          mode: "home",
          duration_bucket: window.dosecraftCompanionDurationBucket
            ? window.dosecraftCompanionDurationBucket(t.durationMins)
            : undefined,
        });
      }
      if (step.type === "start_infusion") {
        var infusionIdx = steps.findIndex(function (s) {
          return s.type === "infusion" && s.medicationKey === step.medicationKey && s.scheduledFor === step.scheduledFor;
        });
        if (infusionIdx >= 0) saveStepIndex(infusionIdx);
      }
    }

    function markStepMedicationComplete() {
      if (!step || !step.medicationKey) return;
      var dose = dueForSession.find(function (d) {
        return STORE.medKey(d.medication) === step.medicationKey
          && d.scheduledFor.toISOString() === step.scheduledFor;
      });
      if (dose) {
        session = STORE.markMedicationDoseComplete(session, dose);
        persistSession(session);
      }
      STORE.completeInfusionTimer(settings);
      setSettings(STORE.loadSettings());
      if (window.trackCompanionScreen) {
        window.trackCompanionScreen("companion_infusion_timer_completed", "sash", {
          mode: "home",
          duration_bucket: window.dosecraftCompanionDurationBucket
            ? window.dosecraftCompanionDurationBucket(stepTimer ? stepTimer.durationMins : 30)
            : undefined,
        });
      }
      advanceStep();
    }

    function finishSession() {
      var completed = (session.completedDoseKeys || []).map(function (key) {
        var parts = key.split("|");
        var medKeyPart = parts[0];
        var sched = parts.slice(1).join("|");
        var dose = dueForSession.find(function (d) {
          return STORE.medKey(d.medication) === medKeyPart && d.scheduledFor.toISOString() === sched;
        });
        return {
          medicationId: medKeyPart,
          scheduledFor: sched,
          durationMins: dose ? (dose.medication.infusionDurationMins || 30) : null,
        };
      });
      if (completed.length) {
        if (window.trackCompanionScreen) {
          window.trackCompanionScreen("companion_dose_session_completed", "sash", { mode: "home", completed: true });
        }
        STORE.logDoseSessionComplete(completed, {
          scheduledFor: dueForSession[0] ? dueForSession[0].scheduledFor.toISOString() : null,
        });
      }
      STORE.cancelInfusionTimer(settings);
      STORE.clearActiveSession();
      setActiveSession(null);
      setSettings(STORE.loadSettings());
      setSashStep(0);
      setSessionDoses([]);
      setSessionChecklist(false);
      setScreen("dashboard");
    }

    function handlePrimaryAction() {
      if (!step) return;
      if (step.action === "continue" || step.action === "confirm") {
        advanceStep();
        return;
      }
      if (step.action === "start_timer") {
        startStepTimer();
        return;
      }
      if (step.action === "mark_med_complete") {
        markStepMedicationComplete();
        return;
      }
      if (step.action === "finish_session") {
        finishSession();
      }
    }

    var primaryLabel = step ? step.actionLabel : "Continue";
    var primaryDisabled = false;

    if (!steps.length) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setScreen("dashboard"); }} label="Dashboard" />
          <p style={{ color: "rgba(255,255,255,0.65)" }}>No medications are due for a dose session right now.</p>
        </HomeShell>
      );
    }

    if (sessionChecklist) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setSessionChecklist(false); }} label="Guided session" />
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>All session steps</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{COPY.multiMedSafetyNote}</p>
          {steps.map(function (s, i) {
            var done = i < sashStep;
            if (s.type === "infusion" && s.medicationKey && s.scheduledFor) {
              done = (session.completedDoseKeys || []).indexOf(s.medicationKey + "|" + s.scheduledFor) >= 0;
            }
            return (
              <div key={s.id} style={{
                ...card,
                opacity: done ? 0.65 : 1,
                borderLeft: done ? "4px solid " + col : "4px solid rgba(255,255,255,0.15)",
              }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
                  Step {i + 1}{s.letter ? " · " + s.letter : ""}{done ? " · Done" : ""}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</div>
              </div>
            );
          })}
        </HomeShell>
      );
    }

    return (
      <HomeShell>
        <HomeBack onClick={function () { setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Dose session</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{COPY.sashIntro}</p>
        {dueForSession.length > 1 && (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>
            This session: {STORE.formatDueMedicationList(dueForSession, ALL_DRUGS)}
          </p>
        )}
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{COPY.multiMedSafetyNote}</p>

        <button
          type="button"
          onClick={function () { setSessionChecklist(true); }}
          style={{
            background: "transparent",
            border: "none",
            color: col,
            fontSize: 15,
            padding: "0 0 12px",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          View all steps
        </button>

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 8, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: Math.round(progress * 100) + "%", height: "100%", background: col, transition: "width 0.3s" }} />
        </div>

        <div style={{ ...card, borderColor: col + "55" }}>
          {step.letter && (
            <div style={{ fontSize: 13, color: col, fontWeight: 700, marginBottom: 6 }}>{step.letter}</div>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{step.title}</h2>
          <p style={{ margin: 0, fontSize: 17, color: "rgba(255,255,255,0.88)" }}>{step.body}</p>

          {step.type === "infusion" && (
            <SessionInfusionCard
              timer={stepTimer}
              store={STORE}
              copy={COPY}
              accentColor={col}
              medicationName={step.medicationName}
              tick={tick}
              onPlayGame={function () {
                var med = STORE.findMedicationByKey(settings, step.medicationKey);
                launchGameForMedication(med);
              }}
              onMedInfo={function () { openMedInfo(step.medicationKey); }}
              onLineCare={function () { goToScreen("lineCare"); }}
              onWarnings={function () { goToScreen("warnings"); }}
            />
          )}
        </div>

        <HomeBtn
          accentColor={col}
          primary
          disabled={primaryDisabled}
          label={primaryLabel}
          onClick={handlePrimaryAction}
        />

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Step {sashStep + 1} of {steps.length}
        </p>
        <CareTeamContact variant="help" accentColor={col} showEmergency={false} />
      </HomeShell>
    );
  }

  // ── WARNING SIGNS ──────────────────────────────────────────────────────────
  if (screen === "warnings") {
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Warning signs</h1>
        <div style={card}>
          <div style={{ ...label, color: "#f4a261" }}>Call your care team if</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {COPY.warningSigns.callClinic.map(function (item, i) {
              return <li key={i} style={{ marginBottom: 8 }}>{item}</li>;
            })}
          </ul>
        </div>
        <div style={card}>
          <div style={{ ...label, color: "#e76f51" }}>Seek urgent or emergency care if</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {COPY.warningSigns.seekUrgent.map(function (item, i) {
              return <li key={i} style={{ marginBottom: 8 }}>{item}</li>;
            })}
          </ul>
        </div>
        <CareTeamContact variant="full" accentColor={col} />
      </HomeShell>
    );
  }

  // ── LINE CARE ──────────────────────────────────────────────────────────────
  if (screen === "lineCare") {
    if (!isModule("lineCare")) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setScreen("dashboard"); }} />
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Line care information is not available in this app configuration.</p>
        </HomeShell>
      );
    }
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Line care</h1>
        <div style={card}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {COPY.lineCare.map(function (item, i) {
              return <li key={i} style={{ marginBottom: 10 }}>{item}</li>;
            })}
          </ul>
        </div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>{cfg.disclaimers.lineCare || COPY.careTeamNote}</p>
      </HomeShell>
    );
  }

  // ── MEDICATION INFO ────────────────────────────────────────────────────────
  if (screen === "medInfo") {
    if (!isModule("medicationEducation")) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setScreen("dashboard"); }} />
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Medication education is not available in this app configuration.</p>
        </HomeShell>
      );
    }
    var infoMeds = STORE.getTreatmentMedications(settings);
    var focusKey = medInfoKey || (activeTimer && activeTimer.medicationId) || (infoMeds[0] ? STORE.medKey(infoMeds[0]) : null);
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setMedInfoKey(null); setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>About your medication(s)</h1>
        <div style={card}>
          <p style={{ margin: 0, fontSize: 16 }}>Call your care team if you have questions, side effects, or concerns about your treatment.</p>
        </div>
        {infoMeds.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {infoMeds.map(function (med) {
              var key = STORE.medKey(med);
              var on = key === focusKey;
              return (
                <button
                  key={key}
                  onClick={function () { setMedInfoKey(key); }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: on ? "2px solid " + medColor(med) : "1px solid rgba(255,255,255,0.2)",
                    background: on ? medColor(med) + "33" : "transparent",
                    color: "#fff",
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  {STORE.medicationLabel(med, ALL_DRUGS)}
                </button>
              );
            })}
          </div>
        )}
        {infoMeds.filter(function (med) { return !focusKey || STORE.medKey(med) === focusKey; }).map(function (med) {
          var drug = med.medicationId != null ? ALL_DRUGS.find(function (x) { return x.id === med.medicationId; }) : null;
          return (
            <MedicationEducationPanel
              key={STORE.medKey(med)}
              med={med}
              drug={drug}
              getEd={getEd}
              accentColor={medColor(med)}
              cardStyle={card}
              labelStyle={label}
              store={STORE}
              allDrugs={ALL_DRUGS}
            />
          );
        })}
        <CareTeamContact variant="full" accentColor={col} />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>{cfg.disclaimers.medication}</p>
        {focusKey && isModule("infusionArcade") && (
          <HomeBtn
            accentColor={col}
            primary
            label="Learn what this medication is doing (play game)"
            onClick={function () {
              var med = STORE.findMedicationByKey(settings, focusKey);
              launchGameForMedication(med);
            }}
          />
        )}
      </HomeShell>
    );
  }

  // ── APPOINTMENT EDIT ───────────────────────────────────────────────────────
  if (screen === "appointment") {
    if (!isModule("appointmentReminders")) {
      return (
        <HomeShell>
          <HomeBack onClick={function () { setScreen("dashboard"); }} />
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Appointment reminders are not available in this app configuration.</p>
        </HomeShell>
      );
    }
    var apptTs = treatmentSet();
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Lab / follow-up visit</h1>
        <div style={card}>
          <div style={label}>Next visit date</div>
          <input type="date" value={apptTs.appointment.nextPickupDate || ""}
            onChange={function (e) {
              var next = Object.assign({}, settings);
              next.treatmentSet = Object.assign({}, treatmentSet());
              next.treatmentSet.appointment = Object.assign({}, next.treatmentSet.appointment, { nextPickupDate: e.target.value });
              persist(next);
            }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={label}>Repeat schedule</div>
          <select value={apptTs.appointment.frequency || "weekly"}
            onChange={function (e) {
              var next = Object.assign({}, settings);
              next.treatmentSet = Object.assign({}, treatmentSet());
              next.treatmentSet.appointment = Object.assign({}, next.treatmentSet.appointment, { frequency: e.target.value });
              persist(next);
            }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}>
            <option value="weekly">Weekly</option>
            <option value="twice_weekly">Twice weekly</option>
            <option value="three_weekly">Three times weekly</option>
            <option value="custom">Custom (days)</option>
          </select>
        </div>
        <CareTeamContact variant="compact" accentColor={col} />
        <HomeBtn accentColor={col} primary label="Save" onClick={function () { setScreen("dashboard"); }} />
      </HomeShell>
    );
  }

  // ── ADDITIONAL SETTINGS ────────────────────────────────────────────────────
  if (screen === "additionalSettings") {
    var addTs = treatmentSet();
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          {(COPY.wizard && COPY.wizard.additionalSettingsTitle) || "Additional settings"}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
          Line care, visit reminders, and notifications shared across your treatment.
        </p>

        <div style={card}>
          <div style={label}>Line type</div>
          {[["picc", "PICC"], ["midline", "Midline"], ["port", "Port"], ["other", "Other"]].map(function (pair) {
            return (
              <label key={pair[0]} style={{ display: "block", marginBottom: 8 }}>
                <input
                  type="radio"
                  checked={(addTs.lineCare.accessType || "picc") === pair[0]}
                  onChange={function () {
                    var next = Object.assign({}, settings);
                    next.treatmentSet = Object.assign({}, treatmentSet());
                    next.treatmentSet.lineCare = Object.assign({}, next.treatmentSet.lineCare, { accessType: pair[0] });
                    persist(next);
                  }}
                  style={{ marginRight: 10 }}
                />
                {pair[1]}
              </label>
            );
          })}
        </div>

        <div style={card}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!addTs.lineCare.heparinOrdered}
              onChange={function (e) {
                var next = Object.assign({}, settings);
                next.treatmentSet = Object.assign({}, treatmentSet());
                next.treatmentSet.lineCare = Object.assign({}, next.treatmentSet.lineCare, { heparinOrdered: e.target.checked });
                persist(next);
              }}
              style={{ marginTop: 4 }}
            />
            <span>Use heparin flush (only if your care team prescribed it)</span>
          </label>
        </div>

        {isModule("appointmentReminders") && (
          <div style={card}>
            <div style={label}>Next lab / follow-up visit</div>
            <input
              type="date"
              value={addTs.appointment.nextPickupDate || ""}
              onChange={function (e) {
                var next = Object.assign({}, settings);
                next.treatmentSet = Object.assign({}, treatmentSet());
                next.treatmentSet.appointment = Object.assign({}, next.treatmentSet.appointment, { nextPickupDate: e.target.value });
                persist(next);
              }}
              style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 12 }}
            />
            <div style={label}>Then repeat</div>
            <select
              value={addTs.appointment.frequency || "weekly"}
              onChange={function (e) {
                var next = Object.assign({}, settings);
                next.treatmentSet = Object.assign({}, treatmentSet());
                next.treatmentSet.appointment = Object.assign({}, next.treatmentSet.appointment, { frequency: e.target.value });
                persist(next);
              }}
              style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
            >
              <option value="weekly">Weekly</option>
              <option value="twice_weekly">Twice weekly</option>
              <option value="three_weekly">Three times weekly</option>
              <option value="custom">Custom interval (days)</option>
            </select>
            {addTs.appointment.frequency === "custom" && (
              <input
                type="number"
                min={1}
                placeholder="Days between visits"
                value={addTs.appointment.customIntervalDays || 7}
                onChange={function (e) {
                  var next = Object.assign({}, settings);
                  next.treatmentSet = Object.assign({}, treatmentSet());
                  next.treatmentSet.appointment = Object.assign({}, next.treatmentSet.appointment, {
                    customIntervalDays: parseInt(e.target.value, 10) || 7,
                  });
                  persist(next);
                }}
                style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginTop: 10 }}
              />
            )}
          </div>
        )}

        <div style={card}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input
              type="checkbox"
              checked={!!addTs.remindersEnabled}
              onChange={function (e) {
                var next = Object.assign({}, settings);
                next.treatmentSet = Object.assign({}, treatmentSet());
                next.treatmentSet.remindersEnabled = e.target.checked;
                persist(next);
              }}
              style={{ marginTop: 4 }}
            />
            <span>Enable dose reminders (browser notifications — coming soon)</span>
          </label>
        </div>

        <HomeBtn accentColor={col} primary label="Done" onClick={function () { setScreen("dashboard"); }} />
      </HomeShell>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  var dayInfo = STORE.getTreatmentDayInfo(settings);
  var apptDate = isModule("appointmentReminders") ? STORE.getNextAppointmentDate(settings) : "";
  var treatmentMeds = STORE.getTreatmentMedications(settings);
  var dueNow = STORE.getDueMedicationDosesForNow(settings);
  var nextSummary = STORE.formatNextDueSummary(settings, ALL_DRUGS);
  var todaySummary = STORE.formatTodayDosesSummary(settings, ALL_DRUGS);

  return (
    <HomeShell>
      {renderGlobalTimerBanner()}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Dosecraft</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 0" }}>{cfg.clinicDisplayName || "Home infusion"}</h1>
        </div>
        <button onClick={function () { setScreen("setup"); }} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
          Edit setup
        </button>
      </div>

      {!STORE.isSetupComplete(settings) && (
        <div style={{ ...card, borderColor: "#f4a26188" }}>
          <p style={{ margin: 0 }}>Complete treatment setup to see your schedule and next dose.</p>
          <HomeBtn accentColor={col} primary label="Set up treatment" onClick={function () { setScreen("setupWizard"); }} />
        </div>
      )}

      {savedMedicationDisabled() && (
        <div style={{ ...card, borderColor: "#f4a26188" }}>
          <p style={{ margin: "0 0 12px", fontSize: 16 }}>
            A medication in your treatment is not available in this app. Please update your treatment setup.
          </p>
          <HomeBtn accentColor={col} primary label="Update treatment" onClick={function () { setScreen("setup"); }} />
        </div>
      )}

      <div style={{ ...card, borderLeft: "4px solid " + col }}>
        <div style={label}>Your treatment</div>
        {treatmentMeds.length ? treatmentMeds.map(function (med) {
          return (
            <div key={STORE.medKey(med)} style={{ marginBottom: treatmentMeds.length > 1 ? 10 : 0 }}>
              <div style={{ fontSize: treatmentMeds.length > 1 ? 20 : 24, fontWeight: 800, color: medColor(med) }}>
                {STORE.medicationLabel(med, ALL_DRUGS)}
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                {STORE.medicationFrequencyLabel(med)}
              </div>
            </div>
          );
        }) : (
          <div style={{ fontSize: 24, fontWeight: 800, color: col }}>Not set</div>
        )}
      </div>

      {STORE.isSetupComplete(settings) && (
        <div style={card}>
          <div style={label}>Next due</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{nextSummary}</div>
          <div style={label}>Today&apos;s remaining doses</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>{todaySummary}</div>
          {(dayInfo.calendarDay || dayInfo.dosesCompleted > 0) && (
            <div style={{ marginTop: 12, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
              {dayInfo.calendarDay && dayInfo.totalDays && (
                <div>Treatment day {dayInfo.calendarDay} of {dayInfo.totalDays}</div>
              )}
              {dayInfo.calendarDay && !dayInfo.totalDays && (
                <div>Treatment day {dayInfo.calendarDay}</div>
              )}
              <div>{dayInfo.dosesCompleted} dose{dayInfo.dosesCompleted === 1 ? "" : "s"} completed</div>
            </div>
          )}
        </div>
      )}

      {isModule("appointmentReminders") && apptDate && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={label}>Next lab / visit</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{new Date(apptDate + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
            </div>
            <button onClick={function () { goToScreen("appointment"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
              Edit
            </button>
          </div>
        </div>
      )}
      {isModule("appointmentReminders") && !apptDate && STORE.isSetupComplete(settings) && (
        <div style={card}>
          <div style={label}>Next lab / visit</div>
          <p style={{ margin: "0 0 10px", fontSize: 15, color: "rgba(255,255,255,0.55)" }}>No visit scheduled yet.</p>
          <HomeBtn accentColor={col} label="Add visit date" onClick={function () { goToScreen("appointment"); }} />
        </div>
      )}

      <CareTeamContact variant="full" accentColor={col} />

      <div style={{ marginTop: 8 }}>
        <div style={label}>Quick actions</div>
        {isModule("sashGuide") && (
          <HomeBtn accentColor={col} primary label="Start dose session" onClick={function () {
            var due = STORE.getDueMedicationDosesForNow(settings);
            if (!due.length) {
              var next = STORE.getNextDueMedicationDose(settings);
              due = next ? [next] : [];
            }
            if (!due.length) return;
            startDoseSession(due);
          }} />
        )}
        <HomeBtn accentColor={col} label="Warning signs" onClick={function () { goToScreen("warnings"); }} />
        {isModule("medicationEducation") && (
          <HomeBtn accentColor={col} label="Medication info" onClick={function () { setMedInfoKey(null); goToScreen("medInfo"); }} />
        )}
        {isModule("lineCare") && (
          <HomeBtn accentColor={col} label="Line care" onClick={function () { goToScreen("lineCare"); }} />
        )}
        <HomeBtn accentColor={col} label="Additional settings" onClick={function () { goToScreen("additionalSettings"); }} />
        {isModule("infusionArcade") && (
          <HomeBtn
            accentColor={col}
            label={activeTimer && !STORE.isTimerComplete(activeTimer)
              ? "Play the " + (activeTimer.medicationName || "medication") + " game while this infusion runs"
              : STORE.hasMultipleTreatmentMedications(settings) ? "Play a medication game" : "Play game"}
            onClick={goPlayGame}
          />
        )}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {isModule("clinicInfusion") && (
          <HomeBtn accentColor={col} label="Switch to clinic infusion mode" onClick={goClinicMode} />
        )}
        {cfg.branding.showPoweredByDosecraft !== false && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "8px 0 0" }}>
            IVIG and in-clinic infusions · SharpRX Interactive
          </p>
        )}
        {cfg.disclaimers.privacyAnalytics && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
            {cfg.disclaimers.privacyAnalytics}
          </p>
        )}
      </div>
    </HomeShell>
  );
}

function HomeModeSelector(props) {
  var STORE = window.DOSECRAFT_HOME_STORE;
  var isModule = window.DOSECRAFT_isModuleEnabled;
  var cfg = window.DOSECRAFT_getClinicConfig();
  var page = {
    minHeight: "100vh",
    background: "linear-gradient(165deg, #0a1628 0%, #0d1f2d 100%)",
    color: "#f5f8fc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  };
  function choose(mode) {
    STORE.setPatientMode(mode);
    if (mode === "home") {
      window.location.href = "index.html";
    } else {
      window.location.href = "game.html";
    }
  }
  return (
    <div style={page}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>DOSECRAFT</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>How will you use Dosecraft?</h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", marginBottom: 28, lineHeight: 1.6 }}>
          You can change this later. {cfg.disclaimers.general}
        </p>
        {isModule("homeInfusion") && (
        <button onClick={function () { choose("home"); }} style={{
          display: "block", width: "100%", minHeight: 56, marginBottom: 14, padding: 16,
          borderRadius: 14, border: "none", background: "#2a9d8f", color: "#041018",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
        }}>
          Home infusion companion
          <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4, opacity: 0.85 }}>Antibiotic doses at home · SASH · dose tracking</div>
        </button>
        )}
        {isModule("clinicInfusion") && (
        <button onClick={function () { choose("clinic"); }} style={{
          display: "block", width: "100%", minHeight: 56, padding: 16,
          borderRadius: 14, border: "2px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)", color: "#f5f8fc",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
        }}>
          Clinic infusion mode
          <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4, opacity: 0.75 }}>IVIG / in-clinic timer · optional games</div>
        </button>
        )}
        {!isModule("homeInfusion") && !isModule("clinicInfusion") && (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>No infusion modes are enabled for this clinic configuration.</p>
        )}
      </div>
    </div>
  );
}
