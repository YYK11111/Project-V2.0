<script setup lang="ts">
// @ts-nocheck
import { getOsInfo } from './api'

let data = ref<any>({})
function getOsInfoFun() {
  getOsInfo().then((res) => {
    data.value = res.data
  })
}
getOsInfoFun()
</script>

<template>
  <div>
    <div class="Gcard">
      <div class="GcardTitle stickyTop bgWhite">服务器信息</div>
      <el-descriptions class="" :column="3" border>
        <el-descriptions-item label="主机名称">{{ data.hostname }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ data.platform }}</el-descriptions-item>
        <el-descriptions-item label="发行版本">{{ data.release }}</el-descriptions-item>
        <el-descriptions-item label="CPU架构">{{ data.arch }}</el-descriptions-item>
        <el-descriptions-item label="服务器IP">
          <el-tag size="small">{{ data.ip }}</el-tag>
        </el-descriptions-item>
        <!-- <el-descriptions-item label="Address">
          No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
        </el-descriptions-item> -->
      </el-descriptions>
    </div>

    <div class="gridCard --MarginT">
      <div class="Gcard">
        <div class="GcardTitle stickyTop bgWhite">CPU {{ data.cpu?.usedCpu }}/{{ data.cpu?.totalCpu }} (百分比)</div>
        <ChartPie
          :series="[
            { value: data.cpu?.usedCpu, name: '使用率' },
            { value: data.cpu?.freeCpu, name: '空闲率' },
          ]"></ChartPie>
      </div>
      <div class="Gcard">
        <div class="GcardTitle stickyTop bgWhite">内存 {{ data.mem?.usedMemory }}/{{ data.mem?.totalMemory }} (G)</div>
        <ChartPie
          :series="[
            { value: data.mem?.usedMemory, name: '使用' },
            { value: data.mem?.freeMemory, name: '空闲' },
          ]"></ChartPie>
      </div>
      <div class="Gcard">
        <div class="GcardTitle stickyTop bgWhite">磁盘 {{ data.disk?.usedDisk }}/{{ data.disk?.totalDisk }} (G)</div>
        <ChartPie
          :series="[
            { value: data.disk?.usedDisk, name: '使用' },
            { value: data.disk?.freeDisk, name: '空闲' },
          ]"></ChartPie>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gridCard {
  display: grid;
  grid-template: auto / 1fr 1fr;
  gap: var(--Margin);
  .Gcard {
    margin-top: 0;
  }
}
</style>
