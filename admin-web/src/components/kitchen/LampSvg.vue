<template>
  <svg :class="kind === 'login' ? 'login-lamp' : 'lamp'" :width="kind === 'login' ? 44 : 40" :height="kind === 'login' ? 64 : 54" viewBox="0 0 40 54" fill="none" aria-hidden="true">
    <path d="M20 0v18" stroke="#6C7E58" stroke-width="1.6" />
    <path d="M8 26c2-8 24-8 24 0-2 10-22 10-24 0z" fill="#6C7E58" />
    <path d="M12 26c1.5 6 14.5 6 16 0" stroke="#E4EDD8" stroke-width="1.2" />
    <circle cx="20" cy="32" r="2.2" fill="#E8C9A0" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'login' | 'head' }>(), { kind: 'head' })
</script>
