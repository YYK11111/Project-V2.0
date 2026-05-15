<script setup>
import { watch } from 'vue'
import { getOne, save, update, getResults, submitApproval } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import FormPageShell from '@/components/FormPageShell.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const resultMap = ref({})
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
  acceptanceScope: '',
  acceptanceDate: '',
  customerApprover: '',
  result: '1',
  attachmentSummary: '',
  comment: '',
  workflowInstanceId: '',
  currentNodeName: '',
})

const rules = {
  title: [{ required: true, message: '请输入验收标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

getResults().then(({ data }) => {
  resultMap.value = data || {}
})

const isAcceptanceFormRoute = useCurrentRouteGuard(route, '/acceptanceManage/form')

async function loadData() {
  if (!isAcceptanceFormRoute()) return
  if (!route.query.id) return
  const { data } = await getOne(route.query.id)
  form.value = { ...form.value, ...(data || {}) }
}

watch(() => route.query.id, () => {
  if (!isAcceptanceFormRoute()) return
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
  if (!route.query.id) return $sdk.msgWarning('请先保存验收单后再提交审批')
  const request = String(form.value.currentNodeName || '').includes('退回发起人') && form.value.workflowInstanceId
    ? resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(route.query.id)
  request.then(() => {
    $sdk.msgSuccess('验收审批提交成功')
    router.back()
  }).catch((e) => {
    $sdk.msgError(e?.response?.data?.message || e?.message || '提交验收审批失败')
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
  <FormPageShell class="business-form-page acceptance-form-shell">
    <template #footerMeta>
      <span>{{ isReadonly ? '查看模式' : isEdit ? '编辑模式' : '新建模式' }}</span>
      <span v-if="fromWorkflow && workflowTaskId">当前来源于流程审批</span>
    </template>

    <el-page-header class="business-form-header" @back="$router.back()" :title="isReadonly ? '验收单详情' : isEdit ? '编辑验收单' : '新增验收单'">
      <template #extra>
        <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        <el-button v-if="form.workflowInstanceId && String(form.currentNodeName || '').includes('退回发起人')" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
      </template>
    </el-page-header>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="business-form">
      <div class="business-form-sections">
        <section class="business-form-section">
          <div class="business-form-section__header">
            <div>
              <div class="business-form-section__title">基本信息</div>
              <div class="business-form-section__desc">维护验收标题、所属项目、验收日期和验收结论，先明确本次验收的业务边界。</div>
            </div>
          </div>

          <div class="business-form-fields">
            <el-form-item label="验收标题" prop="title">
              <ViewField v-if="isReadonly" :value="form.title" />
              <el-input v-else v-model="form.title" placeholder="请输入验收标题" />
            </el-form-item>
            <el-form-item label="所属项目" prop="projectId">
              <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
              <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
            </el-form-item>
            <el-form-item label="验收日期">
              <ViewField v-if="isReadonly" :value="form.acceptanceDate" />
              <el-date-picker v-else v-model="form.acceptanceDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="客户验收人">
              <ViewField v-if="isReadonly" :value="form.customerApprover" />
              <el-input v-else v-model="form.customerApprover" placeholder="请输入客户验收人" />
            </el-form-item>
            <el-form-item label="验收结果">
              <ViewField v-if="isReadonly" :value="resultMap[form.result] || '-'" />
              <el-select v-else v-model="form.result" style="width: 100%">
                <el-option v-for="(label, key) in resultMap" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="business-form-section">
          <div class="business-form-section__header">
            <div>
              <div class="business-form-section__title">验收范围与附件</div>
              <div class="business-form-section__desc">补充验收范围、附件摘要和备注说明，便于审批和后续追溯。</div>
            </div>
          </div>

          <div class="business-form-fields business-form-fields--content">
            <el-form-item label="验收范围">
              <ViewField v-if="isReadonly" :value="form.acceptanceScope" />
              <el-input v-else v-model="form.acceptanceScope" type="textarea" :rows="3" placeholder="请输入验收范围" />
            </el-form-item>
            <el-form-item label="附件摘要">
              <ViewField v-if="isReadonly" :value="form.attachmentSummary" />
              <el-input v-else v-model="form.attachmentSummary" type="textarea" :rows="3" placeholder="请输入附件摘要" />
            </el-form-item>
            <el-form-item label="备注">
              <ViewField v-if="isReadonly" :value="form.comment" />
              <el-input v-else v-model="form.comment" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </div>
        </section>

        <section v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="business-workflow-section">
          <div class="business-workflow-section__header">审批操作区</div>
          <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" :node-name="form.currentNodeName || '验收审批'" @approved="loadData" />
        </section>
      </div>
    </el-form>
    <template #footer>
      <el-button v-if="!isReadonly && isEdit" type="warning" @click="handleSubmitApproval">提交审批</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button @click="$router.back()">取消</el-button>
    </template>
  </FormPageShell>
</template>

<style scoped>
.acceptance-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}
</style>
