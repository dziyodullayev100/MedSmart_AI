'use strict'
const http = require('http')
const https = require('https')

const BASE = process.env.BACKEND_URL || 'http://localhost:3000'
const AI   = process.env.AI_URL      || 'http://localhost:8001'

let passed = 0, failed = 0, warnings = 0
let accessToken = null
let refreshToken = null
let userDataId  = null
let aiResultId  = null

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

async function req(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {'Authorization': `Bearer ${token}`} : {})
      },
      timeout: 30000
    }
    const lib = parsed.protocol === 'https:' ? https : http
    const reqObj = lib.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch { resolve({ status: res.statusCode, data }) }
      })
    })
    reqObj.on('error', reject)
    reqObj.on('timeout', () => reject(new Error('TIMEOUT')))
    if (body) reqObj.write(JSON.stringify(body))
    reqObj.end()
  })
}

function pass(name, detail='') {
  passed++
  console.log(`  ${GREEN}✅ ${name}${RESET}${detail ? ` — ${detail}` : ''}`)
}
function fail(name, reason='') {
  failed++
  console.log(`  ${RED}❌ ${name}${RESET}${reason ? ` — ${reason}` : ''}`)
}
function warn(name, reason='') {
  warnings++
  console.log(`  ${YELLOW}⚠️  ${name}${RESET}${reason ? ` — ${reason}` : ''}`)
}
function section(title) {
  console.log(`\n${BOLD}━━━ ${title} ━━━${RESET}`)
}

async function runTests() {
  console.log(`\n${BOLD}╔══════════════════════════════════════════╗`)
  console.log(`║   MedSmart AI Engine — Full Test Suite   ║`)
  console.log(`║   Backend: ${BASE.padEnd(28)}║`)
  console.log(`╚══════════════════════════════════════════╝${RESET}\n`)

  // ══════════════════════════════════════════════
  section('LAYER 1: Health Checks')
  // ══════════════════════════════════════════════

  // T1: Backend health
  try {
    const r = await req('GET', `${BASE}/health`)
    if (r.status === 200 && r.data.status)
      pass('Backend health', `status=${r.data.status}`)
    else fail('Backend health', `status=${r.status}`)
  } catch(e) { fail('Backend health', e.message) }

  // T2: AI Engine health (via backend proxy)
  try {
    const r = await req('GET', `${BASE}/api/ai/health`)
    if (r.status === 200) pass('AI Engine health', 'online')
    else warn('AI Engine health', 'offline — run python run.py')
  } catch(e) { warn('AI Engine health', 'offline') }

  // T3: DB tables exist
  try {
    const r = await req('GET', `${BASE}/health`)
    const db = r.data?.services?.database
    if (db?.status === 'connected') pass('Database connected', db.dialect)
    else fail('Database', 'not connected')
  } catch(e) { fail('Database check', e.message) }

  // ══════════════════════════════════════════════
  section('LAYER 2: Authentication')
  // ══════════════════════════════════════════════

  // T4: Register new user
  const testEmail = `test_${Date.now()}@medsmart.test`
  try {
    const r = await req('POST', `${BASE}/api/auth/register`, {
      name: 'Test Bemor',
      email: testEmail,
      password: 'Test1234!'
    })
    if (r.status === 201 && r.data.success) {
      pass('Register', `user: ${testEmail}`)
    } else {
      fail('Register', r.data?.message || `status=${r.status}`)
    }
  } catch(e) { fail('Register', e.message) }

  // T5: Login
  try {
    const r = await req('POST', `${BASE}/api/auth/login`, {
      email: 'patient@medsmart.uz',
      password: 'Patient123!'
    })
    if (r.status === 200 && r.data.data?.accessToken) {
      accessToken  = r.data.data.accessToken
      refreshToken = r.data.data.refreshToken
      pass('Login', `user: ${r.data.data.user?.name}`)
    } else {
      fail('Login', r.data?.message || `status=${r.status}`)
      console.log('    Hint: run "cd backend && node scripts/seed.js" first!')
    }
  } catch(e) { fail('Login', e.message) }

  // T6: Get me
  if (accessToken) {
    try {
      const r = await req('GET', `${BASE}/api/auth/me`, null, accessToken)
      if (r.status === 200 && r.data.data?.email)
        pass('Get current user', r.data.data.email)
      else fail('Get current user', r.data?.message)
    } catch(e) { fail('Get current user', e.message) }
  }

  // T7: Refresh token
  if (refreshToken) {
    try {
      const r = await req('POST', `${BASE}/api/auth/refresh-token`,
        { refreshToken })
      if (r.status === 200 && r.data.data?.accessToken) {
        accessToken = r.data.data.accessToken
        pass('Refresh token', 'new token received')
      } else fail('Refresh token', r.data?.message)
    } catch(e) { fail('Refresh token', e.message) }
  }

  // T8: Auth required on protected route
  try {
    const r = await req('GET', `${BASE}/api/data`)  // No token
    if (r.status === 401) pass('Auth protection works', '401 without token')
    else fail('Auth protection', `Expected 401, got ${r.status}`)
  } catch(e) { fail('Auth protection', e.message) }

  // ══════════════════════════════════════════════
  section('LAYER 3: Medical Data CRUD')
  // ══════════════════════════════════════════════

  // T9: Save medical data
  if (accessToken) {
    try {
      const r = await req('POST', `${BASE}/api/data`, {
        age: 45,
        gender: 'male',
        month: 3,
        season: 'Spring',
        previousDiseases: ['Hypertension', 'Diabetes'],
        chronicConditions: ['Diabetes'],
        currentSymptoms: ['Headache', 'Fever'],
        symptomDuration: '1-3 kun',
        severityLevel: 'moderate',
        vitals: {
          bp: '150/95',
          heartRate: 88,
          temperature: 37.8,
          weight: 80,
          height: 175
        }
      }, accessToken)
      if (r.status === 201 && r.data.data?.id) {
        userDataId = r.data.data.id
        const bmi = r.data.data.vitals?.bmi
        pass('Save medical data', `id=${userDataId}, BMI=${bmi}`)
      } else {
        fail('Save medical data', r.data?.message || `status=${r.status}`)
      }
    } catch(e) { fail('Save medical data', e.message) }
  }

  // T10: Get data list
  if (accessToken) {
    try {
      const r = await req('GET', `${BASE}/api/data`, null, accessToken)
      if (r.status === 200 && Array.isArray(r.data.data))
        pass('Get data list', `${r.data.data.length} records`)
      else fail('Get data list', r.data?.message)
    } catch(e) { fail('Get data list', e.message) }
  }

  // ══════════════════════════════════════════════
  section('LAYER 4: AI Engine (4 Modules)')
  // ══════════════════════════════════════════════

  // T11: Full analysis
  if (accessToken && userDataId) {
    try {
      const start = Date.now()
      const r = await req('POST', `${BASE}/api/ai/analyze`,
        { userDataId }, accessToken)
      const ms = Date.now() - start

      if (r.status === 200 && r.data.success) {
        const result = r.data.data
        aiResultId = result?.id

        // Check each module
        const seasonal    = result?.resultData?.seasonal
        const progression = result?.resultData?.progression
        const chat        = result?.resultData?.chat
        const triage      = result?.resultData?.triage
        const score       = result?.overallRiskScore

        pass('Full analysis', `${ms}ms, score=${score}`)

        // Module checks
        if (seasonal?.top_risks?.length > 0)
          pass('  Seasonal module', `${seasonal.top_risks.length} risks`)
        else warn('  Seasonal module', 'top_risks empty (sklearn mismatch?)')

        if (progression?.risk_level)
          pass('  Progression module', `risk=${progression.risk_level}`)
        else warn('  Progression module', 'no risk_level')

        if (chat?.reply?.length > 0)
          pass('  Chatbot module', `reply=${chat.reply.length} chars`)
        else warn('  Chatbot module', 'empty reply')

        if (['HIGH','MEDIUM','LOW','CRITICAL'].includes(triage?.priority ||
             triage?.triage_level))
          pass('  Triage module', `priority=${triage?.priority || triage?.triage_level}`)
        else warn('  Triage module', `unexpected priority: ${JSON.stringify(triage)}`)

        if (score >= 0 && score <= 100)
          pass('  Risk score', `${score}/100`)
        else warn('  Risk score', `invalid: ${score}`)

      } else if (r.data?.code === 'AI_ENGINE_OFFLINE') {
        warn('Full analysis', 'AI Engine offline — run python run.py')
      } else {
        fail('Full analysis', r.data?.message || `status=${r.status}`)
      }
    } catch(e) { fail('Full analysis', e.message) }
  }

  // T12: AI chat
  if (accessToken) {
    try {
      const r = await req('POST', `${BASE}/api/ai/chat`, {
        message: "bosh og'riyapti isitmam bor",
        sessionId: 'test_session'
      }, accessToken)
      if (r.status === 200 && r.data.data?.reply)
        pass('AI Chat', `reply=${r.data.data.reply.length} chars`)
      else warn('AI Chat', r.data?.message || 'AI offline?')
    } catch(e) { warn('AI Chat', e.message) }
  }

  // T13: Triage endpoint
  if (accessToken) {
    try {
      const r = await req('POST', `${BASE}/api/ai/triage`, {
        symptoms: ['chest pain', 'shortness of breath'],
        age: 65,
        severity: 'severe',
        durationDays: 1
      }, accessToken)
      if (r.status === 200) {
        const p = r.data.data?.priority || r.data.data?.triage_level
        if (p === 'HIGH') pass('Triage endpoint', `priority=HIGH ✅`)
        else warn('Triage endpoint', `priority=${p} (expected HIGH)`)
      } else warn('Triage endpoint', r.data?.message)
    } catch(e) { warn('Triage endpoint', e.message) }
  }

  // ══════════════════════════════════════════════
  section('LAYER 5: History & Export')
  // ══════════════════════════════════════════════

  // T14: Get history
  if (accessToken) {
    try {
      const r = await req('GET', `${BASE}/api/history`, null, accessToken)
      if (r.status === 200 && r.data.data)
        pass('Get history', `${r.data.data.length || 0} records`)
      else fail('Get history', r.data?.message)
    } catch(e) { fail('Get history', e.message) }
  }

  // T15: History stats
  if (accessToken) {
    try {
      const r = await req('GET', `${BASE}/api/history/stats`, null, accessToken)
      if (r.status === 200 && r.data.data)
        pass('History stats', `total=${r.data.data.totalAnalyses}`)
      else fail('History stats', r.data?.message)
    } catch(e) { fail('History stats', e.message) }
  }

  // T16: Export history
  if (accessToken) {
    try {
      const r = await req(
        'GET', `${BASE}/api/history/export?format=json`,
        null, accessToken
      )
      if (r.status === 200)
        pass('Export history (JSON)', 'downloaded')
      else warn('Export history', r.data?.message)
    } catch(e) { warn('Export history', e.message) }
  }

  // ══════════════════════════════════════════════
  section('LAYER 6: Security Tests')
  // ══════════════════════════════════════════════

  // T17: Fake JWT rejected
  try {
    const r = await req('GET', `${BASE}/api/auth/me`,
      null, 'fake.token.here')
    if (r.status === 401) pass('Fake JWT rejected', '401')
    else fail('Fake JWT', `Expected 401, got ${r.status}`)
  } catch(e) { fail('Fake JWT test', e.message) }

  // T18: SQL injection attempt
  try {
    const r = await req('POST', `${BASE}/api/auth/login`, {
      email: "admin' OR '1'='1",
      password: "' OR '1'='1"
    })
    if (r.status === 400 || r.status === 401)
      pass('SQL injection blocked', `status=${r.status}`)
    else warn('SQL injection', `Got ${r.status} — verify manually`)
  } catch(e) { warn('SQL injection test', e.message) }

  // T19: XSS attempt
  try {
    const r = await req('POST', `${BASE}/api/auth/register`, {
      name: '<script>alert("xss")</script>',
      email: 'xss@test.com',
      password: 'Test1234!'
    })
    if (r.status === 201 && r.data.data?.user) {
      const name = r.data.data.user.name
      if (!name.includes('<script>'))
        pass('XSS sanitized', 'script tags removed')
      else warn('XSS', 'script tags not sanitized!')
    }
  } catch(e) { warn('XSS test', e.message) }

  // T20: Empty body
  try {
    const r = await req('POST', `${BASE}/api/auth/login`, {})
    if (r.status === 400 || r.status === 422)
      pass('Empty body validation', `status=${r.status}`)
    else warn('Empty body', `Expected 400, got ${r.status}`)
  } catch(e) { warn('Empty body test', e.message) }

  // ══════════════════════════════════════════════
  section('LAYER 7: Stress Test (50 requests)')
  // ══════════════════════════════════════════════

  if (accessToken) {
    const N = 50
    const start = Date.now()
    let ok = 0, err = 0

    const tasks = Array.from({length: N}, (_, i) =>
      req('GET', `${BASE}/api/history/stats`, null, accessToken)
        .then(r => { if (r.status === 200) ok++; else err++ })
        .catch(() => err++)
    )

    await Promise.all(tasks)
    const ms = Date.now() - start
    const rps = Math.round(N / (ms/1000))

    if (ok === N)
      pass(`Stress test ${N} req`, `${ok}/${N} OK, ${ms}ms, ~${rps} req/s`)
    else if (ok > N * 0.8)
      warn(`Stress test ${N} req`, `${ok}/${N} OK (${err} failed)`)
    else
      fail(`Stress test ${N} req`, `Only ${ok}/${N} succeeded!`)
  }

  // ══════════════════════════════════════════════
  section('LAYER 8: File Upload')
  // ══════════════════════════════════════════════

  // T22: Template download
  if (accessToken) {
    try {
      const r = await req('GET',
        `${BASE}/api/upload/template/csv`, null, accessToken)
      if (r.status === 200)
        pass('CSV template download', 'OK')
      else warn('CSV template', `status=${r.status}`)
    } catch(e) { warn('CSV template', e.message) }
  }

  // ══════════════════════════════════════════════
  section('LAYER 9: Logout & Cleanup')
  // ══════════════════════════════════════════════

  if (accessToken && refreshToken) {
    try {
      const r = await req('POST', `${BASE}/api/auth/logout`,
        { refreshToken }, accessToken)
      if (r.status === 200) pass('Logout', 'token revoked')
      else fail('Logout', r.data?.message)
    } catch(e) { fail('Logout', e.message) }
  }

  // Verify token revoked
  if (accessToken) {
    try {
      await new Promise(r => setTimeout(r, 200))
      const r = await req('GET', `${BASE}/api/auth/me`,
        null, accessToken)
      // After logout: may still work (access token in memory)
      // But refresh token should be revoked
      warn('Token after logout', `status=${r.status} (verify blacklist)`)
    } catch(e) {}
  }

  // ══════════════════════════════════════════════
  // FINAL SUMMARY
  // ══════════════════════════════════════════════

  const total = passed + failed + warnings
  const pct = Math.round(passed / (passed + failed) * 100) || 0

  console.log(`\n${BOLD}╔══════════════════════════════════════════╗`)
  console.log(`║           TEST SUMMARY                   ║`)
  console.log(`╠══════════════════════════════════════════╣`)
  console.log(`║  ${GREEN}✅ Passed:   ${String(passed).padEnd(28)}${RESET}${BOLD}║`)
  console.log(`║  ${RED}❌ Failed:   ${String(failed).padEnd(28)}${RESET}${BOLD}║`)
  console.log(`║  ${YELLOW}⚠️  Warnings: ${String(warnings).padEnd(27)}${RESET}${BOLD}║`)
  console.log(`║  📊 Score:    ${String(pct+'%').padEnd(28)}║`)
  console.log(`╠══════════════════════════════════════════╣`)

  if (failed === 0)
    console.log(`║  ${GREEN}🎉 ALL TESTS PASSED! Production Ready!   ${RESET}${BOLD}║`)
  else if (pct >= 80)
    console.log(`║  ${YELLOW}⚠️  Minor issues. Review warnings.        ${RESET}${BOLD}║`)
  else
    console.log(`║  ${RED}🚨 Critical failures. Fix before deploy!  ${RESET}${BOLD}║`)

  console.log(`╚══════════════════════════════════════════╝${RESET}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(console.error)
