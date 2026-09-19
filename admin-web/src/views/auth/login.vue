<template>
  <div class="login-stage">
    <div class="login-card">
      <section class="login-hero">
        <LampSvg kind="login" />
        <header class="login-brand">
          <div class="cursive-row">
            <div class="cursive">{{ greet }}</div>
            <LeafSvg :size="16" />
          </div>
          <div class="shop-title">途个惊喜</div>
          <div class="slogan">
            随盒出发，途个好心情
            <HeartSvg :size="12" />
          </div>
        </header>

        <div class="login-art">
          <figure class="login-shot login-shot-main">
            <img v-if="hero.coverUrl" :src="hero.coverUrl" :alt="hero.name" />
            <div class="v-label">FRESH JOURNEY</div>
            <div class="photo-tag">BAKERY<br>HANDMADE</div>
            <div class="fresh-orb">今日<br>新鲜出炉</div>
          </figure>

          <div class="login-stack">
            <div class="login-ticket">
              <div class="eyebrow">TODAY'S SPECIAL</div>
              <h3>{{ hero.name || '货架准备中' }}</h3>
              <p>{{ hero.intro || '登录后查看上架盲盒' }}</p>
              <span class="link-cta">去货架看看 →</span>
            </div>
            <figure class="login-shot login-shot-side">
              <img v-if="side.coverUrl" :src="side.coverUrl" :alt="side.name" />
            </figure>
            <div class="login-mascot">
              <div class="speech">今天也要把盒子烤好呀！</div>
              <LoginMascot />
            </div>
          </div>
        </div>
      </section>

      <aside class="login-pane">
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="cursive" style="font-size:28px;margin-bottom:4px;">Welcome in</div>
          <h2>进入后厨</h2>
          <p class="hint">请输入管理端账号和密码。演示账号密码均为 tuge。</p>
          <div class="login-roles">
            <button
              v-for="r in LOGIN_ROLES"
              :key="r"
              class="chip"
              :class="{ on: role === r }"
              type="button"
              @click="selectRole(r)"
            >{{ r }}</button>
          </div>
          <div class="field">
            <label>ACCOUNT</label>
            <input v-model.trim="account" autocomplete="username" placeholder="请输入管理端账号" />
          </div>
          <div class="field">
            <label>PASSWORD</label>
            <div class="pass-wrap">
              <input v-model="password" :type="showPass ? 'text' : 'password'" autocomplete="current-password" />
              <button class="pass-toggle" type="button" aria-label="显示密码" @click="showPass = !showPass">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
          <div class="login-extra">
            <label><input v-model="remember" type="checkbox" /> 记住档口</label>
            <span>验证码登录稍后接</span>
          </div>
          <button class="btn-sage btn-block" type="submit" :disabled="loading">开启今日档口 →</button>
          <div class="login-foot">今日特选已放到左侧橱窗。用演示账号 admin / tuge 即可进门。</div>
        </form>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth'
import type { AxiosRequestConfig } from 'axios'
import { listBoxes, type ApiBlindBox } from '@/api/content'
import { useUserStore } from '@/stores/user'
import { setToken } from '@/utils/storage'
import { toast } from '@/utils/toast'
import { hourGreet } from '@/utils/greet'
import { LOGIN_ROLES, ROLE_ACCOUNT, type LoginRole } from '@/constants/nav'
import LampSvg from '@/components/kitchen/LampSvg.vue'
import LeafSvg from '@/components/kitchen/LeafSvg.vue'
import HeartSvg from '@/components/kitchen/HeartSvg.vue'
import LoginMascot from '@/components/kitchen/LoginMascot.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const greet = hourGreet()
const role = ref<LoginRole>('超级管理员')
const account = ref('admin')
const password = ref('tuge')
const showPass = ref(false)
const remember = ref(true)
const loading = ref(false)
const boxes = ref<ApiBlindBox[]>([])

const emptyBox: ApiBlindBox = {
  id: 0,
  name: '',
  category: 'nearby',
  tag: '',
  intro: '',
  price: 0,
  minValue: 0,
  coverUrl: '',
  status: 'on',
}

const hero = ref<ApiBlindBox>(emptyBox)
const side = ref<ApiBlindBox>(emptyBox)

onMounted(async () => {
  try {
    const res = await listBoxes(undefined, { skipToast: true } as AxiosRequestConfig)
    boxes.value = res.data || []
    hero.value = boxes.value[1] || boxes.value[0] || emptyBox
    side.value = boxes.value[0] || emptyBox
  } catch {
    /* 登录页橱窗可空 */
  }
})

async function handleLogin() {
  const loginAccount = account.value.trim()
  if (!loginAccount || !password.value) {
    toast('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(loginAccount, password.value)
    setToken(res.data.token)
    userStore.setProfile(res.data.admin)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: unknown) {
    const ax = err as { response?: { data?: { message?: string } }; message?: string }
    toast(ax.response?.data?.message || ax.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function selectRole(nextRole: LoginRole) {
  role.value = nextRole
  account.value = ROLE_ACCOUNT[nextRole]
}
</script>
