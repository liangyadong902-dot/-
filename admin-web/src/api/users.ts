import request from '@/api'
import type { PageResult } from '@/api/content'

export interface ApiAdminUser {
  id: number
  nickname: string
  avatarUrl?: string | null
  phone: string
  wechatNickname?: string | null
  channel: string
  tripCount: number
  title: string
  spendTotal: number
  savedTotal: number
  status: 'active' | 'disabled'
  personalityType?: string | null
  lastLoginAt?: string | null
  createdAt: string
}

export function listAdminUsers(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminUser>>('/api/v1/admin/users', { params })
}

export interface ApiAdminUserDetail extends ApiAdminUser {
  city?: string | null
  gender?: number | null
  recentMood?: string | null
  stats: Record<string, any>
  badges: Array<Record<string, any>>
  recentOrders: Array<Record<string, any>>
  recentTrips: Array<Record<string, any>>
  csNote?: string | null
  disableReason?: string | null
}

export function getAdminUser(id: number) {
  return request.get<ApiAdminUserDetail>(`/api/v1/admin/users/${id}`)
}

export function updateAdminUserStatus(id: number, status: 'active' | 'disabled', reason?: string) {
  return request.patch(`/api/v1/admin/users/${id}/status`, { status, reason })
}

export function updateAdminUserNote(id: number, note: string) {
  return request.patch(`/api/v1/admin/users/${id}/note`, { note })
}

export function exportAdminUsers(params?: Record<string, unknown>) {
  return request.get<Blob>('/api/v1/admin/users/export', { params, responseType: 'blob' }) as any
}
