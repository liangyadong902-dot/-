<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="#8EA47C" stroke-width="1.7">
    <path d="M5 19c8-1 12-8 14-16-7 2-13 7-14 16z" />
    <path d="M5 19c4-4 8-6 12-7" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 16 })
</script>
