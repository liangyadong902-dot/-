<template>
  <svg v-if="kind === 'boxes'" width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="8" y="16" width="28" height="20" rx="3" stroke="#6C7E58" stroke-width="1.7" />
    <path d="M22 16v20M8 22h28" stroke="#6C7E58" stroke-width="1.5" />
    <path d="M16 16c0-6 12-6 12 0" stroke="#6C7E58" stroke-width="1.5" />
  </svg>
  <svg v-else-if="kind === 'routes'" width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M22 36s10-8.5 10-16a10 10 0 1 0-20 0c0 7.5 10 16 10 16z" stroke="#6C7E58" stroke-width="1.7" />
    <circle cx="22" cy="20" r="3" stroke="#6C7E58" stroke-width="1.5" />
  </svg>
  <svg v-else-if="kind === 'orders'" width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="10" y="12" width="24" height="22" rx="3" stroke="#6C7E58" stroke-width="1.7" />
    <path d="M16 12V9h12v3M16 20h12M16 25h8" stroke="#6C7E58" stroke-width="1.5" />
  </svg>
  <svg v-else-if="kind === 'refunds'" width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="12" y="10" width="20" height="24" rx="3" stroke="#6C7E58" stroke-width="1.7" />
    <path d="M18 18h8M18 23h8M18 28h5" stroke="#6C7E58" stroke-width="1.5" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ kind: 'boxes' | 'routes' | 'orders' | 'refunds' }>()
</script>
