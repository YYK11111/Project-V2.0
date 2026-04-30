<script setup lang="ts">
import { getList, quit } from './api'
import { KEY_NO, KEY_YES } from '@/utils/dictionary'
const yesOrNOStatus = { [KEY_YES]: '成功', [KEY_NO]: '失败' }
</script>

<template>
  <div class="online-user-index-page">
    <RequestChartTable ref="rctRef" class="online-user-index-panel" :request="getList">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.account" label="登录账号" prop="account"></BaInput>
              <BaInput v-model="query.address" label="登录地点" prop="ip"></BaInput>
              <BaInput v-model="query.ip" label="ip地址" prop="ip"></BaInput>
              <BaDatePicker v-model="query.createTimeRange" label="登录时间" prop="createTimeRange"></BaDatePicker>
            </div>
          </div>
        </div>
      </template>

      <template #tableView>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="会话编号" prop="session" :show-overflow-tooltip="true" />
        <el-table-column label="登录账号" prop="account" :show-overflow-tooltip="true" />
        <el-table-column label="登录地点" prop="address" :show-overflow-tooltip="true" />
        <el-table-column label="ip地址" prop="ip" :show-overflow-tooltip="true" />
        <el-table-column label="浏览器" prop="browser" />
        <el-table-column label="操作系统" prop="os" />
        <el-table-column label="登录时间" prop="createTime" />
        <!-- <el-table-column label="操作" fixed="right" width="300">
					<template #default="{ row }">
						<el-button text @click="$refs.rctRef.del(quit, row)">强退</el-button>
					</template>
				</el-table-column> -->
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.online-user-index-page {
  min-height: 100%;
}

.online-user-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.online-user-index-panel :deep(.el-table__header-wrapper),
.online-user-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .online-user-index-panel {
    padding-top: 18px;
  }
}
</style>
