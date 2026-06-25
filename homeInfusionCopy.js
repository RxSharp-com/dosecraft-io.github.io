// Static patient-facing copy for Home Infusion Mode.
(function () {
  var CARE_TEAM_NOTE =
    "Follow your care team's instructions. Your instructions may be different. Call your care team if you are unsure.";

  window.DOSECRAFT_HOME_COPY = {
    careTeamNote: CARE_TEAM_NOTE,
    disclaimer:
      "This app does not replace your care team's instructions. If you are unsure, call your care team. For severe or life-threatening symptoms, seek emergency care.",

    treatmentSetupIntro:
      "Choose the medication(s) in your treatment. Each medication may have its own dose times. Put medications in the order your care team told you to give them. If two medications are due at the same time, your Companion can guide them one after another. Follow the exact instructions from your care team.",

    multiMedSafetyNote:
      "Follow your care team's exact order and flushing instructions. If your printed instructions are different, follow those instructions. Contact your care team if your line will not flush, your pump does not seem to be working, or you are unsure what to do.",

    sashIntro:
      "SASH stands for Saline, Administer medication, Saline, and Heparin (if prescribed). This walkthrough supports PICC line elastomeric pump administration. Your steps may differ — follow your care team's instructions.",

    sessionPrepSteps: [
      {
        id: "wash_hands",
        title: "Wash your hands",
        body: "Wash with soap and water for 40–60 seconds and dry with a clean towel or paper towel.",
        phase: "prep",
      },
      {
        id: "gather_supplies",
        title: "Gather supplies",
        body: "Saline syringes, alcohol prep pads, your medication ball(s) or pump supplies, and heparin syringe only if your care team prescribed it.",
        phase: "prep",
      },
      {
        id: "multi_med_safety",
        title: "Follow your care team's order",
        body: "Follow your care team's exact order and flushing instructions. If your printed instructions are different, follow those instructions.",
        phase: "prep",
      },
    ],

    betweenMedicationFlushStep: {
      id: "saline_between",
      title: "Saline flush between medications",
      body: "Flush with saline between medications as your care team directed. Do not force a flush — if you meet resistance, call your care team.",
      phase: "sash",
      letter: "S",
    },

    sessionPostSteps: [
      {
        id: "saline_post_final",
        title: "Saline flush (after final medication)",
        body: "Repeat the saline flush steps your care team taught you after disconnecting the final medication.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "heparin",
        title: "Heparin flush (if prescribed)",
        body: "Use heparin only if your care team prescribed it. Some PICC lines use saline only. Scrub the hub, attach the heparin syringe, flush as directed, remove the syringe, and clamp the line if instructed.",
        phase: "sash",
        letter: "H",
        conditionalHeparin: true,
      },
    ],

    perMedicationSteps: [
      {
        id: "check_label",
        title: "Check the medication label",
        body: "Confirm the medication name and that it matches what your care team prescribed. Call your care team if anything looks wrong.",
        phase: "prep",
      },
      {
        id: "inspect_device",
        title: "Inspect the medication and device",
        body: "Look for leaks, cracks, or cloudiness. Do not use a damaged device. If the solution was refrigerated, your care team may ask you to let it warm at room temperature before use — follow their instructions.",
        phase: "prep",
      },
      {
        id: "scrub_hub",
        title: "Scrub the hub",
        body: "Scrub the end of your PICC line with an alcohol prep pad for at least 15 seconds. Allow it to dry. Do not blow on it.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "saline_pre",
        title: "Saline flush (before medication)",
        body: "Remove air from the saline syringe. Twist onto the line, open the clamp, and flush with saline as your care team directed. Remove the syringe. Do not force a flush — if you meet resistance, make sure clamps are open and call your care team.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "connect_med",
        title: "Connect medication",
        body: "Scrub the hub again with a new alcohol pad for 15 seconds. Attach the elastomeric pump tubing to your line as directed.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "open_clamp",
        title: "Open the clamp",
        body: "Open the clamp on the medication tubing so the infusion can run. Check that there are no kinks in the line.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "start_timer",
        title: "Start infusion timer",
        body: "Start the timer when the medication begins flowing. Follow your care team's timing for this medication.",
        phase: "sash",
        letter: "A",
        hasTimer: true,
      },
      {
        id: "confirm_empty",
        title: "Confirm medication is finished",
        body: "When the ball appears empty and the infusion is complete, close the clamp if your care team instructed you to.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "disconnect",
        title: "Disconnect medication",
        body: "Disconnect the medication tubing from your line as instructed.",
        phase: "sash",
        letter: "A",
      },
    ],

    sashSteps: [
      {
        id: "wash_hands",
        title: "Wash your hands",
        body: "Wash with soap and water for 40–60 seconds and dry with a clean towel or paper towel.",
        phase: "prep",
      },
      {
        id: "gather_supplies",
        title: "Gather supplies",
        body: "Saline syringes, alcohol prep pads, your medication ball (elastomeric pump), and heparin syringe only if your care team prescribed it.",
        phase: "prep",
      },
      {
        id: "check_label",
        title: "Check the medication label",
        body: "Confirm the medication name and that it matches what your care team prescribed. Call your care team if anything looks wrong.",
        phase: "prep",
      },
      {
        id: "inspect_device",
        title: "Inspect the medication and device",
        body: "Look for leaks, cracks, or cloudiness. Do not use a damaged device. If the solution was refrigerated, your care team may ask you to let it warm at room temperature before use — follow their instructions.",
        phase: "prep",
      },
      {
        id: "scrub_hub",
        title: "Scrub the hub",
        body: "Scrub the end of your PICC line with an alcohol prep pad for at least 15 seconds. Allow it to dry. Do not blow on it.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "saline_pre",
        title: "Saline flush (before medication)",
        body: "Remove air from the saline syringe. Twist onto the line, open the clamp, and flush with saline as your care team directed. Remove the syringe. Do not force a flush — if you meet resistance, make sure clamps are open and call your care team.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "connect_med",
        title: "Connect medication",
        body: "Scrub the hub again with a new alcohol pad for 15 seconds. Attach the elastomeric pump tubing to your line as directed.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "open_clamp",
        title: "Open the clamp",
        body: "Open the clamp on the medication tubing so the infusion can run. Check that there are no kinks in the line.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "start_timer",
        title: "Start infusion timer",
        body: "Start the timer when the medication begins flowing. Most elastomeric doses run about 30 minutes; some run longer. Follow your care team's timing.",
        phase: "sash",
        letter: "A",
        hasTimer: true,
      },
      {
        id: "confirm_empty",
        title: "Confirm medication is finished",
        body: "When the ball appears empty and the infusion is complete, close the clamp if your care team instructed you to.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "disconnect",
        title: "Disconnect medication",
        body: "Disconnect the medication tubing from your line as instructed.",
        phase: "sash",
        letter: "A",
      },
      {
        id: "saline_post",
        title: "Saline flush (after medication)",
        body: "Repeat the saline flush steps your care team taught you after disconnecting the medication.",
        phase: "sash",
        letter: "S",
      },
      {
        id: "heparin",
        title: "Heparin flush (if prescribed)",
        body: "Use heparin only if your care team prescribed it. Some PICC lines use saline only. Scrub the hub, attach the heparin syringe, flush as directed, remove the syringe, and clamp the line if instructed.",
        phase: "sash",
        letter: "H",
        conditionalHeparin: true,
      },
      {
        id: "log_dose",
        title: "Log dose complete",
        body: "Mark this dose as complete so your dashboard shows the next scheduled dose.",
        phase: "done",
      },
    ],

    warningSigns: {
      callClinic: [
        "Fever or worsening infection symptoms",
        "New rash, itching, or concerning side effects",
        "Persistent or concerning diarrhea",
        "Nausea or vomiting preventing intake",
        "PICC or midline redness, pain, swelling, drainage, leaking, or loose dressing",
        "Arm swelling",
        "Missed dose",
        "Medication or device problem",
        "Unsure whether the dose infused correctly",
        "Hard to flush the line — do not force a flush",
      ],
      seekUrgent: [
        "Trouble breathing",
        "Swelling of face, lips, or tongue",
        "Chest pain",
        "Severe dizziness or fainting",
        "Confusion",
        "Severe allergic reaction symptoms",
        "Severe diarrhea with dehydration",
        "Sudden severe arm or line symptoms",
      ],
    },

    lineCare: [
      "Keep the dressing clean and dry",
      "Do not pull or tug on the line",
      "Keep clamps and caps secure as instructed",
      "Call your care team for redness, swelling, pain, drainage, leaking, fever, chills, a loose dressing, or trouble flushing",
      "Follow your nurse or pharmacy instructions for line care",
      "If you meet resistance flushing, make sure clamps are open. Do not force a flush — call your care team.",
    ],

    clinicReactionWarnings: [
      "Slow infusion rates are often intentional — especially for IVIG.",
      "Tell your nurse right away if you feel chills, fever, headache, nausea, rash, or trouble breathing during infusion.",
      "Severe allergic symptoms need urgent attention — tell staff immediately.",
    ],

    infusionDurationPresets: [
      { label: "30 minutes", mins: 30 },
      { label: "60 minutes", mins: 60 },
      { label: "90 minutes", mins: 90 },
      { label: "5 hours", mins: 300 },
      { label: "24 hours", mins: 1440 },
    ],
  };
})();
