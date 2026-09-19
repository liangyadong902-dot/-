<template>
  <div>
    {{ name }}
    <div v-if="wx" style="font-size:11px;color:var(--sage-deep);font-weight:700;">微信名 {{ wx }}</div>
    <div v-if="phoneLine" style="font-size:11px;color:var(--muted);">{{ phoneLine }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKitchenStore } from '@/stores/kitchen'
import type { GuestLike } from '@/types/kitchen'

const props = defineProps<{ guest: GuestLike }>()
const kitchen = useKitchenStore()

const name = computed(() => props.guest.name || props.guest.user || '途友')
const wx = computed(() => kitchen.wxNickOf(props.guest))
const phoneLine = computed(() => {
  const phone = props.guest.phone || ''
  if (wx.value && (!phone || phone === '未绑定')) return '未绑定手机'
  return phone || ''
})
</script>
