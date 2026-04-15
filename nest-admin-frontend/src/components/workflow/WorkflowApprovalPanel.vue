<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { addSignTask, completeTask, transferTask, getWorkflowHistory, getWorkflowInstanceTasks, getWorkflowInstance, getWorkflowDefinition } from '@/views/business/workflow/api'
import UserSelect from '@/components/UserSelect.vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  taskId: { type: String, default: '' },
  instanceId: { type: String, default: '' },
  nodeName: { type: String, default: '' },
})

const emit = defineEmits(['approved'])
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  comment: '',
  targetUserId: '',
  transferComment: '',
  rejectTargetNodeId: '',
  signUserId: '',
  signComment: '',
})

const transferVisible = ref(false)
const rejectVisible = ref(false)
const addSignVisible = ref(false)
const loading = ref(false)
const historyList = ref<any[]>([])
const instanceTasks = ref<any[]>([])
const instanceInfo = ref<any>(null)
const rejectableNodes = ref<any[]>([])
const autoBackVisible = ref(false)
const autoBackSeconds = ref(3)
let autoBackTimer: ReturnType<typeof setInterval> | null = null

const nodeTypeLabelMap: Record<string, string> = {
  start: '开始',
  end: '结束',
  approval: '审批',
  condition: '条件',
  notification: '通知',
  cc: '抄送',
  delay: '延时',
  form: '表单',
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = { '1': '同意', '2': '驳回', '3': '撤回', '4': '转交', '5': '加签', '6': '终止', execute: '执行' }
  return texts[action] || action
}

const getHistoryItemType = (action: string): '' | 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, '' | 'primary' | 'success' | 'warning' | 'info' | 'danger'> = { '1': 'success', '2': 'danger', '3': 'warning', '4': 'info', '5': 'primary', '6': 'danger', execute: 'info' }
  return types[action] || 'info'
}

const loadWorkflowContext = async () => {
  if (!props.instanceId) return
  const [historyRes, tasksRes, instanceRes] = await Promise.all([
    getWorkflowHistory(props.instanceId),
    getWorkflowInstanceTasks(props.instanceId),
    getWorkflowInstance(props.instanceId),
  ])
  historyList.value = historyRes.data || []
  instanceTasks.value = tasksRes.data || []
  instanceInfo.value = instanceRes.data || null

  if (instanceInfo.value?.definitionId) {
    const definitionRes = await getWorkflowDefinition(instanceInfo.value.definitionId)
    const definition = definitionRes.data || {}
    const executedNodeIds = new Set(historyList.value.map((item) => item.nodeId).filter(Boolean))
    rejectableNodes.value = (definition.nodes || []).filter((node: any) => {
      return executedNodeIds.has(node.id) && node.type !== 'end' && String(node.id) !== String(currentTask.value?.nodeId || '')
    })
  }
}

onMounted(() => {
  loadWorkflowContext()
})

onBeforeUnmount(() => {
  clearAutoBackTimer()
})

const rejectableNodeOptions = computed(() => {
  return rejectableNodes.value.map((node: any, index: number) => ({
    value: node.id,
    label: node.type === 'start'
      ? `${index + 1}. ${node.name}（退回发起人）`
      : `${index + 1}. ${node.name}（${nodeTypeLabelMap[node.type] || node.type}）`,
  }))
})

const currentTask = computed(() => instanceTasks.value.find((task) => String(task.id) === String(props.taskId)) || null)
const isCurrentPendingTask = computed(() => String(currentTask.value?.status || '') === '1')
const isCurrentAssignee = computed(() => {
  if (!currentTask.value) return false
  return String(currentTask.value.assigneeId) === String(userStore.id)
})
const canOperateCurrentTask = computed(() => !!props.taskId && !!currentTask.value && isCurrentPendingTask.value && isCurrentAssignee.value)
const actionDisabled = computed(() => !canOperateCurrentTask.value)
const actionDisabledText = computed(() => {
  if (!props.taskId) return '缺少审批任务ID'
  if (!currentTask.value) return '当前审批任务不存在'
  if (!isCurrentPendingTask.value) return '当前审批任务已处理'
  if (!isCurrentAssignee.value) return `当前待办办理人为 ${currentTask.value.assigneeName || currentTask.value.assigneeId}`
  return ''
})

const clearAutoBackTimer = () => {
  if (autoBackTimer) {
    clearInterval(autoBackTimer)
    autoBackTimer = null
  }
}

const goBackAfterApproval = () => {
  clearAutoBackTimer()
  autoBackVisible.value = false
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/workflow/tasks')
}

const startAutoBack = (seconds = 3) => {
  clearAutoBackTimer()
  autoBackSeconds.value = seconds
  autoBackVisible.value = true
  autoBackTimer = setInterval(() => {
    autoBackSeconds.value -= 1
    if (autoBackSeconds.value <= 0) {
      goBackAfterApproval()
    }
  }, 1000)
}

const submitDecision = async (action: 'approve' | 'reject') => {
  if (actionDisabled.value) return ElMessage.warning(actionDisabledText.value)
  loading.value = true
  try {
    await completeTask(props.taskId, { action, comment: form.comment })
    ElMessage.success(action === 'approve' ? '审批通过' : '已驳回')
    await loadWorkflowContext()
    emit('approved', { action })
    startAutoBack(3)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '审批失败')
  } finally {
    loading.value = false
  }
}

const submitRejectToNode = async () => {
  if (actionDisabled.value) return ElMessage.warning(actionDisabledText.value)
  if (!form.rejectTargetNodeId) return ElMessage.warning('请选择驳回目标节点')
  loading.value = true
  try {
    await completeTask(props.taskId, { action: 'reject', comment: form.comment, targetNodeId: form.rejectTargetNodeId })
    const targetNode = rejectableNodes.value.find((node: any) => String(node.id) === String(form.rejectTargetNodeId))
    ElMessage.success(targetNode?.type === 'start' ? '已退回发起人' : '已驳回到指定节点')
    await loadWorkflowContext()
    emit('approved', { action: 'reject' })
    startAutoBack(3)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '驳回失败')
  } finally {
    loading.value = false
    rejectVisible.value = false
  }
}

const submitTransfer = async () => {
  if (actionDisabled.value) return ElMessage.warning(actionDisabledText.value)
  if (!form.targetUserId) return ElMessage.warning('请选择转交人')
  loading.value = true
  try {
    await transferTask(props.taskId, { targetUserId: form.targetUserId, comment: form.transferComment })
    ElMessage.success('转交成功')
    await loadWorkflowContext()
    emit('approved', { action: 'transfer' })
    startAutoBack(3)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '转交失败')
  } finally {
    loading.value = false
    transferVisible.value = false
  }
}

const submitAddSign = async () => {
  if (actionDisabled.value) return ElMessage.warning(actionDisabledText.value)
  if (!form.signUserId) return ElMessage.warning('请选择加签人')
  loading.value = true
  try {
    await addSignTask(props.taskId, { signUserId: form.signUserId, comment: form.signComment })
    ElMessage.success('加签成功')
    await loadWorkflowContext()
    emit('approved', { action: 'addSign' })
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加签失败')
  } finally {
    loading.value = false
    addSignVisible.value = false
  }
}

const openInstanceDetail = () => {
  if (!props.instanceId) return
  router.push({ path: '/workflow/instances', query: { highlight: props.instanceId } })
}
</script>

<template>
  <el-card class="workflow-approval-panel" shadow="hover">
    <template #header>
      <div class="panel-header">
        <span>流程审批</span>
        <el-tag type="warning" size="small">{{ nodeName || '审批节点' }}</el-tag>
      </div>
    </template>

    <el-form label-width="90px">
      <el-form-item label="实例ID">
        <span>{{ instanceId || '-' }}</span>
      </el-form-item>
      <el-form-item label="流程编码" v-if="instanceInfo?.definitionCode">
        <span>{{ instanceInfo.definitionCode }}</span>
      </el-form-item>
      <el-form-item label="发起人" v-if="instanceInfo?.starterId">
        <span>{{ instanceInfo.starterName || instanceInfo.starterId }}</span>
      </el-form-item>
      <el-form-item label="实例状态" v-if="instanceInfo?.status">
        <el-tag :type="instanceInfo.status === '1' ? 'warning' : instanceInfo.status === '2' ? 'success' : 'info'">
          {{ instanceInfo.status === '1' ? '进行中' : instanceInfo.status === '2' ? '已完成' : '已取消' }}
        </el-tag>
      </el-form-item>
      <el-form-item label="业务标题" v-if="instanceInfo?.businessTitle">
        <span>{{ instanceInfo.businessTitle }}</span>
      </el-form-item>
      <el-form-item label="业务编号" v-if="instanceInfo?.businessCode">
        <span>{{ instanceInfo.businessCode }}</span>
      </el-form-item>
      <el-alert v-if="actionDisabledText" :title="actionDisabledText" type="warning" :closable="false" show-icon class="mb-16" />
      <template v-if="canOperateCurrentTask">
        <el-form-item label="审批意见">
          <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" :disabled="actionDisabled" @click="submitDecision('approve')">同意</el-button>
          <el-button type="danger" :loading="loading" :disabled="actionDisabled" @click="rejectVisible = true">驳回</el-button>
          <el-button type="warning" :disabled="actionDisabled" @click="transferVisible = true">转交</el-button>
          <el-button type="info" :disabled="actionDisabled" @click="addSignVisible = true">加签</el-button>
          <el-button @click="openInstanceDetail">查看流程实例</el-button>
        </el-form-item>
      </template>
      <el-form-item v-else>
        <el-button @click="openInstanceDetail">查看流程实例</el-button>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">当前流程上下文</el-divider>

    <div class="panel-scroll">
      <el-descriptions :column="1" border size="small" class="mb-16">
        <el-descriptions-item label="当前节点">{{ nodeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="待办数量">{{ instanceTasks.length }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <el-timeline v-if="historyList.length > 0">
      <el-timeline-item
        v-for="(item, index) in historyList"
        :key="index"
        :timestamp="item.createTime"
        :type="getHistoryItemType(item.action)"
        placement="top"
      >
        <el-card>
          <div class="history-title">{{ getActionText(item.action) }} - {{ item.nodeName || '流程节点' }}</div>
          <div v-if="item.operatorId" class="history-text">操作人: {{ item.operatorName || item.operatorId }}</div>
          <div v-if="item.comment" class="history-text">审批意见: {{ item.comment }}</div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无审批历史" />

    <el-divider content-position="left">当前实例任务</el-divider>
    <div class="panel-scroll">
      <el-table :data="instanceTasks" size="small" border>
        <el-table-column prop="id" label="任务ID" width="90" />
        <el-table-column prop="nodeName" label="节点" min-width="120" />
        <el-table-column prop="assigneeName" label="办理人" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'warning' : row.status === '2' ? 'success' : 'info'" size="small">
              {{ row.status === '1' ? '待处理' : row.status === '2' ? '已完成' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="创建时间" width="170" />
        <el-table-column prop="completeTime" label="完成时间" width="170">
          <template #default="{ row }">
            {{ row.completeTime || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="transferVisible" title="转交审批" width="500px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="转交给">
          <UserSelect v-model="form.targetUserId" placeholder="请选择转交人" clearable />
        </el-form-item>
        <el-form-item label="转交原因">
          <el-input v-model="form.transferComment" type="textarea" :rows="3" placeholder="请输入转交原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitTransfer">确认转交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回到指定节点" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="目标节点">
          <el-select v-model="form.rejectTargetNodeId" placeholder="请选择驳回节点" style="width: 100%">
            <el-option v-for="node in rejectableNodeOptions" :key="node.value" :label="node.label" :value="node.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="驳回意见">
          <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="请输入驳回意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="loading" @click="submitRejectToNode">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addSignVisible" title="加签审批" width="500px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="加签人">
          <UserSelect v-model="form.signUserId" placeholder="请选择加签人" clearable />
        </el-form-item>
        <el-form-item label="加签说明">
          <el-input v-model="form.signComment" type="textarea" :rows="3" placeholder="请输入加签说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSignVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitAddSign">确认加签</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="autoBackVisible"
      title="操作完成"
      width="420px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      destroy-on-close
    >
      <div class="auto-back-dialog__content">
        <el-icon class="auto-back-dialog__icon"><CircleCheckFilled /></el-icon>
        <div class="auto-back-dialog__text">{{ autoBackSeconds }} 秒后自动返回上一页</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="goBackAfterApproval">立即返回</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.workflow-approval-panel {
  margin-bottom: 20px;
  max-width: 100%;
  overflow: hidden;
}

.mb-16 {
  margin-bottom: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.history-text {
  color: #606266;
  line-height: 1.6;
  word-break: break-word;
}

.panel-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.auto-back-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 4px;
}

.auto-back-dialog__icon {
  font-size: 40px;
  color: var(--el-color-success);
}

.auto-back-dialog__text {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

:deep(.el-form-item__content) {
  min-width: 0;
  overflow-wrap: anywhere;
}

:deep(.el-descriptions__cell) {
  word-break: break-word;
}

:deep(.el-table) {
  width: 100%;
}
</style>
