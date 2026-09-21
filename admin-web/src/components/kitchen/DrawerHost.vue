<template>
  <KitchenDrawer :open="!!kitchen.drawer" @close="kitchen.closeDrawer()">
    <template v-if="kitchen.drawer?.type === 'box' && boxForm">
      <h3>{{ boxIsNew ? '新出炉的盒子' : '编辑盲盒' }}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">封面沿用旅行照片，不画假面包</p>
      <div class="form-grid">
        <div class="field span2"><label>名称</label><input v-model="boxForm.name" /></div>
        <div class="field">
          <label>分类</label>
          <select v-model="boxForm.category">
            <option v-for="(label, key) in CAT" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="field"><label>展示标签</label><input v-model="boxForm.tag" /></div>
        <div class="field"><label>售价</label><input v-model.number="boxForm.price" type="number" /></div>
        <div class="field"><label>保底价值</label><input v-model.number="boxForm.guarantee" type="number" /></div>
        <div class="field span2"><label>简介</label><textarea v-model="boxForm.desc" rows="3" style="resize:vertical;" /></div>
        <div class="field span2">
          <label>封面图</label>
          <div style="display:flex;gap:8px;">
            <input v-model="boxForm.img" placeholder="https://… 或点击本地上传" style="flex:1;" />
            <button class="btn-ghost" type="button" :disabled="uploading" @click="boxFileInput?.click()">{{ uploading ? '上传中…' : '本地上传' }}</button>
          </div>
          <input ref="boxFileInput" type="file" accept="image/*" hidden @change="handleUpload('box', $event)" />
        </div>
        <div class="field span2" v-if="boxForm.img">
          <label>封面预览</label>
          <img :src="boxForm.img" alt="封面预览" style="width:100%;height:130px;object-fit:cover;border-radius:12px;border:1px solid var(--line,#E7DCCE);" />
        </div>
        <div class="field span2">
          <label>适配心情</label>
          <div class="moods">
            <label v-for="(label, key) in MOOD" :key="key" class="check">
              <input type="checkbox" :value="key" :checked="boxForm.moods.includes(key as Mood)" @change="toggleMood(key as Mood)" />
              {{ label }}
            </label>
          </div>
        </div>
        <div class="field">
          <label>状态</label>
          <select v-model="boxForm.status">
            <option value="on">上架</option>
            <option value="off">下架</option>
          </select>
        </div>
        <div class="field"><label>排序</label><input v-model.number="boxForm.sort" type="number" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBox">放入货架</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'route' && routeForm && routeForm.guide">
      <h3>{{ routeIsNew ? '新线路' : '编辑线路' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field span2"><label>名称</label><input v-model="routeForm.name" /></div>
        <div class="field"><label>目的地</label><input v-model="routeForm.dest" /></div>
        <div class="field">
          <label>分类</label>
          <select v-model="routeForm.category">
            <option v-for="(label, key) in CAT" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="field"><label>票面价值</label><input v-model.number="routeForm.value" type="number" /></div>
        <div class="field"><label>采购价</label><input v-model.number="routeForm.cost" type="number" /></div>
        <div class="field"><label>场景</label><input v-model="routeForm.scene" placeholder="mountain / food" /></div>
        <div class="field">
          <label>徽章</label>
          <select v-model="routeForm.badge">
            <option v-for="b in kitchen.badges" :key="b.name">{{ b.name }}</option>
          </select>
        </div>
        <div class="field span2"><label>亮点</label><input v-model="routeForm.highlights" /></div>
        <div class="field span2"><label>包含</label><input v-model="routeForm.includes" /></div>
        <div class="field span2"><label>情绪文案</label><input v-model="routeForm.moodText" /></div>
        <div class="field span2">
          <label>图片</label>
          <div style="display:flex;gap:8px;">
            <input v-model="routeForm.img" placeholder="https://… 或点击本地上传" style="flex:1;" />
            <button class="btn-ghost" type="button" :disabled="uploading" @click="routeFileInput?.click()">{{ uploading ? '上传中…' : '本地上传' }}</button>
          </div>
          <input ref="routeFileInput" type="file" accept="image/*" hidden @change="handleUpload('route', $event)" />
        </div>
        <div class="field span2" v-if="routeForm.img">
          <label>图片预览</label>
          <img :src="routeForm.img" alt="线路图片预览" style="width:100%;height:130px;object-fit:cover;border-radius:12px;border:1px solid var(--line,#E7DCCE);" />
        </div>
        <div class="field span2" style="margin-top:4px;">
          <label style="font-weight:800;">盲盒攻略（开盒后用户可见）</label>
        </div>
        <details class="guide-editor" open>
          <summary>行程概览 <small>总览文案 / 时长 / 节奏 / 天气</small></summary>
          <div class="field span2"><label>行程总览</label><textarea v-model="routeForm.guide.overview" rows="2" placeholder="一段话讲清这条线路的体验与卖点" style="resize:vertical;" /></div>
          <div class="field"><label>时长文案</label><input v-model="routeForm.guide.durationText" placeholder="如 3 天 2 夜" /></div>
          <div class="field"><label>节奏文案</label><input v-model="routeForm.guide.paceText" placeholder="如 松弛探索" /></div>
          <div class="field"><label>步数文案</label><input v-model="routeForm.guide.walkText" placeholder="如 8-12 千步/天" /></div>
          <div class="field"><label>交通文案</label><input v-model="routeForm.guide.transitText" placeholder="如 大交通自理" /></div>
          <div class="field"><label>适宜季节</label><input v-model="routeForm.guide.season" placeholder="如 春秋优先" /></div>
          <div class="field"><label>天气提醒</label><input v-model="routeForm.guide.weather" placeholder="温差 / 防晒 / 雨具提示" /></div>
        </details>
        <details class="guide-editor">
          <summary>分时行程 <small>{{ routeForm.guide.schedules.length }} 个时段</small></summary>
          <div v-for="(s, i) in routeForm.guide.schedules" :key="'sched' + i" class="guide-row-card">
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model.number="s.dayNo" type="number" min="1" style="width:64px;flex:none;" placeholder="天" />
              <input v-model="s.time" style="width:92px;flex:none;" placeholder="09:30" />
              <input v-model="s.title" style="flex:1;" placeholder="时段标题（如 金沙索道上山）" />
              <button class="linkish" type="button" @click="routeForm.guide.schedules.splice(i, 1)">删</button>
            </div>
            <textarea v-model="s.description" rows="2" placeholder="这个时段玩什么、怎么走、注意什么（建议 40 字以上）" style="resize:vertical;" />
            <div style="display:flex;gap:6px;margin-top:6px;">
              <input v-model="s.addr" style="flex:1;" placeholder="地点/集合地址（可选）" />
              <input v-model="s.tip" style="flex:1;" placeholder="一句话贴士（可选）" />
            </div>
          </div>
          <button class="linkish" type="button" @click="routeForm.guide.schedules.push({ dayNo: 1, time: '', title: '', description: '' })">+ 添加时段</button>
        </details>
        <details class="guide-editor">
          <summary>沿途景点 <small>{{ routeForm.guide.spots.length }} 个点位</small></summary>
          <div v-for="(s, i) in routeForm.guide.spots" :key="'spot' + i" class="guide-row-card">
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="s.name" placeholder="点位名（如 东方女神）" style="flex:1;" />
              <input v-model.number="s.durationMinutes" type="number" min="0" style="width:120px;flex:none;" placeholder="时长(分)" />
              <button class="linkish" type="button" @click="routeForm.guide.spots.splice(i, 1)">删</button>
            </div>
            <input v-model="s.highlights" style="margin-bottom:6px;" placeholder="亮点一句话（看什么、为什么值得）" />
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="s.coverUrl" style="flex:1;" placeholder="封面图 URL（可选）" />
              <input v-model="s.addr" style="flex:1;" placeholder="地址（可选）" />
            </div>
            <input v-model="s.notice" placeholder="实用提醒（订票/开放时间/体力提示）" />
          </div>
          <button class="linkish" type="button" @click="routeForm.guide.spots.push({ name: '', notice: '' })">+ 添加点位</button>
        </details>
        <details class="guide-editor">
          <summary>交通·餐饮·住宿 <small>{{ routeForm.guide.transport.length }} 段交通 / {{ routeForm.guide.dining.length }} 家餐饮 / {{ routeForm.guide.lodging.length }} 晚住宿</small></summary>
          <div class="field span2">
            <label>交通安排</label>
            <div v-for="(t, i) in routeForm.guide.transport" :key="'tra' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="t.title" style="width:150px;flex:none;" placeholder="如 往返大巴（已含）" />
              <input v-model="t.description" style="flex:1;" placeholder="说明" />
              <button class="linkish" type="button" @click="routeForm.guide.transport.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.transport.push({ title: '', description: '' })">+ 添加交通</button>
          </div>
          <div class="field span2">
            <label>餐饮推荐</label>
            <div v-for="(d, i) in routeForm.guide.dining" :key="'din' + i" class="guide-row-card">
              <div style="display:flex;gap:6px;margin-bottom:6px;">
                <input v-model="d.title" style="flex:1;" placeholder="店名 / 餐段（如 庐陵风味午餐（已含））" />
                <button class="linkish" type="button" @click="routeForm.guide.dining.splice(i, 1)">删</button>
              </div>
              <input v-model="d.description" style="margin-bottom:6px;" placeholder="招牌菜+人均+步行距离" />
              <input v-model="d.addr" placeholder="位置（可选）" />
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.dining.push({ title: '', description: '', addr: '' })">+ 添加餐饮</button>
          </div>
          <div class="field span2">
            <label>住宿安排</label>
            <div v-for="(l, i) in routeForm.guide.lodging" :key="'lod' + i" class="guide-row-card">
              <div style="display:flex;gap:6px;margin-bottom:6px;">
                <input v-model="l.title" style="flex:1;" placeholder="如 山腰度假酒店（已含 1 晚）" />
                <button class="linkish" type="button" @click="routeForm.guide.lodging.splice(i, 1)">删</button>
              </div>
              <textarea v-model="l.description" rows="2" placeholder="酒店名+房型+位置+到店时间" style="resize:vertical;" />
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.lodging.push({ title: '', description: '' })">+ 添加住宿</button>
          </div>
        </details>
        <details class="guide-editor">
          <summary>费用·清单·安全 <small>{{ routeForm.guide.budgetItems.length }} 项预算 / 清单 {{ routeForm.guide.checklist.length }} 项 / 提示 {{ routeForm.guide.safetyTips.length }} 条</small></summary>
          <div class="field span2">
            <label>费用明细</label>
            <div v-for="(b, i) in routeForm.guide.budgetItems" :key="'bud' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="b.name" style="flex:1;" placeholder="费用名（如 感通索道往返（自理））" />
              <input v-model.number="b.amount" type="number" min="0" style="width:96px;flex:none;" placeholder="金额" />
              <button class="linkish" type="button" @click="routeForm.guide.budgetItems.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.budgetItems.push({ name: '', amount: 0, required: false })">+ 添加费用</button>
          </div>
          <div class="field span2">
            <label>出发清单</label>
            <div v-for="(_, i) in routeForm.guide.checklist" :key="'chk' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="routeForm.guide.checklist[i]" style="flex:1;" placeholder="清单项（如 防风外套）" />
              <button class="linkish" type="button" @click="routeForm.guide.checklist.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.checklist.push('')">+ 添加清单项</button>
          </div>
          <div class="field span2">
            <label>安全提示</label>
            <div v-for="(_, i) in routeForm.guide.safetyTips" :key="'safe' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="routeForm.guide.safetyTips[i]" style="flex:1;" placeholder="安全提示" />
              <button class="linkish" type="button" @click="routeForm.guide.safetyTips.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.safetyTips.push('')">+ 添加提示</button>
          </div>
        </details>
        <details class="guide-editor">
          <summary>速览·问答·规则 <small>facts {{ routeForm.guide.facts.length }} / faqs {{ routeForm.guide.faqs.length }} / rules {{ routeForm.guide.rules.length }}</small></summary>
          <div class="field span2">
            <label>行程速览</label>
            <div v-for="(f, i) in routeForm.guide.facts" :key="'fact' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="f.label" placeholder="标签（如 行程节奏）" style="flex:1;" />
              <input v-model="f.value" placeholder="内容（如 轻松慢游）" style="flex:1.4;" />
              <button class="linkish" type="button" @click="routeForm.guide.facts.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.facts.push({ label: '', value: '' })">+ 添加速览</button>
          </div>
          <div class="field span2">
            <label>常见问答</label>
            <div v-for="(f, i) in routeForm.guide.faqs" :key="'faq' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="f.question" placeholder="问题（如 集合信息在哪里查看？）" style="flex:1;" />
              <input v-model="f.answer" placeholder="回答" style="flex:1.4;" />
              <button class="linkish" type="button" @click="routeForm.guide.faqs.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.faqs.push({ question: '', answer: '' })">+ 添加问答</button>
          </div>
          <div class="field span2">
            <label>出行须知</label>
            <div v-for="(r, i) in routeForm.guide.rules" :key="'rule' + i" style="display:flex;gap:6px;margin-bottom:6px;">
              <input v-model="r.title" placeholder="标题（如 预约与集合）" style="flex:1;" />
              <input v-model="r.description" placeholder="说明" style="flex:1.4;" />
              <button class="linkish" type="button" @click="routeForm.guide.rules.splice(i, 1)">删</button>
            </div>
            <button class="linkish" type="button" @click="routeForm.guide.rules.push({ title: '', description: '' })">+ 添加须知</button>
          </div>
          <div class="field span2"><label>应急预案（Plan B）</label><textarea v-model="routeForm.guide.planB" rows="2" placeholder="如遇天气或景区临时调整的处理方式" style="resize:vertical;" /></div>
        </details>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveRoute">保存</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'pool'">
      <h3>线路池校验</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">
        {{ poolBox?.name || '当前盲盒' }} · 票面价值须覆盖保底
      </p>
      <div v-if="kitchen.poolLoading" class="empty">正在读取线路池…</div>
      <template v-else>
        <div class="pill" :class="kitchen.poolOk ? 'ok' : 'wait'" style="display:inline-block;margin-bottom:12px;">
          {{ kitchen.poolOk ? '保底校验通过' : '没有满足保底的上架线路' }}
        </div>
        <div v-for="route in kitchen.poolRoutes" :key="route.id" class="kv">
          <span>{{ route.name }} · {{ route.destination }}</span>
          <strong :style="{ color: route.meetsGuarantee ? 'var(--sage-deep)' : 'var(--muted)' }">
            ￥{{ route.value }} · {{ route.meetsGuarantee ? '满足保底' : '不满足' }}
          </strong>
        </div>
        <div v-if="!kitchen.poolRoutes.length" class="empty">当前分类没有线路</div>
      </template>
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" @click="kitchen.closeDrawer()">收起</button>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'badge' && badgeForm">
      <h3>{{ badgeIsNew ? '新建徽章' : '编辑徽章' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field"><label>印章字（最多 4 字）</label><input v-model="badgeForm.mark" maxlength="4" /></div>
        <div class="field"><label>名称</label><input v-model="badgeForm.name" /></div>
        <div class="field span2"><label>描述</label><input v-model="badgeForm.description" /></div>
        <div class="field"><label>排序</label><input v-model.number="badgeForm.sortWeight" type="number" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBadge">保存徽章</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'banner' && bannerForm">
      <h3>{{ bannerIsNew ? '新建运营位' : '编辑运营位' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field span2"><label>标题</label><input v-model="bannerForm.title" /></div>
        <div class="field"><label>副标题</label><input v-model="bannerForm.sub" /></div>
        <div class="field"><label>标签</label><input v-model="bannerForm.tag" /></div>
        <div class="field span2"><label>图片 URL</label><input v-model="bannerForm.img" /></div>
        <div class="field"><label>跳转类型</label><select v-model="bannerForm.jumpType"><option value="none">无跳转</option><option value="category">分类</option><option value="box">盲盒</option><option value="url">外链</option></select></div>
        <div class="field"><label>跳转目标</label><input v-model="bannerForm.jumpTarget" :placeholder="bannerForm.jumpType === 'category' ? 'nearby / province' : '填写目标值'" /></div>
        <div class="field"><label>开始时间</label><input v-model="bannerForm.startAt" type="datetime-local" /></div>
        <div class="field"><label>结束时间</label><input v-model="bannerForm.endAt" type="datetime-local" /></div>
        <div class="field"><label>排序</label><input v-model.number="bannerForm.sortWeight" type="number" /></div>
        <div class="field"><label>状态</label><select v-model="bannerForm.on"><option :value="true">上架</option><option :value="false">下架</option></select></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBanner">保存运营位</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="orderDetail">
      <h3>订单详情</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">{{ orderDetail.no }}</p>
      <div v-for="row in orderRows" :key="row[0]" class="kv">
        <span>{{ row[0] }}</span>
        <strong>{{ row[1] }}</strong>
      </div>
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" @click="kitchen.closeDrawer()">收起</button>
    </template>

    <template v-else-if="userDetail">
      <h3>{{ userDetail.name }}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
        {{ userDetail.title }} · {{ userDetail.on ? '正常' : '已禁用' }}{{ userDetail.wxName ? ' · 微信 ' + userDetail.wxName : '' }}
      </p>
      <div class="toolbar">
        <button
          v-for="(tab, i) in userTabs"
          :key="tab"
          class="chip"
          :class="{ on: userTab === i }"
          type="button"
          @click="userTab = i"
        >{{ tab }}</button>
      </div>
      <div>
        <div v-for="row in userPanes[userTab]" :key="row[0]" class="kv">
          <span>{{ row[0] }}</span>
          <strong>{{ row[1] }}</strong>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn-ink" type="button" style="flex:1" @click="toggleUser">{{ userDetail.on ? '禁用账号' : '启用账号' }}</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">关闭</button>
      </div>
    </template>
  </KitchenDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KitchenDrawer from './KitchenDrawer.vue'
import { CAT, MOOD, ORDER_ST } from '@/constants/nav'
import { useKitchenStore } from '@/stores/kitchen'
import { toast } from '@/utils/toast'
import { uploadAdminImage } from '@/api/content'
import type { BadgeItem, BannerItem, BlindBox, Mood, RouteGuide, TravelRoute } from '@/types/kitchen'

function emptyGuide(): RouteGuide {
  return {
    overview: '',
    durationText: '',
    paceText: '',
    walkText: '',
    transitText: '',
    season: '',
    weather: '',
    facts: [],
    schedules: [],
    spots: [],
    transport: [],
    dining: [],
    lodging: [],
    budgetItems: [],
    checklist: [],
    planB: '',
    safetyTips: [],
    faqs: [],
    rules: []
  }
}

function normalizeGuide(g?: RouteGuide | null): RouteGuide {
  const next = g ? JSON.parse(JSON.stringify(g)) as Partial<RouteGuide> : {}
  const strings: (keyof RouteGuide)[] = ['overview', 'durationText', 'paceText', 'walkText', 'transitText', 'season', 'weather', 'planB']
  const arrays: (keyof RouteGuide)[] = ['facts', 'schedules', 'spots', 'transport', 'dining', 'lodging', 'budgetItems', 'checklist', 'safetyTips', 'faqs', 'rules']
  for (const key of strings) (next[key] as unknown) = (next[key] as string) || ''
  for (const key of arrays) (next[key] as unknown) = Array.isArray(next[key]) ? next[key] : []
  return next as RouteGuide
}

const kitchen = useKitchenStore()
const boxForm = ref<BlindBox | null>(null)
const boxIsNew = ref(false)
const routeForm = ref<TravelRoute | null>(null)
const routeIsNew = ref(false)
const boxFileInput = ref<HTMLInputElement | null>(null)
const routeFileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function handleUpload(target: 'box' | 'route', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadAdminImage(file)
    const url = res.data?.url || ''
    if (!url) throw new Error('上传失败')
    if (target === 'box' && boxForm.value) boxForm.value.img = url
    if (target === 'route' && routeForm.value) routeForm.value.img = url
    toast('图片已上传')
  } catch {
    toast('图片上传失败，请重试')
  } finally {
    uploading.value = false
    input.value = ''
  }
}
const badgeForm = ref<BadgeItem | null>(null)
const badgeIsNew = ref(false)
const bannerForm = ref<BannerItem | null>(null)
const bannerIsNew = ref(false)
const userTab = ref(0)
const userTabs = ['身份', '偏好', '资产', '成长']

watch(
  () => kitchen.drawer,
  (d) => {
    if (!d) {
      boxForm.value = null
      routeForm.value = null
      badgeForm.value = null
      bannerForm.value = null
      return
    }
    if (d.type === 'box') {
      const found = kitchen.boxes.find((x) => x.id === d.id)
      boxIsNew.value = !found
      boxForm.value = found
        ? { ...found, moods: [...found.moods] }
        : {
            id: 'box_' + Date.now(),
            name: '',
            category: 'nearby',
            tag: '周边游',
            desc: '',
            price: 99,
            guarantee: 120,
            moods: ['happy'],
            img: '',
            status: 'on',
            sort: 10,
            rank: 'NEW',
            opens: 0,
          }
    }
    if (d.type === 'route') {
      const found = kitchen.routes.find((x) => x.id === d.id)
      routeIsNew.value = !found
      routeForm.value = found
        ? { ...found, guide: normalizeGuide(found.guide) }
        : {
            id: 'r' + Date.now(),
            name: '',
            dest: '',
            category: 'nearby',
            value: 148,
            cost: null,
            scene: '',
            badge: '古村',
            moodText: '',
            highlights: '',
            includes: '',
            status: 'on',
            img: '',
            draws: 0,
            guide: emptyGuide(),
          }
    }
    if (d.type === 'user') userTab.value = 0
    if (d.type === 'badge') {
      const found = kitchen.badges.find((x) => x.id === d.id)
      badgeIsNew.value = !found
      badgeForm.value = found
        ? { ...found }
        : { name: '', mark: '', description: '', sortWeight: 0, unlock: 0, routes: 0 }
    }
    if (d.type === 'banner') {
      const found = kitchen.banners.find((x) => x.id === d.id)
      bannerIsNew.value = !found
      bannerForm.value = found
        ? { ...found }
        : {
            id: 'banner_' + Date.now(), title: '', sub: '', tag: '', to: '', on: true,
            img: '', jumpType: 'none', jumpTarget: null, startAt: null, endAt: null, sortWeight: 0,
          }
    }
  },
  { immediate: true },
)

function toggleMood(key: Mood) {
  if (!boxForm.value) return
  const i = boxForm.value.moods.indexOf(key)
  if (i >= 0) boxForm.value.moods.splice(i, 1)
  else boxForm.value.moods.push(key)
}

function saveBox() {
  if (!boxForm.value) return
  const next = {
    ...boxForm.value,
    name: boxForm.value.name.trim() || '未命名盲盒',
  }
  kitchen.saveBox(next, boxIsNew.value)
}

function saveRoute() {
  if (!routeForm.value) return
  kitchen.saveRoute({
    ...routeForm.value,
    name: routeForm.value.name.trim() || '未命名线路',
  })
}

function saveBadge() {
  if (!badgeForm.value) return
  kitchen.saveBadge({ ...badgeForm.value, name: badgeForm.value.name.trim(), mark: badgeForm.value.mark.trim() }, badgeIsNew.value)
}

function saveBanner() {
  if (!bannerForm.value) return
  kitchen.saveBanner({ ...bannerForm.value, title: bannerForm.value.title.trim() }, bannerIsNew.value)
}

const poolBox = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'pool') return null
  return kitchen.boxes.find((box) => box.id === d.id) || null
})

const orderDetail = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'order') return null
  return kitchen.mergedOrders.find((x) => x.no === d.no) || null
})

const orderRows = computed(() => {
  const o = orderDetail.value
  if (!o) return []
  const [lab] = ORDER_ST[o.st]
  return [
    ['用户', [o.user, kitchen.wxNickOf(o) ? '微信名 ' + kitchen.wxNickOf(o) : '', o.phone].filter(Boolean).join(' · ')],
    ['盲盒快照', o.box],
    ['实付', '￥' + o.pay],
    ['渠道', o.ch],
    ['状态', lab],
    ['开盒结果', o.route],
    ['下单时间', o.time],
  ]
})

const userDetail = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'user') return null
  return kitchen.mergedUsers.find((x) => x.id === d.id) || null
})

const userPanes = computed(() => {
  const u = userDetail.value
  if (!u) return []
  return [
    [['用户 ID', u.id], ['微信名', u.wxName || (u.ch === '微信' ? u.name : '未绑定微信')], ['手机', u.phone || '未绑定'], ['渠道', u.ch], ['最近登录', u.last], ['状态', u.on ? '正常' : '禁用']],
    [['最近心情', kitchen.moodLabel(u.mood)], ['旅行人格', u.person], ['常驻', '未填']],
    [['有效订单', u.trips + ' 笔'], ['聊天 / 日记', '摘要见正式环境'], ['徽章', '见行程解锁']],
    [['出行次数', u.trips], ['累计消费', '￥' + u.spend], ['累计省钱', '￥' + u.saved], ['公益里程', u.trips + ' km']],
  ]
})

function toggleUser() {
  const u = userDetail.value
  if (!u) return
  u.on = !u.on
  kitchen.closeDrawer()
  toast(u.on ? '已启用' : '已禁用，不可开盒')
}
</script>
