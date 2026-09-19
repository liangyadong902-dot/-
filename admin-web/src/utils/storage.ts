/** 本地存储工具（带前缀，避免污染） */
const PREFIX = 'tuge_admin_'

export function getStorage<T = any>(key: string): T | null {
  const raw = localStorage.getItem(PREFIX + key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return raw as unknown as T
  }
}

export function setStorage<T = any>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

/** Token 读写 */
export function getToken(): string | null {
  return getStorage<string>('token')
}

export function setToken(token: string): void {
  setStorage('token', token)
}

export function removeToken(): void {
  removeStorage('token')
}

/** 当前登录用户 */
export function getAdminUser(): any | null {
  return getStorage('user')
}

export function setAdminUser(user: any): void {
  setStorage('user', user)
}