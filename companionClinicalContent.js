// Dosecraft Companion — pharmacist-approved clinical content registry (Draft v3, July 6, 2026).
// Loaded via <script src="companionClinicalContent.js"> on index.html.
// internalReviewNote fields are for developer/pharmacist review only — never patient-facing.

(function () {
  var SHARED_MODULE_IDS = ["seriousDiarrhea", "seriousAllergy", "homeInfusionLineConcerns"];

  window.COMPANION_SHARED_SAFETY_MODULES = {
    seriousDiarrhea: {
      id: "seriousDiarrhea",
      title: "All antibiotics - serious diarrhea warning",
      items: [
        "Call your care team promptly if you have watery or bloody diarrhea, severe belly cramps, fever with diarrhea, or diarrhea that starts after antibiotics are finished.",
      ],
    },
    seriousAllergy: {
      id: "seriousAllergy",
      title: "All antibiotics - serious allergy warning",
      items: [
        "Get urgent help now for trouble breathing, swelling of the face, lips, tongue, or throat, fainting, or a severe rash.",
      ],
    },
    homeInfusionLineConcerns: {
      id: "homeInfusionLineConcerns",
      title: "Home infusion line concerns",
      items: [
        "Call your care team if your line site becomes red, warm, swollen, painful, or has drainage.",
        "Call if your dressing is wet or loose, the line leaks, the line will not flush, or you have fever or shaking chills during or after an infusion.",
        "Do not force a line that will not flush. Follow your care team's line instructions.",
      ],
    },
  };

  window.COMPANION_CLINICAL_CONTENT = {
    1: {
      drugId: 1,
      displayName: "Zosyn",
      genericName: "piperacillin/tazobactam",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Zosyn is an antibiotic used for serious bacterial infections. It weakens the bacteria's outer wall. Tazobactam helps protect the antibiotic from some bacterial defenses.",
      whatYouMayNotice: [
        "Mild upset stomach, loose stool, headache, or a mild rash can happen.",
        "Your care team may check labs during longer courses.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "Unusual bruising or bleeding, new fever, sore throat, or feeling much weaker than usual.",
        "New confusion, shaking, twitching, or jerking movements, especially if you have kidney problems or a seizure history.",
      ],
      urgentHelp: [
        "A seizure or seizure-like episode, trouble breathing, swelling of the face, lips, tongue, or throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Kidney function",
        "Blood counts",
        "Electrolytes such as potassium, especially with longer therapy or higher-risk patients",
      ],
      internalReviewNote: "Do not over-explain sodium content in patient copy unless the patient has a fluid/salt restriction. Consider a conditional note if clinic config supports it. Resolved: the kidney-risk consideration associated with combined piperacillin-tazobactam and vancomycin therapy remains internal-only and must not be surfaced as a patient-facing warning naming the combination. The existing general \"kidney function\" item under Labs your care team may watch is sufficient patient-facing coverage.",
    },
    2: {
      drugId: 2,
      displayName: "Ancef",
      genericName: "cefazolin",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Cefazolin is an antibiotic often used for skin, bone, joint, blood, or heart valve infections caused by bacteria it can treat. It works by weakening the bacteria's outer wall.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, or mild rash can happen.",
        "Many patients receive cefazolin at home because it is commonly used for longer infection treatments.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "Unusual bruising, bleeding that is hard to stop, blood in the urine or stool, or many new purple spots on the skin.",
        "New rash, hives, or itching.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face, lips, tongue, or throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Kidney function",
        "Blood counts",
        "Sometimes clotting labs if you are at higher bleeding risk, on a blood thinner, poorly nourished, or on a long course",
      ],
      internalReviewNote: "Bleeding language should probably be shown as \"call care team\" rather than \"urgent\" unless bleeding is heavy or severe. This warning is most useful for prolonged therapy and higher-risk patients.",
    },
    3: {
      drugId: 3,
      displayName: "Rocephin",
      genericName: "ceftriaxone",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Ceftriaxone is a once-daily antibiotic used for many bacterial infections. It weakens the bacteria's outer wall.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, or soreness at the infusion site can happen.",
        "Your care team may watch labs during treatment, especially if treatment lasts more than a few days.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "New right upper belly pain, nausea that does not let up, vomiting, yellowing of the skin or eyes, or dark urine.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face, lips, tongue, or throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Blood counts",
        "Liver tests if clinically needed",
      ],
      internalReviewNote: "Resolved: patient-facing calcium/TPN counseling is out of scope for the current Companion release and is not included by default. Resolved: routine bleeding/bruising counseling has been removed from the default patient-facing card, since the pharmacist does not routinely counsel all ceftriaxone patients on this. Bleeding/bruising counseling may still be provided individually when patient-specific risk factors (blood thinner use, poor nutrition, liver disease, prolonged therapy) make it clinically relevant, but it should not appear in the default Rocephin copy.",
    },
    4: {
      drugId: 4,
      displayName: "Maxipime",
      genericName: "cefepime",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Cefepime is an antibiotic used for serious bacterial infections. It weakens the bacteria's outer wall and is often used when broader coverage is needed.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, headache, or mild rash can happen.",
        "Kidney function matters with this medicine because the dose may need adjustment.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "New confusion, unusual sleepiness, seeing or hearing things that are not there, trouble speaking, twitching or jerking movements, or seizure-like activity.",
        "New rash, hives, or itching.",
      ],
      urgentHelp: [
        "A seizure, severe confusion, trouble waking up, trouble breathing, swelling of the face/lips/tongue/throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Kidney function",
        "Blood counts",
        "Other labs based on infection and duration",
      ],
      internalReviewNote: "Cefepime neurotoxicity is the distinctive patient-facing warning. Keep it short but prominent, especially for home patients with renal dysfunction.",
    },
    5: {
      drugId: 5,
      displayName: "Invanz",
      genericName: "ertapenem",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Ertapenem is a once-daily antibiotic used for serious bacterial infections. It weakens the bacteria's outer wall and covers a broad range of bacteria.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, headache, or infusion-site irritation can happen.",
        "Tell your care team if you take valproic acid or divalproex, which are sometimes used for seizures, bipolar disorder, or migraine prevention.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "New confusion, shaking, twitching, or seizure-like activity.",
        "Worsening rash, hives, or itching.",
      ],
      urgentHelp: [
        "A seizure, trouble breathing, swelling of the face/lips/tongue/throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Kidney function",
        "Blood counts",
        "Liver tests if clinically needed",
      ],
      internalReviewNote: "The valproate interaction is clinically important but uncommon. Patient copy should say \"tell your care team,\" not \"stop valproate.\"",
    },
    6: {
      drugId: 6,
      displayName: "Merrem",
      genericName: "meropenem",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Meropenem is a broad antibiotic used for serious bacterial infections. It weakens the bacteria's outer wall.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, headache, or rash can happen.",
        "Tell your care team if you take valproic acid or divalproex, which are sometimes used for seizures, bipolar disorder, or migraine prevention.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "New confusion, shaking, twitching, or seizure-like activity.",
        "New or worsening rash.",
      ],
      urgentHelp: [
        "A seizure, trouble breathing, swelling of the face/lips/tongue/throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Kidney function",
        "Blood counts",
        "Liver tests if clinically needed",
      ],
      internalReviewNote: "Similar carbapenem warning pattern as ertapenem. Keep valproate note patient-facing because consequences can be major.",
    },
    7: {
      drugId: 7,
      displayName: "Vancomycin (IV)",
      genericName: "vancomycin",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Vancomycin is an antibiotic used for serious infections caused by certain Gram-positive bacteria. It blocks bacteria from building a strong outer wall.",
      whatYouMayNotice: [
        "Your care team may check blood levels or kidney labs to keep the dose in a safe range.",
        "Some people get flushing, itching, rash, chest or back tightness, or dizziness during the infusion. Slowing the infusion often helps, but your care team needs to know.",
      ],
      callCareTeam: [
        "Flushing, itching, rash, chest or back tightness, dizziness, or feeling faint during or soon after the infusion.",
        "Less urine than usual, new swelling, sudden weight gain, or feeling very dehydrated.",
        "Ringing in the ears or new hearing changes.",
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face/lips/tongue/throat, fainting, chest pain, or a severe rash.",
      ],
      labsWatched: [
        "Vancomycin level, if ordered",
        "Kidney function",
        "Blood counts if therapy is longer",
      ],
      internalReviewNote: "Infusion reaction language should be very practical for home infusion. Avoid outdated wording such as \"red man syndrome.\" Use \"vancomycin infusion reaction.\"",
    },
    8: {
      drugId: 8,
      displayName: "Cubicin",
      genericName: "daptomycin",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Daptomycin is an antibiotic used for serious infections caused by certain Gram-positive bacteria. It damages the bacteria's outer covering.",
      whatYouMayNotice: [
        "Your care team may check a muscle lab called CPK while you are on this medicine.",
        "Tell your care team if you take a statin cholesterol medicine. Do not stop it unless your care team tells you to.",
      ],
      callCareTeam: [
        "New or worsening muscle pain, muscle tenderness, or muscle weakness, especially in the arms or legs.",
        "New numbness, tingling, or burning pain.",
        "New cough, fever, chest discomfort, or shortness of breath, especially after you have been on daptomycin for a couple of weeks.",
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
      ],
      urgentHelp: [
        "Severe weakness, trouble breathing, chest pain, fainting, swelling of the face/lips/tongue/throat, or a severe rash.",
      ],
      labsWatched: [
        "CPK muscle lab",
        "Kidney function",
        "Blood counts or other labs based on infection and duration",
      ],
      internalReviewNote: "This is one of the highest-yield drug-specific pages. CPK, muscle symptoms, statins, neuropathy, and eosinophilic pneumonia are useful and patient-relevant.",
    },
    13: {
      drugId: 13,
      displayName: "Penicillin G potassium",
      genericName: "penicillin G",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Penicillin G is an antibiotic used for certain bacteria that are sensitive to penicillin. It weakens the bacteria's outer wall.",
      whatYouMayNotice: [
        "This form contains potassium. Your care team may watch your potassium and kidney function, especially with higher doses.",
        "Mild diarrhea, nausea, or rash can happen.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "New confusion, twitching, jerking movements, or seizure-like activity, especially with kidney problems.",
        "New rash, hives, or itching.",
      ],
      urgentHelp: [
        "Chest pain, fainting, severe weakness, trouble breathing, a new irregular heartbeat, a seizure, or symptoms of a severe allergic reaction.",
      ],
      labsWatched: [
        "Potassium and other electrolytes",
        "Kidney function",
        "Blood counts if therapy is prolonged",
      ],
      internalReviewNote: "Avoid giving patients mEq math. The important patient-facing concept is: this contains potassium, labs matter, and severe heart/weakness symptoms need urgent care.",
    },
    14: {
      drugId: 14,
      displayName: "Dalvance",
      genericName: "dalbavancin",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Dalbavancin is a long-acting antibiotic used for certain skin and soft tissue infections. It blocks bacteria from building a strong outer wall.",
      whatYouMayNotice: [
        "Nausea, headache, diarrhea, or mild itching can happen.",
        "This medicine stays in your body for a long time, so follow-up still matters even after the infusion is finished.",
      ],
      callCareTeam: [
        "Rash, itching, hives, flushing, or feeling lightheaded during or after the infusion.",
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "Symptoms that start days after the infusion and feel new or concerning.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face/lips/tongue/throat, fainting, chest pain, or a severe rash.",
      ],
      labsWatched: [
        "Usually limited after a one-time or two-dose course, unless your care team orders follow-up labs",
        "Liver or kidney labs if clinically needed",
      ],
      internalReviewNote: "Long half-life is the practical patient point. Tell other clinicians they received dalbavancin recently if new symptoms occur.",
    },
    15: {
      drugId: 15,
      displayName: "Teflaro",
      genericName: "ceftaroline fosamil",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Ceftaroline is an antibiotic that weakens the bacteria's outer wall. It can treat some bacteria that do not respond to older antibiotics.",
      whatYouMayNotice: [
        "Mild diarrhea, nausea, headache, or rash can happen.",
        "Your care team may watch blood counts, especially if therapy lasts longer.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "Unusual tiredness, pale skin, shortness of breath with normal activity, yellowing of the skin or eyes, or dark urine.",
        "New rash, hives, or itching.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face/lips/tongue/throat, fainting, or a severe rash.",
      ],
      labsWatched: [
        "Blood counts",
        "Kidney function",
        "Other labs based on infection and duration",
      ],
      internalReviewNote: "Coombs/hemolytic anemia warning should be concise and symptom-based. It is not common enough to dominate the card, but it is distinctive for longer therapy.",
    },
    16: {
      drugId: 16,
      displayName: "Doxycycline (IV)",
      genericName: "doxycycline",
      medicationType: "Antibiotic",
      sharedModuleIds: SHARED_MODULE_IDS.slice(),
      howItHelps: "Doxycycline is an antibiotic that stops bacteria from making proteins they need to grow.",
      whatYouMayNotice: [
        "Your skin may burn more easily in sunlight. Use sun protection and avoid tanning beds.",
        "Mild nausea, diarrhea, or headache can happen.",
      ],
      callCareTeam: [
        "Watery or bloody diarrhea, severe belly cramps, or fever with diarrhea.",
        "A severe sunburn-like rash, blistering skin, or a rash that spreads quickly.",
        "Severe headache, blurry vision, double vision, or vision loss.",
        "Tell your care team if you are pregnant, planning pregnancy, or breastfeeding.",
      ],
      urgentHelp: [
        "Trouble breathing, swelling of the face/lips/tongue/throat, fainting, a severe rash, or sudden vision changes.",
      ],
      labsWatched: [
        "Usually no special routine labs for short courses unless your care team is watching your infection or other medicines",
        "Liver tests or blood counts if clinically needed for longer therapy",
      ],
      internalReviewNote: "IV doxycycline is the only assumption for this app's current scope. Resolved: oral-route counseling (\"take with water, avoid lying down\") is out of scope for the current Companion implementation and is not included by default. Revisit only if oral transition becomes clinically relevant for this patient population, and confirm with pharmacist before adding.",
    },
  };

  function resolveSharedModules(moduleIds) {
    var shared = window.COMPANION_SHARED_SAFETY_MODULES || {};
    var out = [];
    (moduleIds || []).forEach(function (id) {
      if (shared[id]) out.push(shared[id]);
    });
    return out;
  }

  window.DOSECRAFT_getCompanionClinicalContent = function (drug) {
    if (!drug || drug.id == null) return null;
    if (drug.gameType === "ivig") return null;
    var registry = window.COMPANION_CLINICAL_CONTENT;
    if (!registry) return null;
    return registry[drug.id] || null;
  };

  window.DOSECRAFT_getCompanionClinicalView = function (drug) {
    var entry = window.DOSECRAFT_getCompanionClinicalContent(drug);
    if (!entry) return null;
    return {
      displayName: entry.displayName,
      genericName: entry.genericName,
      medicationType: entry.medicationType,
      howItHelps: entry.howItHelps,
      whatYouMayNotice: entry.whatYouMayNotice ? entry.whatYouMayNotice.slice() : [],
      callCareTeam: entry.callCareTeam ? entry.callCareTeam.slice() : [],
      urgentHelp: entry.urgentHelp ? entry.urgentHelp.slice() : [],
      labsWatched: entry.labsWatched ? entry.labsWatched.slice() : [],
      sharedModules: resolveSharedModules(entry.sharedModuleIds),
    };
  };
})();
