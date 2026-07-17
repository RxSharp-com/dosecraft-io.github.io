// Shared Care Team Contact card — reads from clinicConfig.js helpers only.
function CareTeamContact(props) {
  var cfg = window.DOSECRAFT_getClinicConfig();
  var phoneHref = window.DOSECRAFT_clinicPhoneHref;
  var primaryPhone = window.DOSECRAFT_getPrimaryClinicPhone(cfg);
  var appointmentPhone = window.DOSECRAFT_getAppointmentPhone(cfg);
  var pharmacyPhone = window.DOSECRAFT_getPharmacyPhone(cfg);

  var variant = props.variant || "full";
  var accent = props.accentColor || (cfg.branding && cfg.branding.primaryColor) || "#2a9d8f";
  var showEmergency = props.showEmergency !== false;

  var card = {
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 16,
    padding: "18px 20px",
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 1.55,
    boxShadow: "0 10px 32px rgba(4, 18, 32, 0.28)",
  };

  var sectionLabel = {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: 700,
    color: "rgba(244, 248, 252, 0.58)",
    marginBottom: 10,
  };

  function PhoneLink(props) {
    if (!props.number) return null;
    var href = phoneHref(props.number);
    var style = {
      display: "inline-block",
      fontSize: variant === "compact" || variant === "help" ? 18 : 20,
      fontWeight: 700,
      color: accent,
      textDecoration: "none",
      touchAction: "manipulation",
    };
    if (href) return <a href={href} style={style}>{props.number}</a>;
    return <span style={style}>{props.number}</span>;
  }

  function PhoneRow(props) {
    if (!props.number) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{props.label}</div>
        <PhoneLink number={props.number} />
      </div>
    );
  }

  if (variant === "emergency") {
    if (!showEmergency || !cfg.emergencyInstructions) return null;
    return (
      <div className="dc-care-team-card dc-warnings-urgent" style={{
        ...card,
        marginBottom: props.noMargin ? 0 : 16,
      }}>
        <div style={{ ...sectionLabel, color: "#f0a99e" }}>Emergency</div>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: 15 }}>{cfg.emergencyInstructions}</p>
      </div>
    );
  }

  var routineTitle =
    variant === "help"
      ? "Questions or problems? Call your clinic."
      : "Call your care team";

  var showConfiguredContact = cfg.showClinicContact;
  var hasAnyPhone = !!(primaryPhone || appointmentPhone || pharmacyPhone);
  var displayName = cfg.clinicDisplayName || cfg.clinicName;

  var routineBlock = (
    <div className="dc-care-team-card" style={{
      ...card,
      borderLeft: variant === "full" ? "4px solid " + accent : card.border,
      marginBottom: showEmergency && cfg.emergencyInstructions ? 12 : 16,
    }}>
      <div style={sectionLabel}>{routineTitle}</div>
      {showConfiguredContact && displayName && (
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{displayName}</div>
      )}
      {showConfiguredContact && primaryPhone && (
        <PhoneRow number={primaryPhone} label={hasAnyPhone && (appointmentPhone || pharmacyPhone) ? "Main line" : "Clinic phone"} />
      )}
      {showConfiguredContact && cfg.afterHoursInstructions && (
        <p style={{ margin: "0 0 10px", fontSize: 15, color: "rgba(255,255,255,0.65)" }}>{cfg.afterHoursInstructions}</p>
      )}
      {showConfiguredContact && appointmentPhone && (
        <PhoneRow number={appointmentPhone} label="Appointments / labs" />
      )}
      {showConfiguredContact && pharmacyPhone && (
        <PhoneRow number={pharmacyPhone} label="Pharmacy" />
      )}
      {variant === "compact" && showConfiguredContact && cfg.appointmentInstructions && (
        <p style={{ margin: "0 0 6px", fontSize: 15, color: "rgba(255,255,255,0.65)" }}>{cfg.appointmentInstructions}</p>
      )}
      {(!showConfiguredContact || !hasAnyPhone) && (
        <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.65)" }}>
          Call your care team using the phone number they provided.
        </p>
      )}
    </div>
  );

  var emergencyBlock = showEmergency && cfg.emergencyInstructions ? (
    <div className="dc-care-team-card dc-warnings-urgent" style={{
      ...card,
      marginBottom: 0,
    }}>
      <div style={{ ...sectionLabel, color: "#f0a99e" }}>Emergency</div>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: 15 }}>{cfg.emergencyInstructions}</p>
    </div>
  ) : null;

  return (
    <div style={props.noMargin ? { margin: 0 } : undefined}>
      {routineBlock}
      {emergencyBlock}
    </div>
  );
}
