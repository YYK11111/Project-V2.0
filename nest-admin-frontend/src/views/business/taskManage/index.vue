<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { getList, getStatus, getPriority, del, updateProgress, submitApproval } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

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
  { key: 'view', label: '查看', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/taskManage/form') },
  { key: 'comment', label: '评论', onClick: () => goToTaskSection(row, 'comment') },
  { key: 'report', label: '汇报', onClick: () => goToTaskSection(row, 'report') },
  { key: 'edit', label: '修改', disabled: !canTaskUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/taskManage/form') },
  { key: 'submitApproval', label: '提交审批', type: 'warning', disabled: !canTaskSubmitApproval.value || !canSubmitTaskApproval(row), onClick: () => handleSubmitApproval(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canTaskDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList" :key="$route.fullPath">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="任务名称" prop="name"></BaInput>
        <BaSelect v-model="query.status" filterable label="状态" prop="status">
          <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaSelect v-model="query.priority" filterable label="优先级" prop="priority">
          <el-option v-for="(value, key) of priority" :key="key" :label="value" :value="key"></el-option>
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
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canTaskAdd" type="primary" @click="rctRef.goRoute(null, '/taskManage/form')">新增任务</el-button>
          <el-button v-if="canTaskDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
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
