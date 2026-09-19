<template>
  <section class="view on">
    <PageHead title="到店的客人" sub="微信登录会同步微信名；未绑手机也会显示" />
    <div class="sheet">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>昵称 / 微信名</th><th>渠道</th><th>出行</th><th>称号</th><th>累计消费</th><th>省钱</th><th>最近</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in kitchen.mergedUsers" :key="u.id">
            <td>
              {{ u.id }}
              <div v-if="u.live" style="font-size:10px;color:var(--sage-deep);">当前</div>
            </td>
            <td><GuestCell :guest="u" /></td>
            <td>{{ u.ch }}</td>
            <td>{{ u.trips }}</td>
            <td><span class="pill">{{ u.title }}</span></td>
            <td>￥{{ u.spend }}</td>
            <td>￥{{ u.saved }}</td>
            <td>{{ u.last }}</td>
            <td><button class="linkish" type="button" @click="kitchen.showUser(u.id)">档案</button></td>
          </tr>
          <tr v-if="!kitchen.mergedUsers.length">
            <td colspan="9"><div class="empty">用户接口在阶段二接入</div></td>
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
