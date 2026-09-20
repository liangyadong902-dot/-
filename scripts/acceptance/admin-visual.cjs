const fs = require('node:fs')
const path = require('node:path')

const playwrightPath = process.env.PLAYWRIGHT_PATH || 'playwright'
const { chromium } = require(playwrightPath)

const baseUrl = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = path.resolve(process.env.ACCEPTANCE_SCREENSHOT_DIR || 'docs/acceptance/phase3-4/admin-matrix')
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const adminPassword = process.env.ACCEPTANCE_ADMIN_PASSWORD || 'tuge'

const domains = [
  { key: 'users', path: '/users', patterns: ['**/api/v1/admin/users**'], loading: '正在读取用户', empty: '暂无用户', error: '用户列表加载失败' },
  { key: 'stats', path: '/stats', patterns: ['**/api/v1/admin/stats/**'], loading: '正在汇总经营数据', empty: '暂无心情数据', error: '经营数据加载失败' },
  { key: 'ai', path: '/ai', patterns: ['**/api/v1/admin/ai/**'], loading: '正在读取小途配方', empty: '暂无快捷问题', error: 'AI 配置加载失败' },
  { key: 'personality', path: '/quiz', patterns: ['**/api/v1/admin/personality/**'], loading: '正在读取人格题库', empty: '暂无人格题目', error: '人格题库加载失败' },
  { key: 'orders', path: '/orders', patterns: ['**/api/v1/admin/orders**'], loading: '正在读取订单', empty: '暂无订单', error: '订单列表加载失败' },
  { key: 'refunds', path: '/refunds', patterns: ['**/api/v1/admin/refunds**'], loading: '正在读取退款申请', empty: '暂无退款申请', error: '交易数据加载失败' },
  { key: 'flows', path: '/orders', patterns: ['**/api/v1/admin/pay-flows**'], loading: '正在读取支付流水', empty: '暂无支付流水', error: '支付流水加载失败' },
  { key: 'trips', path: '/trips', patterns: ['**/api/v1/admin/trips**'], loading: '正在读取行程', empty: '暂无行程记录', error: '行程列表加载失败' },
]

async function login(page, account = 'admin') {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[autocomplete="username"]').fill(account)
  await page.locator('input[autocomplete="current-password"]').fill(adminPassword)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login')),
    page.locator('button[type="submit"]').click(),
  ])
}

function emptyData(url) {
  if (url.includes('/stats/users')) return { users: { registered: 0, new: 0, active: 0 }, funnel: [], titleDistribution: {}, moodDistribution: {}, ai: { userCount: 0, messageCount: 0, fallbackCount: 0, fallbackRate: 0 } }
  if (url.includes('/stats/pay')) return { orderCount: 0, paidOrderCount: 0, gmv: 0, averageOrderValue: null, refundCount: 0, refundAmount: 0, refundRate: 0, channels: [] }
  if (url.includes('/stats/content')) return { openCount: 0, boxStats: [], routeStats: [] }
  if (url.includes('/ai/config')) return { greet: '', systemPrompt: '', diaryPrompt: '', enabled: false, toolsEnabled: false, fallbackEnabled: true }
  if (url.includes('/admin/ai/') || url.includes('/admin/personality/')) return []
  return { list: [], total: 0, page: 1, pageSize: 100 }
}

async function fulfill(route, state) {
  const code = state === 'forbidden' ? 403 : state === 'error' ? 500 : 0
  const message = state === 'forbidden' ? '无权限访问验收数据' : state === 'error' ? '验收模拟服务异常' : 'success'
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code, message, data: code === 0 ? emptyData(route.request().url()) : null }),
  })
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await chromium.launch({ executablePath, headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  let screenshots = 0

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(`console: ${message.text()}`)
    }
  })

  async function screenshot(name) {
    await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true })
    screenshots += 1
    const viewport = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }))
    if (viewport.width > viewport.viewport) errors.push(`overflow ${name}: ${viewport.width} > ${viewport.viewport}`)
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await screenshot('00-login-initial')
  await login(page)

  for (const domain of domains) {
    await page.goto(`${baseUrl}${domain.path}`, { waitUntil: 'networkidle' })
    await page.locator('.view').waitFor()
    await screenshot(`success-${domain.key}`)
  }

  await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '查看' }).first().click()
  await page.getByText('客服备注').waitFor()
  await screenshot('success-user-detail')

  await context.clearCookies()
  await page.evaluate(() => localStorage.clear())
  await login(page, 'analyst')
  await page.goto(`${baseUrl}/ai`, { waitUntil: 'networkidle' })
  if (await page.getByRole('button', { name: '保存配方' }).count()) throw new Error('analyst must not see AI edit controls')
  await screenshot('success-ai-readonly')

  await context.clearCookies()
  await page.evaluate(() => localStorage.clear())
  await login(page)

  for (const domain of domains) {
    let release
    const gate = new Promise((resolve) => { release = resolve })
    const handlers = domain.patterns.map(() => async (route) => { await gate; await fulfill(route, 'empty') })
    for (let index = 0; index < domain.patterns.length; index += 1) await page.route(domain.patterns[index], handlers[index])
    await page.goto(`${baseUrl}${domain.path}`, { waitUntil: 'domcontentloaded' })
    await page.getByText(domain.loading, { exact: false }).first().waitFor()
    await screenshot(`loading-${domain.key}`)
    release()
    await page.waitForLoadState('networkidle')
    for (let index = 0; index < domain.patterns.length; index += 1) await page.unroute(domain.patterns[index], handlers[index])
  }

  for (const state of ['empty', 'error', 'forbidden']) {
    for (const domain of domains) {
      const handlers = domain.patterns.map(() => (route) => fulfill(route, state))
      for (let index = 0; index < domain.patterns.length; index += 1) await page.route(domain.patterns[index], handlers[index])
      await page.goto(`${baseUrl}${domain.path}`, { waitUntil: 'networkidle' })
      if (state === 'empty') {
        await page.getByText(domain.empty, { exact: false }).first().waitFor()
      } else {
        await page.getByText(domain.error, { exact: false }).first().waitFor()
        if (state === 'forbidden') await page.locator('.toast.on').waitFor()
      }
      await screenshot(`${state}-${domain.key}`)
      for (let index = 0; index < domain.patterns.length; index += 1) await page.unroute(domain.patterns[index], handlers[index])
    }
  }

  await browser.close()
  console.log(JSON.stringify({ status: errors.length ? 'failed' : 'passed', screenshots, domains: domains.length, errors }))
  if (errors.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
