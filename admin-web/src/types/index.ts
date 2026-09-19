// 全局类型定义

/** 统一响应体 */
export interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 管理员信息（对齐 openapi AdminProfile） */
export interface AdminProfile {
  id: number
  account: string
  name: string
  role: AdminRole
}

export type AdminRole = 'super_admin' | 'operator' | 'cs' | 'finance' | 'analyst'