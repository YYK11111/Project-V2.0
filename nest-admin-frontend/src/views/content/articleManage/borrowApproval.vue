<script setup lang="ts">
// @ts-nocheck
import { getPendingArticleBorrows } from './api'
import { useRoute, useRouter } from 'vue-router'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'

const route = useRoute()
const router = useRouter()
const rctRef = ref()
const params = ref({})
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const workflowBorrowId = computed(() => String(route.query.id || ''))

const statusMap = {
  pending: '审批中',
  waitingStart: '等待开始',
  active: '借阅中',
  approved: '已通过',
  rejected: '已拒绝',
  expired: '已到期',
  revoked: '已撤销',
}

const statusTypeMap = {
  pending: 'warning',
  waitingStart: 'warning',
  active: 'success',
  approved: 'success',
  rejected: 'danger',
  expired: 'info',
  revoked: 'info',
}

function goArticle(row: any) {
  if (!row?.articleId) return
  router.push({ path: '/content/articleManage/detail', query: { id: row.articleId } })
}

function refreshList() {
  rctRef.value?.getList?.()
}
</script>

<template>
  <div class="borrow-approval-page km-page">
    <div class="borrow-approval-hero Gcard km-hero">
      <div class="borrow-approval-hero__eyebrow km-hero__eyebrow">借阅审批</div>
      <div class="borrow-approval-hero__title km-hero__title">集中处理知识借阅申请，控制有效期与审批质量</div>
      <div class="borrow-approval-hero__desc km-hero__desc">重点核对申请人、申请理由和借阅时长，确保受限知识在合理范围内开放，避免审批口径不一致。</div>
      <div class="borrow-approval-statuses">
        <div class="borrow-approval-statuses__item"><el-tag type="warning" size="small">审批中</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="warning" size="small">等待开始</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="success" size="small">借阅中</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="success" size="small">已通过</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="danger" size="small">已拒绝</el-tag></div>
      </div>
    </div>

    <div v-if="workflowTaskId && workflowInstanceId" class="borrow-approval-panel Gcard km-panel">
      <div class="borrow-approval-panel__header km-panel__header">
        <div>
          <div class="borrow-approval-panel__title km-panel__title">工作流审批</div>
          <div class="borrow-approval-panel__desc km-panel__desc">当前借阅申请 {{ workflowBorrowId || '-' }}，审批通过后按申请开始时间自动生效。</div>
        </div>
      </div>
      <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" node-name="知识借阅审批" @approved="refreshList" />
    </div>

    <div class="borrow-approval-panel Gcard km-panel">
      <div class="borrow-approval-panel__header km-panel__header">
        <div>
          <div class="borrow-approval-panel__title km-panel__title">审批列表</div>
          <div class="borrow-approval-panel__desc km-panel__desc">按关键词或状态筛选申请记录，优先处理待审批项目。</div>
        </div>
      </div>

      <RequestChartTable ref="rctRef" :params="params" :request="getPendingArticleBorrows">
        <template #query="{ query }">
          <div class="query-sections">
            <div class="query-section query-section--primary">
              <div class="query-grid">
                <BaInput v-model="query.keyword" label="关键词" prop="keyword" />
                <BaSelect v-model="query.status" label="状态" prop="status">
                  <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
                </BaSelect>
              </div>
            </div>
          </div>
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
          <el-table-column label="申请人" width="140">
            <template #default="{ row }">{{ row.applicant?.nickname || row.applicant?.name || row.userId }}</template>
          </el-table-column>
          <el-table-column label="申请理由" prop="applyReason" min-width="220" :show-overflow-tooltip="true" />
          <el-table-column label="申请时长(天)" prop="requestedDays" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status] || 'info'" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="计划开始" prop="requestedStartTime" width="180" />
          <el-table-column label="当前节点" prop="currentNodeName" width="180" />
          <el-table-column label="申请时间" prop="createTime" width="180" />
        </template>
        <template #tableOperation="{ row }">
          <TbOpBtn icon="view" @click="goArticle(row)">查看知识</TbOpBtn>
        </template>
      </RequestChartTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.borrow-approval-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.borrow-approval-statuses__item {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 82%, var(--el-fill-color-extra-light));
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

</style>
