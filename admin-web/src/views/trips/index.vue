<template>
  <section class="view on">
    <PageHead title="行程本" sub="客服查阅用，一般不改">
      <select v-model="validity" class="chip" @change="loadTrips">
        <option value="">全部状态</option>
        <option value="valid">有效</option>
        <option value="invalid">已退款</option>
      </select>
    </PageHead>
    <div class="sheet">
      <table>
        <thead><tr><th>日期</th><th>用户</th><th>订单号</th><th>盲盒</th><th>线路</th><th>目的地</th><th>购入价</th><th>票面</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="trip in trips" :key="trip.id">
            <td>{{ trip.openedDate }}</td><td>{{ trip.userName || `用户${trip.userId}` }}</td><td>{{ trip.orderNo || '—' }}</td>
            <td>{{ trip.boxName }}</td><td>{{ trip.routeName }}</td><td>{{ trip.location }}</td>
            <td>￥{{ (trip.priceCent / 100).toFixed(2) }}</td><td>￥{{ (trip.valueCent / 100).toFixed(2) }}</td>
            <td><span class="pill" :class="trip.validity === 'valid' ? 'ok' : 'bad'">{{ trip.validity === 'valid' ? '有效' : '已退款' }}</span></td>
          </tr>
          <tr v-if="!loading && !trips.length"><td colspan="9"><div class="empty">{{ error || '暂无行程记录' }}</div></td></tr>
          <tr v-if="loading"><td colspan="9"><div class="empty">正在读取行程…</div></td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listAdminTrips, type ApiAdminTrip } from '@/api/transaction'
import PageHead from '@/components/kitchen/PageHead.vue'

const trips = ref<ApiAdminTrip[]>([])
const loading = ref(false)
const validity = ref('')
const error = ref('')

async function loadTrips() {
  loading.value = true
  error.value = ''
  try {
    const result = await listAdminTrips({ validity: validity.value || undefined, page: 1, pageSize: 100 })
    trips.value = result.data?.list || []
  } catch {
    trips.value = []
    error.value = '行程列表加载失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadTrips)
</script>
