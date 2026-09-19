import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import router from '@/router'
import { getToken, removeStorage } from '@/utils/storage'
import { toast } from '@/utils/toast'
import type { ApiResult } from '@/types'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResult
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) {
        const skipToast = Boolean((response.config as { skipToast?: boolean }).skipToast)
        if (!skipToast) toast(res.message || '请求失败')
        return Promise.reject(new Error(res.message))
      }
      return res as any
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message
    const skipToast = Boolean((error.config as { skipToast?: boolean } | undefined)?.skipToast)
    if (status === 401) {
      removeStorage('token')
      removeStorage('user')
      router.push('/login')
      if (!skipToast) toast(message || '登录已过期，请重新登录')
    } else if (!skipToast) {
      toast(message || '网络错误')
    }
    return Promise.reject(error)
  },
)

const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return service.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return service.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return service.put(url, data, config)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return service.patch(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return service.delete(url, config)
  },
}

export default request
