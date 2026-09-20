import assert from 'node:assert/strict'

const baseUrl = process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:8080/api/v1'
const adminPassword = process.env.ACCEPTANCE_ADMIN_PASSWORD || 'tuge'
const runId = String(Date.now()).slice(-7)
const phone = `1878${runId}`

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
  const payload = JSON.parse(raw)
  assert.equal(response.status, 200, `${options.method || 'GET'} ${path} HTTP ${response.status}`)
  assert.equal(payload.code, 0, `${options.method || 'GET'} ${path}: ${raw}`)
  return payload.data
}

async function main() {
  await request('/auth/sms/send', { method: 'POST', body: { phone } })
  const login = await request('/auth/login/phone', {
    method: 'POST',
    body: { phone, code: '123456' },
  })
  const token = login.token
  const admin = await request('/admin/login', {
    method: 'POST',
    body: { account: 'admin', password: adminPassword },
  })
  const before = await request('/me/stats-detail', { token })
  const boxes = await request('/boxes')
  const box = boxes.find((item) => item.status === undefined || item.status === 'on') || boxes[0]
  assert.ok(box?.id)

  const order = await request('/orders', {
    method: 'POST',
    token,
    body: { boxId: box.id },
  })
  const payment = await request(`/orders/${order.orderNo}/pay`, {
    method: 'POST',
    token,
    body: { channel: 'alipay' },
  })
  assert.equal(payment.mock, true, 'backend must be started with PAY_MOCK_ENABLED=true')
  const opened = await request(`/orders/${order.orderNo}`, { token })
  assert.equal(opened.status, 'opened')
  const afterOpen = await request('/me/stats-detail', { token })
  assert.equal(afterOpen.tripCount, before.tripCount + 1)
  assert.equal(afterOpen.welfareKm, before.welfareKm + 1)

  await request(`/orders/${order.orderNo}/refund`, {
    method: 'POST',
    token,
    body: { reason: '验收退款', kind: 'unused' },
  })
  const pendingRefunds = await request('/admin/refunds?status=pending_review&page=1&pageSize=100', {
    token: admin.token,
  })
  const refund = pendingRefunds.list.find((item) => item.orderNo === order.orderNo)
  assert.ok(refund?.refundNo)
  await request(`/admin/refunds/${refund.refundNo}/approve`, {
    method: 'POST',
    token: admin.token,
    body: {},
  })
  const refunded = await request(`/orders/${order.orderNo}`, { token })
  assert.equal(refunded.status, 'refunded')
  const afterRefund = await request('/me/stats-detail', { token })
  assert.equal(afterRefund.tripCount, before.tripCount)
  assert.equal(afterRefund.welfareKm, before.welfareKm)
  assert.equal(afterRefund.savedTotal, before.savedTotal)
  assert.ok(afterRefund.badgeUnlocked >= afterOpen.badgeUnlocked)

  console.log(JSON.stringify({
    status: 'passed',
    runId,
    userId: login.user.id,
    orderNo: order.orderNo,
    refundNo: refund.refundNo,
    badgeBefore: before.badgeUnlocked,
    badgeAfterOpen: afterOpen.badgeUnlocked,
    badgeAfterRefund: afterRefund.badgeUnlocked,
  }))
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
