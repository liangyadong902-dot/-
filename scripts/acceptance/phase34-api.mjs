import assert from 'node:assert/strict'

const baseUrl = process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:8080/api/v1'
const adminPassword = process.env.ACCEPTANCE_ADMIN_PASSWORD || 'tuge'
const aiRounds = Number(process.env.ACCEPTANCE_AI_ROUNDS || 8)
const runId = String(Date.now()).slice(-7)
const phoneA = `1888${runId}`
const phoneB = `1898${runId}`
const guestA = `acceptance_guest_a_${runId}`
const guestB = `acceptance_guest_b_${runId}`

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const raw = await response.text()
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = raw
  }
  return { status: response.status, payload, raw }
}

async function ok(path, options = {}) {
  const result = await request(path, options)
  assert.equal(result.status, 200, `${options.method || 'GET'} ${path} HTTP ${result.status}`)
  assert.equal(result.payload.code, 0, `${options.method || 'GET'} ${path}: ${result.raw}`)
  return result.payload.data
}

async function denied(path, options = {}) {
  const result = await request(path, options)
  assert.equal(result.payload.code, 403, `${options.method || 'GET'} ${path} should return 403`)
}

async function userLogin(phone) {
  await ok('/auth/sms/send', { method: 'POST', body: { phone } })
  return ok('/auth/login/phone', {
    method: 'POST',
    body: { phone, code: '123456' },
  })
}

async function adminLogin(account) {
  return ok('/admin/login', {
    method: 'POST',
    body: { account, password: adminPassword },
  })
}

function configPayload(config, greet = config.greet) {
  return {
    greet,
    systemPrompt: config.systemPrompt,
    diaryPrompt: config.diaryPrompt,
    enabled: config.enabled,
    toolsEnabled: config.toolsEnabled,
    fallbackEnabled: config.fallbackEnabled,
  }
}

async function main() {
  const health = await ok('/health')
  assert.equal(health.status, 'UP')

  const questions = await ok('/personality/questions')
  assert.equal(questions.length, 5)
  questions.forEach((question) => {
    assert.ok(Array.isArray(question.options) && question.options.length > 0)
    assert.equal(Object.hasOwn(question, 'score'), false)
    question.options.forEach((option) => assert.equal(Object.hasOwn(option, 'score'), false))
  })
  const answers = questions.map(() => 0)
  const guestPersonality = await ok('/personality/submit', {
    method: 'POST',
    body: { answers, durationMs: 31000 },
  })
  assert.ok(guestPersonality.type)

  const [userA, userB] = await Promise.all([userLogin(phoneA), userLogin(phoneB)])
  const tokenA = userA.token
  const tokenB = userB.token
  const updated = await ok('/me', {
    method: 'PUT',
    token: tokenA,
    body: { nickname: `验收用户${runId}`, gender: 0, city: '吉安' },
  })
  assert.equal(updated.city, '吉安')

  const personality = await ok('/personality/submit', {
    method: 'POST',
    token: tokenA,
    body: { answers, durationMs: 32000 },
  })
  const storedPersonality = await ok('/personality/my-result', { token: tokenA })
  assert.equal(storedPersonality.type, personality.type)
  await ok('/personality/submit', {
    method: 'POST',
    token: tokenA,
    body: { answers: questions.map((question) => question.options.length - 1), durationMs: 33000 },
  })

  let lastGuestReply
  for (let round = 1; round <= aiRounds; round += 1) {
    lastGuestReply = await ok('/ai/chat', {
      method: 'POST',
      body: {
        text: `验收会话A第${round}轮，标记${runId}`,
        sessionId: guestA,
      },
    })
    assert.equal(lastGuestReply.sessionId, guestA)
    assert.ok(lastGuestReply.content)
  }
  const guestBReply = await ok('/ai/chat', {
    method: 'POST',
    body: { text: `验收会话B，标记${runId}`, sessionId: guestB },
  })
  assert.equal(guestBReply.sessionId, guestB)

  const loggedReply = await ok('/ai/chat', {
    method: 'POST',
    token: tokenA,
    body: { text: `登录用户验收消息${runId}`, viaQuick: false },
  })
  assert.ok(loggedReply.content)
  const history = await ok('/ai/messages?limit=16', { token: tokenA })
  assert.ok(history.length >= 2)
  assert.ok(history.some((message) => message.content.includes(runId)))

  const seeded = await userLogin('13800001201')
  const trips = await ok('/trips', { token: seeded.token })
  assert.ok(trips.list.length > 0)
  const tripId = trips.list[0].id
  const diary1 = await ok(`/trips/${tripId}/diary`, { method: 'POST', token: seeded.token, body: {} })
  const diary2 = await ok(`/trips/${tripId}/diary`, { method: 'POST', token: seeded.token, body: {} })
  assert.equal(diary2.diaryText, diary1.diaryText)
  const otherTrip = await request(`/trips/${tripId}/diary`, { method: 'POST', token: tokenB, body: {} })
  assert.ok([403, 404].includes(otherTrip.payload.code))

  const roleNames = ['admin', 'operator', 'cs', 'finance', 'analyst']
  const roles = Object.fromEntries(await Promise.all(roleNames.map(async (name) => [name, await adminLogin(name)])))
  const adminToken = roles.admin.token
  await Promise.all([
    ok('/admin/users?page=1&pageSize=5', { token: roles.admin.token }),
    ok('/admin/users?page=1&pageSize=5', { token: roles.operator.token }),
    ok('/admin/users?page=1&pageSize=5', { token: roles.cs.token }),
    ok('/admin/users?page=1&pageSize=5', { token: roles.finance.token }),
    ok('/admin/users?page=1&pageSize=5', { token: roles.analyst.token }),
  ])
  const aiConfig = await ok('/admin/ai/config', { token: adminToken })
  await ok('/admin/ai/config', { token: roles.operator.token })
  await ok('/admin/ai/config', { token: roles.cs.token })
  await ok('/admin/ai/config', { token: roles.analyst.token })
  await denied('/admin/ai/config', {
    method: 'PUT',
    token: roles.cs.token,
    body: configPayload(aiConfig),
  })
  await denied('/admin/ai/config', {
    method: 'PUT',
    token: roles.analyst.token,
    body: configPayload(aiConfig),
  })

  const changedGreet = `验收问候${runId}`
  await ok('/admin/ai/config', {
    method: 'PUT',
    token: adminToken,
    body: configPayload(aiConfig, changedGreet),
  })
  assert.equal((await ok('/ai/config')).greet, changedGreet)
  await ok('/admin/ai/config', {
    method: 'PUT',
    token: adminToken,
    body: configPayload(aiConfig),
  })

  await ok(`/admin/users/${userA.user.id}/note`, {
    method: 'PATCH',
    token: roles.cs.token,
    body: { note: `acceptance-${runId}` },
  })
  await ok(`/admin/users/${userA.user.id}/status`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'disabled', reason: '自动化验收' },
  })
  await denied('/me', { token: tokenA })
  await ok(`/admin/users/${userA.user.id}/status`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'active' },
  })

  const begin = '2026-09-01'
  const end = '2026-09-30'
  await Promise.all([
    ok(`/admin/stats/users?begin=${begin}&end=${end}`, { token: roles.analyst.token }),
    ok(`/admin/stats/pay?begin=${begin}&end=${end}`, { token: roles.finance.token }),
    ok(`/admin/stats/content?begin=${begin}&end=${end}`, { token: roles.operator.token }),
  ])
  const exportResult = await request('/admin/users/export?page=1&pageSize=10', { token: roles.finance.token })
  assert.equal(exportResult.status, 200)
  assert.ok(exportResult.raw.includes('用户ID'))

  console.log(JSON.stringify({
    status: 'passed',
    runId,
    userAId: userA.user.id,
    userBId: userB.user.id,
    guestA,
    guestB,
    guestRounds: aiRounds,
    diaryTripId: tripId,
    aiFallback: lastGuestReply.fallback,
  }))
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
