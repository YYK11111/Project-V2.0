<script setup>
import { watch } from 'vue'
import { confirmGoLiveRollback, confirmGoLiveSuccess, getOne, save, startGoLive, update, getStatuses, submitApproval } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import Editor from '@/components/Editor/index.vue'
import FormPageShell from '@/components/FormPageShell.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
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
const canShowActualGoLiveTime = computed(() => (isEdit.value || isReadonly.value) && String(form.value.status || '') !== '1')
const canStartGoLive = computed(() => !isReadonly.value && isEdit.value && String(form.value.status || '') === '3')
const canConfirmGoLiveResult = computed(() => !isReadonly.value && isEdit.value && String(form.value.status || '') === '4')

const form = ref({
  title: '',
  projectId: String(route.query.projectId || ''),
  plannedGoLiveTime: '',
  actualGoLiveTime: '',
  rollbackPlan: '',
  checklistSummary: '',
  relatedAttachments: [],
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
  form.value = {
    ...form.value,
    ...(data || {}),
    relatedAttachments: data?.relatedAttachments || [],
  }
}

watch(() => route.query.id, () => {
  if (!isGoLiveFormRoute()) return
  loadData()
}, { immediate: true })

function submit() {
  formRef.value.validate((valid) => {
    if (!valid) return
    const api = isEdit.value ? update : save
    const payload = { ...form.value }
    delete payload.status
    delete payload.actualGoLiveTime
    api(payload).then(() => {
      $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
      router.back()
    })
  })
}

function handleStartGoLive() {
  if (!route.query.id) return
  $sdk.confirm('确定开始执行上线吗？').then(() => {
    startGoLive(route.query.id).then(() => {
      $sdk.msgSuccess('已开始上线')
      loadData()
    })
  })
}

function handleConfirmSuccess() {
  if (!route.query.id) return
  $sdk.confirm('确定上线已成功吗？系统会自动写入实际上线时间。').then(() => {
    confirmGoLiveSuccess(route.query.id).then(() => {
      $sdk.msgSuccess('已确认上线成功')
      loadData()
    })
  })
}

function handleConfirmRollback() {
  if (!route.query.id) return
  $sdk.confirm('确定本次上线已回退吗？系统会保留或写入实际上线时间，并将状态改为已回退。').then(() => {
    confirmGoLiveRollback(route.query.id).then(() => {
      $sdk.msgSuccess('已确认回退')
      loadData()
    })
  })
}

function handleSubmitApproval() {
  if (!route.query.id) return $sdk.msgWarning('请先保存上线单后再提交审批')
  const request = String(form.value.currentNodeName || '').includes('退回发起人') && form.value.workflowInstanceId
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
  <FormPageShell class="business-form-page go-live-form-shell">
    <template #footerMeta>
      <span>{{ isReadonly ? '查看模式' : isEdit ? '编辑模式' : '新建模式' }}</span>
      <span v-if="fromWorkflow && workflowTaskId">当前来源于流程审批</span>
    </template>

    <el-page-header class="business-form-header" @back="$router.back()" :title="isReadonly ? '上线单详情' : isEdit ? '编辑上线单' : '新增上线单'">
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
              <div class="business-form-section__desc">维护上线标题、所属项目、负责人、上线时间和当前状态，先明确上线动作的基础边界。</div>
            </div>
          </div>

          <div class="business-form-fields">
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
            <el-form-item v-if="canShowActualGoLiveTime" label="实际上线日期">
              <ViewField :value="form.actualGoLiveTime || '-'" />
            </el-form-item>
            <el-form-item v-if="isEdit || isReadonly" label="状态">
              <ViewField :value="statusMap[form.status] || '-'" />
            </el-form-item>
          </div>
        </section>

        <section class="business-form-section">
          <div class="business-form-section__header">
            <div>
              <div class="business-form-section__title">上线检查与回退</div>
              <div class="business-form-section__desc">补充检查项摘要和回退预案，保证上线前后的风险控制有据可查。</div>
            </div>
          </div>

          <div class="business-form-fields business-form-fields--content">
            <el-form-item label="检查项摘要">
              <ViewRichText v-if="isReadonly" :html="form.checklistSummary" />
              <Editor v-else v-model="form.checklistSummary" style="min-height: 220px" placeholder="请输入检查项摘要" />
            </el-form-item>
            <el-form-item label="回退预案">
              <ViewRichText v-if="isReadonly" :html="form.rollbackPlan" />
              <Editor v-else v-model="form.rollbackPlan" style="min-height: 220px" placeholder="请输入回退预案" />
            </el-form-item>
            <el-form-item label="相关附件">
              <ViewFileList v-if="isReadonly" :files="form.relatedAttachments || []" />
              <Upload v-else v-model:fileList="form.relatedAttachments" type="file" multiple />
            </el-form-item>
          </div>
        </section>

        <section v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="business-workflow-section">
          <div class="business-workflow-section__header">审批操作区</div>
          <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" :node-name="form.currentNodeName || '上线审批'" @approved="loadData" />
        </section>
      </div>
    </el-form>
    <template #footer>
      <el-button v-if="!isReadonly && isEdit" type="warning" @click="handleSubmitApproval">提交审批</el-button>
      <el-button v-if="canStartGoLive" type="success" @click="handleStartGoLive">开始上线</el-button>
      <el-button v-if="canConfirmGoLiveResult" type="success" @click="handleConfirmSuccess">确认上线成功</el-button>
      <el-button v-if="canConfirmGoLiveResult" type="danger" @click="handleConfirmRollback">确认回退</el-button>
      <el-button v-if="!isReadonly" type="primary" @click="submit">提交</el-button>
      <el-button @click="$router.back()">取消</el-button>
    </template>
  </FormPageShell>
</template>

<style scoped>
.go-live-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}
</style>
