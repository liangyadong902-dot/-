function createRequestId(prefix) {
  const safePrefix = String(prefix || 'REQ').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16) || 'REQ'
  return safePrefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

module.exports = { createRequestId }
