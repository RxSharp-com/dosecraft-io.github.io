// Clinic profile configuration — single file for clinic-specific Dosecraft settings.
//
// To deploy for a new clinic: edit DOSECRAFT_CLINIC_CONFIG below only.
// Do not scatter clinic phone numbers, disclaimers, or module flags across screens.
//
// Future licensing path: clinic-specific deployments or QR links can provide a
// different DOSECRAFT_CLINIC_CONFIG before app startup (inline script or swapped file).
// TODO: URL/QR param to select config file without backend (e.g. ?clinicId=acme).

(function () {
  var DEFAULT_CLINIC_CONFIG = {
    configVersion: 1,
    clinicId: "default",
    clinicName: "",
    clinicDisplayName: "",
    primaryPhoneNumber: "",
    appointmentPhoneNumber: "",
    pharmacyPhoneNumber: "",
    faxNumber: "",
    afterHoursInstructions: "",
    appointmentInstructions:
      "Call your clinic if you need to reschedule or have questions about appointments.",
    emergencyInstructions:
      "For severe or life-threatening symptoms, call 911 or your local emergency number.",
    showClinicContact: true,

    enabledModules: {
      homeInfusion: true,
      clinicInfusion: true,
      infusionArcade: true,
      sashGuide: true,
      appointmentReminders: true,
      medicationEducation: true,
      lineCare: true,
      doseReminders: false,
    },

    enabledMedications: [],

    branding: {
      logoUrl: "",
      primaryColor: "",
      showPoweredByDosecraft: true,
    },

    disclaimers: {
      general:
        "This app supports, but does not replace, instructions from your care team.",
      medication:
        "Medication information may not include every possible side effect or instruction. Follow your care team's instructions.",
      lineCare:
        "Line care instructions may vary. Follow the instructions given by your nurse, pharmacist, or prescriber.",
      privacyAnalytics:
        "Dosecraft saves your setup on this device only. If anonymous usage analytics are enabled, Dosecraft does not send your medication schedule, appointment times, symptoms, or personal identifying information.",
    },

    analytics: {
      enabled: true,
      arcadeRemoteAnalytics: true,
      companionRemoteAnalytics: false,
      anonymizeIp: true,
    },

    lineCare: {
      heparinDefaultOn: false,
    },
  };

  var EMERGENCY_FALLBACK =
    "For severe or life-threatening symptoms, call 911 or your local emergency number.";

  // Clinic-specific overrides — edit this object for each licensed deployment.
  // Demo: Infectious Disease Specialists of Northwest Arkansas
  window.DOSECRAFT_CLINIC_CONFIG = {
    clinicId: "ids-nwa",
    clinicName: "Infectious Disease Specialists of Northwest Arkansas",
    clinicDisplayName: "Infectious Disease Specialists of Northwest Arkansas",
    primaryPhoneNumber: "(479) 444-6691",
    appointmentPhoneNumber: "(479) 444-6691",
    pharmacyPhoneNumber: "(479) 444-6691",
    // TODO: Verify fax number before patient-facing production use.
    faxNumber: "(479) 444-0117",
    afterHoursInstructions:
      "For urgent concerns after hours, call (281)318-5241. For severe symptoms such as trouble breathing, chest pain, or swelling of the face or throat, call 911.",
    showClinicContact: true,
    lineCare: {
      heparinDefaultOn: true,
    },
  };

  function isPlainObject(val) {
    return val !== null && typeof val === "object" && !Array.isArray(val);
  }

  function deepMerge(base, overrides) {
    var out = Object.assign({}, base);
    if (!overrides || typeof overrides !== "object") return out;
    Object.keys(overrides).forEach(function (key) {
      var val = overrides[key];
      if (val === undefined) return;
      if (isPlainObject(val) && isPlainObject(base[key])) {
        out[key] = deepMerge(base[key], val);
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  function normalizeEmergencyInstructions(text) {
    if (typeof text === "string" && text.trim()) return text.trim();
    return EMERGENCY_FALLBACK;
  }

  function getClinicConfig() {
    var merged = deepMerge(DEFAULT_CLINIC_CONFIG, window.DOSECRAFT_CLINIC_CONFIG || {});
    merged.configVersion = merged.configVersion || DEFAULT_CLINIC_CONFIG.configVersion;
    merged.clinicId = merged.clinicId || DEFAULT_CLINIC_CONFIG.clinicId;
    merged.clinicDisplayName = merged.clinicDisplayName || merged.clinicName || DEFAULT_CLINIC_CONFIG.clinicDisplayName;
    merged.clinicName = merged.clinicName || merged.clinicDisplayName || DEFAULT_CLINIC_CONFIG.clinicName;
    merged.emergencyInstructions = normalizeEmergencyInstructions(merged.emergencyInstructions);
    merged.enabledModules = deepMerge(DEFAULT_CLINIC_CONFIG.enabledModules, merged.enabledModules || {});
    merged.branding = deepMerge(DEFAULT_CLINIC_CONFIG.branding, merged.branding || {});
    merged.disclaimers = deepMerge(DEFAULT_CLINIC_CONFIG.disclaimers, merged.disclaimers || {});
    merged.analytics = deepMerge(DEFAULT_CLINIC_CONFIG.analytics, merged.analytics || {});
    merged.lineCare = deepMerge(DEFAULT_CLINIC_CONFIG.lineCare, merged.lineCare || {});
    if (!Array.isArray(merged.enabledMedications)) merged.enabledMedications = [];
    return merged;
  }

  function phoneTelHref(number) {
    if (!number || typeof number !== "string") return null;
    var digits = number.replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : null;
  }

  function getPrimaryClinicPhone(cfg) {
    return (cfg || getClinicConfig()).primaryPhoneNumber || "";
  }

  function getAppointmentPhone(cfg) {
    return (cfg || getClinicConfig()).appointmentPhoneNumber || "";
  }

  function getPharmacyPhone(cfg) {
    return (cfg || getClinicConfig()).pharmacyPhoneNumber || "";
  }

  function hasRoutineContact(cfg) {
    cfg = cfg || getClinicConfig();
    if (!cfg.showClinicContact) return false;
    return !!(
      cfg.clinicName ||
      cfg.clinicDisplayName ||
      getPrimaryClinicPhone(cfg) ||
      cfg.afterHoursInstructions ||
      getAppointmentPhone(cfg) ||
      getPharmacyPhone(cfg)
    );
  }

  function isModuleEnabled(moduleName) {
    var cfg = getClinicConfig();
    var modules = cfg.enabledModules || {};
    if (Object.prototype.hasOwnProperty.call(modules, moduleName)) {
      return modules[moduleName] !== false;
    }
    if (Object.prototype.hasOwnProperty.call(DEFAULT_CLINIC_CONFIG.enabledModules, moduleName)) {
      return DEFAULT_CLINIC_CONFIG.enabledModules[moduleName] !== false;
    }
    return true;
  }

  function normalizeDrugId(drugId) {
    if (drugId == null) return null;
    var n = parseInt(drugId, 10);
    return isNaN(n) ? drugId : n;
  }

  function isMedicationEnabled(drugId) {
    var cfg = getClinicConfig();
    var list = cfg.enabledMedications;
    if (!list || !list.length) return true;
    var id = normalizeDrugId(drugId);
    return list.some(function (entry) {
      return normalizeDrugId(entry) === id;
    });
  }

  function filterEnabledDrugs(drugs) {
    var list = (drugs || []).slice();
    var cfg = getClinicConfig();
    if (!cfg.enabledMedications || !cfg.enabledMedications.length) return list;
    return list.filter(function (d) {
      return d && isMedicationEnabled(d.id);
    });
  }

  function isSavedMedicationDisabled(settings) {
    if (!settings) return false;
    var meds = [];
    if (settings.treatmentSet && settings.treatmentSet.medications) {
      meds = settings.treatmentSet.medications;
    } else if (settings.medicationId != null || settings.medicationIsOther) {
      meds = [{
        medicationId: settings.medicationId,
        medicationIsOther: settings.medicationIsOther,
        medicationOtherName: settings.medicationOtherName,
      }];
    }
    return meds.some(function (med) {
      if (med.medicationIsOther) return false;
      if (med.medicationOtherName && (med.medicationOtherName || "").trim()) return false;
      if (med.medicationId == null) return false;
      return !isMedicationEnabled(med.medicationId);
    });
  }

  window.DOSECRAFT_DEFAULT_CLINIC_CONFIG = DEFAULT_CLINIC_CONFIG;
  window.DOSECRAFT_getClinicConfig = getClinicConfig;
  window.DOSECRAFT_clinicPhoneHref = phoneTelHref;
  window.DOSECRAFT_hasRoutineClinicContact = hasRoutineContact;
  window.DOSECRAFT_getPrimaryClinicPhone = getPrimaryClinicPhone;
  window.DOSECRAFT_getAppointmentPhone = getAppointmentPhone;
  window.DOSECRAFT_getPharmacyPhone = getPharmacyPhone;
  window.DOSECRAFT_isModuleEnabled = isModuleEnabled;
  window.DOSECRAFT_isMedicationEnabled = isMedicationEnabled;
  window.DOSECRAFT_filterEnabledDrugs = filterEnabledDrugs;
  window.DOSECRAFT_isSavedMedicationDisabled = isSavedMedicationDisabled;
})();
