// Home Infusion Mode — React UI (loaded via Babel on index.html)
function HomeInfusionApp() {
  var STORE = window.DOSECRAFT_HOME_STORE;
  var COPY = window.DOSECRAFT_HOME_COPY;
  var ALL_DRUGS = window.DOSECRAFT_DRUGS || [];
  var HOME_DRUGS = STORE.homeAntibioticDrugs(ALL_DRUGS);
  var getEd = window.DOSECRAFT_getPatientEducation;

  var _useState = React.useState;
  var _useEffect = React.useEffect;

  var _screen = _useState(function () {
    return STORE.isSetupComplete(STORE.loadSettings()) ? "dashboard" : "setup";
  });
  var screen = _screen[0], setScreen = _screen[1];

  var _settings = _useState(STORE.loadSettings());
  var settings = _settings[0], setSettings = _settings[1];

  var _tick = _useState(0);
  var tick = _tick[0], setTick = _tick[1];

  var _sashStep = _useState(0);
  var sashStep = _sashStep[0], setSashStep = _sashStep[1];

  var _checked = _useState({});
  var checked = _checked[0], setChecked = _checked[1];

  var _timer = _useState(STORE.loadDoseTimer());
  var doseTimer = _timer[0], setDoseTimer = _timer[1];

  _useEffect(function () {
    var id = setInterval(function () { setTick(function (t) { return t + 1; }); }, 1000);
    return function () { clearInterval(id); };
  }, []);

  function persist(next) {
    setSettings(next);
    STORE.saveSettings(next);
  }

  function medColor() {
    var d = STORE.getMedicationDrug(settings, ALL_DRUGS);
    return d ? d.color : "#2a9d8f";
  }

  var col = medColor();
  var page = {
    minHeight: "100vh",
    background: "linear-gradient(165deg, #0a1628 0%, #0d1f2d 100%)",
    color: "#f5f8fc",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: 18,
    lineHeight: 1.55,
    padding: "20px 16px 40px",
  };
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

  function Btn(props) {
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
          background: primary ? col : "rgba(255,255,255,0.08)",
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

  function Back(props) {
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

  function Shell(props) {
    return (
      <div style={page}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>{props.children}</div>
      </div>
    );
  }

  function getVisibleSashSteps() {
    return COPY.sashSteps.filter(function (s) {
      if (s.conditionalHeparin && !settings.heparinEnabled) return false;
      return true;
    });
  }

  function goPlayGame() {
    var d = STORE.getMedicationDrug(settings, ALL_DRUGS);
    if (d) {
      window.location.href = "game.html?drug=" + encodeURIComponent(d.name) + "&return=home";
    } else {
      window.location.href = "game.html?return=home";
    }
  }

  function goClinicMode() {
    window.location.href = "game.html";
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen === "setup") {
    var draft = settings;
    function setField(key, val) {
      var next = Object.assign({}, draft);
      next[key] = val;
      draft = next;
      setSettings(next);
    }
    function setNested(parent, key, val) {
      var next = Object.assign({}, draft);
      next[parent] = Object.assign({}, next[parent]);
      next[parent][key] = val;
      draft = next;
      setSettings(next);
    }
    function toggleWeekday(d) {
      var cs = Object.assign({}, draft.customSchedule);
      var w = cs.weekdays.slice();
      var i = w.indexOf(d);
      if (i >= 0) w.splice(i, 1); else w.push(d);
      w.sort();
      cs.weekdays = w;
      setField("customSchedule", cs);
    }
    function saveSetup() {
      persist(settings);
      setScreen("dashboard");
    }

    return (
      <Shell>
        <Back onClick={function () { if (STORE.isSetupComplete(STORE.loadSettings())) setScreen("dashboard"); }} label="Dashboard" />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Treatment setup</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 20, fontSize: 16 }}>{COPY.careTeamNote}</p>

        <div style={card}>
          <div style={label}>Medication</div>
          <select
            value={settings.medicationId != null ? String(settings.medicationId) : settings.medicationIsOther ? "other" : ""}
            onChange={function (e) {
              var v = e.target.value;
              if (v === "other") {
                setField("medicationId", null);
                setField("medicationIsOther", true);
              } else if (v === "") {
                setField("medicationId", null);
                setField("medicationOtherName", "");
                setField("medicationIsOther", false);
              } else {
                setField("medicationId", parseInt(v, 10));
                setField("medicationOtherName", "");
                setField("medicationIsOther", false);
              }
            }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 10 }}
          >
            <option value="">Select medication</option>
            {HOME_DRUGS.map(function (d) {
              return <option key={d.id} value={d.id}>{d.name} ({d.generic})</option>;
            })}
            <option value="other">Other / not listed</option>
          </select>
          {settings.medicationIsOther && (
            <input
              type="text"
              placeholder="Enter medication name"
              value={settings.medicationOtherName || ""}
              onChange={function (e) { setField("medicationOtherName", e.target.value); }}
              style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
            />
          )}
        </div>

        <div style={card}>
          <div style={label}>Dose frequency</div>
          {[
            ["once_daily", "Once daily"],
            ["twice_daily", "Twice daily"],
            ["three_daily", "Three times daily"],
            ["custom", "Custom schedule"],
          ].map(function (pair) {
            return (
              <label key={pair[0]} style={{ display: "block", marginBottom: 10, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="freq"
                  checked={settings.doseFrequency === pair[0]}
                  onChange={function () { setField("doseFrequency", pair[0]); }}
                  style={{ marginRight: 10 }}
                />
                {pair[1]}
              </label>
            );
          })}
        </div>

        {settings.doseFrequency !== "custom" && (
          <div style={card}>
            <div style={label}>Dose times</div>
            {(settings.doseFrequency === "once_daily" ? [0] : settings.doseFrequency === "twice_daily" ? [0, 1] : [0, 1, 2]).map(function (idx) {
              var defaults = ["08:00", "20:00", "14:00"];
              var times = settings.doseTimes.slice();
              while (times.length <= idx) times.push(defaults[idx] || "08:00");
              return (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <input
                    type="time"
                    value={times[idx] || "08:00"}
                    onChange={function (e) {
                      var t = settings.doseTimes.slice();
                      t[idx] = e.target.value;
                      setField("doseTimes", t);
                    }}
                    style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {settings.doseFrequency === "custom" && (
          <div style={card}>
            <div style={label}>Custom schedule type</div>
            {[
              ["weekdays", "Specific weekdays"],
              ["every_x_hours", "Every X hours"],
              ["every_other_day", "Every other day"],
            ].map(function (pair) {
              return (
                <label key={pair[0]} style={{ display: "block", marginBottom: 10 }}>
                  <input
                    type="radio"
                    checked={(settings.customSchedule.type || "weekdays") === pair[0]}
                    onChange={function () {
                      var cs = Object.assign({}, settings.customSchedule, { type: pair[0] });
                      setField("customSchedule", cs);
                    }}
                    style={{ marginRight: 10 }}
                  />
                  {pair[1]}
                </label>
              );
            })}
            {(settings.customSchedule.type || "weekdays") === "every_x_hours" && (
              <div style={{ marginTop: 12 }}>
                <div style={label}>Every how many hours?</div>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.customSchedule.intervalHours || 12}
                  onChange={function (e) {
                    var cs = Object.assign({}, settings.customSchedule, { intervalHours: parseInt(e.target.value, 10) || 12 });
                    setField("customSchedule", cs);
                  }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 10 }}
                />
                <div style={label}>Anchor date & time (first dose reference)</div>
                <input
                  type="datetime-local"
                  value={settings.customSchedule.anchorDateTime || ""}
                  onChange={function (e) {
                    var cs = Object.assign({}, settings.customSchedule, { anchorDateTime: e.target.value });
                    setField("customSchedule", cs);
                  }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
                />
              </div>
            )}
            {(settings.customSchedule.type || "weekdays") === "weekdays" && (
              <div style={{ marginTop: 12 }}>
                <div style={label}>Weekdays</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STORE.WEEKDAY_LABELS.map(function (name, i) {
                    var on = (settings.customSchedule.weekdays || []).indexOf(i) >= 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={function () { toggleWeekday(i); }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: on ? "2px solid " + col : "1px solid rgba(255,255,255,0.2)",
                          background: on ? col + "33" : "transparent",
                          color: "#fff",
                          fontSize: 15,
                          cursor: "pointer",
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div style={{ ...label, marginTop: 14 }}>Time on those days</div>
                <input
                  type="time"
                  value={(settings.doseTimes && settings.doseTimes[0]) || "08:00"}
                  onChange={function (e) { setField("doseTimes", [e.target.value]); }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
                />
              </div>
            )}
            {settings.customSchedule.type === "every_other_day" && (
              <div style={{ marginTop: 12 }}>
                <div style={label}>Starting date</div>
                <input
                  type="date"
                  value={settings.therapyStartDate || ""}
                  onChange={function (e) { setField("therapyStartDate", e.target.value); }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 10 }}
                />
                <input
                  type="time"
                  value={(settings.doseTimes && settings.doseTimes[0]) || "08:00"}
                  onChange={function (e) { setField("doseTimes", [e.target.value]); }}
                  style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}
                />
              </div>
            )}
          </div>
        )}

        <div style={card}>
          <div style={label}>Infusion duration</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COPY.infusionDurationPresets.map(function (p) {
              var on = settings.infusionDurationMins === p.mins;
              return (
                <button
                  key={p.mins}
                  type="button"
                  onClick={function () { setField("infusionDurationMins", p.mins); }}
                  style={{
                    flex: "1 1 40%",
                    padding: 12,
                    borderRadius: 8,
                    border: on ? "2px solid " + col : "1px solid rgba(255,255,255,0.2)",
                    background: on ? col + "33" : "transparent",
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

        <div style={card}>
          <div style={label}>Therapy dates</div>
          <div style={{ marginBottom: 10 }}>Start date</div>
          <input type="date" value={settings.therapyStartDate || ""} onChange={function (e) { setField("therapyStartDate", e.target.value); }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={{ marginBottom: 10 }}>End date (optional)</div>
          <input type="date" value={settings.therapyEndDate || ""} onChange={function (e) { setField("therapyEndDate", e.target.value); setField("totalPlannedDays", null); }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={{ marginBottom: 10 }}>Or total planned days</div>
          <input type="number" min={1} placeholder="e.g. 14" value={settings.totalPlannedDays || ""} onChange={function (e) {
            var v = e.target.value ? parseInt(e.target.value, 10) : null;
            setField("totalPlannedDays", v);
            if (v) setField("therapyEndDate", "");
          }} style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }} />
        </div>

        <div style={card}>
          <div style={label}>Line type</div>
          {[["picc", "PICC"], ["midline", "Midline"], ["port", "Port"], ["other", "Other"]].map(function (pair) {
            return (
              <label key={pair[0]} style={{ display: "block", marginBottom: 8 }}>
                <input type="radio" checked={settings.lineType === pair[0]} onChange={function () { setField("lineType", pair[0]); }} style={{ marginRight: 10 }} />
                {pair[1]}
              </label>
            );
          })}
        </div>

        <div style={card}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={settings.heparinEnabled} onChange={function (e) { setField("heparinEnabled", e.target.checked); }} style={{ marginTop: 4 }} />
            <span>Use heparin flush (only if your care team prescribed it)</span>
          </label>
        </div>

        <div style={card}>
          <div style={label}>Next lab / follow-up visit</div>
          <input type="date" value={settings.appointmentSchedule.nextAppointmentDate || ""}
            onChange={function (e) { setNested("appointmentSchedule", "nextAppointmentDate", e.target.value); }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 12 }} />
          <div style={label}>Then repeat</div>
          <select value={settings.appointmentSchedule.frequency || "weekly"} onChange={function (e) { setNested("appointmentSchedule", "frequency", e.target.value); }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}>
            <option value="weekly">Weekly</option>
            <option value="twice_weekly">Twice weekly</option>
            <option value="three_weekly">Three times weekly</option>
            <option value="custom">Custom interval (days)</option>
          </select>
          {settings.appointmentSchedule.frequency === "custom" && (
            <input type="number" min={1} placeholder="Days between visits" value={settings.appointmentSchedule.customIntervalDays || 7}
              onChange={function (e) { setNested("appointmentSchedule", "customIntervalDays", parseInt(e.target.value, 10) || 7); }}
              style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginTop: 10 }} />
          )}
        </div>

        <div style={card}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input type="checkbox" checked={settings.remindersEnabled} onChange={function (e) { setField("remindersEnabled", e.target.checked); }} style={{ marginTop: 4 }} />
            <span>Enable dose reminders (browser notifications — coming soon)</span>
          </label>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 8, marginBottom: 0 }}>
            TODO: Browser notification permission and scheduling not yet implemented.
          </p>
        </div>

        <Btn primary label="Save treatment setup" onClick={saveSetup} />
      </Shell>
    );
  }

  // ── SASH ───────────────────────────────────────────────────────────────────
  if (screen === "sash") {
    var steps = getVisibleSashSteps();
    var step = steps[sashStep] || steps[0];
    var progress = (sashStep + 1) / steps.length;
    var timerPct = doseTimer ? STORE.getDoseTimerProgress(doseTimer) : 0;
    var timerDone = doseTimer && STORE.isDoseTimerComplete(doseTimer);

    function toggleCheck(id) {
      setChecked(function (c) {
        var n = Object.assign({}, c);
        n[id] = !n[id];
        return n;
      });
    }

    function nextSash() {
      if (step.hasTimer && doseTimer && !timerDone) return;
      if (sashStep < steps.length - 1) setSashStep(sashStep + 1);
      else setScreen("dashboard");
    }

    function startHomeTimer() {
      var t = {
        startTime: Date.now(),
        durationMins: settings.infusionDurationMins || 30,
        scheduledFor: STORE.getNextScheduledDose(settings) ? STORE.getNextScheduledDose(settings).toISOString() : null,
      };
      STORE.saveDoseTimer(t);
      setDoseTimer(t);
    }

    if (step.id === "log_dose" && checked.log_dose) {
      // auto-log when they check and continue
    }

    return (
      <Shell>
        <Back onClick={function () { setScreen("dashboard"); setSashStep(0); setChecked({}); }} label="Dashboard" />
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>SASH guide</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>{COPY.sashIntro}</p>

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 8, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: Math.round(progress * 100) + "%", height: "100%", background: col, transition: "width 0.3s" }} />
        </div>

        <div style={{ ...card, borderColor: col + "55" }}>
          {step.letter && (
            <div style={{ fontSize: 13, color: col, fontWeight: 700, marginBottom: 6 }}>SASH — {step.letter}</div>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{step.title}</h2>
          <p style={{ margin: 0, fontSize: 17, color: "rgba(255,255,255,0.88)" }}>{step.body}</p>

          {step.hasTimer && (
            <div style={{ marginTop: 18 }}>
              {!doseTimer && <Btn primary label="Start infusion timer" onClick={startHomeTimer} />}
              {doseTimer && (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: col, textAlign: "center", marginBottom: 8 }}>
                    {Math.round(timerPct * 100)}%
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 12, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: Math.round(timerPct * 100) + "%", height: "100%", background: col }} />
                  </div>
                  <p style={{ textAlign: "center", fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                    {timerDone ? "Timer complete" : "Infusion in progress — " + (settings.infusionDurationMins || 30) + " min dose"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, ...card, cursor: "pointer" }}>
          <input type="checkbox" checked={!!checked[step.id]} onChange={function () { toggleCheck(step.id); }} style={{ width: 22, height: 22, marginTop: 2 }} />
          <span>I completed this step (or followed my care team's version)</span>
        </label>

        <Btn
          primary
          disabled={!checked[step.id] || (step.hasTimer && doseTimer && !timerDone)}
          label={step.id === "log_dose" ? "Mark dose complete & finish" : "Next step →"}
          onClick={function () {
            if (step.id === "log_dose") {
              STORE.logDoseComplete(
                doseTimer && doseTimer.scheduledFor,
                settings.infusionDurationMins
              );
              STORE.clearDoseTimer();
              setDoseTimer(null);
              setSashStep(0);
              setChecked({});
              setScreen("dashboard");
            } else {
              nextSash();
            }
          }}
        />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Step {sashStep + 1} of {steps.length}
        </p>
      </Shell>
    );
  }

  // ── WARNING SIGNS ──────────────────────────────────────────────────────────
  if (screen === "warnings") {
    return (
      <Shell>
        <Back onClick={function () { setScreen("dashboard"); }} />
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
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{COPY.disclaimer}</p>
      </Shell>
    );
  }

  // ── LINE CARE ──────────────────────────────────────────────────────────────
  if (screen === "lineCare") {
    return (
      <Shell>
        <Back onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Line care</h1>
        <div style={card}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {COPY.lineCare.map(function (item, i) {
              return <li key={i} style={{ marginBottom: 10 }}>{item}</li>;
            })}
          </ul>
        </div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>{COPY.careTeamNote}</p>
      </Shell>
    );
  }

  // ── MEDICATION INFO ────────────────────────────────────────────────────────
  if (screen === "medInfo") {
    var drug = STORE.getMedicationDrug(settings, ALL_DRUGS);
    var ed = drug ? getEd(drug) : getEd(null);
    return (
      <Shell>
        <Back onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: col }}>
          {STORE.getMedicationDisplay(settings, ALL_DRUGS)}
        </h1>
        {drug && <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>{drug.generic}</p>}

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
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>{ed.disclaimer || COPY.disclaimer}</p>
        {drug && <Btn primary label="Learn what this medication is doing (play game)" onClick={goPlayGame} />}
      </Shell>
    );
  }

  // ── APPOINTMENT EDIT ───────────────────────────────────────────────────────
  if (screen === "appointment") {
    return (
      <Shell>
        <Back onClick={function () { setScreen("dashboard"); }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Lab / follow-up visit</h1>
        <div style={card}>
          <div style={label}>Next visit date</div>
          <input type="date" value={settings.appointmentSchedule.nextAppointmentDate || ""}
            onChange={function (e) {
              var next = Object.assign({}, settings);
              next.appointmentSchedule = Object.assign({}, next.appointmentSchedule, { nextAppointmentDate: e.target.value });
              persist(next);
            }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8, marginBottom: 14 }} />
          <div style={label}>Repeat schedule</div>
          <select value={settings.appointmentSchedule.frequency || "weekly"}
            onChange={function (e) {
              var next = Object.assign({}, settings);
              next.appointmentSchedule = Object.assign({}, next.appointmentSchedule, { frequency: e.target.value });
              persist(next);
            }}
            style={{ width: "100%", padding: 12, fontSize: 17, borderRadius: 8 }}>
            <option value="weekly">Weekly</option>
            <option value="twice_weekly">Twice weekly</option>
            <option value="three_weekly">Three times weekly</option>
            <option value="custom">Custom (days)</option>
          </select>
        </div>
        <Btn primary label="Save" onClick={function () { setScreen("dashboard"); }} />
      </Shell>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  var dayInfo = STORE.getTreatmentDayInfo(settings);
  var apptDate = STORE.getNextAppointmentDate(settings);
  void tick;

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Dosecraft</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 0" }}>Home infusion</h1>
        </div>
        <button onClick={function () { setScreen("setup"); }} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
          Edit setup
        </button>
      </div>

      {!STORE.isSetupComplete(settings) && (
        <div style={{ ...card, borderColor: "#f4a26188" }}>
          <p style={{ margin: 0 }}>Complete treatment setup to see your schedule and next dose.</p>
          <Btn primary label="Set up treatment" onClick={function () { setScreen("setup"); }} />
        </div>
      )}

      <div style={{ ...card, borderLeft: "4px solid " + col }}>
        <div style={label}>Current medication</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: col }}>{STORE.getMedicationDisplay(settings, ALL_DRUGS)}</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>{STORE.frequencyLabel(settings)}</div>
      </div>

      {STORE.isSetupComplete(settings) && (
        <div style={card}>
          <div style={label}>Next scheduled dose</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{STORE.formatNextDose(settings)}</div>
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

      {apptDate && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={label}>Next lab / visit</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{new Date(apptDate + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
            </div>
            <button onClick={function () { setScreen("appointment"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
              Edit
            </button>
          </div>
        </div>
      )}
      {!apptDate && STORE.isSetupComplete(settings) && (
        <div style={card}>
          <div style={label}>Next lab / visit</div>
          <p style={{ margin: "0 0 10px", fontSize: 15, color: "rgba(255,255,255,0.55)" }}>No visit scheduled yet.</p>
          <Btn label="Add visit date" onClick={function () { setScreen("appointment"); }} />
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <div style={label}>Quick actions</div>
        <Btn primary label="Start dose (SASH guide)" onClick={function () { setSashStep(0); setChecked({}); setDoseTimer(STORE.loadDoseTimer()); setScreen("sash"); }} />
        <Btn label="Warning signs" onClick={function () { setScreen("warnings"); }} />
        <Btn label="Medication info" onClick={function () { setScreen("medInfo"); }} />
        <Btn label="Line care" onClick={function () { setScreen("lineCare"); }} />
        <Btn label="Play game" onClick={goPlayGame} />
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <Btn label="Switch to clinic infusion mode" onClick={goClinicMode} />
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", margin: 0 }}>
          IVIG and in-clinic infusions · SharpRX Interactive
        </p>
      </div>
    </Shell>
  );
}

function HomeModeSelector(props) {
  var STORE = window.DOSECRAFT_HOME_STORE;
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
          You can change this later. Follow your care team's instructions for your actual treatment.
        </p>
        <button onClick={function () { choose("home"); }} style={{
          display: "block", width: "100%", minHeight: 56, marginBottom: 14, padding: 16,
          borderRadius: 14, border: "none", background: "#2a9d8f", color: "#041018",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
        }}>
          Home infusion companion
          <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4, opacity: 0.85 }}>Antibiotic doses at home · SASH · dose tracking</div>
        </button>
        <button onClick={function () { choose("clinic"); }} style={{
          display: "block", width: "100%", minHeight: 56, padding: 16,
          borderRadius: 14, border: "2px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)", color: "#f5f8fc",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
        }}>
          Clinic infusion mode
          <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4, opacity: 0.75 }}>IVIG / in-clinic timer · optional games</div>
        </button>
      </div>
    </div>
  );
}
