<template>
  <svg v-if="name === 'dash'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
  </svg>
  <svg v-else-if="name === 'box'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13" />
    <path d="M12 8c-2-3 2-5 4-3s0 3-4 3z" />
  </svg>
  <svg v-else-if="name === 'route'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
  <svg v-else-if="name === 'badge'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M12 3 14.5 8l5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9L9.5 8z" />
  </svg>
  <svg v-else-if="name === 'banner'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 15l5-4 4 3 9-7" />
  </svg>
  <svg v-else-if="name === 'ai'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="8" r="3" />
    <path d="M6 19c1.5-3 4-4.5 6-4.5S16.5 16 18 19" />
    <path d="M19 8h2M3 8h2M12 2v1" />
  </svg>
  <svg v-else-if="name === 'quiz'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8V14" />
    <circle cx="12" cy="17" r=".8" fill="currentColor" />
  </svg>
  <svg v-else-if="name === 'order'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    <rect x="4" y="7" width="16" height="14" rx="2" />
    <path d="M8 12h8M8 16h5" />
  </svg>
  <svg v-else-if="name === 'refund'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M4 12a8 8 0 1 0 2-5.3" />
    <path d="M4 4v5h5" />
  </svg>
  <svg v-else-if="name === 'trip'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
  <svg v-else-if="name === 'user'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
  <svg v-else-if="name === 'stats'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
  </svg>
  <svg v-else-if="name === 'set'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.5 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
  <svg v-else-if="name === 'pal'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="10" r="1.2" fill="currentColor" />
    <circle cx="15" cy="10" r="1.2" fill="currentColor" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import type { NavIconName } from '@/types/kitchen'

defineProps<{ name: NavIconName }>()
</script>
