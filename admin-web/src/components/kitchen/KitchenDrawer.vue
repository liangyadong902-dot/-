<template>
  <div class="drawer-mask" :class="{ on: open }" @click.self="emit('close')">
    <aside class="drawer">
      <slot />
    </aside>
  </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>
