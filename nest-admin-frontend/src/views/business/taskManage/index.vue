<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { getList, getStatus, getPriority, del, updateProgress, submitApproval } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import { sourceTypeMap } from '../projectManage/fieldMaps'

const params = ref({})

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const priority = ref({})
getPriority().then(({ data }) => (priority.value = data))


const rctRef = ref()
const canTaskAdd = computed(() => checkPermi(['business/tasks/add']))
const canTaskUpdate = computed(() => checkPermi(['business/tasks/update']))
const canTaskDelete = computed(() => checkPermi(['business/tasks/delete']))
const canTaskUpdateProgress = computed(() => checkPermi(['business/tasks/updateProgress']))
const canTaskSubmitApproval = computed(() => checkPermi(['business/tasks/update']))

function handleProgressChange(row) {
  if (!canTaskUpdateProgress.value) return $sdk.msgWarning('当前操作没有权限')
  updateProgress(row.id, row.progress).then(() => {
    $sdk.msgSuccess('进度更新成功')
  })
}

async function handleSubmitApproval(row) {
  if (!canTaskSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该任务审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

function goToTaskSection(row, tab) {
  rctRef.value.goRoute({ id: row.id, action: 'view', tab }, '/taskManage/form')
}

function isReportStale(row) {
  if (!row.latestReportTime) return true
  return dayjs(row.latestReportTime).isBefore(dayjs().subtract(7, 'day'))
}

function isRowAttentionNeeded(row) {
  return !row.commentCount || isReportStale(row)
}

const canSubmitTaskApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/taskManage/form') },
  { key: 'comment', label: '评论', onClick: () => goToTaskSection(row, 'comment') },
  { key: 'report', label: '汇报', onClick: () => goToTaskSection(row, 'report') },
  canTaskUpdate.value && row.canEdit !== false ? { key: 'edit', label: '修改', onClick: () => rctRef.value.goRoute(row.id, '/taskManage/form') } : null,
  canTaskSubmitApproval.value && canSubmitTaskApproval(row) ? { key: 'submitApproval', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  canTaskDelete.value && row.canDelete !== false ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="task-index-page">
    <RequestChartTable ref="rctRef" class="task-index-panel" :params="params" :request="getList" :key="$route.fullPath" :is-selection="true">
      <template #query="{ query }">
        <div class="query-grid">
          <BaInput v-model="query.name" label="任务名称" prop="name" />
          <BaSelect v-model="query.status" filterable label="状态" prop="status">
            <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
          <BaSelect v-model="query.priority" filterable label="优先级" prop="priority">
            <el-option v-for="(value, key) of priority" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
          <BaSelect v-model="query.sourceType" filterable label="来源类型" prop="sourceType">
            <el-option v-for="(label, key) in sourceTypeMap" :key="key" :label="label" :value="key"></el-option>
          </BaSelect>
          <BaSelect v-model="query.hasComment" filterable label="评论情况" prop="hasComment" isAll>
            <el-option label="有评论" value="1"></el-option>
            <el-option label="无评论" value="0"></el-option>
          </BaSelect>
          <BaSelect v-model="query.hasReport" filterable label="汇报情况" prop="hasReport" isAll>
            <el-option label="有汇报" value="1"></el-option>
            <el-option label="无汇报" value="0"></el-option>
          </BaSelect>
          <BaSelect v-model="query.reportFreshness" filterable label="汇报时效" prop="reportFreshness" isAll>
            <el-option label="最近7天未汇报" value="stale7d"></el-option>
          </BaSelect>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="task-index-operation">
          <div class="task-index-operation__left">
            <el-button v-if="canTaskAdd" type="primary" @click="rctRef.goRoute(null, '/taskManage/form')">新增任务</el-button>
          </div>
          <el-button v-if="canTaskDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="任务名称" prop="name" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="协作提醒" width="110">
          <template #default="{ row }">
            <el-tag v-if="isRowAttentionNeeded(row)" type="warning" size="small">需跟进</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务编号" prop="code" width="120" />
        <el-table-column label="负责人" prop="leader.nickname" width="100" />
        <el-table-column label="经办人" min-width="140" :show-overflow-tooltip="true">
          <template #default="{ row }">
            {{ (row.executors || []).map(user => user?.nickname || user?.name).filter(Boolean).join('、') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="开始时间" prop="startDate" width="120" />
        <el-table-column label="截止时间" prop="endDate" width="120" />
        <el-table-column label="计划开始" prop="plannedStartDate" width="120" />
        <el-table-column label="计划结束" prop="plannedEndDate" width="120" />
        <el-table-column label="实际开始" prop="actualStartDate" width="120" />
        <el-table-column label="实际结束" prop="actualEndDate" width="120" />
        <el-table-column label="来源类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.sourceType" :type="row.sourceType === 'change' ? 'warning' : row.sourceType === 'baseline' ? 'primary' : 'info'" size="small">
              {{ sourceTypeMap[row.sourceType] || row.sourceType }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '3' ? 'success' : row.status === '2' ? 'primary' : 'info'"
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="110">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评论数" prop="commentCount" width="90">
          <template #default="{ row }">
            <el-tag :type="row.commentCount ? 'primary' : 'info'" size="small">{{ row.commentCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近汇报" prop="latestReportTime" width="170">
          <template #default="{ row }">
            <el-tag :type="isReportStale(row) ? 'danger' : 'success'" size="small">
              {{ row.latestReportTime || '未汇报' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="优先级" prop="priority" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" 
              size="small">
              {{ priority[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="180">
          <template #default="{ row }">
            <el-slider
              v-model="row.progress"
              :max="100"
              :step="5"
              :disabled="!canTaskUpdateProgress"
              style="width: 150px"
              @change="handleProgressChange(row)" />
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
.task-index-page {
  min-height: 100%;
}

.task-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.task-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-index-panel :deep(.el-table__header-wrapper),
.task-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-grid :deep(.el-form-item) {
  display: flex;
  width: 100%;
  margin-bottom: 0;
}

.query-grid :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input) {
  width: 100%;
  flex: 1;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .task-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .task-index-operation,
  .task-index-operation__left {
    align-items: stretch;
  }
}
</style>
