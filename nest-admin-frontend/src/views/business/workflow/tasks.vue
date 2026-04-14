<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from './api'
import { checkPermi } from '@/utils/permission'

const params = ref({})
const rctRef = ref()
const approvalDialogVisible = ref(false)
const approvalTitle = ref('审批')
const currentTask = ref<any>(null)
const approvalAction = ref('')
const approvalForm = reactive({ comment: '' })

const transferDialogVisible = ref(false)
const transferForm = reactive({ targetUserId: '', comment: '' })
const canWorkflowTaskComplete = computed(() => checkPermi(['business/workflow/tasks/complete']))
const canWorkflowTaskTransfer = computed(() => checkPermi(['business/workflow/tasks/transfer']))

const handleApprove = (row: any) => {
  if (!canWorkflowTaskComplete.value) return $sdk.msgError('当前操作没有权限')
  currentTask.value = row
  approvalAction.value = 'approve'
  approvalTitle.value = '同意审批'
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

const handleReject = (row: any) => {
  if (!canWorkflowTaskComplete.value) return $sdk.msgError('当前操作没有权限')
  currentTask.value = row
  approvalAction.value = 'reject'
  approvalTitle.value = '拒绝审批'
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

const handleTransfer = (row: any) => {
  if (!canWorkflowTaskTransfer.value) return $sdk.msgError('当前操作没有权限')
  currentTask.value = row
  transferForm.targetUserId = ''
  transferForm.comment = ''
  transferDialogVisible.value = true
}

const submitApproval = async () => {
  if (!currentTask.value) return
  try {
    await api.completeTask(currentTask.value.id, { action: approvalAction.value, comment: approvalForm.comment })
    ElMessage.success(approvalAction.value === 'approve' ? '已同意' : '已拒绝')
    approvalDialogVisible.value = false
    rctRef.value.getList()
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '操作失败') }
}

const submitTransfer = async () => {
  if (!currentTask.value || !transferForm.targetUserId) { ElMessage.warning('请输入目标用户ID'); return }
  try {
    await api.transferTask(currentTask.value.id, { targetUserId: transferForm.targetUserId, comment: transferForm.comment })
    ElMessage.success('转交成功')
    transferDialogVisible.value = false
    rctRef.value.getList()
  } catch (error: any) { ElMessage.error(error.response?.data?.message || '转交失败') }
}

const viewInstanceDetail = (row: any) => { currentTask.value = row }
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="api.getMyTasks">
      <template #table>
        <el-table-column prop="nodeName" label="任务名称" width="150" />
        <el-table-column prop="instanceId" label="流程实例ID" width="180" show-overflow-tooltip>
          <template #default="{ row }"><el-button link type="primary" @click="viewInstanceDetail(row)">{{ row.instanceId }}</el-button></template>
        </el-table-column>
        <el-table-column prop="starterId" label="发起人" width="120" />
        <el-table-column prop="startTime" label="创建时间" width="180" />
      </template>
      <template #tableOperation="{ row }">
        <el-button v-if="canWorkflowTaskComplete" type="primary" size="small" @click="handleApprove(row)">同意</el-button>
        <el-button v-if="canWorkflowTaskComplete" type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
        <el-button v-if="canWorkflowTaskTransfer" type="warning" size="small" @click="handleTransfer(row)">转交</el-button>
      </template>
    </RequestChartTable>

    <BaDialog v-model="approvalDialogVisible" :title="approvalTitle" width="500" @confirm="submitApproval">
      <template #form>
        <el-form-item label="审批意见"><el-input v-model="approvalForm.comment" type="textarea" :rows="4" placeholder="请输入审批意见" /></el-form-item>
      </template>
    </BaDialog>

    <BaDialog v-model="transferDialogVisible" title="转交任务" width="500" @confirm="submitTransfer">
      <template #form>
        <BaInput v-model="transferForm.targetUserId" prop="targetUserId" label="转交给" />
        <BaInput v-model="transferForm.comment" prop="comment" type="textarea" label="转交原因" />
      </template>
    </BaDialog>
  </div>
</template>
