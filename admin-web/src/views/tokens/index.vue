<template>
  <section class="view on">
    <PageHead title="和橱窗同一套颜料" sub="用户端 docs/页面原型.html 已用同一组 token" />
    <div class="swatch-grid">
      <div v-for="c in colors" :key="c.hex" class="swatch">
        <i :style="{ background: c.hex }" />
        <p>{{ c.zh }}<span>{{ c.en }} · {{ c.hex }}</span></p>
      </div>
    </div>
    <div class="two-col" style="margin-top:18px;">
      <div class="paper type-card">
        <div class="cursive">Good Morning!</div>
        <div class="shop-title">途个惊喜</div>
        <p>Caveat 手写问候 · Noto Serif SC 店名 · Noto Sans SC 正文</p>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">元件节奏</div>
        <div class="todo-row"><span>搜索</span><span>白胶囊 + 鼠尾草圆钮</span></div>
        <div class="todo-row"><span>主按钮</span><span>满绿胶囊，hover 转 deep</span></div>
        <div class="todo-row"><span>卡片</span><span>纸色、14–18 圆角、一层淡影</span></div>
        <div class="todo-row"><span>加号</span><span>26px 绿圆，对齐参考图 +</span></div>
        <div class="todo-row"><span>顶栏</span><span>鼠尾草云朵 + 奶油扇贝</span></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PageHead from '@/components/kitchen/PageHead.vue'

const colors = [
  { hex: '#F6F1E6', en: 'Cream', zh: '画布' },
  { hex: '#E4EDD8', en: 'Sage mist', zh: '云朵顶' },
  { hex: '#8EA47C', en: 'Sage', zh: '按钮 / TOP' },
  { hex: '#6C7E58', en: 'Sage deep', zh: '图标描边' },
  { hex: '#3C342C', en: 'Ink', zh: '标题' },
  { hex: '#8F8376', en: 'Muted', zh: '说明' },
  { hex: '#FFFDF8', en: 'Paper', zh: '卡片' },
  { hex: '#E7DCCE', en: 'Line', zh: '分割' },
  { hex: '#D4924A', en: 'Caramel', zh: 'Good Morning' },
  { hex: '#E8B4A2', en: 'Blush', zh: '退款提示' },
]
</script>
