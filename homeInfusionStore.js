// Home Infusion Mode — local settings, dose log, and schedule math.
(function () {
  var SETTINGS_KEY = "dc_home_settings";
  var DOSE_LOG_KEY = "dc_home_dose_log";
  var DOSE_TIMER_KEY = "dc_home_dose_timer";
  var MODE_KEY = "dc_patient_mode";
  var MODE_SEEN_KEY = "dc_mode_choice_seen";

  var WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  }

  function defaultSettings() {
    return {
      version: 1,
      medicationId: null,
      medicationOtherName: "",
      medicationIsOther: false,
      doseFrequency: "once_daily",
      doseTimes: ["08:00"],
      customSchedule: {
        type: "weekdays",
        intervalHours: 12,
        anchorDateTime: "",
        weekdays: [1, 3, 5],
        everyOtherDay: false,
      },
      infusionDurationMins: 30,
      therapyStartDate: "",
      therapyEndDate: "",
      totalPlannedDays: null,
      lineType: "picc",
      heparinEnabled: false,
      appointmentSchedule: {
        frequency: "weekly",
        customIntervalDays: 7,
        nextAppointmentDate: "",
      },
      remindersEnabled: false,
    };
  }

  function parseTimeOnDate(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    var d = new Date(dateStr + "T" + timeStr + ":00");
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function formatTimeShort(d) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDateShort(d) {
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings();
      var s = safeParse(raw, {});
      return Object.assign(defaultSettings(), s, {
        customSchedule: Object.assign(defaultSettings().customSchedule, s.customSchedule || {}),
        appointmentSchedule: Object.assign(defaultSettings().appointmentSchedule, s.appointmentSchedule || {}),
      });
    } catch (e) {
      return defaultSettings();
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadDoseLog() {
    try {
      var raw = localStorage.getItem(DOSE_LOG_KEY);
      return raw ? safeParse(raw, []) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDoseLog(log) {
    try {
      localStorage.setItem(DOSE_LOG_KEY, JSON.stringify(log));
      return true;
    } catch (e) {
      return false;
    }
  }

  function logDoseComplete(scheduledFor, durationMins) {
    var log = loadDoseLog();
    log.push({
      completedAt: new Date().toISOString(),
      scheduledFor: scheduledFor || null,
      durationMins: durationMins || null,
    });
    saveDoseLog(log);
    return log;
  }

  function getDosesCompletedCount() {
    return loadDoseLog().length;
  }

  function getTreatmentDayInfo(settings) {
    var dosesCompleted = getDosesCompletedCount();
    if (!settings.therapyStartDate) {
      return { calendarDay: null, totalDays: null, dosesCompleted: dosesCompleted };
    }
    var start = startOfDay(new Date(settings.therapyStartDate + "T12:00:00"));
    var today = startOfDay(new Date());
    var calendarDay = Math.max(1, Math.round((today - start) / 86400000) + 1);
    var totalDays = settings.totalPlannedDays;
    if (!totalDays && settings.therapyEndDate) {
      var end = startOfDay(new Date(settings.therapyEndDate + "T12:00:00"));
      totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
    }
    return { calendarDay: calendarDay, totalDays: totalDays, dosesCompleted: dosesCompleted };
  }

  function timesForStandardFrequency(settings) {
    var times = settings.doseTimes && settings.doseTimes.length ? settings.doseTimes.slice() : ["08:00"];
    if (settings.doseFrequency === "once_daily") return [times[0] || "08:00"];
    if (settings.doseFrequency === "twice_daily") return times.slice(0, 2).length >= 2 ? times.slice(0, 2) : ["08:00", "20:00"];
    if (settings.doseFrequency === "three_daily") {
      return times.slice(0, 3).length >= 3 ? times.slice(0, 3) : ["08:00", "14:00", "20:00"];
    }
    return times;
  }

  function nextFromStandardTimes(settings, after) {
    var now = after || new Date();
    var todayStr = formatDateISO(now);
    var times = timesForStandardFrequency(settings);
    var candidates = [];

    for (var dayOffset = 0; dayOffset < 14; dayOffset++) {
      var day = addDays(startOfDay(now), dayOffset);
      var dayStr = formatDateISO(day);
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) candidates.push(dt);
      }
    }
    candidates.sort(function (a, b) { return a - b; });
    return candidates[0] || null;
  }

  function nextFromEveryXHours(settings, after) {
    var cs = settings.customSchedule || {};
    var intervalMs = (cs.intervalHours || 12) * 3600000;
    var now = after || new Date();
    var anchor = cs.anchorDateTime ? new Date(cs.anchorDateTime) : null;
    if (!anchor || isNaN(anchor.getTime())) {
      anchor = settings.therapyStartDate
        ? parseTimeOnDate(settings.therapyStartDate, (settings.doseTimes && settings.doseTimes[0]) || "08:00")
        : now;
    }
    if (!anchor || isNaN(anchor.getTime())) anchor = now;
    var t = anchor.getTime();
    while (t <= now.getTime()) t += intervalMs;
    return new Date(t);
  }

  function nextFromWeekdays(settings, after) {
    var cs = settings.customSchedule || {};
    var weekdays = cs.weekdays && cs.weekdays.length ? cs.weekdays : [1, 3, 5];
    var times = settings.doseTimes && settings.doseTimes.length ? settings.doseTimes : ["08:00"];
    var now = after || new Date();
    var candidates = [];

    for (var dayOffset = 0; dayOffset < 28; dayOffset++) {
      var day = addDays(startOfDay(now), dayOffset);
      if (weekdays.indexOf(day.getDay()) === -1) continue;
      var dayStr = formatDateISO(day);
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) candidates.push(dt);
      }
    }
    candidates.sort(function (a, b) { return a - b; });
    return candidates[0] || null;
  }

  function nextFromEveryOtherDay(settings, after) {
    var cs = settings.customSchedule || {};
    var times = settings.doseTimes && settings.doseTimes.length ? settings.doseTimes : ["08:00"];
    var now = after || new Date();
    var anchor = cs.anchorDateTime
      ? startOfDay(new Date(cs.anchorDateTime))
      : settings.therapyStartDate
        ? startOfDay(new Date(settings.therapyStartDate + "T12:00:00"))
        : startOfDay(now);

    for (var n = 0; n < 60; n++) {
      var day = addDays(anchor, n * 2);
      var dayStr = formatDateISO(day);
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) return dt;
      }
    }
    return null;
  }

  function getNextScheduledDose(settings, after) {
    if (!settings || !settings.therapyStartDate) return null;
    var freq = settings.doseFrequency;
    if (freq === "custom") {
      var type = (settings.customSchedule && settings.customSchedule.type) || "weekdays";
      if (type === "every_x_hours") return nextFromEveryXHours(settings, after);
      if (type === "every_other_day") return nextFromEveryOtherDay(settings, after);
      return nextFromWeekdays(settings, after);
    }
    return nextFromStandardTimes(settings, after);
  }

  function formatNextDose(settings) {
    var next = getNextScheduledDose(settings);
    if (!next) return "Set up your treatment schedule";
    var todayStr = formatDateISO(new Date());
    var nextStr = formatDateISO(next);
    var timePart = formatTimeShort(next);
    if (nextStr === todayStr) return "Today at " + timePart;
    var tomorrow = formatDateISO(addDays(startOfDay(new Date()), 1));
    if (nextStr === tomorrow) return "Tomorrow at " + timePart;
    return formatDateShort(next) + " at " + timePart;
  }

  function getNextAppointmentDate(settings) {
    return (settings.appointmentSchedule && settings.appointmentSchedule.nextAppointmentDate) || "";
  }

  function advanceAppointmentDate(settings) {
    var appt = settings.appointmentSchedule || {};
    if (!appt.nextAppointmentDate) return settings;
    var freq = appt.frequency || "weekly";
    var daysMap = { weekly: 7, twice_weekly: 3, three_weekly: 2, custom: appt.customIntervalDays || 7 };
    var add = daysMap[freq] || 7;
    var next = addDays(new Date(appt.nextAppointmentDate + "T12:00:00"), add);
    settings.appointmentSchedule.nextAppointmentDate = formatDateISO(next);
    saveSettings(settings);
    return settings;
  }

  function getMedicationDisplay(settings, drugs) {
    if (settings.medicationOtherName) return settings.medicationOtherName;
    if (settings.medicationId != null) {
      var d = (drugs || []).find(function (x) { return x.id === settings.medicationId; });
      if (d) return d.name;
    }
    return "Not set";
  }

  function getMedicationDrug(settings, drugs) {
    if (settings.medicationId == null) return null;
    return (drugs || []).find(function (x) { return x.id === settings.medicationId; }) || null;
  }

  function homeAntibioticDrugs(allDrugs) {
    return (allDrugs || []).filter(function (d) { return d.gameType !== "ivig"; });
  }

  function isSetupComplete(settings) {
    var hasMed = settings.medicationId != null || (settings.medicationOtherName || "").trim().length > 0;
    return hasMed && !!settings.therapyStartDate;
  }

  function loadDoseTimer() {
    try {
      var raw = localStorage.getItem(DOSE_TIMER_KEY);
      if (!raw) return null;
      var t = safeParse(raw, null);
      if (!t || !t.startTime) return null;
      return t;
    } catch (e) {
      return null;
    }
  }

  function saveDoseTimer(timer) {
    try {
      if (!timer) localStorage.removeItem(DOSE_TIMER_KEY);
      else localStorage.setItem(DOSE_TIMER_KEY, JSON.stringify(timer));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearDoseTimer() {
    saveDoseTimer(null);
  }

  function getDoseTimerProgress(timer) {
    if (!timer || !timer.startTime) return 0;
    var elapsed = Date.now() - timer.startTime;
    var total = (timer.durationMins || 30) * 60000;
    return Math.min(1, elapsed / total);
  }

  function isDoseTimerComplete(timer) {
    return getDoseTimerProgress(timer) >= 1;
  }

  function getPatientMode() {
    try {
      return localStorage.getItem(MODE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setPatientMode(mode) {
    try {
      localStorage.setItem(MODE_KEY, mode);
      localStorage.setItem(MODE_SEEN_KEY, "true");
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasModeChoice() {
    try {
      return localStorage.getItem(MODE_SEEN_KEY) === "true";
    } catch (e) {
      return false;
    }
  }

  function frequencyLabel(settings) {
    var f = settings.doseFrequency;
    if (f === "once_daily") return "Once daily";
    if (f === "twice_daily") return "Twice daily";
    if (f === "three_daily") return "Three times daily";
    var cs = settings.customSchedule || {};
    if (cs.type === "every_x_hours") return "Every " + (cs.intervalHours || 12) + " hours";
    if (cs.type === "every_other_day") return "Every other day";
    if (cs.weekdays && cs.weekdays.length) {
      return cs.weekdays.map(function (d) { return WEEKDAY_LABELS[d]; }).join(", ");
    }
    return "Custom schedule";
  }

  window.DOSECRAFT_HOME_STORE = {
    SETTINGS_KEY: SETTINGS_KEY,
    WEEKDAY_LABELS: WEEKDAY_LABELS,
    defaultSettings: defaultSettings,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadDoseLog: loadDoseLog,
    logDoseComplete: logDoseComplete,
    getDosesCompletedCount: getDosesCompletedCount,
    getTreatmentDayInfo: getTreatmentDayInfo,
    getNextScheduledDose: getNextScheduledDose,
    formatNextDose: formatNextDose,
    getNextAppointmentDate: getNextAppointmentDate,
    advanceAppointmentDate: advanceAppointmentDate,
    getMedicationDisplay: getMedicationDisplay,
    getMedicationDrug: getMedicationDrug,
    homeAntibioticDrugs: homeAntibioticDrugs,
    isSetupComplete: isSetupComplete,
    loadDoseTimer: loadDoseTimer,
    saveDoseTimer: saveDoseTimer,
    clearDoseTimer: clearDoseTimer,
    getDoseTimerProgress: getDoseTimerProgress,
    isDoseTimerComplete: isDoseTimerComplete,
    getPatientMode: getPatientMode,
    setPatientMode: setPatientMode,
    hasModeChoice: hasModeChoice,
    frequencyLabel: frequencyLabel,
    formatDateISO: formatDateISO,
  };
})();
