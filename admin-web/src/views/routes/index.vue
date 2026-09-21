<template>
  <section class="view on">
    <PageHead title="线路池" sub="同分类下须有线路票面 ≥ 盲盒保底，否则开盒失败">
      <button class="btn-sage" type="button" @click="kitchen.editRoute(null)">新建线路</button>
    </PageHead>
    <div class="toolbar">
      <input
        v-model.trim="kitchen.filters.routeKeyword"
        class="chip"
        style="max-width:220px;"
        placeholder="搜索线路名称 / 目的地"
      />
    </div>
    <div class="sheet">
      <table>
        <thead>
          <tr>
            <th>线路</th><th>目的地</th><th>分类</th><th>票面</th><th>徽章</th><th>抽中</th><th>状态</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in kitchen.filteredRoutes" :key="r.id">
            <td>
              <div class="who">
                <img class="thumb" :src="r.img" alt="" />
                <div>
                  <strong>{{ r.name }}</strong>
                  <div style="font-size:11px;color:var(--muted);">{{ r.moodText }}</div>
                </div>
              </div>
            </td>
            <td>{{ r.dest }}</td>
            <td>{{ kitchen.catLabel(r.category) }}</td>
            <td>￥{{ r.value }}</td>
            <td><span class="pill">{{ r.badge }}</span></td>
            <td>{{ r.draws }}</td>
            <td><button class="pill" :class="r.status === 'on' ? 'ok' : 'wait'" type="button" @click="kitchen.toggleRoute(r.id)">{{ r.status === 'on' ? '启用' : '停用' }}</button></td>
            <td>
              <button class="linkish" type="button" @click="kitchen.editRoute(r.id)">编辑</button>
              <button class="linkish" type="button" @click="confirmAction('确定删除这条线路吗？') && kitchen.deleteRoute(r.id)">删除</button>
            </td>
          </tr>
          <tr v-if="!kitchen.filteredRoutes.length">
            <td colspan="8"><div class="empty">{{ kitchen.catalogError || '暂无线路数据' }}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'

const kitchen = useKitchenStore()

function confirmAction(message: string) {
  return window.confirm(message)
}
</script>
