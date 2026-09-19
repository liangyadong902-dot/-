<template>
  <section class="view on">
    <PageHead title="小途的配方" sub="人设写在牛皮纸上，模型失败就走关键词降级">
      <button class="btn-sage" type="button" @click="saveAi">保存配方</button>
    </PageHead>
    <div class="two-col">
      <div class="paper">
        <div class="field"><label>开场白</label><textarea v-model="kitchen.ai.greet" /></div>
        <div class="field"><label>系统 Prompt</label><textarea v-model="kitchen.ai.prompt" style="min-height:140px" /></div>
        <div class="field"><label>日记模板</label><textarea v-model="kitchen.ai.diary" /></div>
      </div>
      <div>
        <div class="paper" style="margin-bottom:12px;">
          <div class="section-title" style="font-size:15px;margin-bottom:8px;">快捷问题</div>
          <div v-for="(q, i) in kitchen.ai.quick" :key="q + i" class="todo-row">
            <span>{{ q }}</span>
            <button class="linkish" type="button" @click="kitchen.ai.quick.splice(i, 1)">去掉</button>
          </div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:8px;">降级话术</div>
          <div v-for="q in kitchen.ai.fallback" :key="q" class="todo-row">
            <span>{{ q }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import { toast } from '@/utils/toast'
import PageHead from '@/components/kitchen/PageHead.vue'

const kitchen = useKitchenStore()

function saveAi() {
  toast('写入接口在阶段二接入')
}
</script>
