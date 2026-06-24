// Care Team Contact — single configuration file for clinic-specific contact info.
//
// To deploy for a new clinic: edit DOSECRAFT_CLINIC_CONFIG below only.
// Do not add phone numbers to individual screens elsewhere in the app.

(function () {
  window.DOSECRAFT_CLINIC_CONFIG = {
    clinicName: "Your Home Infusion Clinic",
    primaryPhoneNumber: "",
    afterHoursInstructions:
      "If you reach voicemail after routine hours, follow the instructions your care team gave you.",
    appointmentPhoneNumber: "",
    pharmacyPhoneNumber: "",
    emergencyInstructions:
      "For severe or life-threatening symptoms, seek emergency care. Call 911 or your local emergency number if needed.",
    showClinicContact: true,
  };

  var DEFAULTS = {
    clinicName: "Your Home Infusion Clinic",
    primaryPhoneNumber: "",
    afterHoursInstructions: "",
    appointmentPhoneNumber: "",
    pharmacyPhoneNumber: "",
    emergencyInstructions:
      "For severe or life-threatening symptoms, seek emergency care. Call 911 or your local emergency number if needed.",
    showClinicContact: true,
  };

  function getClinicConfig() {
    return Object.assign({}, DEFAULTS, window.DOSECRAFT_CLINIC_CONFIG || {});
  }

  function phoneTelHref(number) {
    if (!number || typeof number !== "string") return null;
    var digits = number.replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : null;
  }

  function hasRoutineContact(cfg) {
    cfg = cfg || getClinicConfig();
    if (!cfg.showClinicContact) return false;
    return !!(
      cfg.clinicName ||
      cfg.primaryPhoneNumber ||
      cfg.afterHoursInstructions ||
      cfg.appointmentPhoneNumber ||
      cfg.pharmacyPhoneNumber
    );
  }

  window.DOSECRAFT_getClinicConfig = getClinicConfig;
  window.DOSECRAFT_clinicPhoneHref = phoneTelHref;
  window.DOSECRAFT_hasRoutineClinicContact = hasRoutineContact;
})();
