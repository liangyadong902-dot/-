<template>
  <section class="view on">
    <PageHead title="后场规则" sub="系统配置写入归入后续阶段" />
    <div class="two-col">
      <div class="sheet"><div class="empty">后续阶段：当前不允许使用本地表单修改生产规则</div></div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:8px;">当前身份</div>
        <div class="todo-row">
          <span>{{ roleLabel }}</span>
          <strong>{{ account }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ROLE_LABEL } from '@/constants/nav'
import { useUserStore } from '@/stores/user'
import PageHead from '@/components/kitchen/PageHead.vue'

const userStore = useUserStore()

const account = computed(() => userStore.profile?.account || '—')
const roleLabel = computed(() => {
  const role = userStore.profile?.role
  return (role && ROLE_LABEL[role]) || '管理员'
})

</script>
