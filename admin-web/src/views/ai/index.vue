<template>
  <section class="view on">
    <PageHead title="小途的配方" sub="系统 Prompt、快捷问题与模型失败降级">
      <button v-if="canEdit" class="btn-sage" type="button" :disabled="saving" @click="saveConfig">保存配方</button>
    </PageHead>
    <div v-if="loading" class="sheet"><div class="empty">正在读取小途配方…</div></div>
    <div v-else-if="error" class="sheet"><div class="empty">{{ error }} <button class="linkish" type="button" @click="load">重试</button></div></div>
    <template v-else>
      <div class="two-col">
        <div class="paper">
          <div class="field"><label>开场白</label><textarea v-model="config.greet" :disabled="!canEdit" /></div>
          <div class="field"><label>系统 Prompt</label><textarea v-model="config.systemPrompt" :disabled="!canEdit" style="min-height:140px" /></div>
          <div class="field"><label>日记 Prompt</label><textarea v-model="config.diaryPrompt" :disabled="!canEdit" /></div>
          <div class="toolbar">
            <label class="check"><input v-model="config.enabled" type="checkbox" :disabled="!canEdit" /> 模型启用</label>
            <label class="check"><input v-model="config.toolsEnabled" type="checkbox" :disabled="!canEdit" /> 事实工具</label>
            <label class="check"><input v-model="config.fallbackEnabled" type="checkbox" :disabled="!canEdit" /> 降级回复</label>
          </div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">快捷问题</div>
          <div v-for="item in quick" :key="item.id" class="todo-row">
            <input v-model="item.text" class="chip" style="flex:1" :disabled="!canEdit" />
            <input v-model.number="item.sortWeight" class="chip" type="number" style="width:74px" :disabled="!canEdit" />
            <select v-model="item.status" class="chip" :disabled="!canEdit"><option value="on">启用</option><option value="off">停用</option></select>
            <button v-if="canEdit" class="linkish" type="button" @click="saveQuick(item)">保存</button>
            <button v-if="canEdit" class="linkish" type="button" @click="removeQuick(item.id)">删除</button>
          </div>
          <div v-if="!quick.length" class="empty">暂无快捷问题</div>
          <div v-if="canEdit" class="todo-row"><input v-model="newQuick" class="chip" style="flex:1" placeholder="新增快捷问题" /><button class="btn-ghost" type="button" @click="addQuick">新增</button></div>
        </div>
      </div>

      <div class="two-col" style="margin-top:16px;">
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">关键词规则</div>
          <div v-for="item in rules" :key="item.id" style="padding:12px 0;border-bottom:1px dashed var(--line)">
            <div class="field"><label>关键词（逗号分隔）</label><input v-model="item.keywordsText" :disabled="!canEdit" /></div>
            <div class="field"><label>回复</label><textarea v-model="item.replyText" :disabled="!canEdit" /></div>
            <div class="toolbar"><input v-model="item.boxIdsText" class="chip" placeholder="推荐盲盒 ID，如 1,2" :disabled="!canEdit" /><input v-model.number="item.sortWeight" class="chip" type="number" :disabled="!canEdit" /><select v-model="item.status" class="chip" :disabled="!canEdit"><option value="on">启用</option><option value="off">停用</option></select><button v-if="canEdit" class="btn-ghost" type="button" @click="saveRule(item)">保存</button><button v-if="canEdit" class="linkish" type="button" @click="removeRule(item.id)">删除</button></div>
          </div>
          <div v-if="!rules.length" class="empty">暂无关键词规则</div>
          <button v-if="canEdit" class="btn-ghost btn-block" style="margin-top:12px" type="button" @click="addRule">新增关键词规则</button>
        </div>
        <div>
          <div class="paper" style="margin-bottom:16px">
            <div class="section-title" style="font-size:15px;margin-bottom:10px;">默认回复</div>
            <div v-for="item in defaults" :key="item.id" class="todo-row"><input v-model="item.text" class="chip" style="flex:1" :disabled="!canEdit" /><button v-if="canEdit" class="linkish" type="button" @click="saveDefault(item)">保存</button><button v-if="canEdit" class="linkish" type="button" @click="removeDefault(item.id)">删除</button></div>
            <div v-if="!defaults.length" class="empty">暂无默认回复</div>
            <button v-if="canEdit" class="btn-ghost btn-block" type="button" @click="addDefault">新增默认回复</button>
          </div>
          <div class="paper">
            <div class="section-title" style="font-size:15px;margin-bottom:10px;">日记降级模板</div>
            <div v-for="item in diaries" :key="item.id" style="margin-bottom:12px"><textarea v-model="item.content" :disabled="!canEdit" /><div v-if="canEdit" class="toolbar" style="margin-top:8px"><button class="btn-ghost" type="button" @click="saveDiary(item)">保存</button><button class="linkish" type="button" @click="removeDiary(item.id)">删除</button></div></div>
            <div v-if="!diaries.length" class="empty">暂无日记模板</div>
            <button v-if="canEdit" class="btn-ghost btn-block" type="button" @click="addDiary">新增日记模板</button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'
import { toast } from '@/utils/toast'
import { deleteDefaultReply, deleteDiaryTemplate, deleteKeywordRule, deleteQuickQuestion, getAiConfig, listDefaultReplies, listDiaryTemplates, listKeywordRules, listQuickQuestions, saveDefaultReply, saveDiaryTemplate, saveKeywordRule, saveQuickQuestion, updateAiConfig, type AdminAiConfig, type DefaultReply, type DiaryTemplate, type QuickQuestion } from '@/api/ai'
import { useUserStore } from '@/stores/user'

type RuleRow = { id: number; keywordsText: string; replyText: string; boxIdsText: string; sortWeight: number; status: 'on' | 'off' }
const loading = ref(true); const saving = ref(false); const newQuick = ref(''); const error = ref('')
const config = reactive<AdminAiConfig>({ greet: '', systemPrompt: '', diaryPrompt: '', enabled: false, toolsEnabled: true, fallbackEnabled: true })
const userStore = useUserStore(); const canEdit = computed(() => ['super_admin', 'operator'].includes(userStore.profile?.role || ''))
const quick = ref<QuickQuestion[]>([]); const rules = ref<RuleRow[]>([]); const defaults = ref<DefaultReply[]>([]); const diaries = ref<DiaryTemplate[]>([])

async function load() {
  loading.value = true; error.value = ''
  try {
    const [c, q, r, d, t] = await Promise.all([getAiConfig(), listQuickQuestions(), listKeywordRules(), listDefaultReplies(), listDiaryTemplates()])
    Object.assign(config, c.data); quick.value = q.data || []; defaults.value = d.data || []; diaries.value = t.data || []
    rules.value = (r.data || []).map(item => ({ id: item.id, keywordsText: item.keywords.join(','), replyText: item.replyText, boxIdsText: item.recommendBoxIds.join(','), sortWeight: item.sortWeight, status: item.status }))
  } catch { error.value = 'AI 配置加载失败，请重试' } finally { loading.value = false }
}
async function saveConfig() { saving.value = true; try { const r = await updateAiConfig({ ...config }); Object.assign(config, r.data); toast('配方已保存') } finally { saving.value = false } }
async function addQuick() { if (!newQuick.value.trim()) return; await saveQuickQuestion(null, { text: newQuick.value.trim(), sortWeight: 0, status: 'on' }); newQuick.value = ''; await load() }
async function saveQuick(item: QuickQuestion) { await saveQuickQuestion(item.id, { text: item.text, sortWeight: item.sortWeight, status: item.status }); toast('快捷问题已保存') }
async function removeQuick(id: number) { await deleteQuickQuestion(id); await load() }
function addRule() { rules.value.unshift({ id: 0, keywordsText: '', replyText: '', boxIdsText: '', sortWeight: 0, status: 'on' }) }
async function saveRule(item: RuleRow) { const payload = { keywords: splitText(item.keywordsText), replyText: item.replyText, recommendBoxIds: splitText(item.boxIdsText).map(Number).filter(Boolean), sortWeight: item.sortWeight, status: item.status }; await saveKeywordRule(item.id || null, payload); toast('关键词规则已保存'); await load() }
async function removeRule(id: number) { if (!id) { rules.value = rules.value.filter(item => item.id !== id); return }; await deleteKeywordRule(id); await load() }
function addDefault() { defaults.value.unshift({ id: 0, text: '', sortWeight: 0, status: 'on' }) }
async function saveDefault(item: DefaultReply) { await saveDefaultReply(item.id || null, { text: item.text, sortWeight: item.sortWeight, status: item.status }); toast('默认回复已保存'); await load() }
async function removeDefault(id: number) { if (!id) { defaults.value = defaults.value.filter(item => item.id !== id); return }; await deleteDefaultReply(id); await load() }
function addDiary() { diaries.value.unshift({ id: 0, content: '今天在{目的地}走了一段{线路名称}。{亮点}', sortWeight: 0, status: 'on' }) }
async function saveDiary(item: DiaryTemplate) { await saveDiaryTemplate(item.id || null, { content: item.content, sortWeight: item.sortWeight, status: item.status }); toast('日记模板已保存'); await load() }
async function removeDiary(id: number) { if (!id) { diaries.value = diaries.value.filter(item => item.id !== id); return }; await deleteDiaryTemplate(id); await load() }
function splitText(value: string) { return value.split(/[,，]/).map(item => item.trim()).filter(Boolean) }
onMounted(load)
</script>
