<script setup>
import { watch } from 'vue'
import { getOne, save, update, getStatuses, submitApproval } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
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

const form = ref({
  title: '',
  projectId: String(route.query.projectId || ''),
  handoverTo: '',
  handoverDate: '',
  serviceWindow: '',
  contacts: '',
  knownIssues: '',
  knowledgeReady: '0',
  status: '1',
  workflowInstanceId: '',
  currentNodeName: '',
})

const rules = {
  title: [{ required: true, message: '请输入交接单标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

getStatuses().then(({ data }) => {
  statusMap.value = data || {}
})

const isHandoverFormRoute = useCurrentRouteGuard(route, '/handoverManage/form')

async function loadData() {
  if (!isHandoverFormRoute()) return
  if (!route.query.id) return
  const { data } = await getOne(route.query.id)
  form.value = { ...form.value, ...(data || {}) }
}

watch(() => route.query.id, () => {
  if (!isHandoverFormRoute()) return
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
  if (!route.query.id) return $sdk.msgWarning('请先保存运维交接单后再提交审批')
  const request = String(form.value.currentNodeName || '').includes('退回发起人') && form.value.workflowInstanceId
    ? resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(route.query.id)
  request.then(() => {
    $sdk.msgSuccess('运维交接审批提交成功')
    router.back()
  }).catch((e) => {
    $sdk.msgError(e?.response?.data?.message || e?.message || '提交运维交接审批失败')
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
  <div class="Gcard handover-form-shell">
    <el-page-header class="mb20" @back="$router.back()" :title="isReadonly ? '运维交接单详情' : isEdit ? '编辑运维交接单' : '新增运维交接单'">
      <template #extra>
        <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        <el-button v-if="form.workflowInstanceId && String(form.currentNodeName || '').includes('退回发起人')" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
      </template>
    </el-page-header>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 840px">
      <el-form-item label="交接单标题" prop="title">
        <ViewField v-if="isReadonly" :value="form.title" />
        <el-input v-else v-model="form.title" placeholder="请输入交接单标题" />
      </el-form-item>
      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>
      <el-form-item label="接维对象">
        <ViewField v-if="isReadonly" :value="form.handoverTo" />
        <el-input v-else v-model="form.handoverTo" placeholder="请输入接维对象" />
      </el-form-item>
      <el-form-item label="交接日期">
        <ViewField v-if="isReadonly" :value="form.handoverDate" />
        <el-date-picker v-else v-model="form.handoverDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="服务窗口说明">
        <ViewField v-if="isReadonly" :value="form.serviceWindow" />
        <el-input v-else v-model="form.serviceWindow" type="textarea" :rows="3" placeholder="请输入服务窗口说明" />
      </el-form-item>
      <el-form-item label="联系人与渠道">
        <ViewField v-if="isReadonly" :value="form.contacts" />
        <el-input v-else v-model="form.contacts" type="textarea" :rows="3" placeholder="请输入联系人与渠道" />
      </el-form-item>
      <el-form-item label="已知问题">
        <ViewField v-if="isReadonly" :value="form.knownIssues" />
        <el-input v-else v-model="form.knownIssues" type="textarea" :rows="3" placeholder="请输入已知问题" />
      </el-form-item>
      <el-form-item label="知识准备完成">
        <ViewField v-if="isReadonly" :value="form.knowledgeReady === '1' ? '是' : '否'" />
        <el-switch v-else v-model="form.knowledgeReady" active-value="1" inactive-value="0" />
      </el-form-item>
      <el-form-item label="状态">
        <ViewField v-if="isReadonly" :value="statusMap[form.status] || '-'" />
        <el-select v-else v-model="form.status" style="width: 100%">
          <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <div v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="workflow-panel-section">
        <div class="workflow-panel-section__header">审批操作区</div>
        <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" :node-name="form.currentNodeName || '运维交接审批'" @approved="loadData" />
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
.handover-form-shell {
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
