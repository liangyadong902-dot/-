<template>
  <aside class="side">
    <div class="side-brand">
      <div class="cursive" style="font-size:22px;">Tuge Oven</div>
      <div class="shop-title">途个惊喜</div>
      <div class="slogan" style="margin-top:4px;font-size:11px;">运营后厨</div>
    </div>
    <nav class="nav-scroll">
      <template v-for="group in NAV" :key="group.g">
        <div class="nav-label">{{ group.g }}</div>
        <button
          v-for="item in group.items"
          :key="item.id"
          class="nav-item"
          :class="{ on: route.path === item.path }"
          type="button"
          @click="router.push(item.path)"
        >
          <NavIcon :name="item.icon" />
          <span>{{ item.name }}</span>
        </button>
      </template>
    </nav>
    <div class="side-foot">
      <div class="ava">
        <NavIcon name="ai" />
      </div>
      <div class="side-who">
        <strong>{{ displayName }}</strong>
        <small>{{ roleLabel }}</small>
      </div>
      <button class="side-logout" type="button" @click="handleLogout">退出</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAV, ROLE_LABEL } from '@/constants/nav'
import { useKitchenStore } from '@/stores/kitchen'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/toast'
import NavIcon from '@/components/kitchen/NavIcon.vue'

const route = useRoute()
const router = useRouter()
const kitchen = useKitchenStore()
const userStore = useUserStore()

const displayName = computed(() => userStore.profile?.name || '管理员')
const roleLabel = computed(() => {
  const role = userStore.profile?.role
  return (role && ROLE_LABEL[role]) || '管理员'
})

function handleLogout() {
  kitchen.closeDrawer()
  userStore.logout()
  toast('已退出后厨')
  router.replace('/login')
}
</script>
