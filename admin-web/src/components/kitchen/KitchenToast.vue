<template>
  <div class="toast" :class="{ on }">{{ msg }}</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { setToastHandler } from '@/utils/toast'

const msg = ref('')
const on = ref(false)
let timer = 0

function show(text: string) {
  msg.value = text
  on.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    on.value = false
  }, 1800)
}

onMounted(() => setToastHandler(show))
onUnmounted(() => {
  setToastHandler(null)
  window.clearTimeout(timer)
})
</script>
