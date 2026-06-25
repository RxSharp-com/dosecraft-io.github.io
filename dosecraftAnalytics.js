// Dosecraft analytics — central wrapper with Arcade vs Companion privacy rules.
//
// Companion analytics must measure feature usage only, not patient treatment details.
// Never send medication names, schedules, appointment dates, line type, symptoms,
// clinic phone numbers, free-text fields, or localStorage contents.

(function () {
  var APP_VERSION = "1";

  var COMPANION_EVENT_ALLOWLIST = {
    companion_opened: true,
    companion_setup_wizard_started: true,
    companion_setup_started: true,
    companion_setup_completed: true,
    companion_treatment_setup_started: true,
    companion_treatment_setup_completed: true,
    companion_infusion_timer_started: true,
    companion_infusion_timer_completed: true,
    companion_active_timer_game_opened: true,
    companion_active_timer_med_info_opened: true,
    companion_dose_walkthrough_started: true,
    companion_dose_session_completed: true,
    sash_guide_started: true,
    sash_guide_completed: true,
    line_care_viewed: true,
    warning_signs_viewed: true,
    medication_info_viewed: true,
    appointment_card_viewed: true,
    privacy_notice_viewed: true,
    clear_saved_data_clicked: true,
    arcade_opened_from_companion: true,
    reminder_enabled: true,
    reminder_scheduled: true,
  };

  var COMPANION_PROPERTY_ALLOWLIST = {
    mode: true,
    screen: true,
    completed: true,
    duration_bucket: true,
    device_type: true,
    app_version: true,
    clinic_config_id: true,
    lead_minutes_bucket: true,
    at_time_enabled: true,
  };

  // Blocked property keys (Companion and guard-rail for accidental Arcade leakage).
  var SENSITIVE_PROPERTY_KEYS = {
    medication: true,
    medicationname: true,
    medication_name: true,
    drug: true,
    drugid: true,
    drug_id: true,
    medicationid: true,
    medication_id: true,
    medicationothername: true,
    dosetime: true,
    dose_times: true,
    dosetimes: true,
    dosefrequency: true,
    dose_frequency: true,
    appointmentdate: true,
    appointment_date: true,
    nextappointmentdate: true,
    therapystartdate: true,
    therapyenddate: true,
    totalplanneddays: true,
    linetype: true,
    line_type: true,
    heparin: true,
    heparinenabled: true,
    completedat: true,
    scheduledfor: true,
    symptom: true,
    symptoms: true,
    warningsign: true,
    phone: true,
    phonenumber: true,
    primaryphonenumber: true,
    appointmentphonenumber: true,
    pharmacyphonenumber: true,
    localstorage: true,
    settings: true,
    patientid: true,
    patient_id: true,
    diagnosis: true,
    address: true,
    insurance: true,
    payment: true,
    freetext: true,
    freetextfield: true,
    misseddose: true,
  };

  function getAnalyticsConfig() {
    var cfg = window.DOSECRAFT_getClinicConfig
      ? window.DOSECRAFT_getClinicConfig()
      : {};
    var defaults = {
      enabled: true,
      arcadeRemoteAnalytics: true,
      companionRemoteAnalytics: false,
      anonymizeIp: true,
    };
    return Object.assign({}, defaults, cfg.analytics || {});
  }

  function isDevAnalyticsLog() {
    try {
      if (/localhost|127\.0\.0\.1/.test(window.location.hostname)) return true;
      return /(?:^|[?&])dosecraft_analytics_debug=1(?:&|$)/.test(window.location.search || "");
    } catch (e) {
      return false;
    }
  }

  function devLog(message, detail) {
    if (!isDevAnalyticsLog()) return;
    if (detail !== undefined) console.info("[Dosecraft Analytics]", message, detail);
    else console.info("[Dosecraft Analytics]", message);
  }

  function normalizeKey(key) {
    return String(key || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  function isSensitiveProperty(key) {
    return !!SENSITIVE_PROPERTY_KEYS[normalizeKey(key)];
  }

  function isCompanionEvent(eventName) {
    return !!COMPANION_EVENT_ALLOWLIST[eventName];
  }

  function inferDomain(eventName, context) {
    if (context && context.domain) return context.domain;
    if (isCompanionEvent(eventName)) return "companion";
    return "arcade";
  }

  function getDeviceType() {
    try {
      var ua = navigator.userAgent || "";
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
      return "desktop";
    } catch (e) {
      return "unknown";
    }
  }

  function companionDurationBucket(minutes) {
    var m = parseInt(minutes, 10);
    if (isNaN(m) || m < 5) return "under_5m";
    if (m <= 30) return "5_30m";
    if (m <= 120) return "30m_2h";
    return "2h_plus";
  }

  function filterCompanionProperties(properties) {
    var out = {};
    var dropped = [];
    Object.keys(properties || {}).forEach(function (key) {
      if (isSensitiveProperty(key)) {
        dropped.push(key + " (sensitive)");
        return;
      }
      if (!COMPANION_PROPERTY_ALLOWLIST[key]) {
        dropped.push(key + " (not allowlisted)");
        return;
      }
      out[key] = properties[key];
    });
    return { filtered: out, dropped: dropped };
  }

  function sendRemote(eventName, params) {
    try {
      if (typeof gtag === "function") {
        gtag("event", eventName, params);
      }
    } catch (e) {
      console.warn("[Dosecraft Analytics] Remote send failed:", e.message);
    }
  }

  function applyGtagPrivacyConfig(analyticsCfg) {
    try {
      if (typeof gtag !== "function") return;
      var opts = {};
      if (analyticsCfg.anonymizeIp) opts.anonymize_ip = true;
      gtag("config", "G-C34V4019DW", opts);
    } catch (e) {}
  }

  function trackDosecraftEvent(eventName, properties, context) {
    properties = properties || {};
    context = context || {};
    var analyticsCfg = getAnalyticsConfig();
    var domain = inferDomain(eventName, context);

    if (!analyticsCfg.enabled) {
      devLog("Blocked (analytics disabled): " + eventName, { domain: domain });
      return;
    }

    if (domain === "companion") {
      if (!analyticsCfg.companionRemoteAnalytics) {
        devLog("Companion remote analytics disabled: " + eventName);
        return;
      }
      if (!isCompanionEvent(eventName)) {
        devLog("Blocked Companion event (not allowlisted): " + eventName);
        return;
      }
      var companionResult = filterCompanionProperties(properties);
      if (companionResult.dropped.length) {
        devLog("Dropped Companion properties for " + eventName, companionResult.dropped);
      }
      var companionPayload = Object.assign(
        {
          app_version: APP_VERSION,
          device_type: getDeviceType(),
          clinic_config_id: (window.DOSECRAFT_getClinicConfig && window.DOSECRAFT_getClinicConfig().clinicId) || "default",
        },
        companionResult.filtered
      );
      sendRemote(eventName, companionPayload);
      return;
    }

    // Arcade — preserve existing event names/params; companion remote flag does not apply.
    if (!analyticsCfg.arcadeRemoteAnalytics) {
      devLog("Arcade remote analytics disabled: " + eventName);
      return;
    }

    // Guard-rail: strip accidentally sensitive keys from Arcade payloads without changing allowed keys.
    var arcadeParams = {};
    var arcadeDropped = [];
    Object.keys(properties).forEach(function (key) {
      if (isSensitiveProperty(key) && key !== "medication") {
        arcadeDropped.push(key);
        return;
      }
      arcadeParams[key] = properties[key];
    });
    if (arcadeDropped.length) {
      devLog("Dropped sensitive Arcade properties for " + eventName, arcadeDropped);
    }
    sendRemote(eventName, arcadeParams);
  }

  function trackCompanionScreen(eventName, screen, extra) {
    trackDosecraftEvent(
      eventName,
      Object.assign({ mode: "home", screen: screen || "" }, extra || {}),
      { domain: "companion" }
    );
  }

  window.trackDosecraftEvent = trackDosecraftEvent;
  window.trackCompanionScreen = trackCompanionScreen;
  window.dosecraftCompanionDurationBucket = companionDurationBucket;

  // Backward-compatible Arcade helper used by InfusionArcade.js
  window.trackEvent = function (eventName, params) {
    trackDosecraftEvent(eventName, params || {}, { domain: "arcade" });
  };

  window.addEventListener("load", function () {
    applyGtagPrivacyConfig(getAnalyticsConfig());
  });
})();
