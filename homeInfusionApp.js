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

function CompactTimerBanner(props) {
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

var REMINDER_LEAD_OPTIONS = [
  [15, "15 minutes"],
  [30, "30 minutes"],
  [60, "60 minutes"],
  [90, "90 minutes"],
];

var REMINDER_SCHEDULE_DAYS = 7;
var activeReminderTimeouts = [];

function isStandalonePwa() {
  try {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator && window.navigator.standalone === true) return true;
  } catch (e) {}
  return false;
}

function getNotificationPermission() {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission || "default";
  } catch (e) {
    return "unsupported";
  }
}

function postReminderToServiceWorker(payload) {
  if (!("serviceWorker" in navigator)) return;
  var message = Object.assign({ type: "SHOW_REMINDER" }, payload);
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return;
  }
  navigator.serviceWorker.ready.then(function (reg) {
    var sw = reg.active || reg.installing || reg.waiting;
    if (sw) sw.postMessage(message);
  }).catch(function () {});
}

function fireReminderNotification(STORE, tag, reminderType, leadMinutes) {
  var prefs = STORE.loadReminderPrefs();
  if (!prefs.enabled) return;
  if (getNotificationPermission() !== "granted") return;

  var title = "Dosecraft — Dose Reminder";
  var body;
  if (reminderType === "headsup") {
    body = "Your infusion dose is coming up in " + leadMinutes + " minutes. If your medication is refrigerated, now is a good time to take it out so it can warm up before your infusion.";
  } else {
    body = "Your infusion dose is due now. Open Dosecraft to start your session.";
  }

  postReminderToServiceWorker({ tag: tag, title: title, body: body });
}

function registerReminderTimeout(STORE, tag, fireTime, reminderType, leadMinutes) {
  var delay = fireTime - Date.now();
  if (delay <= 0) return;
  var id = setTimeout(function () {
    fireReminderNotification(STORE, tag, reminderType, leadMinutes);
  }, delay);
  activeReminderTimeouts.push(id);
}

function clearActiveReminderTimeouts() {
  for (var i = 0; i < activeReminderTimeouts.length; i++) {
    clearTimeout(activeReminderTimeouts[i]);
  }
  activeReminderTimeouts = [];
}

function collectUpcomingDosesForReminders(STORE, settings) {
  var now = new Date();
  var cutoff = now.getTime() + REMINDER_SCHEDULE_DAYS * 24 * 60 * 60 * 1000;
  var seen = {};
  var doses = [];

  function addDose(dose) {
    if (!dose || !dose.scheduledFor) return;
    var t = dose.scheduledFor.getTime();
    if (t <= now.getTime()) return;
    if (t > cutoff) return;
    var key = String(t);
    if (seen[key]) return;
    seen[key] = true;
    doses.push(dose);
  }

  STORE.getTodayMedicationDoses(settings, now).forEach(addDose);

  var meds = STORE.getTreatmentMedications(settings);
  meds.forEach(function (med) {
    var cursor = now;
    var safety = 0;
    while (safety < 200) {
      safety += 1;
      var next = STORE.getNextDoseForMedication(settings, med, cursor);
      if (!next) break;
      if (next.scheduledFor.getTime() > cutoff) break;
      addDose(next);
      cursor = new Date(next.scheduledFor.getTime() + 60000);
    }
  });

  doses.sort(function (a, b) {
    return a.scheduledFor - b.scheduledFor;
  });
  return doses;
}

function resumePendingReminders(STORE) {
  clearActiveReminderTimeouts();
  var list = STORE.loadScheduledNotifications();
  var now = Date.now();
  var remaining = [];
  var prefs = STORE.loadReminderPrefs();

  if (!prefs.enabled || getNotificationPermission() !== "granted") {
    STORE.saveScheduledNotifications([]);
    return;
  }

  list.forEach(function (entry) {
    if (!entry || !entry.fireTime || entry.fireTime <= now) return;
    remaining.push(entry);
    var leadMinutes = prefs.leadMinutes || 60;
    registerReminderTimeout(STORE, entry.tag, entry.fireTime, entry.type, leadMinutes);
  });

  STORE.saveScheduledNotifications(remaining);
}

function scheduleDoseReminders(STORE, settings, prefs) {
  clearActiveReminderTimeouts();
  var doses = collectUpcomingDosesForReminders(STORE, settings);
  var scheduled = [];
  var now = Date.now();
  var leadMs = (prefs.leadMinutes || 60) * 60000;

  doses.forEach(function (dose) {
    var scheduledFor = dose.scheduledFor.getTime();
    var isoTs = dose.scheduledFor.toISOString();

    var headsUpTime = scheduledFor - leadMs;
    if (headsUpTime > now) {
      var headsTag = "dc-reminder-headsup-" + isoTs;
      registerReminderTimeout(STORE, headsTag, headsUpTime, "headsup", prefs.leadMinutes || 60);
      scheduled.push({ tag: headsTag, fireTime: headsUpTime, type: "headsup" });
    }

    if (prefs.atTimeEnabled !== false && scheduledFor > now) {
      var attimeTag = "dc-reminder-attime-" + isoTs;
      registerReminderTimeout(STORE, attimeTag, scheduledFor, "attime", 0);
      scheduled.push({ tag: attimeTag, fireTime: scheduledFor, type: "attime" });
    }
  });

  STORE.saveScheduledNotifications(scheduled);
  STORE.saveReminderPrefs(prefs);
  return scheduled.length;
}

function reminderAnalyticsProps(prefs) {
  return {
    mode: "home",
    lead_minutes_bucket: String(prefs.leadMinutes || 60),
    at_time_enabled: prefs.atTimeEnabled !== false,
  };
}

function PwaInstallSetupCard(props) {
  var col = props.accentColor || "#2a9d8f";
  if (props.standalone) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "12px 14px",
        marginTop: 14,
        marginBottom: 14,
      }}
    >
      <p style={{ margin: "0 0 12px", fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
        For the most reliable reminders, add Dosecraft to your home screen. Tap the share button in your browser and select &apos;Add to Home Screen,&apos; or use the button below if available.
      </p>
      {props.installPromptReady && (
        <button
          type="button"
          onClick={props.onInstall}
          style={{
            display: "block",
            width: "100%",
            minHeight: 52,
            padding: "14px 20px",
            borderRadius: 12,
            border: "none",
            background: col,
            color: "#041018",
            fontSize: 17,
            fontWeight: 700,
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          Add to Home Screen
        </button>
      )}
    </div>
  );
}

function DashboardInstallCard(props) {
  if (props.standalone || props.dismissed) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "12px 14px",
        marginTop: 16,
        marginBottom: 8,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={props.onDismiss}
        aria-label="Dismiss install prompt"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          fontSize: 18,
          lineHeight: 1,
          minWidth: 52,
          minHeight: 52,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ×
      </button>
      <p style={{ margin: "0 32px 10px 0", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>
        Add Dosecraft to your home screen for the best experience.
      </p>
      {props.installPromptReady && (
        <button
          type="button"
          onClick={props.onInstall}
          style={{
            display: "block",
            width: "100%",
            minHeight: 52,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.65)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          Add to Home Screen
        </button>
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

  var _reminderPrefs = _useState(function () { return STORE.loadReminderPrefs(); });
  var reminderPrefs = _reminderPrefs[0], setReminderPrefs = _reminderPrefs[1];

  var _reminderPanelOpen = _useState(function () { return !!STORE.loadReminderPrefs().enabled; });
  var reminderPanelOpen = _reminderPanelOpen[0], setReminderPanelOpen = _reminderPanelOpen[1];

  var _permissionBlockedMsg = _useState("");
  var permissionBlockedMsg = _permissionBlockedMsg[0], setPermissionBlockedMsg = _permissionBlockedMsg[1];

  var _installPromptReady = _useState(false);
  var installPromptReady = _installPromptReady[0], setInstallPromptReady = _installPromptReady[1];

  var _installDismissed = _useState(function () { return STORE.isInstallPromptDismissed(); });
  var installDismissed = _installDismissed[0], setInstallDismissed = _installDismissed[1];

  var _settingsConfirm = _useState(null);
  var settingsConfirm = _settingsConfirm[0], setSettingsConfirm = _settingsConfirm[1];

  var installPromptEventRef = _useRef(null);
  var standalonePwa = isStandalonePwa();

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

  _useEffect(function () {
    resumePendingReminders(STORE);
  }, []);

  _useEffect(function () {
    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      installPromptEventRef.current = e;
      setInstallPromptReady(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return function () {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  _useEffect(function () {
    if (getNotificationPermission() === "denied") {
      setPermissionBlockedMsg("Notifications are blocked in your browser settings.");
      setReminderPanelOpen(false);
      setReminderPrefs(function (prev) {
        var next = Object.assign({}, prev, { enabled: false, permissionGranted: false });
        STORE.saveReminderPrefs(next);
        return next;
      });
    }
  }, []);

  function handlePwaInstallClick() {
    var evt = installPromptEventRef.current;
    if (!evt || !evt.prompt) return;
    evt.prompt();
    if (evt.userChoice && evt.userChoice.then) {
      evt.userChoice.then(function () {
        installPromptEventRef.current = null;
        setInstallPromptReady(false);
      });
    }
  }

  function dismissDashboardInstallPrompt() {
    STORE.setInstallPromptDismissed();
    setInstallDismissed(true);
  }

  function handleReminderToggleChange(checked) {
    if (getNotificationPermission() === "denied") return;

    if (!checked) {
      setReminderPanelOpen(false);
      var offPrefs = Object.assign({}, reminderPrefs, {
        enabled: false,
        permissionGranted: getNotificationPermission() === "granted",
      });
      setReminderPrefs(offPrefs);
      STORE.saveReminderPrefs(offPrefs);
      STORE.saveScheduledNotifications([]);
      clearActiveReminderTimeouts();
      setPermissionBlockedMsg("");
      return;
    }

    setReminderPanelOpen(true);

    if (typeof Notification === "undefined" || !Notification.requestPermission) {
      setReminderPanelOpen(false);
      setPermissionBlockedMsg("Notifications are not supported in this browser.");
      return;
    }

    if (getNotificationPermission() === "granted") {
      var alreadyGrantedPrefs = Object.assign({}, reminderPrefs, {
        enabled: true,
        permissionGranted: true,
      });
      setReminderPrefs(alreadyGrantedPrefs);
      STORE.saveReminderPrefs(alreadyGrantedPrefs);
      setPermissionBlockedMsg("");
      if (window.trackCompanionScreen) {
        window.trackCompanionScreen("reminder_enabled", "additional_settings", reminderAnalyticsProps(alreadyGrantedPrefs));
      }
      return;
    }

    Notification.requestPermission().then(function (result) {
      if (result === "granted") {
        var onPrefs = Object.assign({}, reminderPrefs, {
          enabled: true,
          permissionGranted: true,
        });
        setReminderPrefs(onPrefs);
        STORE.saveReminderPrefs(onPrefs);
        setPermissionBlockedMsg("");
        if (window.trackCompanionScreen) {
          window.trackCompanionScreen("reminder_enabled", "additional_settings", reminderAnalyticsProps(onPrefs));
        }
      } else {
        setReminderPanelOpen(false);
        var deniedPrefs = Object.assign({}, reminderPrefs, {
          enabled: false,
          permissionGranted: false,
        });
        setReminderPrefs(deniedPrefs);
        STORE.saveReminderPrefs(deniedPrefs);
        setPermissionBlockedMsg("Notifications are blocked. Please allow notifications for Dosecraft in your browser or device settings.");
      }
    });
  }

  function handleScheduleReminders() {
    var prefs = Object.assign({}, reminderPrefs, {
      enabled: true,
      permissionGranted: getNotificationPermission() === "granted",
    });
    scheduleDoseReminders(STORE, settings, prefs);
    setReminderPrefs(prefs);
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("reminder_scheduled", "additional_settings", reminderAnalyticsProps(prefs));
    }
  }

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
    STORE.setLastUsedExperience("clinic");
    window.location.href = "game.html";
  }

  function switchExperience() {
    STORE.openExperiencePicker();
  }

  function executeResetCompanionSetup() {
    STORE.resetCompanionSetup();
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("companion_setup_reset", "settings", { mode: "home" });
    }
    var fresh = STORE.loadSettings();
    setSettings(fresh);
    setWizardDraft(defaultWizardDraft(STORE));
    setWizardMedDraft(defaultWizardMedDraft());
    setActiveSession(null);
    setSettingsConfirm(null);
    setScreen("setupWizard");
  }

  function executeClearAllData() {
    STORE.clearAllDosecraftData();
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("local_device_data_cleared", "settings", { mode: "home" });
    }
    window.location.href = "index.html";
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

  // ── APP SETTINGS (experience + data controls) ─────────────────────────────
  if (screen === "appSettings") {
    var confirmCopy = settingsConfirm === "companion"
      ? "This will clear your saved Companion treatment setup on this device. It will not contact your clinic or change your treatment."
      : settingsConfirm === "all"
        ? "This clears Dosecraft data saved on this device. It will not contact your clinic or change your treatment."
        : "";
    return (
      <HomeShell>
        {renderGlobalTimerBanner()}
        <HomeBack onClick={function () { setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Settings</h1>

        <div style={{ marginBottom: 20 }}>
          <div style={label}>Experience</div>
          <HomeBtn accentColor={col} label="Switch experience" onClick={switchExperience} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={label}>Companion</div>
          <HomeBtn accentColor={col} label="Reset Companion setup" onClick={function () { setSettingsConfirm("companion"); }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={label}>Device data</div>
          <HomeBtn accentColor={col} label="Clear Dosecraft data from this device" onClick={function () { setSettingsConfirm("all"); }} />
        </div>

        {settingsConfirm && (
          <div style={Object.assign({}, card, { border: "1px solid rgba(255,180,80,0.35)" })}>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 16px", color: "rgba(255,255,255,0.85)" }}>
              {confirmCopy}
            </p>
            <HomeBtn
              accentColor={col}
              primary
              label={settingsConfirm === "companion" ? "Reset Companion setup" : "Clear data"}
              onClick={settingsConfirm === "companion" ? executeResetCompanionSetup : executeClearAllData}
            />
            <HomeBtn accentColor={col} label="Cancel" onClick={function () { setSettingsConfirm(null); }} />
          </div>
        )}
      </HomeShell>
    );
  }

  // ── ADDITIONAL SETTINGS ────────────────────────────────────────────────────
  if (screen === "additionalSettings") {
    var addTs = treatmentSet();
    var addNotifPerm = getNotificationPermission();
    var addPermDenied = addNotifPerm === "denied";
    var addRemindersOn = !!reminderPrefs.enabled && !addPermDenied;
    var addShowReminderPanel = reminderPanelOpen && !addPermDenied;
    var addPermissionGranted = addNotifPerm === "granted";
    var addSchedulableDoses = collectUpcomingDosesForReminders(STORE, settings);
    var addCanSchedule = addRemindersOn && addPermissionGranted && addSchedulableDoses.length > 0;
    var addBlockedText = permissionBlockedMsg || (addPermDenied ? "Notifications are blocked in your browser settings." : "");
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

        {isModule("doseReminders") && STORE.isSetupComplete(settings) && (
          <div style={card}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: addPermDenied ? "default" : "pointer" }}>
              <input
                type="checkbox"
                checked={addShowReminderPanel}
                disabled={addPermDenied}
                onChange={function (e) { handleReminderToggleChange(e.target.checked); }}
                style={{ marginTop: 4, minWidth: 20, minHeight: 20 }}
              />
              <span>Dose reminders</span>
            </label>

            {addBlockedText && (
              <p style={{ margin: "10px 0 0", fontSize: 15, color: "rgba(255,255,255,0.75)" }} role="alert">
                {addBlockedText}
              </p>
            )}

            {addShowReminderPanel && (
              <div style={{ marginTop: 16 }}>
                <PwaInstallSetupCard
                  standalone={standalonePwa}
                  installPromptReady={installPromptReady}
                  onInstall={handlePwaInstallClick}
                  accentColor={col}
                />

                {addPermissionGranted && (
                  <div>
                <div style={label}>Heads-up reminder</div>
                <select
                  value={String(reminderPrefs.leadMinutes || 60)}
                  onChange={function (e) {
                    var next = Object.assign({}, reminderPrefs, { leadMinutes: parseInt(e.target.value, 10) });
                    setReminderPrefs(next);
                    STORE.saveReminderPrefs(next);
                  }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }}
                >
                  {REMINDER_LEAD_OPTIONS.map(function (pair) {
                    return <option key={pair[0]} value={String(pair[0])}>{pair[1]}</option>;
                  })}
                </select>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14 }}>
                  <input
                    type="checkbox"
                    checked={reminderPrefs.atTimeEnabled !== false}
                    onChange={function (e) {
                      var next = Object.assign({}, reminderPrefs, { atTimeEnabled: e.target.checked });
                      setReminderPrefs(next);
                      STORE.saveReminderPrefs(next);
                    }}
                    style={{ marginTop: 4, minWidth: 20, minHeight: 20 }}
                  />
                  <span>Reminder at dose time</span>
                </label>

                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    Reminders work best when Dosecraft is installed on your home screen and your device allows background activity. If you change your dose schedule, turn reminders off and back on to update them.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScheduleReminders}
                  disabled={!addCanSchedule}
                  style={{
                    display: "block",
                    width: "100%",
                    minHeight: 52,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: addCanSchedule ? col : "rgba(255,255,255,0.08)",
                    color: addCanSchedule ? "#041018" : "rgba(255,255,255,0.45)",
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: addCanSchedule ? "pointer" : "default",
                    opacity: addCanSchedule ? 1 : 0.6,
                    touchAction: "manipulation",
                  }}
                >
                  {addSchedulableDoses.length === 0 ? "No doses scheduled yet." : "Schedule reminders"}
                </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
        <HomeBtn accentColor={col} label="Settings" onClick={function () { goToScreen("appSettings"); }} />
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
        {STORE.isSetupComplete(settings) && !standalonePwa && !installDismissed && (
          <DashboardInstallCard
            standalone={standalonePwa}
            dismissed={installDismissed}
            installPromptReady={installPromptReady}
            onInstall={handlePwaInstallClick}
            onDismiss={dismissDashboardInstallPrompt}
          />
        )}
        {isModule("clinicInfusion") && isModule("homeInfusion") && (
          <HomeBtn accentColor={col} label="Switch experience" onClick={switchExperience} />
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

var LANDING_SCREEN_STYLES = [
  ":root {",
  "  --dc-deep-night: #070A12;",
  "  --dc-warm-ink: #120D08;",
  "  --dc-glow-warm: #1E140A;",
  "  --dc-amber: #F4B942;",
  "  --dc-soft-gold: #FFD66B;",
  "  --dc-teal: #56D6C9;",
  "  --dc-text-primary: #FFF7DF;",
  "  --dc-text-secondary: #D8CDAF;",
  "  --dc-text-muted: #9E9277;",
  "  --dc-surface: rgba(255, 247, 223, 0.06);",
  "  --dc-surface-strong: rgba(255, 247, 223, 0.10);",
  "  --dc-border-soft: rgba(255, 214, 107, 0.22);",
  "  --dc-border-active: rgba(255, 214, 107, 0.48);",
  "}",
  ".dc-landing {",
  "  min-height: 100vh;",
  "  min-height: 100dvh;",
  "  display: flex;",
  "  flex-direction: column;",
  "  align-items: center;",
  "  justify-content: center;",
  "  padding: max(20px, env(safe-area-inset-top)) 20px max(16px, env(safe-area-inset-bottom));",
  "  background:",
  "    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244, 185, 66, 0.08) 0%, transparent 55%),",
  "    linear-gradient(175deg, var(--dc-deep-night) 0%, var(--dc-warm-ink) 55%, var(--dc-glow-warm) 100%);",
  "  color: var(--dc-text-primary);",
  "  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;",
  "  -webkit-font-smoothing: antialiased;",
  "}",
  ".dc-landing__inner {",
  "  width: 100%;",
  "  max-width: 420px;",
  "  display: flex;",
  "  flex-direction: column;",
  "  gap: 22px;",
  "}",
  ".dc-landing__brand {",
  "  text-align: center;",
  "}",
  ".dc-landing__title {",
  "  font-size: clamp(2rem, 7vw, 2.35rem);",
  "  font-weight: 800;",
  "  letter-spacing: 0.02em;",
  "  line-height: 1.1;",
  "  margin: 0 0 8px;",
  "  color: var(--dc-text-primary);",
  "}",
  ".dc-landing__subtitle {",
  "  font-size: clamp(1rem, 3.8vw, 1.125rem);",
  "  font-weight: 500;",
  "  line-height: 1.45;",
  "  margin: 0 0 6px;",
  "  color: var(--dc-text-secondary);",
  "}",
  ".dc-landing__tagline {",
  "  font-size: clamp(0.875rem, 3.2vw, 0.9375rem);",
  "  line-height: 1.45;",
  "  margin: 0;",
  "  color: var(--dc-text-muted);",
  "}",
  ".dc-landing__modes {",
  "  display: flex;",
  "  flex-direction: column;",
  "  gap: 14px;",
  "}",
  ".dc-landing__card {",
  "  display: block;",
  "  width: 100%;",
  "  text-align: left;",
  "  padding: 20px 18px 18px;",
  "  border-radius: 16px;",
  "  border: 1px solid var(--dc-border-soft);",
  "  background: var(--dc-surface);",
  "  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 247, 223, 0.04);",
  "  backdrop-filter: blur(10px);",
  "  -webkit-backdrop-filter: blur(10px);",
  "  cursor: pointer;",
  "  touch-action: manipulation;",
  "  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;",
  "  font-family: inherit;",
  "  color: inherit;",
  "}",
  ".dc-landing__card:hover {",
  "  background: var(--dc-surface-strong);",
  "  border-color: rgba(255, 214, 107, 0.32);",
  "  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 247, 223, 0.06);",
  "}",
  ".dc-landing__card:focus {",
  "  outline: none;",
  "}",
  ".dc-landing__card:focus-visible {",
  "  outline: 2px solid var(--dc-border-active);",
  "  outline-offset: 3px;",
  "  border-color: var(--dc-border-active);",
  "  box-shadow: 0 0 0 4px rgba(244, 185, 66, 0.10);",
  "}",
  ".dc-landing__card-title {",
  "  font-size: clamp(1.125rem, 4.2vw, 1.25rem);",
  "  font-weight: 700;",
  "  line-height: 1.3;",
  "  margin: 0 0 6px;",
  "  color: var(--dc-text-primary);",
  "}",
  ".dc-landing__card-text {",
  "  font-size: clamp(0.9375rem, 3.5vw, 1rem);",
  "  line-height: 1.5;",
  "  margin: 0 0 16px;",
  "  color: var(--dc-text-secondary);",
  "}",
  ".dc-landing__card-action {",
  "  display: flex;",
  "  align-items: center;",
  "  justify-content: center;",
  "  width: 100%;",
  "  min-height: 46px;",
  "  padding: 11px 18px;",
  "  border-radius: 10px;",
  "  border: none;",
  "  background: linear-gradient(135deg, var(--dc-amber) 0%, var(--dc-soft-gold) 100%);",
  "  color: #1A1208;",
  "  font-size: clamp(0.9375rem, 3.5vw, 1rem);",
  "  font-weight: 700;",
  "  letter-spacing: 0.01em;",
  "  pointer-events: none;",
  "}",
  ".dc-landing__support {",
  "  text-align: center;",
  "}",
  ".dc-landing__reassurance {",
  "  font-size: clamp(0.875rem, 3.2vw, 0.9375rem);",
  "  line-height: 1.55;",
  "  margin: 0 0 10px;",
  "  color: var(--dc-text-secondary);",
  "}",
  ".dc-landing__disclaimer {",
  "  font-size: clamp(0.8125rem, 3vw, 0.875rem);",
  "  line-height: 1.5;",
  "  margin: 0 0 14px;",
  "  color: var(--dc-text-muted);",
  "}",
  ".dc-landing__footer-brand {",
  "  font-size: 0.6875rem;",
  "  font-weight: 600;",
  "  letter-spacing: 0.22em;",
  "  text-transform: uppercase;",
  "  margin: 0;",
  "  color: var(--dc-text-muted);",
  "  opacity: 0.75;",
  "}",
  ".dc-landing__empty {",
  "  text-align: center;",
  "  font-size: 0.9375rem;",
  "  line-height: 1.5;",
  "  color: var(--dc-text-muted);",
  "  margin: 0;",
  "}",
].join("\n");

function HomeModeSelector(props) {
  var STORE = window.DOSECRAFT_HOME_STORE;
  var isModule = window.DOSECRAFT_isModuleEnabled;
  var hasHome = isModule("homeInfusion");
  var hasClinic = isModule("clinicInfusion");
  var switchOnly = props.switchOnly || STORE.isExperiencePickerRequested();
  function choose(mode) {
    STORE.setLastUsedExperience(mode);
    if (window.trackCompanionScreen) {
      window.trackCompanionScreen("app_experience_switched", switchOnly ? "switch" : "picker", {
        mode: mode === "home" ? "home" : "clinic",
      });
    }
    if (mode === "home") {
      window.location.href = "index.html";
    } else {
      window.location.href = "game.html";
    }
  }
  if (switchOnly) {
    var switchPage = {
      minHeight: "100dvh",
      background: "linear-gradient(165deg, #0a1628 0%, #0d1f2d 100%)",
      color: "#f5f8fc",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
    };
    return (
      <div style={switchPage}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
            What would you like to use today?
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.5 }}>
            You can switch anytime.
          </p>
          {hasHome && (
            <button onClick={function () { choose("home"); }} style={{
              display: "block", width: "100%", minHeight: 52, marginBottom: 12, padding: "14px 20px",
              borderRadius: 12, border: "none", background: "#F4B942", color: "#1A1208",
              fontSize: 17, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
            }}>
              Home Infusion Companion
            </button>
          )}
          {hasClinic && (
            <button onClick={function () { choose("clinic"); }} style={{
              display: "block", width: "100%", minHeight: 52, padding: "14px 20px",
              borderRadius: 12, border: "none", background: "#F4B942", color: "#1A1208",
              fontSize: 17, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
            }}>
              Infusion Arcade
            </button>
          )}
          {!hasHome && !hasClinic && (
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
              No infusion modes are enabled for this clinic configuration.
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: LANDING_SCREEN_STYLES }} />
      <div className="dc-landing">
        <div className="dc-landing__inner">
          <header className="dc-landing__brand">
            <h1 className="dc-landing__title">Dosecraft</h1>
            <p className="dc-landing__subtitle">Interactive support for infusion therapy</p>
            <p className="dc-landing__tagline">Understand your therapy. One dose at a time.</p>
          </header>

          <div className="dc-landing__modes">
            {hasClinic && (
              <button
                type="button"
                className="dc-landing__card"
                onClick={function () { choose("clinic"); }}
              >
                <h2 className="dc-landing__card-title">Clinic Mode</h2>
                <p className="dc-landing__card-text">
                  Play a short interactive experience that shows what your infusion medication is doing.
                </p>
                <span className="dc-landing__card-action">Start Clinic Mode</span>
              </button>
            )}
            {hasHome && (
              <button
                type="button"
                className="dc-landing__card"
                onClick={function () { choose("home"); }}
              >
                <h2 className="dc-landing__card-title">Home Infusion Companion</h2>
                <p className="dc-landing__card-text">
                  Follow step-by-step dose support, reminders, and home infusion guidance.
                </p>
                <span className="dc-landing__card-action">Start Home Companion</span>
              </button>
            )}
            {!hasHome && !hasClinic && (
              <p className="dc-landing__empty">No infusion modes are enabled for this clinic configuration.</p>
            )}
          </div>

          <footer className="dc-landing__support">
            <p className="dc-landing__reassurance">
              Designed to support patient understanding during infusion and home therapy.
            </p>
            <p className="dc-landing__disclaimer">
              Dosecraft is an educational companion and does not replace instructions from your care team.
            </p>
            <p className="dc-landing__footer-brand">SHARPRX INTERACTIVE</p>
          </footer>
        </div>
      </div>
    </React.Fragment>
  );
}
