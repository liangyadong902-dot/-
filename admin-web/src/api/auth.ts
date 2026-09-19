import request from '@/api'
import type { AdminProfile } from '@/types'

/** 管理员登录 */
export function login(account: string, password: string) {
  return request.post<{ token: string; admin: AdminProfile }>(
    '/api/v1/admin/login',
    { account, password },
    { skipToast: true } as any,
  )
}

/** 当前管理员信息 */
export function getProfile() {
  return request.get<AdminProfile>('/api/v1/admin/me')
}