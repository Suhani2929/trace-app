// ─── GOVERNMENT HEALTH API INTEGRATION ───
// Complete free, no API key needed

const axios = require('axios');

// ─── SEARCH PUBMED FOR SYMPTOMS ───
async function searchPubMed(symptom) {
    try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(symptom)}&retmode=json&retmax=5`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('PubMed error:', error.message);
        return null;
    }
}

// ─── GET ARTICLE DETAILS FROM PUBMED ───
async function getPubMedDetails(id) {
    try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${id}&retmode=json`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('PubMed details error:', error.message);
        return null;
    }
}

// ─── SEARCH MEDLINE PLUS FOR HEALTH TOPICS ───
async function searchMedlinePlus(symptom) {
    try {
        const url = `https://connect.medlineplus.gov/service?mainSearchCriteria.v.dn=${encodeURIComponent(symptom)}&informationRecipient.languageCode.c=en`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('MedlinePlus error:', error.message);
        return null;
    }
}

// ─── SEARCH CLINICAL TRIALS ───
async function searchClinicalTrials(symptom) {
    try {
        const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(symptom)}&pageSize=3`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('ClinicalTrials error:', error.message);
        return null;
    }
}

// ─── GET HEALTH INFO FROM MULTIPLE SOURCES ───
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

module.exports = {
    searchPubMed,
    getPubMedDetails,
    searchMedlinePlus,
    searchClinicalTrials,
    getHealthInfo
};