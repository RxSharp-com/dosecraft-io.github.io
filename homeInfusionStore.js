// Home Infusion Mode — treatment regimen, dose log, schedule math, and infusion timer.
(function () {
  var SETTINGS_KEY = "dc_home_settings";
  var DOSE_LOG_KEY = "dc_home_dose_log";
  var DOSE_TIMER_KEY = "dc_home_dose_timer";
  var MODE_KEY = "dc_patient_mode";
  var MODE_SEEN_KEY = "dc_mode_choice_seen";
  var ACTIVE_SESSION_KEY = "dc_home_active_session";
  var STORAGE_CRYPTO_KEY_ID = "dc_home_storage_kid";
  var REMINDER_PREFS_KEY = "dc_reminder_prefs";
  var SCHEDULED_NOTIFICATIONS_KEY = "dc_scheduled_notifications";
  var INSTALL_PROMPT_DISMISSED_KEY = "dc_install_prompt_dismissed";

  function bytesToBase64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function getOrCreateStorageSecret() {
    var existing = localStorage.getItem(STORAGE_CRYPTO_KEY_ID);
    if (existing) return existing;
    var rnd = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(rnd);
    } else {
      for (var i = 0; i < rnd.length; i++) rnd[i] = Math.floor(Math.random() * 256);
    }
    var created = bytesToBase64(rnd);
    localStorage.setItem(STORAGE_CRYPTO_KEY_ID, created);
    return created;
  }

  function xorMask(text, secretB64) {
    var data = new TextEncoder().encode(text);
    var key = base64ToBytes(secretB64);
    var out = new Uint8Array(data.length);
    for (var i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
    return bytesToBase64(out);
  }

  function xorUnmask(maskedB64, secretB64) {
    var data = base64ToBytes(maskedB64);
    var key = base64ToBytes(secretB64);
    var out = new Uint8Array(data.length);
    for (var i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
    return new TextDecoder().decode(out);
  }

  function encryptForStorage(plainText) {
    try {
      var secret = getOrCreateStorageSecret();
      return "enc:v1:" + xorMask(plainText, secret);
    } catch (e) {
      return plainText;
    }
  }

  function decryptFromStorage(storedText) {
    if (!storedText) return storedText;
    if (storedText.indexOf("enc:v1:") !== 0) return storedText;
    try {
      var secret = getOrCreateStorageSecret();
      return xorUnmask(storedText.slice(7), secret);
    } catch (e) {
      return null;
    }
  }

  function setEncryptedJsonItem(key, value) {
    localStorage.setItem(key, encryptForStorage(JSON.stringify(value)));
  }

  function getDecryptedItem(key) {
    var raw = localStorage.getItem(key);
    if (!raw) return raw;
    var dec = decryptFromStorage(raw);
    return dec == null ? raw : dec;
  }

  var WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Minutes before scheduled time to treat a dose as "due now".
  var DOSE_DUE_WINDOW_BEFORE_MINS = 30;
  // Minutes after scheduled time a dose still counts as "due now" (not yet missed).
  var DOSE_OVERDUE_GRACE_MINS = 120;
  // Medications scheduled within this many minutes are grouped into one back-to-back session.
  var DOSE_GROUP_WINDOW_MINS = 15;

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  }

  function uid() {
    var bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    var rand = Array.prototype.map
      .call(bytes, function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
    return "s" + Date.now().toString(36) + rand;
  }

  function defaultMedicationSchedule() {
    return {
      frequency: "once_daily",
      doseTimes: ["08:00"],
      customSchedule: {
        type: "weekdays",
        intervalHours: 12,
        anchorDateTime: "",
        weekdays: [1, 3, 5],
        everyOtherDay: false,
      },
    };
  }

  function defaultMedication(overrides) {
    return Object.assign(
      {
        medicationId: null,
        displayName: "",
        medicationOtherName: "",
        medicationIsOther: false,
        sortOrder: 1,
        infusionDurationMins: 30,
        schedule: defaultMedicationSchedule(),
      },
      overrides || {}
    );
  }

  function getHeparinDefault() {
    try {
      var cfg = window.DOSECRAFT_getClinicConfig ? window.DOSECRAFT_getClinicConfig() : {};
      if (cfg.lineCare && cfg.lineCare.heparinDefaultOn === true) return true;
    } catch (e) {}
    return false;
  }

  function defaultTreatmentSet() {
    return {
      id: "active",
      status: "active",
      medications: [],
      course: {
        startDate: "",
        endDate: "",
        totalPlannedDays: null,
      },
      lineCare: {
        accessType: "picc",
        heparinOrdered: getHeparinDefault(),
      },
      appointment: {
        nextPickupDate: "",
        frequency: "weekly",
        customIntervalDays: 7,
      },
      remindersEnabled: false,
    };
  }

  function defaultSettings() {
    return {
      version: 2,
      treatmentSet: defaultTreatmentSet(),
      doseSessionLog: [],
      activeInfusionTimer: null,
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

  function addMinutes(d, n) {
    return new Date(d.getTime() + n * 60000);
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

  function normalizeFrequency(freq) {
    if (freq === "daily" || freq === "once_daily") return "once_daily";
    if (freq === "every_8_hours") return "every_8_hours";
    if (freq === "every_12_hours") return "every_12_hours";
    if (freq === "every_24_hours") return "every_24_hours";
    return freq || "once_daily";
  }

  function intervalHoursForFrequency(freq) {
    if (freq === "every_8_hours") return 8;
    if (freq === "every_12_hours") return 12;
    if (freq === "every_24_hours") return 24;
    return null;
  }

  function isIntervalFrequency(freq) {
    return intervalHoursForFrequency(freq) != null;
  }

  function migrateLegacyFlatSettings(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.treatmentSet && raw.treatmentSet.medications) return null;

    var hasLegacy =
      raw.medicationId != null ||
      (raw.medicationOtherName || "").trim().length > 0 ||
      raw.medicationIsOther ||
      raw.doseFrequency ||
      raw.therapyStartDate;

    if (!hasLegacy) return null;

    var med = defaultMedication({
      medicationId: raw.medicationId != null ? raw.medicationId : null,
      displayName: "",
      medicationOtherName: raw.medicationOtherName || "",
      medicationIsOther: !!raw.medicationIsOther,
      sortOrder: 1,
      infusionDurationMins: raw.infusionDurationMins != null ? raw.infusionDurationMins : 30,
      schedule: {
        frequency: normalizeFrequency(raw.doseFrequency || "once_daily"),
        doseTimes: raw.doseTimes && raw.doseTimes.length ? raw.doseTimes.slice() : ["08:00"],
        customSchedule: Object.assign(defaultMedicationSchedule().customSchedule, raw.customSchedule || {}),
      },
    });

    var medications = [];
    if (med.medicationId != null || med.medicationOtherName.trim() || med.medicationIsOther) {
      medications.push(med);
    }

    return {
      version: 2,
      treatmentSet: {
        id: "active",
        status: "active",
        medications: medications,
        course: {
          startDate: raw.therapyStartDate || "",
          endDate: raw.therapyEndDate || "",
          totalPlannedDays: raw.totalPlannedDays != null ? raw.totalPlannedDays : null,
        },
        lineCare: {
          accessType: raw.lineType || "picc",
          heparinOrdered: !!raw.heparinEnabled,
        },
        appointment: Object.assign(
          { nextPickupDate: "", frequency: "weekly", customIntervalDays: 7 },
          raw.appointmentSchedule
            ? {
                nextPickupDate: raw.appointmentSchedule.nextAppointmentDate || "",
                frequency: raw.appointmentSchedule.frequency || "weekly",
                customIntervalDays: raw.appointmentSchedule.customIntervalDays || 7,
              }
            : {}
        ),
        remindersEnabled: !!raw.remindersEnabled,
      },
      doseSessionLog: [],
      activeInfusionTimer: null,
    };
  }

  function migrateLegacyDoseLog(entries) {
    if (!entries || !entries.length) return [];
    if (entries[0] && entries[0].sessionId) return entries;
    return entries.map(function (e) {
      return {
        sessionId: uid(),
        scheduledFor: e.scheduledFor || null,
        startedAt: e.completedAt || null,
        completedAt: e.completedAt || null,
        medicationDosesCompleted: [
          {
            medicationId: null,
            scheduledFor: e.scheduledFor || null,
            startedAt: e.completedAt || null,
            completedAt: e.completedAt || null,
            durationMins: e.durationMins || null,
          },
        ],
      };
    });
  }

  function migrateLegacyTimer(rawTimer, settings) {
    if (!rawTimer || !rawTimer.startTime) return null;
    var meds = getTreatmentMedications(settings);
    var med = meds[0] || null;
    var durationMins = rawTimer.durationMins || (med && med.infusionDurationMins) || 30;
    var startedAt = new Date(rawTimer.startTime);
    var expectedEndAt = new Date(startedAt.getTime() + durationMins * 60000);
    var status = Date.now() >= expectedEndAt.getTime() ? "complete" : "running";
    return {
      sessionId: uid(),
      medicationId: med ? medKey(med) : null,
      medicationName: med ? medicationLabel(med, []) : "Medication",
      startedAt: startedAt.toISOString(),
      expectedEndAt: expectedEndAt.toISOString(),
      durationMins: durationMins,
      status: status,
      scheduledFor: rawTimer.scheduledFor || null,
    };
  }

  function medKey(med) {
    if (med.medicationIsOther || med.medicationOtherName) {
      return "other:" + (med.medicationOtherName || med.displayName || "other");
    }
    return med.medicationId != null ? String(med.medicationId) : "unknown";
  }

  function findMedicationByKey(settings, key) {
    return getTreatmentMedications(settings).find(function (m) {
      return medKey(m) === String(key);
    }) || null;
  }

  function loadSettingsRaw() {
    try {
      var raw = getDecryptedItem(SETTINGS_KEY);
      if (!raw) return defaultSettings();
      var parsed = safeParse(raw, {});
      var migrated = migrateLegacyFlatSettings(parsed);
      if (migrated) {
        var logRaw = getDecryptedItem(DOSE_LOG_KEY);
        if (logRaw) migrated.doseSessionLog = migrateLegacyDoseLog(safeParse(logRaw, []));
        var timerRaw = getDecryptedItem(DOSE_TIMER_KEY);
        if (timerRaw) {
          var legacyTimer = safeParse(timerRaw, null);
          migrated.activeInfusionTimer = migrateLegacyTimer(legacyTimer, migrated);
        }
        saveSettings(migrated);
        return migrated;
      }

      var s = Object.assign(defaultSettings(), parsed);
      s.treatmentSet = Object.assign(defaultTreatmentSet(), s.treatmentSet || {});
      s.treatmentSet.course = Object.assign(defaultTreatmentSet().course, s.treatmentSet.course || {});
      s.treatmentSet.lineCare = Object.assign(defaultTreatmentSet().lineCare, s.treatmentSet.lineCare || {});
      s.treatmentSet.appointment = Object.assign(defaultTreatmentSet().appointment, s.treatmentSet.appointment || {});
      s.treatmentSet.medications = (s.treatmentSet.medications || []).map(function (m, i) {
        return Object.assign(defaultMedication({ sortOrder: i + 1 }), m, {
          schedule: Object.assign(defaultMedicationSchedule(), (m && m.schedule) || {}),
        });
      });

      if (!s.doseSessionLog || !s.doseSessionLog.length) {
        var existingLog = getDecryptedItem(DOSE_LOG_KEY);
        if (existingLog) s.doseSessionLog = migrateLegacyDoseLog(safeParse(existingLog, []));
      }

      if (!s.activeInfusionTimer) {
        var existingTimer = getDecryptedItem(DOSE_TIMER_KEY);
        if (existingTimer) {
          s.activeInfusionTimer = migrateLegacyTimer(safeParse(existingTimer, null), s);
        }
      }

      return s;
    } catch (e) {
      return defaultSettings();
    }
  }

  function loadSettings() {
    return loadSettingsRaw();
  }

  function sanitizeSettingsForStorage(settings) {
    var safe = Object.assign({}, settings || {});
    safe.treatmentSet = Object.assign({}, (safe && safe.treatmentSet) || {});
    // Do not persist appointment details in cleartext localStorage.
    safe.treatmentSet.appointment = Object.assign({}, defaultTreatmentSet().appointment);
    return safe;
  }

  function saveSettings(settings) {
    try {
      var storable = sanitizeSettingsForStorage(settings);
      setEncryptedJsonItem(SETTINGS_KEY, storable);
      if (settings.doseSessionLog) {
        setEncryptedJsonItem(DOSE_LOG_KEY, settings.doseSessionLog);
      }
      if (settings.activeInfusionTimer) {
        localStorage.setItem(
          DOSE_TIMER_KEY,
          JSON.stringify({
            startTime: new Date(settings.activeInfusionTimer.startedAt).getTime(),
            durationMins: settings.activeInfusionTimer.durationMins,
            scheduledFor: settings.activeInfusionTimer.scheduledFor || null,
            medicationId: settings.activeInfusionTimer.medicationId || null,
          })
        );
      } else {
        localStorage.removeItem(DOSE_TIMER_KEY);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getActiveTreatmentSet(settings) {
    settings = settings || loadSettings();
    return settings.treatmentSet || defaultTreatmentSet();
  }

  function getTreatmentMedications(settings) {
    var ts = getActiveTreatmentSet(settings);
    return (ts.medications || []).slice().sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }

  function getPrimaryMedication(settings) {
    var meds = getTreatmentMedications(settings);
    return meds.length ? meds[0] : null;
  }

  function getMedicationSchedule(medicationId, settings) {
    var med = findMedicationByKey(settings, medicationId);
    return med ? med.schedule || defaultMedicationSchedule() : defaultMedicationSchedule();
  }

  function medicationLabel(med, drugs) {
    if (med.displayName) return med.displayName;
    if (med.medicationOtherName) return med.medicationOtherName;
    if (med.medicationId != null) {
      var d = (drugs || []).find(function (x) { return x.id === med.medicationId; });
      if (d) return d.name;
    }
    return "Medication";
  }

  function getTreatmentDisplayName(settings, drugs) {
    var meds = getTreatmentMedications(settings);
    if (!meds.length) return "Not set";
    if (meds.length === 1) return medicationLabel(meds[0], drugs);
    return meds.map(function (m) { return medicationLabel(m, drugs); }).join(" + ");
  }

  function hasMultipleTreatmentMedications(settings) {
    return getTreatmentMedications(settings).length > 1;
  }

  function getCourseStartDate(settings) {
    var ts = getActiveTreatmentSet(settings);
    return (ts.course && ts.course.startDate) || "";
  }

  function timesForMedicationSchedule(schedule) {
    var times = schedule.doseTimes && schedule.doseTimes.length ? schedule.doseTimes.slice() : ["08:00"];
    var freq = normalizeFrequency(schedule.frequency);
    if (freq === "once_daily" || freq === "every_24_hours") return [times[0] || "08:00"];
    if (freq === "twice_daily") return times.slice(0, 2).length >= 2 ? times.slice(0, 2) : ["08:00", "20:00"];
    if (freq === "three_daily") {
      return times.slice(0, 3).length >= 3 ? times.slice(0, 3) : ["08:00", "14:00", "20:00"];
    }
    if (isIntervalFrequency(freq)) return [times[0] || "08:00"];
    return times;
  }

  function nextFromStandardTimesForMed(settings, med, after) {
    var now = after || new Date();
    var schedule = med.schedule || defaultMedicationSchedule();
    var times = timesForMedicationSchedule(schedule);
    var candidates = [];
    var startDate = getCourseStartDate(settings);

    for (var dayOffset = 0; dayOffset < 14; dayOffset++) {
      var day = addDays(startOfDay(now), dayOffset);
      var dayStr = formatDateISO(day);
      if (startDate && dayStr < startDate) continue;
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) {
          candidates.push({ medication: med, scheduledFor: dt });
        }
      }
    }
    candidates.sort(function (a, b) { return a.scheduledFor - b.scheduledFor; });
    return candidates[0] || null;
  }

  function nextFromEveryXHoursForMed(settings, med, after) {
    var schedule = med.schedule || defaultMedicationSchedule();
    var cs = schedule.customSchedule || {};
    var intervalHours = intervalHoursForFrequency(schedule.frequency) || cs.intervalHours || 12;
    var intervalMs = intervalHours * 3600000;
    var now = after || new Date();
    var anchor = cs.anchorDateTime ? new Date(cs.anchorDateTime) : null;
    if (!anchor || isNaN(anchor.getTime())) {
      anchor = getCourseStartDate(settings)
        ? parseTimeOnDate(getCourseStartDate(settings), (schedule.doseTimes && schedule.doseTimes[0]) || "08:00")
        : now;
    }
    if (!anchor || isNaN(anchor.getTime())) anchor = now;
    var t = anchor.getTime();
    while (t <= now.getTime()) t += intervalMs;
    return { medication: med, scheduledFor: new Date(t) };
  }

  function nextFromWeekdaysForMed(settings, med, after) {
    var schedule = med.schedule || defaultMedicationSchedule();
    var cs = schedule.customSchedule || {};
    var weekdays = cs.weekdays && cs.weekdays.length ? cs.weekdays : [1, 3, 5];
    var times = schedule.doseTimes && schedule.doseTimes.length ? schedule.doseTimes : ["08:00"];
    var now = after || new Date();
    var candidates = [];

    for (var dayOffset = 0; dayOffset < 28; dayOffset++) {
      var day = addDays(startOfDay(now), dayOffset);
      if (weekdays.indexOf(day.getDay()) === -1) continue;
      var dayStr = formatDateISO(day);
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) candidates.push({ medication: med, scheduledFor: dt });
      }
    }
    candidates.sort(function (a, b) { return a.scheduledFor - b.scheduledFor; });
    return candidates[0] || null;
  }

  function nextFromEveryOtherDayForMed(settings, med, after) {
    var schedule = med.schedule || defaultMedicationSchedule();
    var cs = schedule.customSchedule || {};
    var times = schedule.doseTimes && schedule.doseTimes.length ? schedule.doseTimes : ["08:00"];
    var now = after || new Date();
    var anchor = cs.anchorDateTime
      ? startOfDay(new Date(cs.anchorDateTime))
      : getCourseStartDate(settings)
        ? startOfDay(new Date(getCourseStartDate(settings) + "T12:00:00"))
        : startOfDay(now);

    for (var n = 0; n < 60; n++) {
      var day = addDays(anchor, n * 2);
      var dayStr = formatDateISO(day);
      for (var i = 0; i < times.length; i++) {
        var dt = parseTimeOnDate(dayStr, times[i]);
        if (dt && dt > now) return { medication: med, scheduledFor: dt };
      }
    }
    return null;
  }

  function getNextDoseForMedication(settings, med, after) {
    if (!getCourseStartDate(settings)) return null;
    var schedule = med.schedule || defaultMedicationSchedule();
    var freq = normalizeFrequency(schedule.frequency);
    if (isIntervalFrequency(freq)) return nextFromEveryXHoursForMed(settings, med, after);
    if (freq === "custom") {
      var type = (schedule.customSchedule && schedule.customSchedule.type) || "weekdays";
      if (type === "every_x_hours") return nextFromEveryXHoursForMed(settings, med, after);
      if (type === "every_other_day") return nextFromEveryOtherDayForMed(settings, med, after);
      return nextFromWeekdaysForMed(settings, med, after);
    }
    return nextFromStandardTimesForMed(settings, med, after);
  }

  function getNextDueMedicationDose(settings, after) {
    settings = settings || loadSettings();
    if (!getCourseStartDate(settings)) return null;
    var meds = getTreatmentMedications(settings);
    var best = null;
    meds.forEach(function (med) {
      var next = getNextDoseForMedication(settings, med, after);
      if (!next) return;
      if (!best || next.scheduledFor < best.scheduledFor) best = next;
    });
    return best;
  }

  function dosesForMedicationOnDay(settings, med, dayDate) {
    var schedule = med.schedule || defaultMedicationSchedule();
    var freq = normalizeFrequency(schedule.frequency);
    var dayStr = formatDateISO(startOfDay(dayDate));
    var startDate = getCourseStartDate(settings);
    if (startDate && dayStr < startDate) return [];

    if (isIntervalFrequency(freq)) {
      var intervalHours = intervalHoursForFrequency(freq) || 12;
      var intervalMs = intervalHours * 3600000;
      var cs = schedule.customSchedule || {};
      var anchor = cs.anchorDateTime ? new Date(cs.anchorDateTime) : null;
      if (!anchor || isNaN(anchor.getTime())) {
        anchor = startDate
          ? parseTimeOnDate(startDate, (schedule.doseTimes && schedule.doseTimes[0]) || "08:00")
          : startOfDay(dayDate);
      }
      if (!anchor || isNaN(anchor.getTime())) return [];
      var dayStart = startOfDay(dayDate).getTime();
      var dayEnd = addDays(startOfDay(dayDate), 1).getTime();
      var doses = [];
      var t = anchor.getTime();
      while (t < dayStart) t += intervalMs;
      while (t < dayEnd) {
        if (t >= dayStart) doses.push({ medication: med, scheduledFor: new Date(t) });
        t += intervalMs;
      }
      return doses;
    }

    if (freq === "custom") {
      var type = (schedule.customSchedule && schedule.customSchedule.type) || "weekdays";
      if (type === "every_other_day") {
        var cs2 = schedule.customSchedule || {};
        var anchorDay = cs2.anchorDateTime
          ? startOfDay(new Date(cs2.anchorDateTime))
          : startDate
            ? startOfDay(new Date(startDate + "T12:00:00"))
            : startOfDay(dayDate);
        var diffDays = Math.round((startOfDay(dayDate) - anchorDay) / 86400000);
        if (diffDays < 0 || diffDays % 2 !== 0) return [];
      } else if (type === "weekdays") {
        var weekdays = (schedule.customSchedule && schedule.customSchedule.weekdays) || [1, 3, 5];
        if (weekdays.indexOf(startOfDay(dayDate).getDay()) === -1) return [];
      } else if (type === "every_x_hours") {
        return dosesForMedicationOnDay(
          settings,
          Object.assign({}, med, { schedule: Object.assign({}, schedule, { frequency: "every_12_hours" }) }),
          dayDate
        );
      }
    }

    var times = timesForMedicationSchedule(schedule);
    return times.map(function (timeStr) {
      return { medication: med, scheduledFor: parseTimeOnDate(dayStr, timeStr) };
    }).filter(function (d) { return d.scheduledFor; });
  }

  function isDoseDueNow(scheduledFor, now) {
    now = now || new Date();
    var start = addMinutes(scheduledFor, -DOSE_DUE_WINDOW_BEFORE_MINS);
    var end = addMinutes(scheduledFor, DOSE_OVERDUE_GRACE_MINS);
    return now >= start && now <= end;
  }

  function getAllDosesNearNow(settings, now) {
    now = now || new Date();
    var meds = getTreatmentMedications(settings);
    var all = [];
    for (var dayOffset = -1; dayOffset <= 1; dayOffset++) {
      var day = addDays(startOfDay(now), dayOffset);
      meds.forEach(function (med) {
        dosesForMedicationOnDay(settings, med, day).forEach(function (dose) {
          all.push(dose);
        });
      });
    }
    return all;
  }

  function groupDosesIntoSessions(doses) {
    if (!doses.length) return [];
    var sorted = doses.slice().sort(function (a, b) {
      if (a.scheduledFor - b.scheduledFor !== 0) return a.scheduledFor - b.scheduledFor;
      return (a.medication.sortOrder || 0) - (b.medication.sortOrder || 0);
    });
    var sessions = [];
    var current = [sorted[0]];
    for (var i = 1; i < sorted.length; i++) {
      var prev = current[current.length - 1];
      var gapMins = (sorted[i].scheduledFor - prev.scheduledFor) / 60000;
      if (gapMins <= DOSE_GROUP_WINDOW_MINS) current.push(sorted[i]);
      else {
        sessions.push(current);
        current = [sorted[i]];
      }
    }
    sessions.push(current);
    return sessions;
  }

  function getDueMedicationDosesForNow(settings, now) {
    settings = settings || loadSettings();
    now = now || new Date();
    var due = getAllDosesNearNow(settings, now).filter(function (d) {
      return isDoseDueNow(d.scheduledFor, now);
    });
    if (!due.length) return [];
    due.sort(function (a, b) {
      if (a.scheduledFor - b.scheduledFor !== 0) return a.scheduledFor - b.scheduledFor;
      return (a.medication.sortOrder || 0) - (b.medication.sortOrder || 0);
    });
    var sessions = groupDosesIntoSessions(due);
    var session = sessions[0] || [];
    session.sort(function (a, b) {
      return (a.medication.sortOrder || 0) - (b.medication.sortOrder || 0);
    });
    return session;
  }

  function getTodayMedicationDoses(settings, now) {
    settings = settings || loadSettings();
    now = now || new Date();
    var meds = getTreatmentMedications(settings);
    var all = [];
    meds.forEach(function (med) {
      dosesForMedicationOnDay(settings, med, now).forEach(function (d) {
        all.push(d);
      });
    });
    all.sort(function (a, b) {
      if (a.scheduledFor - b.scheduledFor !== 0) return a.scheduledFor - b.scheduledFor;
      return (a.medication.sortOrder || 0) - (b.medication.sortOrder || 0);
    });
    return all;
  }

  function getRemainingTodayDoses(settings, now) {
    now = now || new Date();
    return getTodayMedicationDoses(settings, now).filter(function (d) {
      return d.scheduledFor >= now || isDoseDueNow(d.scheduledFor, now);
    });
  }

  function formatTodayDosesSummary(settings, drugs, now) {
    var remaining = getRemainingTodayDoses(settings, now);
    if (!remaining.length) return "No more doses scheduled for today";
    var byMed = {};
    remaining.forEach(function (d) {
      var label = medicationLabel(d.medication, drugs);
      if (!byMed[label]) byMed[label] = [];
      byMed[label].push(formatTimeShort(d.scheduledFor));
    });
    return Object.keys(byMed).map(function (label) {
      return label + " " + byMed[label].join(" / ");
    }).join(", ");
  }

  function formatDueMedicationList(doses, drugs) {
    if (!doses.length) return "";
    return doses.map(function (d) { return medicationLabel(d.medication, drugs); }).join(" + ");
  }

  function formatNextDueSummary(settings, drugs, now) {
    now = now || new Date();
    var dueNow = getDueMedicationDosesForNow(settings, now);
    if (dueNow.length) {
      return "Due now: " + formatDueMedicationList(dueNow, drugs);
    }
    var next = getNextDueMedicationDose(settings, now);
    if (!next) return "Set up your treatment schedule";
    var todayStr = formatDateISO(now);
    var nextStr = formatDateISO(next.scheduledFor);
    var timePart = formatTimeShort(next.scheduledFor);
    var medName = medicationLabel(next.medication, drugs);
    if (nextStr === todayStr) return "Next due: " + medName + " at " + timePart;
    var tomorrow = formatDateISO(addDays(startOfDay(now), 1));
    if (nextStr === tomorrow) return "Next due: " + medName + " tomorrow at " + timePart;
    return "Next due: " + medName + " " + formatDateShort(next.scheduledFor) + " at " + timePart;
  }

  function getEstimatedSessionMinutesForDueMeds(dueDoses) {
    if (!dueDoses || !dueDoses.length) return 0;
    return dueDoses.reduce(function (sum, d) {
      return sum + (d.medication.infusionDurationMins || 30);
    }, 0);
  }

  function loadDoseLog() {
    var s = loadSettings();
    return s.doseSessionLog || [];
  }

  function saveDoseLog(log) {
    var s = loadSettings();
    s.doseSessionLog = log;
    return saveSettings(s);
  }

  function logDoseSessionComplete(dosesCompleted, sessionMeta) {
    var s = loadSettings();
    var nowIso = new Date().toISOString();
    var entry = {
      sessionId: uid(),
      scheduledFor: sessionMeta && sessionMeta.scheduledFor ? sessionMeta.scheduledFor : null,
      startedAt: sessionMeta && sessionMeta.startedAt ? sessionMeta.startedAt : nowIso,
      completedAt: nowIso,
      medicationDosesCompleted: (dosesCompleted || []).map(function (d) {
        return {
          medicationId: d.medicationId,
          scheduledFor: d.scheduledFor || null,
          startedAt: d.startedAt || nowIso,
          completedAt: d.completedAt || nowIso,
          durationMins: d.durationMins || null,
        };
      }),
    };
    s.doseSessionLog = s.doseSessionLog || [];
    s.doseSessionLog.push(entry);
    saveSettings(s);
    return s.doseSessionLog;
  }

  function logDoseComplete(scheduledFor, durationMins, medicationId) {
    return logDoseSessionComplete(
      [{ medicationId: medicationId || null, scheduledFor: scheduledFor, durationMins: durationMins }],
      { scheduledFor: scheduledFor }
    );
  }

  function getDosesCompletedCount() {
    var log = loadDoseLog();
    var count = 0;
    log.forEach(function (session) {
      if (session.medicationDosesCompleted && session.medicationDosesCompleted.length) {
        count += session.medicationDosesCompleted.length;
      } else if (session.completedAt) count += 1;
    });
    return count;
  }

  function getTreatmentDayInfo(settings) {
    var dosesCompleted = getDosesCompletedCount();
    var startDate = getCourseStartDate(settings);
    if (!startDate) {
      return { calendarDay: null, totalDays: null, dosesCompleted: dosesCompleted };
    }
    var ts = getActiveTreatmentSet(settings);
    var start = startOfDay(new Date(startDate + "T12:00:00"));
    var today = startOfDay(new Date());
    var calendarDay = Math.max(1, Math.round((today - start) / 86400000) + 1);
    var totalDays = ts.course && ts.course.totalPlannedDays;
    if (!totalDays && ts.course && ts.course.endDate) {
      var end = startOfDay(new Date(ts.course.endDate + "T12:00:00"));
      totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
    }
    return { calendarDay: calendarDay, totalDays: totalDays, dosesCompleted: dosesCompleted };
  }

  function getNextAppointmentDate(settings) {
    var appt = getActiveTreatmentSet(settings).appointment || {};
    return appt.nextPickupDate || "";
  }

  function advanceAppointmentDate(settings) {
    settings = settings || loadSettings();
    var ts = getActiveTreatmentSet(settings);
    var appt = ts.appointment || {};
    if (!appt.nextPickupDate) return settings;
    var freq = appt.frequency || "weekly";
    var daysMap = { weekly: 7, twice_weekly: 3, three_weekly: 2, custom: appt.customIntervalDays || 7 };
    var add = daysMap[freq] || 7;
    var next = addDays(new Date(appt.nextPickupDate + "T12:00:00"), add);
    settings.treatmentSet.appointment.nextPickupDate = formatDateISO(next);
    saveSettings(settings);
    return settings;
  }

  function getMedicationDisplay(settings, drugs) {
    return getTreatmentDisplayName(settings, drugs);
  }

  function getMedicationDrug(settings, drugs) {
    var med = getPrimaryMedication(settings);
    if (!med || med.medicationId == null) return null;
    return (drugs || []).find(function (x) { return x.id === med.medicationId; }) || null;
  }

  function getMedicationDrugByKey(settings, drugs, key) {
    var med = findMedicationByKey(settings, key);
    if (!med || med.medicationId == null) return null;
    return (drugs || []).find(function (x) { return x.id === med.medicationId; }) || null;
  }

  function homeAntibioticDrugs(allDrugs) {
    var antibiotics = (allDrugs || []).filter(function (d) { return d.gameType !== "ivig"; });
    if (window.DOSECRAFT_filterEnabledDrugs) {
      return window.DOSECRAFT_filterEnabledDrugs(antibiotics);
    }
    return antibiotics;
  }

  function isSetupComplete(settings) {
    settings = settings || loadSettings();
    var meds = getTreatmentMedications(settings);
    var hasMed = meds.some(function (m) {
      return m.medicationId != null || (m.medicationOtherName || "").trim().length > 0 || m.medicationIsOther;
    });
    return hasMed && !!getCourseStartDate(settings);
  }

  function getActiveInfusionTimer(settings) {
    settings = settings || loadSettings();
    var t = settings.activeInfusionTimer;
    if (!t || !t.startedAt) return null;
    if (t.status === "complete" || isTimerComplete(t)) return null;
    return t;
  }

  function getTimerRemainingMs(timer) {
    if (!timer || !timer.expectedEndAt) return 0;
    return Math.max(0, new Date(timer.expectedEndAt).getTime() - Date.now());
  }

  function getTimerProgress(timer) {
    if (!timer || !timer.startedAt || !timer.expectedEndAt) return 0;
    var total = new Date(timer.expectedEndAt).getTime() - new Date(timer.startedAt).getTime();
    if (total <= 0) return 1;
    var elapsed = Date.now() - new Date(timer.startedAt).getTime();
    return Math.min(1, Math.max(0, elapsed / total));
  }

  function isTimerComplete(timer) {
    if (!timer) return false;
    if (timer.status === "complete") return true;
    return getTimerRemainingMs(timer) <= 0;
  }

  function formatTimerRemaining(timer) {
    var ms = getTimerRemainingMs(timer);
    var mins = Math.ceil(ms / 60000);
    if (mins <= 0) return "Complete";
    if (mins === 1) return "1 minute remaining";
    return mins + " minutes remaining";
  }

  function getCurrentInfusingMedication(settings, drugs) {
    var timer = getActiveInfusionTimer(settings);
    if (!timer || !timer.medicationId) return null;
    var med = findMedicationByKey(settings, timer.medicationId);
    if (!med) {
      return {
        medicationId: timer.medicationId,
        displayName: timer.medicationName || "Medication",
        medicationOtherName: "",
        medicationIsOther: false,
        sortOrder: 0,
        infusionDurationMins: timer.durationMins || 30,
        schedule: defaultMedicationSchedule(),
      };
    }
    return med;
  }

  function startInfusionTimerForMedication(settings, medicationId, scheduledFor) {
    settings = settings || loadSettings();
    var med = findMedicationByKey(settings, medicationId);
    if (!med) return null;
    var durationMins = med.infusionDurationMins || 30;
    var startedAt = new Date();
    var expectedEndAt = addMinutes(startedAt, durationMins);
    var timer = {
      sessionId: uid(),
      medicationId: medKey(med),
      medicationName: medicationLabel(med, []),
      startedAt: startedAt.toISOString(),
      expectedEndAt: expectedEndAt.toISOString(),
      durationMins: durationMins,
      status: "running",
      scheduledFor: scheduledFor || null,
    };
    settings.activeInfusionTimer = timer;
    saveSettings(settings);
    return timer;
  }

  function completeInfusionTimer(settings) {
    settings = settings || loadSettings();
    if (!settings.activeInfusionTimer) return null;
    var completed = Object.assign({}, settings.activeInfusionTimer, {
      status: "complete",
      completedAt: new Date().toISOString(),
    });
    settings.activeInfusionTimer = null;
    saveSettings(settings);
    return completed;
  }

  function cancelInfusionTimer(settings) {
    settings = settings || loadSettings();
    settings.activeInfusionTimer = null;
    saveSettings(settings);
    return null;
  }

  function clearDoseTimer() {
    cancelInfusionTimer(loadSettings());
  }

  function loadDoseTimer() {
    var t = getActiveInfusionTimer();
    if (!t) return null;
    return {
      startTime: new Date(t.startedAt).getTime(),
      durationMins: t.durationMins,
      scheduledFor: t.scheduledFor,
      medicationId: t.medicationId,
    };
  }

  function saveDoseTimer(timer) {
    if (!timer) {
      cancelInfusionTimer(loadSettings());
      return true;
    }
    var s = loadSettings();
    var med = timer.medicationId ? findMedicationByKey(s, timer.medicationId) : getPrimaryMedication(s);
    if (!med) return false;
    return !!startInfusionTimerForMedication(s, medKey(med), timer.scheduledFor);
  }

  function getDoseTimerProgress(timer) {
    if (!timer) return 0;
    if (timer.startedAt) return getTimerProgress(timer);
    if (timer.startTime) {
      return getTimerProgress({
        startedAt: new Date(timer.startTime).toISOString(),
        expectedEndAt: new Date(timer.startTime + (timer.durationMins || 30) * 60000).toISOString(),
      });
    }
    return 0;
  }

  function isDoseTimerComplete(timer) {
    if (!timer) return false;
    if (timer.startedAt) return isTimerComplete(timer);
    if (timer.startTime) {
      return Date.now() >= timer.startTime + (timer.durationMins || 30) * 60000;
    }
    return false;
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

  function medicationFrequencyLabel(med) {
    var schedule = med.schedule || defaultMedicationSchedule();
    var f = normalizeFrequency(schedule.frequency);
    if (f === "once_daily" || f === "every_24_hours") return "Once daily";
    if (f === "twice_daily") return "Twice daily";
    if (f === "three_daily") return "Three times daily";
    if (f === "every_8_hours") return "Every 8 hours";
    if (f === "every_12_hours") return "Every 12 hours";
    var cs = schedule.customSchedule || {};
    if (cs.type === "every_x_hours") return "Every " + (cs.intervalHours || 12) + " hours";
    if (cs.type === "every_other_day") return "Every other day";
    if (cs.weekdays && cs.weekdays.length) {
      return cs.weekdays.map(function (d) { return WEEKDAY_LABELS[d]; }).join(", ");
    }
    return "Custom schedule";
  }

  function frequencyLabel(settings) {
    var meds = getTreatmentMedications(settings);
    if (!meds.length) return "Not set";
    if (meds.length === 1) return medicationFrequencyLabel(meds[0]);
    return meds.map(function (m) {
      return medicationLabel(m, []) + ": " + medicationFrequencyLabel(m);
    }).join(" · ");
  }

  function getNextScheduledDose(settings, after) {
    var next = getNextDueMedicationDose(settings, after);
    return next ? next.scheduledFor : null;
  }

  function formatNextDose(settings, drugs) {
    return formatNextDueSummary(settings, drugs || []);
  }

  function getDoseSessionKey(dose) {
    if (!dose || !dose.medication) return "";
    var sched = dose.scheduledFor instanceof Date
      ? dose.scheduledFor.toISOString()
      : (dose.scheduledFor || "");
    return medKey(dose.medication) + "|" + sched;
  }

  function sortDueDosesByMedOrder(dueDoses) {
    return (dueDoses || []).slice().sort(function (a, b) {
      if (a.scheduledFor - b.scheduledFor !== 0) return a.scheduledFor - b.scheduledFor;
      return (a.medication.sortOrder || 0) - (b.medication.sortOrder || 0);
    });
  }

  function saveActiveSession(session) {
    try {
      if (!session) sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      else sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadActiveSession() {
    try {
      var raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
      return raw ? safeParse(raw, null) : null;
    } catch (e) {
      return null;
    }
  }

  function clearActiveSession() {
    return saveActiveSession(null);
  }

  function createActiveSession(dueDoses) {
    var sorted = sortDueDosesByMedOrder(dueDoses);
    return {
      sessionId: uid(),
      dueDoseKeys: sorted.map(function (d) {
        return { medicationKey: medKey(d.medication), scheduledFor: d.scheduledFor.toISOString() };
      }),
      completedDoseKeys: [],
      stepIndex: 0,
    };
  }

  function isMedicationDoseCompleted(session, dose) {
    if (!session) return false;
    var key = getDoseSessionKey(dose);
    return (session.completedDoseKeys || []).indexOf(key) >= 0;
  }

  function markMedicationDoseComplete(session, dose) {
    if (!session) return session;
    var key = getDoseSessionKey(dose);
    var completed = (session.completedDoseKeys || []).slice();
    if (completed.indexOf(key) === -1) completed.push(key);
    return Object.assign({}, session, { completedDoseKeys: completed });
  }

  function dueDosesFromSession(session, settings) {
    if (!session || !session.dueDoseKeys) return [];
    return session.dueDoseKeys.map(function (entry) {
      var med = findMedicationByKey(settings, entry.medicationKey);
      if (!med) {
        med = defaultMedication({
          medicationId: entry.medicationKey,
          displayName: entry.medicationKey,
          sortOrder: 0,
        });
      }
      return {
        medication: med,
        scheduledFor: new Date(entry.scheduledFor),
      };
    });
  }

  function shouldShowGlobalTimerBanner(viewName) {
    return viewName !== "sash";
  }

  function buildDoseSessionSteps(dueDoses, settings, copy) {
    var ts = getActiveTreatmentSet(settings);
    var heparin = ts.lineCare && ts.lineCare.heparinOrdered;
    var steps = [];
    var doses = sortDueDosesByMedOrder(dueDoses);
    var medCount = doses.length;
    var sc = (copy && copy.sessionStepCopy) || {};

    if (!medCount) return steps;

    steps.push({
      id: "prep",
      type: "prep",
      title: "Prepare supplies",
      body: sc.prep || "Wash your hands and gather saline syringes, alcohol prep pads, and your medication supplies as instructed by your care team.",
      action: "continue",
      actionLabel: "Continue",
    });

    steps.push({
      id: "saline_pre",
      type: "saline",
      letter: "S",
      title: "Saline flush",
      body: sc.salinePre || "Flush with saline as your care team directed before starting medication. Do not force a flush — call your care team if you meet resistance.",
      action: "continue",
      actionLabel: "Line flushed — continue",
    });

    doses.forEach(function (dose, idx) {
      var key = medKey(dose.medication);
      var name = medicationLabel(dose.medication, []);
      var sched = dose.scheduledFor.toISOString();

      if (idx > 0) {
        steps.push({
          id: "saline_between_" + idx,
          type: "saline",
          letter: "S",
          title: "Saline flush between medications",
          body: sc.salineBetween || "Flush with saline between medications as your care team directed. Do not force a flush — call your care team if you meet resistance.",
          action: "continue",
          actionLabel: "Line flushed — continue",
        });
      }

      steps.push({
        id: "start_" + key + "_" + sched,
        type: "start_infusion",
        letter: "A",
        title: medCount > 1 ? "Start " + name + " infusion" : "Start medication infusion",
        body: (sc.startInfusion || "Connect {medication} as your care team instructed. When the medication begins flowing, start the infusion timer.").replace(/\{medication\}/g, name),
        action: "start_timer",
        actionLabel: "Start infusion timer",
        medicationKey: key,
        medicationName: name,
        scheduledFor: sched,
      });

      steps.push({
        id: "infusion_" + key + "_" + sched,
        type: "infusion",
        letter: "A",
        title: medCount > 1 ? "Infusing " + name : "Infusion in progress",
        body: (sc.activeTimer || "Your {medication} infusion is running. You can use the rest of the Companion while you wait. Mark complete when the infusion has finished.").replace(/\{medication\}/g, name),
        action: "mark_med_complete",
        actionLabel: "Mark infusion complete",
        medicationKey: key,
        medicationName: name,
        scheduledFor: sched,
        showTimerActions: true,
      });
    });

    steps.push({
      id: "saline_post",
      type: "saline",
      letter: "S",
      title: medCount > 1 ? "Saline flush after final medication" : "Saline flush after medication",
      body: medCount > 1
        ? (sc.salinePostFinal || "Flush with saline after the final medication as your care team directed.")
        : (sc.salinePostSingle || "Flush with saline after medication as your care team directed."),
      action: "continue",
      actionLabel: "Line flushed — continue",
    });

    if (heparin) {
      steps.push({
        id: "heparin",
        type: "heparin",
        letter: "H",
        title: "Heparin flush (if prescribed)",
        body: sc.heparin || "Use heparin only if your care team prescribed it. Scrub the hub, flush as directed, and clamp the line if instructed.",
        action: "confirm",
        actionLabel: "Heparin given or not needed — continue",
      });
    }

    steps.push({
      id: "session_complete",
      type: "complete",
      title: "Session complete",
      body: sc.sessionComplete || "You have finished this dose session. Your dashboard will show what is due next.",
      action: "finish_session",
      actionLabel: "Finish session",
    });

    return steps;
  }

  function findResumeStepIndex(steps, session, activeTimer) {
    if (!steps.length) return 0;
    if (activeTimer && activeTimer.medicationId) {
      for (var i = 0; i < steps.length; i++) {
        if (steps[i].type === "infusion" && steps[i].medicationKey === activeTimer.medicationId) {
          return i;
        }
      }
    }
    if (session && session.completedDoseKeys && session.completedDoseKeys.length) {
      var lastCompleted = session.completedDoseKeys[session.completedDoseKeys.length - 1];
      for (var j = 0; j < steps.length; j++) {
        if (steps[j].type === "infusion") {
          var doseKey = steps[j].medicationKey + "|" + steps[j].scheduledFor;
          if (doseKey === lastCompleted) {
            return Math.min(j + 1, steps.length - 1);
          }
        }
      }
    }
    if (session && typeof session.stepIndex === "number") {
      return Math.max(0, Math.min(session.stepIndex, steps.length - 1));
    }
    return 0;
  }

  function getNextMedicationDoseInSession(session, settings) {
    var doses = dueDosesFromSession(session, settings);
    for (var i = 0; i < doses.length; i++) {
      if (!isMedicationDoseCompleted(session, doses[i])) return doses[i];
    }
    return null;
  }

  function buildWalkthroughSteps(dueDoses, settings, copy) {
    return buildDoseSessionSteps(dueDoses, settings, copy);
  }

  function defaultReminderPrefs() {
    return {
      enabled: false,
      leadMinutes: 60,
      atTimeEnabled: true,
      permissionGranted: false,
    };
  }

  function loadReminderPrefs() {
    var raw = localStorage.getItem(REMINDER_PREFS_KEY);
    if (!raw) return defaultReminderPrefs();
    var parsed = safeParse(raw, null);
    if (!parsed || typeof parsed !== "object") return defaultReminderPrefs();
    return {
      enabled: !!parsed.enabled,
      leadMinutes: parsed.leadMinutes != null ? parsed.leadMinutes : 60,
      atTimeEnabled: parsed.atTimeEnabled !== false,
      permissionGranted: !!parsed.permissionGranted,
    };
  }

  function saveReminderPrefs(prefs) {
    localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs || defaultReminderPrefs()));
  }

  function loadScheduledNotifications() {
    var raw = localStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    if (!raw) return [];
    var parsed = safeParse(raw, null);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveScheduledNotifications(list) {
    localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(list || []));
  }

  function isInstallPromptDismissed() {
    return localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "true";
  }

  function setInstallPromptDismissed() {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
  }

  window.DOSECRAFT_HOME_STORE = {
    SETTINGS_KEY: SETTINGS_KEY,
    WEEKDAY_LABELS: WEEKDAY_LABELS,
    DOSE_DUE_WINDOW_BEFORE_MINS: DOSE_DUE_WINDOW_BEFORE_MINS,
    DOSE_GROUP_WINDOW_MINS: DOSE_GROUP_WINDOW_MINS,
    defaultSettings: defaultSettings,
    defaultMedication: defaultMedication,
    getHeparinDefault: getHeparinDefault,
    defaultTreatmentSet: defaultTreatmentSet,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadDoseLog: loadDoseLog,
    saveDoseLog: saveDoseLog,
    logDoseComplete: logDoseComplete,
    logDoseSessionComplete: logDoseSessionComplete,
    getDosesCompletedCount: getDosesCompletedCount,
    getTreatmentDayInfo: getTreatmentDayInfo,
    getActiveTreatmentSet: getActiveTreatmentSet,
    getTreatmentMedications: getTreatmentMedications,
    getPrimaryMedication: getPrimaryMedication,
    getMedicationSchedule: getMedicationSchedule,
    getTreatmentDisplayName: getTreatmentDisplayName,
    getEstimatedSessionMinutesForDueMeds: getEstimatedSessionMinutesForDueMeds,
    hasMultipleTreatmentMedications: hasMultipleTreatmentMedications,
    getNextDueMedicationDose: getNextDueMedicationDose,
    getNextDoseForMedication: getNextDoseForMedication,
    getDueMedicationDosesForNow: getDueMedicationDosesForNow,
    getTodayMedicationDoses: getTodayMedicationDoses,
    getRemainingTodayDoses: getRemainingTodayDoses,
    formatTodayDosesSummary: formatTodayDosesSummary,
    formatNextDueSummary: formatNextDueSummary,
    formatDueMedicationList: formatDueMedicationList,
    getActiveInfusionTimer: getActiveInfusionTimer,
    getCurrentInfusingMedication: getCurrentInfusingMedication,
    startInfusionTimerForMedication: startInfusionTimerForMedication,
    completeInfusionTimer: completeInfusionTimer,
    cancelInfusionTimer: cancelInfusionTimer,
    getTimerRemainingMs: getTimerRemainingMs,
    getTimerProgress: getTimerProgress,
    isTimerComplete: isTimerComplete,
    formatTimerRemaining: formatTimerRemaining,
    medKey: medKey,
    findMedicationByKey: findMedicationByKey,
    medicationLabel: medicationLabel,
    medicationFrequencyLabel: medicationFrequencyLabel,
    buildWalkthroughSteps: buildWalkthroughSteps,
    buildDoseSessionSteps: buildDoseSessionSteps,
    getDoseSessionKey: getDoseSessionKey,
    sortDueDosesByMedOrder: sortDueDosesByMedOrder,
    saveActiveSession: saveActiveSession,
    loadActiveSession: loadActiveSession,
    clearActiveSession: clearActiveSession,
    createActiveSession: createActiveSession,
    isMedicationDoseCompleted: isMedicationDoseCompleted,
    markMedicationDoseComplete: markMedicationDoseComplete,
    dueDosesFromSession: dueDosesFromSession,
    shouldShowGlobalTimerBanner: shouldShowGlobalTimerBanner,
    findResumeStepIndex: findResumeStepIndex,
    getNextMedicationDoseInSession: getNextMedicationDoseInSession,
    getNextScheduledDose: getNextScheduledDose,
    formatNextDose: formatNextDose,
    getNextAppointmentDate: getNextAppointmentDate,
    advanceAppointmentDate: advanceAppointmentDate,
    getMedicationDisplay: getMedicationDisplay,
    getMedicationDrug: getMedicationDrug,
    getMedicationDrugByKey: getMedicationDrugByKey,
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
    formatTimeShort: formatTimeShort,
    REMINDER_PREFS_KEY: REMINDER_PREFS_KEY,
    SCHEDULED_NOTIFICATIONS_KEY: SCHEDULED_NOTIFICATIONS_KEY,
    INSTALL_PROMPT_DISMISSED_KEY: INSTALL_PROMPT_DISMISSED_KEY,
    defaultReminderPrefs: defaultReminderPrefs,
    loadReminderPrefs: loadReminderPrefs,
    saveReminderPrefs: saveReminderPrefs,
    loadScheduledNotifications: loadScheduledNotifications,
    saveScheduledNotifications: saveScheduledNotifications,
    isInstallPromptDismissed: isInstallPromptDismissed,
    setInstallPromptDismissed: setInstallPromptDismissed,
  };
})();
