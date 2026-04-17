<script setup lang="ts">
// @ts-nocheck
import { getMyArticleBorrows } from './api'
import { useRouter } from 'vue-router'

const router = useRouter()
const rctRef = ref()
const params = ref({})

function goArticle(row: any) {
  if (!row?.articleId) return
  router.push({ path: '/content/articleManage/detail', query: { id: row.articleId } })
}

const statusMap = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  expired: '已到期',
  revoked: '已撤销',
}

const statusTypeMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  expired: 'info',
  revoked: 'info',
}
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getMyArticleBorrows">
      <template #query="{ query }">
        <BaInput v-model="query.keyword" label="关键词" prop="keyword"></BaInput>
        <BaSelect v-model="query.status" label="状态" prop="status">
          <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>
      <template #table>
        <el-table-column label="知识标题" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="goArticle(row)">{{ row.article?.title || '-' }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="140">
          <template #default="{ row }">{{ row.article?.catalog?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status] || 'info'" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请理由" prop="applyReason" min-width="220" :show-overflow-tooltip="true" />
        <el-table-column label="借阅时长(天)" prop="requestedDays" width="120" />
        <el-table-column label="借阅开始" prop="borrowStartTime" width="180" />
        <el-table-column label="借阅结束" prop="borrowEndTime" width="180" />
        <el-table-column label="审批时间" prop="approvedAt" width="180" />
      </template>
    </RequestChartTable>
  </div>
</template>
