<script setup>
import { watch } from 'vue'
import { getOne, save, update, getStatuses, submitApproval } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const statusMap = ref({})
const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const isWorkflowReadonly = computed(() => fromWorkflow.value && !!workflowTaskId.value)
const isReadonly = computed(() => isView.value || isWorkflowReadonly.value)
const workflowPanelRef = ref()
const approvalView = computed(() => form.value?.approvalView || {})

const form = ref({
  title: '',
  projectId: String(route.query.projectId || ''),
  plannedGoLiveTime: '',
  actualGoLiveTime: '',
  rollbackPlan: '',
  checklistSummary: '',
  dutyMembers: [],
  status: '1',
  ownerId: '',
  workflowInstanceId: '',
  currentNodeName: '',
})

const rules = {
  title: [{ required: true, message: '请输入上线标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

getStatuses().then(({ data }) => {
  statusMap.value = data || {}
})

const isGoLiveFormRoute = useCurrentRouteGuard(route, '/goLiveManage/form')

async function loadData() {
  if (!isGoLiveFormRoute()) return
  if (!route.query.id) return
  const { data } = await getOne(route.query.id)
  form.value = { ...form.value, ...(data || {}) }
}

watch(() => route.query.id, () => {
  if (!isGoLiveFormRoute()) return
  loadData()
}, { immediate: true })

function submit() {
  formRef.value.validate((valid) => {
    if (!valid) return
    const api = isEdit.value ? update : save
    api(form.value).then(() => {
      $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
      router.back()
    })
  })
}

function handleSubmitApproval() {
  if (!route.query.id) return $sdk.msgWarning('请先保存上线单后再提交审批')
  const request = approvalView.value?.status === 'returned' && form.value.workflowInstanceId
    ? resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(route.query.id)
  request.then(() => {
    $sdk.msgSuccess('上线审批提交成功')
    router.back()
  }).catch((e) => {
    $sdk.msgError(e?.response?.data?.message || e?.message || '提交上线审批失败')
  })
}

async function handleCloseReturnedInstance() {
  await closeReturnedWorkflowInstance(form.value.workflowInstanceId, { reason: '发起人确认结束退回实例' })
  $sdk.msgSuccess('退回实例已结束')
  loadData()
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="Gcard go-live-form-shell">
    <el-page-header class="mb20" @back="$router.back()" :title="isReadonly ? '上线单详情' : isEdit ? '编辑上线单' : '新增上线单'">
      <template #extra>
        <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        <el-button v-if="form.workflowInstanceId && approvalView.status === 'returned'" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
      </template>
    </el-page-header>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 840px">
      <el-form-item label="上线标题" prop="title">
        <ViewField v-if="isReadonly" :value="form.title" />
        <el-input v-else v-model="form.title" placeholder="请输入上线标题" />
      </el-form-item>
      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>
      <el-form-item label="负责人">
        <ViewUser v-if="isReadonly" :user="form.owner" />
        <UserSelect v-else v-model="form.ownerId" placeholder="请选择负责人" clearable />
      </el-form-item>
      <el-form-item label="计划上线日期">
        <ViewField v-if="isReadonly" :value="form.plannedGoLiveTime" />
        <el-date-picker v-else v-model="form.plannedGoLiveTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="实际上线日期">
        <ViewField v-if="isReadonly" :value="form.actualGoLiveTime" />
        <el-date-picker v-else v-model="form.actualGoLiveTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态">
        <ViewField v-if="isReadonly" :value="statusMap[form.status] || '-'" />
        <el-select v-else v-model="form.status" style="width: 100%">
          <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="检查项摘要">
        <ViewField v-if="isReadonly" :value="form.checklistSummary" />
        <el-input v-else v-model="form.checklistSummary" type="textarea" :rows="3" placeholder="请输入检查项摘要" />
      </el-form-item>
      <el-form-item label="回退预案">
        <ViewField v-if="isReadonly" :value="form.rollbackPlan" />
        <el-input v-else v-model="form.rollbackPlan" type="textarea" :rows="3" placeholder="请输入回退预案" />
      </el-form-item>
      <div v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="workflow-panel-section">
        <div class="workflow-panel-section__header">审批操作区</div>
        <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" :node-name="form.currentNodeName || '上线审批'" @approved="loadData" />
      </div>
      <el-form-item v-if="!isReadonly">
        <el-button type="primary" @click="submit">提交</el-button>
        <el-button v-if="isEdit" type="warning" @click="handleSubmitApproval">提交审批</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.go-live-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.workflow-panel-section {
  margin: 24px 0;
}

.workflow-panel-section__header {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}
</style>
