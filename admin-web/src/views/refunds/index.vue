<template>
  <section class="view on">
    <PageHead title="退款柜台" sub="用户端提交的申请会出现在最上方；自动退只读可查" />
    <div class="sheet">
      <table>
        <thead>
          <tr>
            <th>退款单</th><th>原订单</th><th>用户</th><th>原因</th><th>金额</th><th>类型</th><th>动作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in kitchen.mergedRefunds" :key="r.no">
            <td>{{ r.no }}</td>
            <td>{{ r.order }}</td>
            <td><GuestCell :guest="r" /></td>
            <td>{{ r.reason }}</td>
            <td>￥{{ r.amount }}</td>
            <td><span class="pill" :class="r.type === '自动' ? 'wait' : 'ok'">{{ r.type }}</span></td>
            <td>
              <template v-if="r.st === 'wait' && r.type === '人工'">
                <button class="linkish" type="button" @click="kitchen.decideRefund(r.no, 'done')">通过</button>
                <button class="linkish" type="button" @click="kitchen.decideRefund(r.no, 'reject')">驳回</button>
              </template>
              <span v-else class="pill wait">{{ r.st === 'done' ? '已退回' : r.st === 'reject' ? '已驳回' : r.st }}</span>
            </td>
          </tr>
          <tr v-if="kitchen.transactionsLoading">
            <td colspan="7"><div class="empty">正在读取退款申请…</div></td>
          </tr>
          <tr v-else-if="!kitchen.mergedRefunds.length">
            <td colspan="7"><div class="empty">{{ kitchen.transactionsError || '暂无退款申请' }}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'
import GuestCell from '@/components/kitchen/GuestCell.vue'

const kitchen = useKitchenStore()
</script>
