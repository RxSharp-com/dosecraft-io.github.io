// Shared Care Team Contact card — reads from clinicConfig.js only.
function CareTeamContact(props) {
  var cfg = window.DOSECRAFT_getClinicConfig();
  var phoneHref = window.DOSECRAFT_clinicPhoneHref;

  var variant = props.variant || "full";
  var accent = props.accentColor || "#2a9d8f";
  var showEmergency = props.showEmergency !== false;

  var card = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 14,
    fontSize: 16,
    lineHeight: 1.55,
  };

  var sectionLabel = {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
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
      <div style={{
        ...card,
        borderColor: "rgba(231,111,81,0.35)",
        background: "rgba(231,111,81,0.1)",
        marginBottom: props.noMargin ? 0 : 14,
      }}>
        <div style={{ ...sectionLabel, color: "#e76f51" }}>Emergency</div>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: 15 }}>{cfg.emergencyInstructions}</p>
      </div>
    );
  }

  var routineTitle =
    variant === "help"
      ? "Questions or problems? Call your clinic."
      : "Call your care team";

  var showConfiguredContact = cfg.showClinicContact;
  var hasAnyPhone = !!(cfg.primaryPhoneNumber || cfg.appointmentPhoneNumber || cfg.pharmacyPhoneNumber);

  var routineBlock = (
    <div style={{
      ...card,
      borderLeft: variant === "full" ? "4px solid " + accent : card.border,
      marginBottom: showEmergency && cfg.emergencyInstructions ? 10 : 14,
    }}>
      <div style={sectionLabel}>{routineTitle}</div>
      {showConfiguredContact && cfg.clinicName && (
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{cfg.clinicName}</div>
      )}
      {showConfiguredContact && cfg.primaryPhoneNumber && (
        <PhoneRow number={cfg.primaryPhoneNumber} label={hasAnyPhone && (cfg.appointmentPhoneNumber || cfg.pharmacyPhoneNumber) ? "Main line" : "Clinic phone"} />
      )}
      {showConfiguredContact && cfg.afterHoursInstructions && (
        <p style={{ margin: "0 0 10px", fontSize: 15, color: "rgba(255,255,255,0.65)" }}>{cfg.afterHoursInstructions}</p>
      )}
      {showConfiguredContact && cfg.appointmentPhoneNumber && (
        <PhoneRow number={cfg.appointmentPhoneNumber} label="Appointments / labs" />
      )}
      {showConfiguredContact && cfg.pharmacyPhoneNumber && (
        <PhoneRow number={cfg.pharmacyPhoneNumber} label="Pharmacy" />
      )}
      {(!showConfiguredContact || !hasAnyPhone) && (
        <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.65)" }}>
          Call your care team using the phone number they provided.
        </p>
      )}
    </div>
  );

  var emergencyBlock = showEmergency && cfg.emergencyInstructions ? (
    <div style={{
      ...card,
      borderColor: "rgba(231,111,81,0.35)",
      background: "rgba(231,111,81,0.1)",
      marginBottom: 0,
    }}>
      <div style={{ ...sectionLabel, color: "#e76f51" }}>Emergency</div>
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
