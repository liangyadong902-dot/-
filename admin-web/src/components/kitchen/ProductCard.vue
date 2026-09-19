<template>
  <article class="product-card" :style="dimmed ? 'opacity:.55' : undefined">
    <div v-if="img" class="prod-img-wrap">
      <img :src="img" alt="" />
      <div v-if="badge" class="top-badge">{{ badge }}</div>
    </div>
    <div class="prod-info">
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    img?: string
    badge?: string
    dimmed?: boolean
  }>(),
  { dimmed: false },
)
</script>
