import request from '@/api'
import type { OrderStatus } from '@/types/kitchen'
import type { PageResult } from '@/api/content'

export interface ApiAdminOrder {
  orderNo: string
  userId: number
  userName: string
  phone: string
  boxName: string
  priceCent: number
  paidCent: number
  status: OrderStatus
  payChannel?: string | null
  routeName?: string | null
  tripId?: number | null
  createdAt: string
}

export interface ApiAdminRefund {
  refundNo: string
  orderNo: string
  userId: number
  userName: string
  amountCent: number
  reason: string
  kind: string
  status: string
  rejectReason?: string | null
  createdAt: string
}

export function listAdminOrders(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminOrder>>('/api/v1/admin/orders', { params })
}

export function listAdminRefunds(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminRefund>>('/api/v1/admin/refunds', { params })
}

export function approveAdminRefund(refundNo: string) {
  return request.post<void>(`/api/v1/admin/refunds/${refundNo}/approve`)
}

export function rejectAdminRefund(refundNo: string, reason = '审核未通过') {
  return request.post<void>(`/api/v1/admin/refunds/${refundNo}/reject`, { reason })
}
