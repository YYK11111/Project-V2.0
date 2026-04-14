<script setup lang="ts">
import { getList, del } from './api'
import { KEY_NO, KEY_YES } from '@/utils/dictionary'
const yesOrNOStatus = { [KEY_YES]: '成功', [KEY_NO]: '失败' }
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.account" label="登录账号" prop="account"></BaInput>
        <BaInput v-model="query.address" label="登录地点" prop="ip"></BaInput>
        <BaInput v-model="query.ip" label="ip地址" prop="ip"></BaInput>
        <BaSelect v-model="query.isSuccess" filterable label="登录状态" prop="isSuccess">
          <el-option v-for="(value, key) of yesOrNOStatus" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaDatePicker v-model="query.createTimeRange" label="登录时间" prop="createTimeRange"></BaDatePicker>
      </template>

      <template #tableView>
        <el-table-column label="会话编号" prop="session" :show-overflow-tooltip="true" />
        <el-table-column label="登录账号" prop="account" :show-overflow-tooltip="true" />
        <!-- <el-table-column label="登录密码" prop="password" :show-overflow-tooltip="true" /> -->
        <el-table-column label="登录地点" prop="address" :show-overflow-tooltip="true" />
        <el-table-column label="ip地址" prop="ip" :show-overflow-tooltip="true" />

        <el-table-column label="浏览器" prop="browser" />
        <el-table-column label="操作系统" prop="os" />
        <el-table-column label="登录状态" prop="isSuccess">
          <template #default="{ row }">
            {{ yesOrNOStatus[row.isSuccess] }}
          </template>
        </el-table-column>
        <el-table-column label="登录时间" prop="createTime" />
        <el-table-column label="提示消息" prop="msg" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.title-name {
  font-size: 14px;

  font-weight: 600;
  color: var(--FontBlack);
  display: flex;
  align-items: center;
}
.bottom {
  justify-content: flex-end;
  padding: 20px;
}
</style>
