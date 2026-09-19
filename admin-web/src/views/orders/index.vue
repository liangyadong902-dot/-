<template>
  <section class="view on">
    <PageHead title="订单小票" sub="支付宝沙箱 · 本期无微信">
      <button class="btn-ghost" type="button" @click="toast('原型不落文件，正式环境按时间范围导出')">导出明细</button>
    </PageHead>
    <div class="toolbar">
      <button
        v-for="s in states"
        :key="s.value"
        class="chip"
        :class="{ on: kitchen.filters.orderSt === s.value }"
        type="button"
        @click="kitchen.filters.orderSt = s.value"
      >{{ s.label }}</button>
    </div>
    <div class="sheet">
      <table>
        <thead>
          <tr>
            <th>单号</th><th>用户</th><th>盲盒</th><th>实付</th><th>渠道</th><th>状态</th><th>开盒结果</th><th>时间</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in kitchen.filteredOrders" :key="o.no">
            <td>{{ o.no }}</td>
            <td><GuestCell :guest="o" /></td>
            <td>{{ o.box }}</td>
            <td>￥{{ o.pay }}</td>
            <td>{{ o.ch }}</td>
            <td><span class="pill" :class="ORDER_ST[o.st][1]">{{ ORDER_ST[o.st][0] }}</span></td>
            <td>{{ o.route }}</td>
            <td>{{ o.time }}</td>
            <td><button class="linkish" type="button" @click="kitchen.showOrder(o.no)">详情</button></td>
          </tr>
          <tr v-if="!kitchen.filteredOrders.length">
            <td colspan="9"><div class="empty">暂无订单</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ORDER_ST } from '@/constants/nav'
import { useKitchenStore } from '@/stores/kitchen'
import { toast } from '@/utils/toast'
import PageHead from '@/components/kitchen/PageHead.vue'
import GuestCell from '@/components/kitchen/GuestCell.vue'

const kitchen = useKitchenStore()
const states = [
  { value: 'all', label: '全部' },
  { value: 'pending_pay', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'opened', label: '已开盒' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
]
</script>
