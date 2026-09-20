<template>
  <section class="view on">
    <PageHead title="旅行 DNA" sub="题目、选项与结果均由服务端计分配置驱动">
      <button v-if="canEdit" class="btn-sage" type="button" @click="addQuestion">新增题目</button>
    </PageHead>
    <div v-if="loading" class="sheet"><div class="empty">正在读取人格题库…</div></div>
    <div v-else-if="error" class="sheet"><div class="empty">{{ error }} <button class="linkish" type="button" @click="load">重试</button></div></div>
    <template v-else>
      <div v-if="!questions.length" class="sheet"><div class="empty">暂无人格题目</div></div>
      <div class="paper" v-for="question in questions" :key="question.id" style="margin-bottom:16px">
        <div class="form-grid">
          <div class="field"><label>题号</label><input v-model.number="question.seq" type="number" min="1" :disabled="!canEdit" /></div>
          <div class="field"><label>状态</label><select v-model="question.status" :disabled="!canEdit"><option value="on">启用</option><option value="off">停用</option></select></div>
          <div class="field span2"><label>题干</label><input v-model="question.stem" :disabled="!canEdit" /></div>
        </div>
        <div class="sheet">
          <table><thead><tr><th>序号</th><th>选项</th><th>计分 JSON</th><th>操作</th></tr></thead>
            <tbody><tr v-for="option in question.options" :key="option.id"><td><input v-model.number="option.seq" class="chip" type="number" style="width:70px" :disabled="!canEdit" /></td><td><input v-model="option.label" class="chip" style="width:100%" :disabled="!canEdit" /></td><td><input v-model="option.scoreText" class="chip" style="width:100%" :disabled="!canEdit" /></td><td><template v-if="canEdit"><button class="linkish" type="button" @click="saveOptionRow(question, option)">保存</button> <button class="linkish" type="button" @click="removeOption(option.id)">删除</button></template></td></tr></tbody>
          </table>
        </div>
        <div v-if="canEdit" class="toolbar" style="margin-top:12px"><button class="btn-ghost" type="button" @click="addOption(question)">新增选项</button><button class="btn-sage" type="button" @click="saveQuestionRow(question)">保存题目</button><button class="linkish" type="button" @click="removeQuestion(question.id)">删除题目</button></div>
      </div>

      <div class="section-title" style="margin:24px 0 12px">人格结果定义</div>
      <div v-if="!results.length" class="sheet"><div class="empty">暂无人格结果</div></div>
      <div class="product-grid">
        <div v-for="result in results" :key="result.id" class="paper">
          <div class="form-grid">
            <div class="field"><label>类型</label><select v-model="result.type" :disabled="!canEdit"><option value="nature">nature</option><option value="city">city</option><option value="adventure">adventure</option><option value="culture">culture</option></select></div>
            <div class="field"><label>印记</label><input v-model="result.mark" maxlength="4" :disabled="!canEdit" /></div>
            <div class="field span2"><label>名称</label><input v-model="result.name" :disabled="!canEdit" /></div>
            <div class="field span2"><label>描述</label><textarea v-model="result.description" :disabled="!canEdit" /></div>
            <div class="field span2"><label>推荐方向</label><textarea v-model="result.recommend" :disabled="!canEdit" /></div>
          </div>
          <div v-if="canEdit" class="toolbar"><button class="btn-sage" type="button" @click="saveResultRow(result)">保存结果</button><button class="linkish" type="button" @click="removeResult(result.id)">删除</button></div>
        </div>
      </div>
      <button v-if="canEdit" class="btn-ghost btn-block" style="margin-top:16px" type="button" @click="addResult">新增人格结果</button>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'
import { toast } from '@/utils/toast'
import { deletePersonalityOption, deletePersonalityQuestion, deletePersonalityResult, listPersonalityQuestions, listPersonalityResults, savePersonalityOption, savePersonalityQuestion, savePersonalityResult, type PersonalityQuestion, type PersonalityResult } from '@/api/personality'
import { useUserStore } from '@/stores/user'

type OptionRow = PersonalityQuestion['options'][number] & { scoreText: string }
type QuestionRow = Omit<PersonalityQuestion, 'options'> & { options: OptionRow[] }
const loading = ref(true); const error = ref(''); const questions = ref<QuestionRow[]>([]); const results = ref<PersonalityResult[]>([])
const userStore = useUserStore(); const canEdit = computed(() => ['super_admin', 'operator'].includes(userStore.profile?.role || ''))

async function load() {
  loading.value = true; error.value = ''
  try {
    const [q, r] = await Promise.all([listPersonalityQuestions(), listPersonalityResults()])
    questions.value = (q.data || []).map(item => ({ ...item, options: item.options.map(option => ({ ...option, scoreText: JSON.stringify(option.score) })) }))
    results.value = r.data || []
  } catch { error.value = '人格题库加载失败，请重试' } finally { loading.value = false }
}
function addQuestion() { questions.value.push({ id: 0, seq: questions.value.length + 1, stem: '', status: 'on', options: [] }) }
async function saveQuestionRow(row: QuestionRow) { await savePersonalityQuestion(row.id || null, { seq: row.seq, stem: row.stem, status: row.status }); toast('题目已保存'); await load() }
async function removeQuestion(id: number) { if (!id) { questions.value = questions.value.filter(item => item.id !== id); return }; await deletePersonalityQuestion(id); await load() }
function addOption(question: QuestionRow) { question.options.push({ id: 0, questionId: question.id, seq: question.options.length + 1, label: '', score: {}, scoreText: '{"nature":1}' }) }
async function saveOptionRow(question: QuestionRow, row: OptionRow) { let score: Record<string, number>; try { score = JSON.parse(row.scoreText) } catch { toast('计分 JSON 格式不正确'); return }; await savePersonalityOption(question.id, row.id || null, { seq: row.seq, label: row.label, score }); toast('选项已保存'); await load() }
async function removeOption(id: number) { if (!id) { questions.value.forEach(q => { q.options = q.options.filter(item => item.id !== id) }); return }; await deletePersonalityOption(id); await load() }
function addResult() { results.value.push({ id: 0, type: 'nature', name: '', mark: '', description: '', recommend: '' }) }
async function saveResultRow(row: PersonalityResult) { await savePersonalityResult(row.id || null, { type: row.type, name: row.name, mark: row.mark, description: row.description, recommend: row.recommend }); toast('人格结果已保存'); await load() }
async function removeResult(id: number) { if (!id) { results.value = results.value.filter(item => item.id !== id); return }; await deletePersonalityResult(id); await load() }
onMounted(load)
</script>
