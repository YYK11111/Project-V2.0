<script setup lang="ts">
import { computed } from 'vue'
import { formatWorkflowDateTime } from '@/views/business/workflow/time'

const props = defineProps({
  historyList: { type: Array, default: () => [] },
  tasks: { type: Array, default: () => [] },
  instanceInfo: { type: Object, default: () => ({}) },
})

const isResubmitHistory = (item: any) => item?.action === 'execute' && String(item?.comment || '').includes('发起人重新提交审批')

const isStartHistory = (item: any) => {
  return item?.action === 'execute' && (item?.nodeId === 'start' || item?.nodeName === '开始')
}

const isApprovalHistoryVisible = (item: any) => {
  return item?.action !== 'execute' || isStartHistory(item) || isResubmitHistory(item)
}

const getApprovalTask = (item: any) => {
  if (!item) return null
  if (item.taskId) {
    const matchedByTaskId = (props.tasks || []).find((task: any) => String(task.id) === String(item.taskId))
    if (matchedByTaskId) return matchedByTaskId
  }
  return (props.tasks || []).find((task: any) => String(task.nodeId) === String(item.nodeId) && task.completeTime === item.createTime) || null
}

type HistoryTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getHistoryItemType = (action: string): HistoryTagType => {
  const types: Record<string, HistoryTagType> = { '1': 'success', '2': 'danger', '3': 'warning', '4': 'info', '5': 'primary', '6': 'danger' }
  return types[action] || 'info'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = { '1': '同意', '2': '驳回', '3': '撤回', '4': '转交', '5': '加签', '6': '终止', execute: '系统流转' }
  return texts[action] || action
}

const getHistoryActionText = (item: any) => {
  if (isStartHistory(item)) {
    return '发起'
  }
  if (isResubmitHistory(item)) {
    return '发起人重新提交'
  }
  if (item?.action === '2' && props.instanceInfo?.variables?._lastRejectTarget === 'start') {
    return '驳回（退回发起人）'
  }
  return getActionText(item?.action)
}

const getHistoryOperatorText = (item: any) => {
  if (isStartHistory(item) && !item?.operatorName && !item?.operatorId) {
    const starterName = props.instanceInfo?.starterName || props.instanceInfo?.starterId || '-'
    return props.instanceInfo?.starterId && props.instanceInfo?.starterName ? `${props.instanceInfo.starterName}（${props.instanceInfo.starterId}）` : starterName
  }
  const approvalTask = getApprovalTask(item) as any
  if (!item?.operatorName && !item?.operatorId && (approvalTask?.assigneeName || approvalTask?.assigneeId)) {
    return approvalTask?.assigneeId && approvalTask?.assigneeName ? `${approvalTask.assigneeName}（${approvalTask.assigneeId}）` : approvalTask.assigneeName || approvalTask.assigneeId
  }
  const name = item?.operatorName || item?.operatorId || '-'
  return item?.operatorId && item?.operatorName ? `${item.operatorName}（${item.operatorId}）` : name
}

const getHistoryCommentText = (item: any) => {
  return item?.comment || '无审批意见'
}

const getRawTimeValue = (value: any) => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const formatDuration = (value: string | number) => {
  const totalMilliseconds = Number(value || 0)
  if (!Number.isFinite(totalMilliseconds) || totalMilliseconds <= 0) return '-'
  if (totalMilliseconds < 1000) return `${totalMilliseconds}毫秒`

  const totalSeconds = Math.floor(totalMilliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}小时${minutes}分${seconds}秒`
  if (minutes > 0) return `${minutes}分${seconds}秒`
  return `${seconds}秒`
}

const getApprovalArriveTime = (item: any) => {
  const task = getApprovalTask(item) as any
  return task?.startTime || task?.createTime || item?.createTime
}

const getApprovalCompleteTime = (item: any) => {
  const task = getApprovalTask(item) as any
  if (task?.completeTime) return task.completeTime
  if (item?.action && (item.action !== 'execute' || isStartHistory(item) || isResubmitHistory(item))) return item.createTime
  return null
}

const getApprovalStayDuration = (item: any) => {
  const task = getApprovalTask(item) as any
  if (task?.duration) return formatDuration(task.duration)

  const arriveTimestamp = getRawTimeValue(getApprovalArriveTime(item))
  const completeTimestamp = getRawTimeValue(getApprovalCompleteTime(item))
  if (!arriveTimestamp || !completeTimestamp || completeTimestamp <= arriveTimestamp) return '-'
  return formatDuration(completeTimestamp - arriveTimestamp)
}

const historyRecords = computed(() => {
  return (props.historyList || [])
    .filter(isApprovalHistoryVisible)
    .map((item: any, index: number) => ({
      ...item,
      stepNumber: index + 1,
      actionText: getHistoryActionText(item),
      operatorText: getHistoryOperatorText(item),
      commentText: getHistoryCommentText(item),
      arriveTime: formatWorkflowDateTime(getApprovalArriveTime(item)),
      completeTime: formatWorkflowDateTime(getApprovalCompleteTime(item)),
      stayDuration: getApprovalStayDuration(item),
    }))
})
</script>

<template>
  <el-table v-if="historyRecords.length > 0" :data="historyRecords" border stripe class="workflow-history-table">
    <el-table-column label="审批过程" width="90">
      <template #default="{ row }">第{{ row.stepNumber }}步</template>
    </el-table-column>
    <el-table-column prop="nodeName" label="节点名称" min-width="140" show-overflow-tooltip>
      <template #default="{ row }">{{ row.nodeName || '流程节点' }}</template>
    </el-table-column>
    <el-table-column label="审批操作" width="150">
      <template #default="{ row }">
        <el-tag :type="getHistoryItemType(row.action)" size="small">{{ row.actionText }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="operatorText" label="审批人" min-width="140" show-overflow-tooltip />
    <el-table-column prop="arriveTime" label="到达时间" width="170" />
    <el-table-column prop="completeTime" label="审批通过时间" width="170" />
    <el-table-column prop="stayDuration" label="停留时长" width="120" />
    <el-table-column prop="commentText" label="审批意见" min-width="180" show-overflow-tooltip />
  </el-table>
  <el-empty v-else description="暂无审批历史" />
</template>

<style scoped>
.workflow-history-table {
  width: 100%;
}

.workflow-history-table :deep(.cell) {
  line-height: 1.5;
}
</style>
