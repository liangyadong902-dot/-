import request from '@/api'

export interface AdminUserStats {
  users: { registered: number; new: number; active: number }
  funnel: Array<{ key: string; label: string; count: number | null; rate: number | null }>
  titleDistribution: Record<string, number>
  moodDistribution: Record<string, number>
  ai: { userCount: number; messageCount: number; fallbackCount: number; fallbackRate: number }
}

export interface AdminPayStats {
  orderCount: number
  paidOrderCount: number
  gmv: number
  averageOrderValue: number | null
  refundCount: number
  refundAmount: number
  refundRate: number
  channels: Array<{ channel: string; count: number }>
}

export interface AdminContentStats {
  openCount: number
  boxStats: Array<{ name: string; count: number }>
  routeStats: Array<{ name: string; count: number }>
}

export const getUserStats = (params: { begin: string; end: string }) => request.get<AdminUserStats>('/api/v1/admin/stats/users', { params })
export const getPayStats = (params: { begin: string; end: string }) => request.get<AdminPayStats>('/api/v1/admin/stats/pay', { params })
export const getContentStats = (params: { begin: string; end: string }) => request.get<AdminContentStats>('/api/v1/admin/stats/content', { params })
