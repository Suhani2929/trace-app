const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── MEDICATION DATABASE ───
const MEDICATIONS = [
    { name: 'Metformin', keywords: ['metformin', 'glucophage'], category: 'Antidiabetic' },
    { name: 'Amlodipine', keywords: ['amlodipine', 'norvasc'], category: 'Antihypertensive' },
    { name: 'Lisinopril', keywords: ['lisinopril', 'prinivil', 'zestril'], category: 'Antihypertensive' },
    { name: 'Atorvastatin', keywords: ['atorvastatin', 'lipitor'], category: 'Statin' },
    { name: 'Levothyroxine', keywords: ['levothyroxine', 'synthroid'], category: 'Thyroid' },
    { name: 'Omeprazole', keywords: ['omeprazole', 'prilosec'], category: 'PPI' },
    { name: 'Metoprolol', keywords: ['metoprolol', 'lopressor'], category: 'Beta Blocker' },
    { name: 'Losartan', keywords: ['losartan', 'cozaar'], category: 'ARB' },
    { name: 'Albuterol', keywords: ['albuterol', 'ventolin'], category: 'Bronchodilator' },
    { name: 'Prednisone', keywords: ['prednisone', 'deltasone'], category: 'Corticosteroid' },
    { name: 'Aspirin', keywords: ['aspirin', 'ecotrin'], category: 'Antiplatelet' },
    { name: 'Ibuprofen', keywords: ['ibuprofen', 'advil', 'motrin'], category: 'NSAID' },
    { name: 'Acetaminophen', keywords: ['acetaminophen', 'tylenol'], category: 'Analgesic' },
    { name: 'Warfarin', keywords: ['warfarin', 'coumadin'], category: 'Anticoagulant' },
    { name: 'Furosemide', keywords: ['furosemide', 'lasix'], category: 'Diuretic' },
];

// ─── SMART SYMPTOM ANALYZER ───
function smartSymptomAnalysis(text) {
    const lowerText = text.toLowerCase();
    let matchedSymptoms = [];
    let highestSeverity = 'mild';
    let allRemedies = [];
    let allAdvice = [];
    let emergency = false;

    // Emergency keywords (English + Hindi + Marathi)
    const emergencyKeywords = [
        'chest pain', 'heart pain', 'chest tightness', 'chest pressure', 'pain in chest',
        'heart attack', 'cardiac arrest', 'myocardial infarction', 'crushing chest pain',
        'difficulty breathing', 'hard to breathe', 'can\'t breathe', 'shortness of breath',
        'breathless', 'gasping', 'breathing problem', 'not breathing', 'struggling to breathe',
        'stroke', 'facial droop', 'arm weakness', 'speech difficulty', 'slurred speech',
        'unconscious', 'passed out', 'fainted', 'blacked out', 'lost consciousness',
        'seizure', 'convulsion', 'fitting', 'shaking', 'severe bleeding', 'heavy bleeding',
        'anaphylaxis', 'severe allergy', 'swelling of lips', 'swelling of tongue',
        'suicide', 'kill myself', 'want to die', 'self harm', 'overdose', 'poisoning',
        'सीने में दर्द', 'दिल का दर्द', 'सांस लेने में तकलीफ', 'सांस नहीं आ रही',
        'हार्ट अटैक', 'बेहोश', 'फिट', 'खून बह रहा',
        'छातीत दुखणे', 'हृदय दुखणे', 'श्वास घेण्यास त्रास', 'हार्ट अटॅक',
        'बेशुद्ध', 'फिट येणे', 'रक्तस्त्राव'
    ];

    // Moderate keywords
    const moderateKeywords = [
        'fever', 'high temperature', 'feverish', 'hot', 'temperature', 'high fever',
        'vomiting', 'vomit', 'threw up', 'nausea', 'sick to stomach', 'puking',
        'dizziness', 'dizzy', 'lightheaded', 'vertigo', 'spinning', 'faint',
        'stomach pain', 'abdominal pain', 'belly ache', 'tummy hurts', 'stomach ache',
        'diarrhoea', 'diarrhea', 'loose motion', 'watery stool', 'dehydration',
        'severe headache', 'worst headache', 'migraine with aura',
        'बुखार', 'उल्टी', 'चक्कर आना', 'पेट दर्द', 'दस्त', 'निर्जलीकरण',
        'तेज सिरदर्द', 'माइग्रेन',
        'ताप', 'उलटी', 'चक्कर येणे', 'पोटदुखी', 'जुलाब', 'निर्जलीकरण',
        'तीव्र डोकेदुखी', 'मायग्रेन'
    ];

    // Mild keywords
    const mildKeywords = [
        'cold', 'runny nose', 'stuffy nose', 'sneezing', 'congestion', 'nasal', 'sinus', 'sniffles',
        'cough', 'coughing', 'dry cough', 'wet cough', 'phlegm',
        'headache', 'head pain', 'migraine', 'head hurting',
        'body ache', 'body pain', 'muscle pain', 'muscle ache', 'sore muscles', 'joint pain',
        'sore throat', 'throat pain', 'scratchy throat', 'throat irritation',
        'fatigue', 'tired', 'exhausted', 'weakness', 'low energy', 'sleepy', 'drained',
        'allergy', 'allergic', 'hives', 'rash', 'itching',
        'सर्दी', 'खांसी', 'शरीर में दर्द', 'सिरदर्द', 'गले में खराश',
        'थकान', 'एलर्जी', 'चकत्ते', 'खुजली',
        'सर्दी', 'खोकला', 'शरीर दुखणे', 'डोकेदुखी', 'घसा दुखणे',
        'थकवा', 'ऍलर्जी', 'पुरळ', 'खाज'
    ];

    // Check emergency
    for (const word of emergencyKeywords) {
        if (lowerText.includes(word)) {
            highestSeverity = 'severe';
            emergency = true;
            matchedSymptoms.push('emergency');
            allAdvice.push('🚨 THIS IS A MEDICAL EMERGENCY. Call 1066 immediately.');
            allRemedies.push('Call 1066 immediately');
            break;
        }
    }

    // Check moderate
    if (!emergency) {
        for (const word of moderateKeywords) {
            if (lowerText.includes(word)) {
                highestSeverity = 'moderate';
                matchedSymptoms.push(word);
                allAdvice.push('⚠️ These symptoms need attention. Monitor closely and consult a doctor if they worsen.');
                allRemedies.push('Rest', 'Stay hydrated', 'Monitor symptoms', 'Consult a doctor if persists');
                break;
            }
        }
    }

    // Check mild
    if (!emergency && highestSeverity !== 'moderate') {
        for (const word of mildKeywords) {
            if (lowerText.includes(word)) {
                highestSeverity = 'mild';
                matchedSymptoms.push(word);
                allAdvice.push('✅ These symptoms appear mild. Rest and home remedies should help.');
                allRemedies.push('Rest and stay hydrated', 'Monitor your symptoms');
                break;
            }
        }
    }

    // If no symptoms matched
    if (matchedSymptoms.length === 0) {
        const healthWords = ['pain', 'hurt', 'ache', 'sick', 'ill', 'unwell', 'disease', 'problem', 'issue'];
        let foundHealth = false;
        for (const word of healthWords) {
            if (lowerText.includes(word)) {
                foundHealth = true;
                break;
            }
        }
        if (foundHealth) {
            return {
                severity: 'mild',
                remedies: ['Rest and stay hydrated', 'Monitor your symptoms', 'If symptoms persist, consult a doctor'],
                advice: 'Please describe your symptoms more clearly. If you are feeling unwell, consult a healthcare professional.',
                emergency: false,
                matched: ['general health concern']
            };
        }
        return {
            severity: 'mild',
            remedies: ['Rest and stay hydrated', 'Monitor your symptoms', 'If symptoms persist or worsen, consult a doctor'],
            advice: 'Could not identify specific symptoms from your description. If you are feeling unwell, please consult a healthcare professional.',
            emergency: false,
            matched: []
        };
    }

    const uniqueRemedies = [...new Set(allRemedies)];

    return {
        severity: highestSeverity,
        remedies: uniqueRemedies.slice(0, 6),
        advice: allAdvice[0] || 'Please consult a healthcare professional for proper medical advice.',
        emergency: emergency,
        matched: matchedSymptoms
    };
}

function extractMedications(text) {
    const results = [];
    const lines = text.split(/[\n\.\,\;]/);
    for (const line of lines) {
        const l = line.toLowerCase();
        if (l.length < 5 || l.length > 300) continue;
        const hasMedKeywords = ['mg', 'tablet', 'capsule', 'take', 'daily', 'twice', 'once', 'prescription', 'medication'].some(k => l.includes(k));
        if (!hasMedKeywords) continue;
        for (const med of MEDICATIONS) {
            if (med.keywords.some(k => l.includes(k))) {
                let status = 'unknown';
                if (l.includes('stop') || l.includes('discontinue')) status = 'stopped';
                else if (l.includes('continue') || l.includes('take')) status = 'active';
                const dateMatch = l.match(/(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i) ||
                                  l.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
                const date = dateMatch ? dateMatch[0] : 'Unknown date';
                results.push({
                    name: med.name,
                    category: med.category,
                    status,
                    date,
                    instruction: line.trim().substring(0, 150)
                });
                break;
            }
        }
    }
    return results;
}

function extractInstructions(text) {
    const results = [];
    const patterns = [
        { pattern: /repeat\s+(\w+)\s+test/i, type: 'follow-up' },
        { pattern: /follow[- ]?up\s+in\s+(\d+)\s*(weeks?|months?)/i, type: 'follow-up' },
        { pattern: /review\s+(\w+)\s+result/i, type: 'review' },
        { pattern: /recheck\s+(\w+)/i, type: 'follow-up' },
        { pattern: /next\s+appointment/i, type: 'appointment' },
    ];
    for (const p of patterns) {
        const match = text.match(p.pattern);
        if (match) {
            results.push({
                text: match[0],
                date: extractDate(text),
                type: p.type
            });
        }
    }
    return results;
}

function extractDate(text) {
    const patterns = [
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
        /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
        /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }
    return 'Unknown date';
}

function reconcile(medications) {
    const conflicts = [];
    const confirmed = [];
    const outdated = [];
    const unknown = [];
    const timeline = [];

    const groups = {};
    for (const med of medications) {
        if (!groups[med.name]) groups[med.name] = [];
        groups[med.name].push(med);
    }

    for (const [name, entries] of Object.entries(groups)) {
        if (entries.length > 1) {
            const statuses = entries.map(e => e.status);
            const hasActive = statuses.includes('active');
            const hasStopped = statuses.includes('stopped');
            if (hasActive && hasStopped) {
                conflicts.push({
                    title: `Medication conflict: ${name}`,
                    detail: `Records show both "continue" and "stop" instructions for ${name}.`,
                    sources: entries.map(e => `${e.date}`).join('; '),
                    severity: 'high'
                });
            }
        }
    }

    for (const [name, entries] of Object.entries(groups)) {
        const active = entries.filter(e => e.status === 'active');
        if (active.length > 0) {
            const isConflict = conflicts.some(c => c.title.includes(name));
            if (!isConflict) {
                confirmed.push({
                    text: `${name} — active medication`,
                    source: active[0].date || 'Unknown date',
                    category: active[0].category || 'Medication'
                });
            }
        }
    }

    for (const [name, entries] of Object.entries(groups)) {
        for (const e of entries) {
            if (e.date !== 'Unknown date') {
                const dateMatch = e.date.match(/(\d{4})/);
                if (dateMatch) {
                    const year = parseInt(dateMatch[1]);
                    const currentYear = new Date().getFullYear();
                    if (currentYear - year > 1 && e.status === 'active') {
                        outdated.push({
                            title: `Possibly outdated: ${name}`,
                            detail: `Last confirmed ${currentYear - year} years ago.`,
                            source: e.date
                        });
                    }
                }
            }
        }
    }

    for (const [name, entries] of Object.entries(groups)) {
        const unknownStatus = entries.filter(e => e.status === 'unknown');
        if (unknownStatus.length > 0 && !conflicts.some(c => c.title.includes(name))) {
            unknown.push({
                title: `Uncertain medication status: ${name}`,
                detail: `Some records for ${name} have unclear instructions.`,
                source: unknownStatus.map(e => e.date).join('; ')
            });
        }
    }

    for (const med of medications) {
        if (med.date !== 'Unknown date') {
            timeline.push({
                date: med.date,
                event: `${med.name} — ${med.status === 'active' ? 'Active' : med.status === 'stopped' ? 'Stopped' : 'Unknown'}`,
                instruction: med.instruction
            });
        }
    }
    timeline.sort((a, b) => a.date.localeCompare(b.date));

    return { conflicts, confirmed, outdated, unknown, timeline };
}

async function searchPubMed(symptom) {
    try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(symptom)}&retmode=json&retmax=5`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function searchMedlinePlus(symptom) {
    try {
        const url = `https://connect.medlineplus.gov/service?mainSearchCriteria.v.dn=${encodeURIComponent(symptom)}&informationRecipient.languageCode.c=en`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function searchClinicalTrials(symptom) {
    try {
        const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(symptom)}&pageSize=3`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function getHealthInfo(symptom) {
    const results = {
        symptom: symptom,
        pubmed: null,
        medline: null,
        trials: null,
        timestamp: new Date().toISOString()
    };

    try {
        results.pubmed = await searchPubMed(symptom);
        results.medline = await searchMedlinePlus(symptom);
        results.trials = await searchClinicalTrials(symptom);
    } catch (error) {
        console.error('Health info error:', error);
    }

    return results;
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TRACE API running with AI' });
});

app.post('/api/analyze-symptoms', async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms) {
            return res.status(400).json({ error: 'No symptoms provided' });
        }
        const result = smartSymptomAnalysis(symptoms);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Symptom analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze symptoms' });
    }
});

app.post('/api/health-info', async (req, res) => {
    try {
        const { symptom } = req.body;
        if (!symptom) {
            return res.status(400).json({ error: 'No symptom provided' });
        }
        const healthInfo = await getHealthInfo(symptom);
        res.json({
            success: true,
            data: healthInfo
        });
    } catch (error) {
        console.error('Health info error:', error);
        res.status(500).json({ error: 'Failed to fetch health information' });
    }
});

app.post('/api/process', (req, res) => {
    try {
        const { documents } = req.body;
        if (!documents || documents.length === 0) {
            return res.status(400).json({ error: 'No documents provided' });
        }

        let allMedications = [];
        let allInstructions = [];

        for (const doc of documents) {
            const text = doc.content || '';
            const meds = extractMedications(text);
            const instructions = extractInstructions(text);
            allMedications = allMedications.concat(meds);
            allInstructions = allInstructions.concat(instructions);
        }

        const uniqueMeds = [];
        const seen = new Set();
        for (const med of allMedications) {
            const key = med.name + med.status + med.date;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMeds.push(med);
            }
        }

        const result = reconcile(uniqueMeds);

        for (const inst of allInstructions) {
            if (inst.type === 'follow-up' || inst.type === 'review') {
                if (!result.missing) result.missing = [];
                result.missing.push({
                    title: `Missing follow-up: "${inst.text}"`,
                    detail: `A follow-up was mentioned but no corresponding result was found.`,
                    source: inst.date || 'Unknown date'
                });
            }
        }

        res.json({
            success: true,
            medications: uniqueMeds,
            instructions: allInstructions,
            summary: {
                confirmed: result.confirmed.length,
                conflicts: result.conflicts.length,
                missing: result.missing ? result.missing.length : 0,
                outdated: result.outdated.length,
                unknown: result.unknown.length
            },
            data: result
        });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Failed to process documents' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 TRACE API running on http://localhost:${PORT}`);
    console.log(`🧠 Smart symptom analysis enabled with 20+ conditions`);
});