import request from '@/api'
import type { PageResult } from '@/api/content'

export interface AdminPost { postId: number; title: string; content?: string; status: string; version?: number; likeCount: number; commentCount: number; collectCount: number; createdAt: string; author?: { nickname?: string; userId?: number }; topic?: { name?: string } }
export interface AdminComment { commentId: number; postId: number; content: string; status: string; version?: number; createdAt: string; author?: { nickname?: string } }
export interface AdminTopic { topicId: number; name: string; description?: string; postCount: number; followCount: number; status: string; version?: number }
export interface AdminCheckin { checkinId: number; tripId?: number; locationName: string; status: string; version?: number; likeCount: number; createdAt: string; user?: { nickname?: string } }
export interface AdminAchievement { achievementId: number; code: string; name: string; description: string; requirementType: string; requirementValue: number; level: number; status: string; version?: number }
export interface AdminCheckinStatistics {
  total: number
  newUsers: number
  activeUsers: number
  topLocations: Array<{ locationName: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}
export interface AdminAchievementStatistics {
  unlockTotal: number
  userTotal: number
  unlockRate: number
  byAchievement: Array<{ achievementId: number; name: string; unlockCount: number; unlockRate: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

export function listAdminPosts(params?: Record<string, unknown>) { return request.get<PageResult<AdminPost>>('/api/v1/admin/community/posts', { params }) }
export function updateAdminPostStatus(id: number, data: { toStatus: string; reason?: string; version?: number }) { return request.patch<AdminPost>(`/api/v1/admin/community/posts/${id}/status`, data) }
export function listAdminComments(params?: Record<string, unknown>) { return request.get<PageResult<AdminComment>>('/api/v1/admin/community/comments', { params }) }
export function updateAdminCommentStatus(id: number, data: { toStatus: string; reason?: string; version?: number }) { return request.patch<void>(`/api/v1/admin/community/comments/${id}/status`, data) }
export function listAdminTopics(params?: Record<string, unknown>) { return request.get<PageResult<AdminTopic>>('/api/v1/admin/community/topics', { params }) }
export function createAdminTopic(data: unknown) { return request.post<AdminTopic>('/api/v1/admin/community/topics', data) }
export function updateAdminTopic(id: number, data: unknown) { return request.put<AdminTopic>(`/api/v1/admin/community/topics/${id}`, data) }
export function deleteAdminTopic(id: number) { return request.delete<void>(`/api/v1/admin/community/topics/${id}`) }
export function listAdminCheckins(params?: Record<string, unknown>) { return request.get<PageResult<AdminCheckin>>('/api/v1/admin/checkins', { params }) }
export function getAdminCheckinStatistics() { return request.get<AdminCheckinStatistics>('/api/v1/admin/checkins/statistics') }
export function updateAdminCheckinStatus(id: number, data: { toStatus: string; reason?: string; version?: number }) { return request.patch<AdminCheckin>(`/api/v1/admin/checkins/${id}/status`, data) }
export function listAdminAchievements(params?: Record<string, unknown>) { return request.get<PageResult<AdminAchievement>>('/api/v1/admin/achievements', { params }) }
export function getAdminAchievementStatistics() { return request.get<AdminAchievementStatistics>('/api/v1/admin/achievements/statistics') }
export function createAdminAchievement(data: unknown) { return request.post<AdminAchievement>('/api/v1/admin/achievements', data) }
export function updateAdminAchievement(id: number, data: unknown) { return request.put<AdminAchievement>(`/api/v1/admin/achievements/${id}`, data) }
export function deleteAdminAchievement(id: number) { return request.delete<void>(`/api/v1/admin/achievements/${id}`) }
