<template>
  <section class="view on">
    <PageHead title="订单小票" sub="支付宝沙箱 · 本期无微信">
      <button class="btn-ghost" type="button" @click="downloadCsv">导出明细</button>
    </PageHead>
    <div class="toolbar">
      <button v-for="s in states" :key="s.value" class="chip" :class="{ on: status === s.value }" type="button" @click="changeStatus(s.value)">{{ s.label }}</button>
    </div>
    <div class="sheet">
      <table>
        <thead><tr><th>单号</th><th>用户</th><th>盲盒</th><th>实付</th><th>渠道</th><th>状态</th><th>开盒结果</th><th>时间</th><th></th></tr></thead>
        <tbody>
          <tr v-for="o in orders" :key="o.orderNo">
            <td>{{ o.orderNo }}</td><td>{{ o.userName || `用户${o.userId}` }}<br><small>{{ o.phone }}</small></td><td>{{ o.boxName }}</td>
            <td>￥{{ (o.paidCent / 100).toFixed(2) }}</td><td>{{ o.payChannel || '—' }}</td>
            <td><span class="pill" :class="ORDER_ST[o.status]?.[1]">{{ ORDER_ST[o.status]?.[0] || o.status }}</span></td>
            <td>{{ o.routeName || '—' }}</td><td>{{ o.createdAt }}</td>
            <td><button class="linkish" type="button" @click="showDetail(o.orderNo)">详情</button></td>
          </tr>
          <tr v-if="!loading && !orders.length"><td colspan="9"><div class="empty">{{ orderError || '暂无订单' }}</div></td></tr>
          <tr v-if="loading"><td colspan="9"><div class="empty">正在读取订单…</div></td></tr>
        </tbody>
      </table>
    </div>
    <PageHead title="支付流水" sub="只读对账数据，不在管理端修改" />
    <div class="sheet">
      <table>
        <thead><tr><th>流水号</th><th>订单号</th><th>渠道</th><th>渠道单号</th><th>金额</th><th>结果</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="flow in flows" :key="flow.flowNo">
            <td>{{ flow.flowNo }}</td><td>{{ flow.orderNo }}</td><td>{{ flow.channel }}</td><td>{{ flow.channelTradeNo || '—' }}</td>
            <td>￥{{ (flow.amountCent / 100).toFixed(2) }}</td><td><span class="pill" :class="flow.result === 'success' ? 'ok' : flow.result === 'pending' ? 'wait' : 'bad'">{{ flow.result }}</span></td><td>{{ flow.createdAt }}</td>
          </tr>
          <tr v-if="!flowsLoading && !flows.length"><td colspan="7"><div class="empty">{{ flowError || '暂无支付流水' }}</div></td></tr>
          <tr v-if="flowsLoading"><td colspan="7"><div class="empty">正在读取支付流水…</div></td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="detail" class="detail-box">
      <b>订单详情 {{ detail.orderNo }}</b><span>状态：{{ detail.status }}</span><span>线路：{{ detail.routeName || '尚未开盒' }}</span>
      <button v-if="detail.status === 'paid' && !detail.tripId" class="btn-ghost" type="button" @click="reopen">补单</button>
      <button class="linkish" type="button" @click="detail = null">关闭</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ORDER_ST } from '@/constants/nav'
import { exportAdminOrders, getAdminOrder, listAdminOrders, listAdminPaymentFlows, reopenAdminOrder, type ApiAdminOrder, type ApiAdminPaymentFlow } from '@/api/transaction'
import PageHead from '@/components/kitchen/PageHead.vue'

const orders = ref<ApiAdminOrder[]>([])
const status = ref('all')
const loading = ref(false)
const orderError = ref('')
const detail = ref<ApiAdminOrder | null>(null)
const flows = ref<ApiAdminPaymentFlow[]>([])
const flowsLoading = ref(false)
const flowError = ref('')
const states = [{ value: 'all', label: '全部' }, { value: 'pending_pay', label: '待支付' }, { value: 'paid', label: '已支付' }, { value: 'opened', label: '已开盒' }, { value: 'cancelled', label: '已取消' }, { value: 'refunded', label: '已退款' }]

async function loadOrders() {
  loading.value = true
  orderError.value = ''
  try {
    const result = await listAdminOrders({ status: status.value === 'all' ? undefined : status.value, page: 1, pageSize: 100 })
    orders.value = result.data?.list || []
  } catch {
    orders.value = []
    orderError.value = '订单列表加载失败，请重试'
  } finally {
    loading.value = false
  }
}
async function loadFlows() {
  flowsLoading.value = true
  flowError.value = ''
  try {
    const result = await listAdminPaymentFlows({ page: 1, pageSize: 100 })
    flows.value = result.data?.list || []
  } catch {
    flows.value = []
    flowError.value = '支付流水加载失败，请重试'
  } finally {
    flowsLoading.value = false
  }
}
function changeStatus(value: string) { status.value = value; loadOrders() }
async function showDetail(orderNo: string) { const result = await getAdminOrder(orderNo); detail.value = result.data }
async function reopen() { if (!detail.value) return; const result = await reopenAdminOrder(detail.value.orderNo); detail.value = result.data; await loadOrders() }
async function downloadCsv() { const result = await exportAdminOrders({ status: status.value === 'all' ? undefined : status.value }); const url = URL.createObjectURL(result.data); const a = document.createElement('a'); a.href = url; a.download = 'tuge-orders.csv'; a.click(); URL.revokeObjectURL(url) }
onMounted(() => { loadOrders(); loadFlows() })
</script>
