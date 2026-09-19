<template>
  <section class="view on">
    <PageHead title="后场规则" sub="改的是用户端能看见的句子，和开盒超时">
      <button class="btn-sage" type="button" @click="saveSet">保存设置</button>
    </PageHead>
    <div class="two-col">
      <div class="paper">
        <div class="field"><label>价值保底文案</label><textarea v-model="kitchen.settings.guarantee" /></div>
        <div class="field"><label>情绪匹配文案</label><textarea v-model="kitchen.settings.moodCopy" /></div>
        <div class="form-grid">
          <div class="field"><label>公益（元 / 单）</label><input v-model.number="kitchen.settings.village" type="number" /></div>
          <div class="field"><label>待支付超时（分）</label><input v-model.number="kitchen.settings.timeout" type="number" /></div>
        </div>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:8px;">出行次数 → 称号</div>
        <div v-for="lv in kitchen.settings.levels" :key="lv[2]" class="todo-row">
          <span>{{ lv[0] }}–{{ lv[1] }} 次</span>
          <strong>{{ lv[2] }}</strong>
        </div>
        <div class="section-title" style="font-size:15px;margin:16px 0 8px;">当前身份</div>
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
import { useKitchenStore } from '@/stores/kitchen'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/toast'
import PageHead from '@/components/kitchen/PageHead.vue'

const kitchen = useKitchenStore()
const userStore = useUserStore()

const account = computed(() => userStore.profile?.account || '—')
const roleLabel = computed(() => {
  const role = userStore.profile?.role
  return (role && ROLE_LABEL[role]) || '管理员'
})

function saveSet() {
  toast('写入接口在阶段二接入')
}
</script>
