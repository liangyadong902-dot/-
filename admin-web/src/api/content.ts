import type { AxiosRequestConfig } from 'axios'
import request from '@/api'
import type { Category, Mood, ShelfStatus } from '@/types/kitchen'

export interface ApiBlindBox {
  id: number
  name: string
  category: Category
  tag: string
  rankTag?: string | null
  intro: string
  price: number
  minValue: number
  coverUrl: string
  moods?: Mood[]
  status: ShelfStatus
}

export interface ApiBanner {
  id: number
  title: string
  subTitle: string
  tag: string
  imageUrl: string
  jumpType: string
  jumpTarget?: string | null
}

export interface ApiBadge {
  id: number
  name: string
  mark: string
  description: string
  unlocked?: boolean
  unlockedAt?: string | null
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiAdminBox extends ApiBlindBox {
  sortWeight: number
  openCount: number
  createdAt?: string
  updatedAt?: string
  warning?: string | null
}

export interface ApiAdminRoute {
  id: number
  name: string
  category: Category
  destination: string
  scene?: string
  imageUrl?: string | null
  guide?: Record<string, unknown> | null
  guideVersion?: number | null
  value: number
  cost?: number | null
  badgeId: number
  badgeName: string
  badgeMark?: string
  highlight: string
  includes: string[]
  moodText: string
  status: ShelfStatus
  drawCount: number
  meetsGuarantee?: boolean
}

export interface ApiAdminBadge extends ApiBadge {
  icon?: string | null
  sortWeight: number
  unlockedCount: number
  routeCount: number
}

export interface ApiAdminBanner extends ApiBanner {
  startAt?: string | null
  endAt?: string | null
  sortWeight: number
  status: ShelfStatus
}

/** 上架盲盒（用户端，阶段一冒烟） */
export function listBoxes(
  params?: { category?: string; mood?: string },
  config?: AxiosRequestConfig,
) {
  return request.get<ApiBlindBox[]>('/api/v1/boxes', { params, ...config })
}

/** 当前有效 Banner */
export function listBanners() {
  return request.get<ApiBanner[]>('/api/v1/banners')
}

/** 徽章定义 */
export function listBadges() {
  return request.get<{ total: number; list: ApiBadge[] }>('/api/v1/badges')
}

export function listAdminBoxes(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminBox>>('/api/v1/admin/boxes', { params })
}

export function createAdminBox(data: unknown) {
  return request.post<ApiAdminBox>('/api/v1/admin/boxes', data)
}

export function updateAdminBox(id: string | number, data: unknown) {
  return request.put<ApiAdminBox>(`/api/v1/admin/boxes/${id}`, data)
}

export function updateAdminBoxStatus(id: string | number, status: ShelfStatus) {
  return request.patch<void>(`/api/v1/admin/boxes/${id}/status`, { status })
}

export function deleteAdminBox(id: string | number) {
  return request.delete<void>(`/api/v1/admin/boxes/${id}`)
}

export interface ApiRoutePool {
  routes: ApiAdminRoute[]
  ok: boolean
}

export function getAdminBoxPool(id: string | number) {
  return request.get<ApiRoutePool>(`/api/v1/admin/boxes/${id}/pool`)
}

export function listAdminRoutes(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminRoute>>('/api/v1/admin/routes', { params })
}

export function uploadAdminImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<{ uploadId: string; url: string; size: number; mimeType: string }>(
    '/api/v1/upload/image',
    form,
  )
}

export function createAdminRoute(data: unknown) {
  return request.post<ApiAdminRoute>('/api/v1/admin/routes', data)
}

export function updateAdminRoute(id: string | number, data: unknown) {
  return request.put<ApiAdminRoute>(`/api/v1/admin/routes/${id}`, data)
}

export function updateAdminRouteStatus(id: string | number, status: ShelfStatus) {
  return request.patch<void>(`/api/v1/admin/routes/${id}/status`, { status })
}

export function deleteAdminRoute(id: string | number) {
  return request.delete<void>(`/api/v1/admin/routes/${id}`)
}

export function listAdminBadges(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminBadge>>('/api/v1/admin/badges', { params })
}

export function createAdminBadge(data: unknown) {
  return request.post<ApiAdminBadge>('/api/v1/admin/badges', data)
}

export function updateAdminBadge(id: string | number, data: unknown) {
  return request.put<ApiAdminBadge>(`/api/v1/admin/badges/${id}`, data)
}

export function listAdminBanners(params?: Record<string, unknown>) {
  return request.get<PageResult<ApiAdminBanner>>('/api/v1/admin/banners', { params })
}

export function createAdminBanner(data: unknown) {
  return request.post<ApiAdminBanner>('/api/v1/admin/banners', data)
}

export function updateAdminBanner(id: string | number, data: unknown) {
  return request.put<ApiAdminBanner>(`/api/v1/admin/banners/${id}`, data)
}

export function deleteAdminBanner(id: string | number) {
  return request.delete<void>(`/api/v1/admin/banners/${id}`)
}

export function updateAdminBannerStatus(id: string | number, status: ShelfStatus) {
  return request.patch<void>(`/api/v1/admin/banners/${id}/status`, { status })
}
