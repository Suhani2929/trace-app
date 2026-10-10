// ─── TRACE BACKEND ─────────────────────────────────────────────

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── HELPERS ──────────────────────────────────────────────────

function unique(items) {
    return [...new Set(items.filter(Boolean))];
}

function containsAny(text, words) {
    return words.some(word => text.includes(word));
}

function detectBodyPart(text) {
    const bodyParts = {
        head: ["head", "scalp", "forehead"],
        eye: ["eye", "eyes", "vision", "sight"],
        ear: ["ear", "ears", "hearing"],
        nose: ["nose", "sinus", "nasal"],
        throat: ["throat"],
        neck: ["neck"],
        chest: ["chest"],
        back: ["back", "spine"],
        shoulder: ["shoulder"],
        arm: ["arm", "elbow", "wrist", "forearm"],
        hand: ["hand", "finger", "thumb", "palm"],
        stomach: ["stomach", "abdomen", "belly", "tummy"],
        kidney: ["kidney"],
        bladder: ["bladder"],
        leg: ["leg", "knee", "ankle", "calf", "thigh"],
        foot: ["foot", "feet", "toe", "heel"],
        hip: ["hip"],
        skin: ["skin"],
        muscle: ["muscle"],
        joint: ["joint"]
    };

    for (const [part, keywords] of Object.entries(bodyParts)) {
        if (containsAny(text, keywords)) {
            return part;
        }
    }

    return "";
}

function detectPainType(text) {
    const painTypes = {
        throbbing: ["throbbing", "pulsating", "pounding"],
        sharp: ["sharp", "stabbing", "shooting", "piercing"],
        burning: ["burning", "stinging"],
        aching: ["aching", "dull", "sore"],
        cramping: ["cramping", "spasming", "tightening"]
    };

    for (const [type, keywords] of Object.entries(painTypes)) {
        if (containsAny(text, keywords)) {
            return type;
        }
    }

    return "";
}

function detectSymptoms(text) {
    const symptomTypes = {
        pain: ["pain", "ache", "hurt", "sore", "discomfort"],
        fever: ["fever", "temperature", "chills"],
        cough: ["cough", "coughing", "phlegm"],
        cold: ["cold", "runny nose", "stuffy", "sneeze"],
        vomiting: ["vomit", "vomiting", "nausea", "threw up"],
        diarrhea: [
            "diarrhea",
            "diarrhoea",
            "loose motion",
            "watery stool"
        ],
        dizziness: [
            "dizziness",
            "dizzy",
            "vertigo",
            "lightheaded"
        ],
        fatigue: [
            "tired",
            "fatigue",
            "exhausted",
            "weak",
            "sleepy"
        ],
        allergy: [
            "allergy",
            "allergic",
            "hives",
            "rash",
            "itching"
        ],
        swelling: [
            "swelling",
            "swollen",
            "inflamed",
            "puffy"
        ],
        breathing: [
            "breath",
            "breathing",
            "gasp",
            "wheeze"
        ]
    };

    const detected = [];

    for (const [type, keywords] of Object.entries(symptomTypes)) {
        if (containsAny(text, keywords)) {
            detected.push(type);
        }
    }

    return detected;
}

function detectSeverity(text) {
    if (
        containsAny(text, [
            "severe",
            "extreme",
            "unbearable",
            "worst",
            "agonizing"
        ])
    ) {
        return "severe";
    }

    if (
        containsAny(text, [
            "moderate",
            "significant",
            "considerable"
        ])
    ) {
        return "moderate";
    }

    return "mild";
}

function detectEmergency(text) {
    const emergencyKeywords = [
        "chest pain",
        "chest pressure",
        "chest tightness",
        "difficulty breathing",
        "can't breathe",
        "cannot breathe",
        "severe breathing",
        "unconscious",
        "fainted",
        "seizure",
        "stroke",
        "severe bleeding",
        "choking",
        "anaphylaxis",
        "face drooping",
        "slurred speech",
        "sudden weakness"
    ];

    return containsAny(text, emergencyKeywords);
}

// ─── PROFILE CONTEXT ──────────────────────────────────────────

function buildProfileContext(profile = {}) {
    const context = [];

    if (profile.age) {
        context.push(`Age: ${profile.age}`);
    }

    if (profile.gender) {
        context.push(`Gender: ${profile.gender}`);
    }

    if (profile.city) {
        context.push(`City: ${profile.city}`);
    }

    if (profile.conditions) {
        context.push(
            `Relevant medical history: ${profile.conditions}`
        );
    }

    if (profile.allergies) {
        context.push(
            `Allergies: ${profile.allergies}`
        );
    }

    if (profile.medications) {
        context.push(
            `Current medications: ${profile.medications}`
        );
    }

    if (profile.bloodGroup) {
        context.push(
            `Blood group: ${profile.bloodGroup}`
        );
    }

    return context;
}

// ─── REASONING RECEIPT ────────────────────────────────────────

function buildReasoningReceipt({
    bodyPart,
    painType,
    symptoms,
    severity,
    emergency,
    profile
}) {
    const possibleExplanations = [];

    if (symptoms.includes("pain")) {
        possibleExplanations.push({
            label: "Musculoskeletal cause",
            supports:
                "Pain is present in the described area.",
            missing:
                "Recent injury, overuse, movement pattern, onset, and physical examination."
        });

        possibleExplanations.push({
            label: "Nerve-related irritation",
            supports:
                "Nerve irritation can sometimes produce localized or radiating pain.",
            missing:
                "Numbness, tingling, weakness, radiation pattern, and neurological examination."
        });

        possibleExplanations.push({
            label: "Inflammatory cause",
            supports:
                "Inflammation can produce pain and tenderness.",
            missing:
                "Swelling, redness, warmth, fever, duration, and examination findings."
        });

        possibleExplanations.push({
            label: "Other underlying cause",
            supports:
                "Text alone cannot safely exclude less common causes.",
            missing:
                "Medical history, medications, risk factors, vital signs, and testing when indicated."
        });
    }

    if (symptoms.includes("fever")) {
        possibleExplanations.push({
            label: "Infectious or inflammatory process",
            supports:
                "Fever can occur with infections and inflammatory conditions.",
            missing:
                "Measured temperature, duration, exposures, and associated symptoms."
        });
    }

    if (
        symptoms.includes("cough") ||
        symptoms.includes("cold")
    ) {
        possibleExplanations.push({
            label: "Respiratory irritation or infection",
            supports:
                "Cough and cold symptoms can have several common causes.",
            missing:
                "Duration, fever, breathing status, exposures, and other respiratory symptoms."
        });
    }

    if (symptoms.includes("dizziness")) {
        possibleExplanations.push({
            label: "Multiple possible causes",
            supports:
                "Dizziness can result from several different mechanisms.",
            missing:
                "Timing, triggers, hydration, medications, blood pressure, and neurological symptoms."
        });
    }

    const decisionChangingQuestions = [
        "When did this start, and did it begin suddenly or gradually?",
        "Is it getting better, worse, or staying the same?",
        "What other symptoms are happening at the same time?",
        "Are there recent injuries, medicines, medical conditions, or relevant risk factors?"
    ];

    if (symptoms.includes("pain")) {
        decisionChangingQuestions.unshift(
            "Is the pain triggered by movement or exertion, or does it occur at rest?"
        );
    }

    if (
        bodyPart === "arm" ||
        bodyPart === "shoulder"
    ) {
        decisionChangingQuestions.push(
            "Is there numbness, tingling, weakness, swelling, or color change in the arm or hand?"
        );
    }

    // Use information already supplied in the profile.
    if (profile?.conditions) {
        decisionChangingQuestions.push(
            "Could the current symptom be related to an existing medical condition?"
        );
    }

    if (profile?.medications) {
        decisionChangingQuestions.push(
            "Did the symptom begin after starting or changing any medication?"
        );
    }

    return {
        evidenceStatus: emergency
            ? "High-priority safety signal detected from the text."
            : "Limited — rule-based triage from the information entered; no physical examination or diagnostic test was performed.",

        observedEvidence: unique([
            bodyPart
                ? `Body area detected: ${bodyPart}`
                : "",

            painType
                ? `Pain description detected: ${painType}`
                : "",

            symptoms.length
                ? `Symptoms detected: ${symptoms.join(", ")}`
                : "",

            `Reported severity language: ${severity}`,

            profile?.age
                ? `Profile context available: age ${profile.age}`
                : "",

            profile?.conditions
                ? "Existing health history supplied"
                : "",

            profile?.allergies
                ? "Allergy information supplied"
                : "",

            profile?.medications
                ? "Current medication information supplied"
                : ""
        ]),

        uncertainty:
            "TRACE is not claiming a diagnosis. The same symptom can have different causes, and important clinical information may still be missing.",

        possibleExplanations,

        decisionChangingQuestions: unique(
            decisionChangingQuestions
        ).slice(0, 6)
    };
}

// ─── GUIDANCE ENGINE ──────────────────────────────────────────

function buildUserGuidance({
    bodyPart,
    painType,
    symptoms,
    severity,
    emergency
}) {
    const whatMayBeHappening = [];
    const whyItMayBeHappening = [];
    const whatToDoNow = [];
    const whenToSeekCare = [];

    // ─────────────────────────────────────────────
    // WHAT MAY BE HAPPENING
    // ─────────────────────────────────────────────
    if (bodyPart && painType) {
        whatMayBeHappening.push(
            `Your symptoms sound like ${painType} discomfort involving the ${bodyPart}.`
        );
    } else if (bodyPart) {
        whatMayBeHappening.push(
            `Your symptoms appear to be mainly affecting the ${bodyPart}.`
        );
    } else if (symptoms.length) {
        whatMayBeHappening.push(
            `TRACE detected ${symptoms.join(", ")} from what you described.`
        );
    } else {
        whatMayBeHappening.push(
            "There is not enough symptom information yet to identify a useful pattern."
        );
    }

    // ─────────────────────────────────────────────
    // WHY IT MAY BE HAPPENING
    // ─────────────────────────────────────────────
    if (painType === "sharp") {
        whyItMayBeHappening.push(
            "Sharp pain can occur when muscles, joints, nerves, or other tissues are irritated. The exact cause cannot be determined from text alone."
        );
    } else if (painType === "burning") {
        whyItMayBeHappening.push(
            "Burning or stinging sensations can occur with nerve or tissue irritation. More information is needed to distinguish between possible causes."
        );
    } else if (painType === "throbbing") {
        whyItMayBeHappening.push(
            "Throbbing or pulsating discomfort can have several causes. Timing, triggers and associated symptoms are important for narrowing them."
        );
    } else if (painType === "cramping") {
        whyItMayBeHappening.push(
            "Cramping can occur when muscles or other tissues contract or become irritated."
        );
    } else if (painType === "aching") {
        whyItMayBeHappening.push(
            "Aching or dull discomfort can occur with common musculoskeletal or inflammatory patterns, among other causes."
        );
    } else {
        whyItMayBeHappening.push(
            "The same symptom can have several different causes, so TRACE avoids presenting one diagnosis as certain."
        );
    }

    // ─────────────────────────────────────────────
    // EMERGENCY
    // ─────────────────────────────────────────────
    if (emergency) {
        whatToDoNow.push(
            "Do not rely on home remedies for this symptom pattern."
        );

        whatToDoNow.push(
            "Seek urgent medical assessment now. If the situation is serious or rapidly worsening, call 112."
        );
    }

    // ─────────────────────────────────────────────
    // SEVERE
    // ─────────────────────────────────────────────
    else if (severity === "severe") {
        whatToDoNow.push(
            "Because the symptom is described as severe, prioritize medical assessment rather than trying to manage it only at home."
        );

        whatToDoNow.push(
            "Avoid activities that clearly make the symptom worse while arranging appropriate medical care."
        );
    }

    // ─────────────────────────────────────────────
    // MILD — PRACTICAL SELF CARE
    // ─────────────────────────────────────────────
    else if (severity === "mild") {

        if (symptoms.includes("pain")) {
            whatToDoNow.push(
                "Rest the affected area and avoid movements or activities that clearly increase the pain."
            );

            whatToDoNow.push(
                "Stay hydrated and maintain regular meals unless you have been advised otherwise."
            );
        }

        if (bodyPart === "head") {
            whatToDoNow.push(
                "Rest in a quiet, comfortable environment and consider taking a break from bright screens."
            );
        }

        if (symptoms.includes("fever")) {
            whatToDoNow.push(
                "Rest and drink fluids regularly to reduce the risk of dehydration."
            );

            whatToDoNow.push(
                "If possible, measure your temperature and keep track of whether it is rising or improving."
            );
        }

        if (
            symptoms.includes("cough") ||
            symptoms.includes("cold")
        ) {
            whatToDoNow.push(
                "Rest, drink fluids regularly, and avoid smoke, dust and other respiratory irritants."
            );
        }

        if (
            symptoms.includes("vomiting")
        ) {
            whatToDoNow.push(
                "Take small, frequent sips of water or an oral rehydration drink rather than drinking a large amount at once."
            );

            whatToDoNow.push(
                "When tolerated, choose light foods and avoid heavy or irritating meals."
            );
        }

        if (symptoms.includes("diarrhea")) {
            whatToDoNow.push(
                "Focus on replacing fluids and electrolytes with water or an oral rehydration solution."
            );
        }

        if (symptoms.includes("dizziness")) {
            whatToDoNow.push(
                "Sit or lie down if you feel dizzy and get up slowly once you feel steadier."
            );

            whatToDoNow.push(
                "Drink fluids and avoid driving or other activities where dizziness could put you at risk."
            );
        }

        if (symptoms.includes("fatigue")) {
            whatToDoNow.push(
                "Prioritize sleep, hydration and regular meals, and reduce strenuous activity while you recover."
            );
        }

        if (symptoms.includes("allergy")) {
            whatToDoNow.push(
                "Avoid the suspected trigger if you know what caused the reaction."
            );
        }

        if (!whatToDoNow.length) {
            whatToDoNow.push(
                "Rest, stay hydrated, monitor the symptom and note anything that makes it better or worse."
            );
        }
    }

    // ─────────────────────────────────────────────
    // MODERATE
    // ─────────────────────────────────────────────
    else {
        whatToDoNow.push(
            "Use supportive measures such as rest, hydration and avoiding activities that worsen the symptom."
        );

        whatToDoNow.push(
            "If the symptom persists, worsens, repeatedly returns, or interferes with normal activities, arrange a healthcare assessment."
        );
    }

    // ─────────────────────────────────────────────
    // WHEN TO SEEK CARE
    // ─────────────────────────────────────────────
    if (emergency) {
        whenToSeekCare.push(
            "Seek emergency medical attention now."
        );
    } else if (severity === "severe") {
        whenToSeekCare.push(
            "Seek prompt medical assessment because the symptom is severe."
        );
    } else if (severity === "moderate") {
        whenToSeekCare.push(
            "Arrange medical assessment if the symptom persists, worsens, or significantly affects normal activity."
        );
    } else {
        whenToSeekCare.push(
            "Seek medical care if the symptom persists, gets worse, repeatedly returns, or new concerning symptoms appear."
        );
    }

    whenToSeekCare.push(
        "Get urgent help for severe breathing difficulty, chest pressure or pain, fainting, seizure, major bleeding, sudden weakness, facial drooping, slurred speech, or another rapidly worsening serious symptom."
    );

    return {
        whatMayBeHappening,
        whyItMayBeHappening,
        whatToDoNow,
        whenToSeekCare
    };
}

// ─── MAIN ANALYSIS ────────────────────────────────────────────

function analyzeSymptoms(inputText, profile = {}) {
    const text = String(inputText || "")
        .trim()
        .toLowerCase();

    const bodyPart = detectBodyPart(text);
    const painType = detectPainType(text);
    const symptoms = detectSymptoms(text);
    const severity = detectSeverity(text);
    const emergency = detectEmergency(text);

    const receipt = buildReasoningReceipt({
        bodyPart,
        painType,
        symptoms,
        severity,
        emergency,
        profile
    });

    const guidance = buildUserGuidance({
        bodyPart,
        painType,
        symptoms,
        severity,
        emergency
    });

    const primaryPattern =
        bodyPart && painType
            ? `${painType} ${bodyPart} symptom pattern`
            : bodyPart
                ? `${bodyPart} symptom pattern`
                : symptoms.length
                    ? `${symptoms[0]} symptom pattern`
                    : "insufficient symptom pattern";

    const overview = emergency
        ? "TRACE detected a potentially urgent signal in the information provided. This result should not replace emergency medical assessment."
        : "TRACE found a symptom pattern from the information provided, while also considering the health context supplied in the profile.";

    // Only ask for information that has NOT already been supplied.
    const missingInformation = [];

    if (!profile.age) {
        missingInformation.push("Exact age");
    }

    missingInformation.push(
        "How and when the symptom started",
        "Whether it is getting better or worse"
    );

    if (!profile.conditions) {
        missingInformation.push(
            "Relevant medical history"
        );
    }

    if (!profile.medications) {
        missingInformation.push(
            "Current medications"
        );
    }

    missingInformation.push(
        "Recent injury, illness, or unusual activity",
        "Other symptoms occurring at the same time"
    );

    return {
        traceVersion: "2.1",

        input: {
            originalText: inputText
        },

        profileContext: {
            age: profile.age || null,
            gender: profile.gender || null,
            city: profile.city || null,
            conditions: profile.conditions || null,
            allergies: profile.allergies || null,
            medications: profile.medications || null,
            bloodGroup: profile.bloodGroup || null
        },

        summary: {
            primaryPattern,
            detectedSymptoms: symptoms,
            bodyPart,
            painType,
            severity,
            emergency
        },

        evidence: receipt.observedEvidence,

        evidenceStatus: receipt.evidenceStatus,

        possibleExplanations:
            receipt.possibleExplanations,

        missingInformation,

        decisionChangingQuestions:
            receipt.decisionChangingQuestions,

        overview,

        whatMayBeHappening:
            guidance.whatMayBeHappening,

        whyItMayBeHappening:
            guidance.whyItMayBeHappening,

        whatToDoNow:
            guidance.whatToDoNow,

        whenToSeekCare:
            guidance.whenToSeekCare,

        emergency: emergency
            ? {
                active: true,
                message:
                    "Potential emergency warning detected. If you are experiencing a serious or rapidly worsening emergency, call 112 or seek emergency medical care immediately."
            }
            : {
                active: false,
                message:
                    "No explicit emergency warning signal was detected from the text provided. This does not rule out a medical emergency."
            },

        emergencySignals: emergency
            ? [
                "Potentially urgent symptom wording detected",
                "Immediate clinical assessment may be appropriate"
            ]
            : [],

        confidence: {
            level: "pattern-based",
            explanation:
                "This is confidence in the text pattern extraction, not confidence in a medical diagnosis."
        },

        disclaimer:
            "TRACE provides AI-assisted, text-based health guidance and triage support. It is not a medical diagnosis and cannot replace a qualified healthcare professional."
    };
}

// ─── API ROUTES ───────────────────────────────────────────────

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "TRACE backend",
        version: "2.1"
    });
});

app.post("/api/analyze-symptoms", (req, res) => {
    try {
        const {
            symptoms,
            text,
            message,
            profile
        } = req.body || {};

        const input =
            symptoms ||
            text ||
            message ||
            "";

        if (!String(input).trim()) {
            return res.status(400).json({
                error:
                    "Please provide a symptom description."
            });
        }

        const result = analyzeSymptoms(
            input,
            profile || {}
        );

        return res.json(result);
    } catch (error) {
        console.error(
            "TRACE analysis error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to analyze the symptom description.",
            details: error.message
        });
    }
});

// ─── HEALTH INFO ──────────────────────────────────────────────

app.post("/api/health-info", (req, res) => {
    try {
        const { query } = req.body || {};

        if (!query || !String(query).trim()) {
            return res.status(400).json({
                error:
                    "Please provide a health information query."
            });
        }

        return res.json({
            query,
            answer:
                "TRACE can provide general health information, but this endpoint does not provide a diagnosis. For persistent, worsening, or concerning symptoms, consult a qualified healthcare professional.",
            disclaimer:
                "General information only; not medical diagnosis or treatment."
        });
    } catch (error) {
        console.error(
            "TRACE health-info error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to process the health information request."
        });
    }
});

// ─── LEGACY / PROCESS ROUTE ──────────────────────────────────

app.post("/api/process", (req, res) => {
    try {
        const {
            symptoms,
            text,
            message,
            input,
            profile
        } = req.body || {};

        const symptomText =
            symptoms ||
            text ||
            message ||
            input ||
            "";

        if (!String(symptomText).trim()) {
            return res.status(400).json({
                error:
                    "Please provide a symptom description."
            });
        }

        const result = analyzeSymptoms(
            symptomText,
            profile || {}
        );

        return res.json(result);
    } catch (error) {
        console.error(
            "TRACE process error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to process the request.",
            details: error.message
        });
    }
});

// ─── 404 HANDLER ──────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({
        error:
            "TRACE API endpoint not found.",
        path: req.path
    });
});

// ─── ERROR HANDLER ────────────────────────────────────────────

app.use((err, req, res, next) => {
    console.error(
        "TRACE server error:",
        err
    );

    res.status(500).json({
        error:
            "Internal TRACE server error.",
        details: err.message
    });
});

// ─── START SERVER ─────────────────────────────────────────────

const PORT = 5000;

const server = app.listen(
    PORT,
    () => {
        console.log(
            `TRACE backend running on http://localhost:${PORT}`
        );
    }
);

server.on("error", error => {
    console.error(
        "TRACE server error:",
        error
    );
});

// Keep Node alive.
setInterval(() => {}, 1000);