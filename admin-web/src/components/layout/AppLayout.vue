<template>
  <div class="kitchen-shell">
    <Sidebar />
    <div class="workspace">
      <Header />
      <main class="main">
        <router-view />
      </main>
    </div>
    <DrawerHost />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import DrawerHost from '@/components/kitchen/DrawerHost.vue'
import { useKitchenStore } from '@/stores/kitchen'

const kitchen = useKitchenStore()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') kitchen.closeDrawer()
}

onMounted(() => {
  document.body.classList.add('app-on')
  window.addEventListener('keydown', onKey)
  kitchen.loadCatalog().catch(() => {
    /* 拦截器已提示 */
  })
})
onUnmounted(() => {
  document.body.classList.remove('app-on')
  window.removeEventListener('keydown', onKey)
})
</script>
