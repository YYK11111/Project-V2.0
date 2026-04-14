<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from './api'
import { checkPermi } from '@/utils/permission'
import { useRouter } from 'vue-router'

const params = ref({})
const rctRef = ref()
const router = useRouter()
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

const getBusinessRoute = (row: any) => {
  const businessId = String(row.businessKey || '').split('_').pop()
  const query = { id: businessId, taskId: row.id, instanceId: row.instanceId, fromWorkflow: '1' }
  if (row.businessType === 'project') return { path: '/projectManage/detail', query }
  if (row.businessType === 'change') return { path: '/changeManage/form', query }
  if (row.businessType === 'ticket') return { path: '/ticketManage/form', query }
  if (row.businessType === 'task') return { path: '/taskManage/form', query }
  if (row.businessType === 'customer') return { path: '/crm/customer/form', query }
  return null
}

const viewInstanceDetail = (row: any) => {
  const target = getBusinessRoute(row)
  if (!target) {
    return ElMessage.warning('未识别的业务对象，无法跳转')
  }
  router.push(target)
}
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="api.getMyTasks">
      <template #table>
        <el-table-column prop="nodeName" label="任务名称" width="150" />
        <el-table-column prop="businessType" label="业务对象" width="100" />
        <el-table-column prop="businessTitle" label="业务标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }"><el-button link type="primary" @click="viewInstanceDetail(row)">{{ row.businessTitle }}</el-button></template>
        </el-table-column>
        <el-table-column prop="businessCode" label="业务编号" width="160" show-overflow-tooltip />
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
