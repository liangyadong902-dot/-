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

export interface ApiAdminTrip {
  id: number
  userId: number
  userName: string
  orderNo: string
  routeId: number
  routeName: string
  location: string
  boxName: string
  priceCent: number
  valueCent: number
  validity: string
  openedDate: string
}

export function listAdminTrips(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminTrip>>('/api/v1/admin/trips', { params })
}

export function listAdminPaymentFlows(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminPaymentFlow>>('/api/v1/admin/pay-flows', { params })
}

export interface ApiAdminPaymentFlow {
  flowNo: string
  orderNo: string
  channel: string
  channelTradeNo?: string | null
  amountCent: number
  result: string
  createdAt: string
}

export function getAdminOrder(orderNo: string) {
  return request.get<ApiAdminOrder>(`/api/v1/admin/orders/${orderNo}`)
}

export function reopenAdminOrder(orderNo: string) {
  return request.post<ApiAdminOrder>(`/api/v1/admin/orders/${orderNo}/reopen`)
}

export function exportAdminOrders(params?: Record<string, unknown>) {
  return request.get<Blob>('/api/v1/admin/orders/export', { params, responseType: 'blob' })
}
