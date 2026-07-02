// Privacy-preserving calendar (.ics) export for Dosecraft Home Infusion Companion.
// Generates ICS strings on device only — no backend, no persistence.

(function () {
  var DOSE_COUNT_CAP = 180;
  var DOSE_ALARM_MINUTES = 15;
  var VISIT_ALARM_MINUTES = 60;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function escapeIcsText(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n/g, "\\n")
      .replace(/\n/g, "\\n");
  }

  function formatIcsUtcStamp(date) {
    return (
      date.getUTCFullYear() +
      pad2(date.getUTCMonth() + 1) +
      pad2(date.getUTCDate()) +
      "T" +
      pad2(date.getUTCHours()) +
      pad2(date.getUTCMinutes()) +
      pad2(date.getUTCSeconds()) +
      "Z"
    );
  }

  function formatIcsLocalDateTime(date) {
    return (
      date.getFullYear() +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      "T" +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      pad2(date.getSeconds())
    );
  }

  function parseTimeParts(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    var parts = timeStr.split(":");
    if (parts.length < 2) return null;
    var hours = parseInt(parts[0], 10);
    var mins = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(mins) || hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
    return { hours: hours, minutes: mins };
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

  function minutesFromTimeStr(timeStr) {
    var parts = parseTimeParts(timeStr);
    if (!parts) return null;
    return parts.hours * 60 + parts.minutes;
  }

  function timeStrFromMinutes(totalMins) {
    var mins = ((totalMins % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return pad2(h) + ":" + pad2(m);
  }

  function timesForMedicationSchedule(schedule) {
    schedule = schedule || {};
    var times = schedule.doseTimes && schedule.doseTimes.length ? schedule.doseTimes.slice() : ["08:00"];
    var freq = normalizeFrequency(schedule.frequency);
    if (freq === "once_daily" || freq === "every_24_hours") return [times[0] || "08:00"];
    if (freq === "twice_daily") {
      return times.slice(0, 2).length >= 2 ? times.slice(0, 2) : ["08:00", "20:00"];
    }
    if (freq === "three_daily") {
      return times.slice(0, 3).length >= 3 ? times.slice(0, 3) : ["08:00", "14:00", "20:00"];
    }
    if (isIntervalFrequency(freq)) {
      var intervalHours = intervalHoursForFrequency(freq);
      var firstMins = minutesFromTimeStr(times[0] || "08:00");
      if (firstMins == null || !intervalHours) return [times[0] || "08:00"];
      var step = intervalHours * 60;
      var seen = {};
      var out = [];
      var t = firstMins;
      while (t < 1440) {
        var key = timeStrFromMinutes(t);
        if (!seen[key]) {
          seen[key] = true;
          out.push(key);
        }
        t += step;
      }
      return out.length ? out : [times[0] || "08:00"];
    }
    if (freq === "custom") {
      var cs = schedule.customSchedule || {};
      if (cs.type === "every_x_hours" && cs.intervalHours) {
        var customHours = parseInt(cs.intervalHours, 10);
        if (!isNaN(customHours) && customHours > 0) {
          var anchorMins = minutesFromTimeStr(times[0] || "08:00");
          if (anchorMins == null) return [times[0] || "08:00"];
          var customStep = customHours * 60;
          var customSeen = {};
          var customOut = [];
          var ct = anchorMins;
          while (ct < 1440) {
            var ckey = timeStrFromMinutes(ct);
            if (!customSeen[ckey]) {
              customSeen[ckey] = true;
              customOut.push(ckey);
            }
            ct += customStep;
          }
          return customOut.length ? customOut : [times[0] || "08:00"];
        }
      }
    }
    return times;
  }

  function collectUniqueDoseTimesOfDay(settings) {
    var STORE = window.DOSECRAFT_HOME_STORE;
    if (!STORE || !settings) return [];
    var meds = STORE.getTreatmentMedications(settings);
    var seen = {};
    var unique = [];
    meds.forEach(function (med) {
      var schedule = med.schedule || {};
      var times = timesForMedicationSchedule(schedule);
      times.forEach(function (timeStr) {
        var normalized = timeStrFromMinutes(minutesFromTimeStr(timeStr) || 0);
        if (!seen[normalized]) {
          seen[normalized] = true;
          unique.push(normalized);
        }
      });
    });
    unique.sort(function (a, b) {
      return (minutesFromTimeStr(a) || 0) - (minutesFromTimeStr(b) || 0);
    });
    return unique;
  }

  function getDoseSeriesStartDate(settings) {
    var STORE = window.DOSECRAFT_HOME_STORE;
    var course = settings && settings.treatmentSet && settings.treatmentSet.course;
    var startDate = course && course.startDate;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate) {
      var start = new Date(startDate + "T00:00:00");
      if (!isNaN(start.getTime()) && start > today) return start;
    }
    return today;
  }

  function doseRecurrenceCount(settings) {
    var course = settings && settings.treatmentSet && settings.treatmentSet.course;
    var startDate = course && course.startDate;
    var endDate = course && course.endDate;
    if (startDate && endDate) {
      var start = new Date(startDate + "T00:00:00");
      var end = new Date(endDate + "T00:00:00");
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        var days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        if (days > 0 && days < DOSE_COUNT_CAP) return days;
        if (days >= DOSE_COUNT_CAP) return DOSE_COUNT_CAP;
      }
    }
    return DOSE_COUNT_CAP;
  }

  function makeUid(prefix, parts) {
    return prefix + "-" + parts.join("-") + "@dosecraft.local";
  }

  function buildValarm(minutesBefore) {
    return [
      "BEGIN:VALARM",
      "TRIGGER:-PT" + minutesBefore + "M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Dosecraft reminder",
      "END:VALARM",
    ].join("\r\n");
  }

  function buildVisitValarm(minutesBefore) {
    return [
      "BEGIN:VALARM",
      "TRIGGER:-PT" + minutesBefore + "M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Clinic visit",
      "END:VALARM",
    ].join("\r\n");
  }

  function buildDoseReminderICS(settings) {
    var times = collectUniqueDoseTimesOfDay(settings);
    if (!times.length) return "";

    var startDate = getDoseSeriesStartDate(settings);
    var count = doseRecurrenceCount(settings);
    var nowStamp = formatIcsUtcStamp(new Date());
    var events = [];

    times.forEach(function (timeStr, index) {
      var parts = parseTimeParts(timeStr);
      if (!parts) return;
      var dt = new Date(startDate);
      dt.setHours(parts.hours, parts.minutes, 0, 0);
      var uid = makeUid("dosecraft-dose", [timeStr.replace(":", ""), String(index)]);
      events.push(
        [
          "BEGIN:VEVENT",
          "UID:" + uid,
          "DTSTAMP:" + nowStamp,
          "DTSTART:" + formatIcsLocalDateTime(dt),
          "RRULE:FREQ=DAILY;COUNT=" + count,
          "SUMMARY:Dosecraft reminder",
          "DESCRIPTION:" + escapeIcsText("Follow your care team's instructions. Open Dosecraft if you use the dose guide."),
          buildValarm(DOSE_ALARM_MINUTES),
          "END:VEVENT",
        ].join("\r\n")
      );
    });

    if (!events.length) return "";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dosecraft//Dose Reminders//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      events.join("\r\n"),
      "END:VCALENDAR",
    ].join("\r\n");
  }

  function buildWeeklyVisitICS(settings) {
    var appt = settings && settings.treatmentSet && settings.treatmentSet.appointment;
    if (!appt || appt.frequency !== "weekly") return "";
    if (!appt.nextPickupDate) return "";

    var timeStr = appt.nextVisitTime || "";
    var timeParts = parseTimeParts(timeStr);
    if (!timeParts) return "";

    var dt = new Date(appt.nextPickupDate + "T00:00:00");
    if (isNaN(dt.getTime())) return "";
    dt.setHours(timeParts.hours, timeParts.minutes, 0, 0);

    var nowStamp = formatIcsUtcStamp(new Date());
    var uid = makeUid("dosecraft-visit", [appt.nextPickupDate.replace(/-/g, ""), timeStr.replace(":", "")]);

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dosecraft//Weekly Visit//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + nowStamp,
      "DTSTART:" + formatIcsLocalDateTime(dt),
      "RRULE:FREQ=WEEKLY",
      "SUMMARY:Clinic visit",
      "DESCRIPTION:" + escapeIcsText("Follow your care team's appointment instructions."),
      buildVisitValarm(VISIT_ALARM_MINUTES),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    return "download";
  }

  function shareOrDownloadICS(icsString, filename) {
    if (!icsString) {
      return Promise.resolve({ method: "none", message: "" });
    }

    var blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
    var safeName = filename || "dosecraft-reminders.ics";
    var file;
    try {
      file = new File([blob], safeName, { type: "text/calendar" });
    } catch (e) {
      file = null;
    }

    if (file && navigator.share && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file] }).then(function () {
            return { method: "share", message: "" };
          }).catch(function () {
            triggerDownload(blob, safeName);
            return { method: "download", message: "download" };
          });
        }
      } catch (shareErr) {}
    }

    triggerDownload(blob, safeName);
    return Promise.resolve({ method: "download", message: "download" });
  }

  window.DOSECRAFT_ICS = {
    buildDoseReminderICS: buildDoseReminderICS,
    buildWeeklyVisitICS: buildWeeklyVisitICS,
    shareOrDownloadICS: shareOrDownloadICS,
    collectUniqueDoseTimesOfDay: collectUniqueDoseTimesOfDay,
  };
})();
