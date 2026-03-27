/**
 * testMVP.js — AI Integration End-to-End Test
 *
 * Tests all AI endpoints with the highest-risk patient:
 *   Patient ID: 7 — Akmal Zokirov (Age: 71, Risk: 88/100)
 *   Conditions: Heart Disease + Hypertension + Diabetes
 *
 * Run: node scripts/testMVP.js
 */

const axios = require('axios');

const BACKEND_URL    = process.env.BACKEND_URL || 'http://localhost:5000';
const BASE           = `${BACKEND_URL}/api/ai`;
const AUTH_URL       = `${BACKEND_URL}/api/users`;
const PATIENT_ID     = 7;
const ADMIN_EMAIL    = 'admin@medsmart.uz';
const ADMIN_PASSWORD = 'Demo1234!';

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

let passed = 0, failed = 0;
let AUTH_TOKEN = '';

function ok(label, detail, ms) {
    passed++;
    console.log(`${GREEN}✅ ${label}${RESET} — ${detail} ${YELLOW}(${ms}ms)${RESET}`);
}

function fail(label, detail, ms) {
    failed++;
    console.log(`${RED}❌ ${label}${RESET} — ${detail} ${YELLOW}(${ms || 0}ms)${RESET}`);
}

async function post(path, body, useAuth = true) {
    const start   = Date.now();
    const headers = useAuth && AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
    const res     = await axios.post(`${BASE}${path}`, body, { timeout: 30000, headers });
    return { data: res.data, ms: Date.now() - start };
}

// ─── TEST 1: Seasonal Prediction ─────────────────────────────────────────────
async function test1_seasonal() {
    const label = 'Test 1: Seasonal Prediction';
    const start = Date.now();
    try {
        const { data, ms } = await post('/seasonal-prediction', { patientId: PATIENT_ID });
        const forecast  = data['Patient Forecast'];
        const topRisks  = forecast?.['Top Risks'] || [];
        const topDisease = topRisks[0]?.disease || 'N/A';
        const topRisk    = topRisks[0]?.risk    || 0;

        if (topRisks.length > 0) {
            ok(label, `Top: ${topDisease} ${topRisk}%`, ms);
        } else {
            fail(label, 'No top risks returned', ms);
        }
        console.log(`   ${CYAN}→ Season: ${forecast?.Season} | Factors: ${(forecast?.['Risk Factors Used'] || []).join(', ') || 'base model'}${RESET}`);
    } catch (e) {
        fail(label, e.response?.data?.message || e.message, Date.now() - start);
    }
}

// ─── TEST 2: Disease Progression ─────────────────────────────────────────────
async function test2_progression() {
    const label = 'Test 2: Disease Progression';
    const start = Date.now();
    try {
        const { data, ms } = await post('/disease-progression', { patientId: PATIENT_ID });
        const analysis  = data['Patient Risk Analysis'];
        const riskLevel = analysis?.['Overall Risk Level'] || 'Unknown';
        const riskScore = analysis?.['Risk Score'] ?? 'N/A';

        if (['High', 'Moderate'].includes(riskLevel)) {
            ok(label, `Risk Level: ${riskLevel}, Score: ${riskScore}/100`, ms);
        } else {
            fail(label, `Risk level too low: ${riskLevel}`, ms);
        }

        const fr = analysis?.['Future Risks'] || [];
        if (fr.length > 0) console.log(`   ${CYAN}→ Top future risk: ${fr[0].disease} (${fr[0].probability})${RESET}`);

        const vf = analysis?.['Vitals Risk Flags'] || [];
        if (vf.length > 0) console.log(`   ${CYAN}→ Vitals alerts: ${vf.join(' | ')}${RESET}`);
    } catch (e) {
        fail(label, e.response?.data?.message || e.message, Date.now() - start);
    }
}

// ─── TEST 3: AI Chat with Patient Context ────────────────────────────────────
async function test3_chat() {
    const label = 'Test 3: AI Chat (with patient context)';
    const start = Date.now();
    try {
        const { data, ms } = await post('/chat', {
            message: "Ko'kragim og'riyapti",
            patientId: PATIENT_ID
        }, false); // chat is a public endpoint

        const reply     = data.reply || '';
        const emergency = data.metadata?.emergency || false;

        if (reply.length > 0) {
            ok(label, emergency ? 'EMERGENCY detected in response' : 'Reply received', ms);
        } else {
            fail(label, 'Empty reply from AI', ms);
        }
        console.log(`   ${CYAN}→ Emergency: ${emergency ? '🚨 YES' : 'No'} | Preview: "${reply.substring(0, 80)}..."${RESET}`);
    } catch (e) {
        fail(label, e.response?.data?.message || e.message, Date.now() - start);
    }
}

// ─── TEST 4: Triage ───────────────────────────────────────────────────────────
async function test4_triage() {
    const label = 'Test 4: Triage (chest pain + elderly)';
    const start = Date.now();
    try {
        const { data, ms } = await post('/triage', {
            symptoms: ['chest pain', 'shortness of breath'],
            age: 71,
            duration_days: 2,
            severity: 'severe'
        }, false); // triage is a public endpoint

        const level     = data.triage_level;
        const emergency = data.seek_emergency;

        if (level === 'HIGH' && emergency === true) {
            ok(label, `Level: ${level}, Seek Emergency: YES`, ms);
        } else {
            fail(label, `Level: ${level}, Seek Emergency: ${emergency}`, ms);
        }
        console.log(`   ${CYAN}→ Matched: ${(data.matched_symptoms || []).join(', ')} | Wait: ${data.estimated_wait}${RESET}`);
    } catch (e) {
        fail(label, e.response?.data?.message || e.message, Date.now() - start);
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}${CYAN}   MedSmart AI — MVP Integration Test Suite${RESET}`);
    console.log(`${BOLD}${CYAN}   Patient: Akmal Zokirov (ID: ${PATIENT_ID}) | Risk: 88/100${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

    // ── Step 0: Login to get JWT token ────────────────────────────────────
    try {
        const loginRes = await axios.post(`${AUTH_URL}/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        }, { timeout: 8000 });
        AUTH_TOKEN = loginRes.data?.accessToken || loginRes.data?.token || '';
        if (AUTH_TOKEN) {
            console.log(`${GREEN}🔑 Authenticated as ${ADMIN_EMAIL}${RESET}\n`);
        } else {
            console.log(`${YELLOW}⚠ Login succeeded but no token found. Protected tests may fail.${RESET}\n`);
        }
    } catch (e) {
        console.log(`${RED}⚠ Login failed: ${e.response?.data?.message || e.message}${RESET}`);
        console.log(`  Ensure backend is running: node server.js\n`);
    }

    // ── Run all tests ─────────────────────────────────────────────────────
    await test1_seasonal();
    await test2_progression();
    await test3_chat();
    await test4_triage();

    // ── Summary ───────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  Results: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : ''}${failed} failed${RESET}`);
    console.log(`\n  DBeaver SQL to verify DB writes:`);
    console.log(`  ${CYAN}SELECT * FROM AILogs ORDER BY createdAt DESC LIMIT 10;${RESET}`);
    console.log(`  ${CYAN}SELECT * FROM AIPredictions ORDER BY createdAt DESC LIMIT 10;${RESET}`);
    console.log(`  ${CYAN}SELECT * FROM RiskScores WHERE patientId = ${PATIENT_ID};${RESET}`);
    console.log(`  ${CYAN}SELECT * FROM Notifications ORDER BY createdAt DESC LIMIT 5;${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error(`${RED}Fatal error: ${e.message}${RESET}`);
    process.exit(1);
});
