import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAdminUser, setAdminUser, removeToken, removeStorage } from '@/utils/storage'
import type { AdminProfile } from '@/types'

/** 当前登录管理员状态 */
export const useUserStore = defineStore('user', () => {
  const profile = ref<AdminProfile | null>(getAdminUser() as AdminProfile | null)

  function setProfile(user: AdminProfile) {
    profile.value = user
    setAdminUser(user)
  }

  /** 是否已登录 */
  function isLoggedIn(): boolean {
    return !!profile.value
  }

  function logout() {
    profile.value = null
    removeToken()
    removeStorage('user')
  }

  return { profile, setProfile, isLoggedIn, logout }
})