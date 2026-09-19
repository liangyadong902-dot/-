<template>
  <div class="page-head">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ sub }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; sub: string }>()
</script>
