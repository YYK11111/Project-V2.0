<script setup>
import { watch } from 'vue'
import { getOne, save, update, getStatus, getPriority, getType, getSeverity, getRootCauseCategory, submitApproval } from './api'
import { getList as getTaskList } from '@/views/business/taskManage/api'
import { ElMessageBox } from 'element-plus'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  type: '1',
  projectId: '',
  taskId: '',
  submitterId: '',
  handlerId: '',
  status: '1',
  priority: '2',
  content: '',
  attachments: [],
  severity: '3',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  environment: '',
  rootCause: '',
  rootCauseCategory: '',
  resolution: '',
  foundInVersion: '',
  fixedInVersion: '',
})

const rules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  submitterId: [{ required: true, message: '请选择提交人', trigger: 'change' }],
}

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const priority = ref({})
getPriority().then(({ data }) => (priority.value = data))

const type = ref({})
getType().then(({ data }) => (type.value = data))

const severity = ref({})
getSeverity().then(({ data }) => (severity.value = data))

const rootCauseCategory = ref({})
getRootCauseCategory().then(({ data }) => (rootCauseCategory.value = data))

const taskList = ref([])
const loadTaskList = () => {
  if (form.value.projectId) {
    getTaskList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId }).then(({ data }) => {
      taskList.value = data || []
    })
  } else {
    taskList.value = []
  }
}

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const canSubmitCurrentApproval = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const isWorkflowReadonly = computed(() => fromWorkflow.value && !!workflowTaskId.value)
const isReadonly = computed(() => isView.value || isWorkflowReadonly.value)
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))
const canCloseReturnedInstance = computed(() => form.value.workflowInstanceId && form.value.approvalStatus === '3' && String(form.value.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()
const hasTicketId = computed(() => !!route.query.id)
const normalizedAttachments = computed(() => Array.isArray(form.value.attachments) ? form.value.attachments : [])

const defaultForm = () => ({
  title: '',
  type: '1',
  projectId: '',
  taskId: '',
  submitterId: '',
  handlerId: '',
  status: '1',
  priority: '2',
  content: '',
  attachments: [],
  severity: '3',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  environment: '',
  rootCause: '',
  rootCauseCategory: '',
  resolution: '',
  foundInVersion: '',
  fixedInVersion: '',
})

async function loadTicket() {
  if (!hasTicketId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = {
    ...data,
    severity: data.severity || '3',
    rootCauseCategory: data.rootCauseCategory || '',
  }
}

watch(
  () => [route.query.id, route.query.action, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    loadTicket()
  },
  { immediate: true },
)

function reloadCurrent() {
  loadTicket()
}

function submit() {
  if (isReadonly.value || (isEdit.value && !canTicketUpdate.value) || (!isEdit.value && !canTicketAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  formRef.value.validate((valid) => {
    if (valid) {
      const api = isEdit.value ? update : save
      api(form.value).then(() => {
        $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
        if (isEdit.value) {
          router.back()
        } else {
          router.push('/ticketManage/index')
        }
      })
    }
  })
}

function cancel() {
  router.back()
}

async function handleSubmitApproval() {
  if (!canTicketUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (canCloseReturnedInstance.value) {
    await resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    $sdk.msgSuccess('重新提交审批成功')
    reloadCurrent()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  await submitApproval(route.query.id)
  $sdk.msgSuccess('提交审批成功')
  router.back()
}

async function handleCloseReturnedInstance() {
  const { value } = await ElMessageBox.prompt('结束后实例将进入已取消状态，业务对象将同步更新为最终驳回态。', '结束退回实例', {
    confirmButtonText: '确认结束',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入结束原因（选填）',
    inputType: 'textarea',
  })
  await closeReturnedWorkflowInstance(form.value.workflowInstanceId, { reason: value || '发起人确认结束退回实例' })
  $sdk.msgSuccess('退回实例已结束')
  reloadCurrent()
}

function goToEdit() {
  if (!route.query.id) return
  router.push({ path: '/ticketManage/form', query: { id: route.query.id } })
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '工单详情' : isEdit ? '编辑工单' : '新增工单'">
        <template #extra>
          <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </template>
      </el-page-header>
    </div>

    <el-alert
      v-if="isEdit && form.approvalStatus === '3'"
      :title="String(form.currentNodeName || '').includes('退回发起人') ? '该工单审批已退回发起人，可修改后重新提交，或直接结束退回实例。' : '该工单审批已驳回，请根据意见调整后重新提交。'"
      type="warning"
      :closable="false"
      show-icon
      class="mb-16"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="route.query.action === 'view'" type="primary" size="small" @click="goToEdit">去编辑</el-button>
          <el-button v-if="isEdit && canTicketUpdate && canSubmitCurrentApproval" type="warning" size="small" @click="handleSubmitApproval">重新提交审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单标题" prop="title">
            <ViewField v-if="isReadonly" :value="form.title" />
            <el-input v-else v-model="form.title" placeholder="请输入工单标题" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单类型">
              <ViewField v-if="isReadonly" :value="type[form.type]" />
              <el-select v-else v-model="form.type" placeholder="请选择类型" style="width: 100%">
               <el-option v-for="(value, key) in type" :key="key" :label="value" :value="key" />
             </el-select>
           </el-form-item>
        </el-col>
      </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属项目" prop="projectId">
            <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
            <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" @change="loadTaskList" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联任务">
            <ViewEntity v-if="isReadonly" :title="form.task?.name" :subtitle="form.task?.code" />
            <el-select v-else v-model="form.taskId" placeholder="请选择任务（可选）" style="width: 100%" clearable>
              <el-option v-for="task in taskList" :key="task.id" :label="task.name" :value="task.id" />
            </el-select>
            </el-form-item>
        </el-col>
      </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="提交人" prop="submitterId">
            <ViewUser v-if="isReadonly" :user="form.submitter" />
            <UserSelect v-else v-model="form.submitterId" placeholder="请选择提交人" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="处理人">
            <ViewUser v-if="isReadonly" :user="form.handler" />
            <UserSelect v-else v-model="form.handlerId" placeholder="请选择处理人（可选）" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="严重程度">
              <ViewField v-if="isReadonly" :value="severity[form.severity]" />
              <el-select v-else v-model="form.severity" placeholder="请选择严重程度" style="width: 100%">
               <el-option v-for="(value, key) in severity" :key="key" :label="value" :value="key" />
             </el-select>
           </el-form-item>
        </el-col>
      </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <ViewTagField v-if="isReadonly" :text="status[form.status]" :type="form.status === '3' ? 'success' : form.status === '2' ? 'warning' : form.status === '4' ? 'info' : 'danger'" />
              <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
               <el-option v-for="(value, key) in status" :key="key" :label="value" :value="key" />
             </el-select>
           </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <ViewTagField v-if="isReadonly" :text="priority[form.priority]" :type="form.priority === '3' ? 'danger' : form.priority === '2' ? 'warning' : 'info'" />
              <el-select v-else v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
               <el-option v-for="(value, key) in priority" :key="key" :label="value" :value="key" />
             </el-select>
           </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="审批状态" v-if="hasTicketId">
        <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[form.approvalStatus] || '无需审批'" :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'" />
      </el-form-item>

      <el-form-item label="当前审批节点" v-if="hasTicketId && form.currentNodeName">
        <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
      </el-form-item>

      <el-alert
        v-if="isEdit && form.approvalStatus === '2'"
        title="该工单审批已通过，当前业务状态应进入处理中。"
        type="success"
        :closable="false"
        show-icon
        class="mb-16"
      />
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发现版本">
            <ViewField v-if="isReadonly" :value="form.foundInVersion" />
            <el-input v-else v-model="form.foundInVersion" placeholder="请输入发现版本" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="修复版本">
            <ViewField v-if="isReadonly" :value="form.fixedInVersion" />
            <el-input v-else v-model="form.fixedInVersion" placeholder="请输入修复版本" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="环境信息">
        <ViewField v-if="isReadonly" :value="form.environment" />
        <el-input v-else v-model="form.environment" placeholder="如：Chrome 120.0 / Windows 11 / iOS 17.0" />
      </el-form-item>

      <el-form-item label="工单内容" prop="content">
        <ViewRichText v-if="isReadonly" :html="form.content" />
        <Editor v-else v-model="form.content" style="min-height: 200px" />
      </el-form-item>

      <!-- 缺陷相关字段 -->
      <template v-if="form.type === '1'">
        <el-divider content-position="left">缺陷详细信息</el-divider>

        <el-form-item label="重现步骤">
          <ViewRichText v-if="isReadonly" :html="form.stepsToReproduce" />
          <Editor v-else v-model="form.stepsToReproduce" style="min-height: 150px" placeholder="请描述复现步骤" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望结果">
              <ViewField v-if="isReadonly" :value="form.expectedResult" />
              <el-input v-else v-model="form.expectedResult" type="textarea" :rows="3" placeholder="请描述期望结果" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际结果">
              <ViewField v-if="isReadonly" :value="form.actualResult" />
              <el-input v-else v-model="form.actualResult" type="textarea" :rows="3" placeholder="请描述实际结果" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">根因分析（处理完成后填写）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="根因分类">
              <ViewField v-if="isReadonly" :value="rootCauseCategory[form.rootCauseCategory]" />
              <el-select v-else v-model="form.rootCauseCategory" placeholder="请选择根因分类" style="width: 100%" clearable>
                <el-option v-for="(value, key) in rootCauseCategory" :key="key" :label="value" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="根因分析">
          <ViewRichText v-if="isReadonly" :html="form.rootCause" />
          <Editor v-else v-model="form.rootCause" style="min-height: 150px" placeholder="请分析缺陷根因" />
        </el-form-item>

        <el-form-item label="解决方案">
          <ViewRichText v-if="isReadonly" :html="form.resolution" />
          <Editor v-else v-model="form.resolution" style="min-height: 150px" placeholder="请描述解决方案" />
        </el-form-item>
      </template>

      <el-form-item label="工单附件">
        <ViewFileList v-if="isReadonly" :files="normalizedAttachments" />
        <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canTicketUpdate : canTicketAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isReadonly && isEdit && canTicketUpdate && canSubmitCurrentApproval" type="warning" @click="handleSubmitApproval">提交审批</el-button>
      </el-form-item>
    </el-form>

    <div v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="workflow-panel-section">
      <div class="workflow-panel-section__header">审批操作区</div>
      <WorkflowApprovalPanel
        :task-id="workflowTaskId"
        :instance-id="workflowInstanceId"
        :node-name="form.currentNodeName"
        @approved="reloadCurrent"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}

.workflow-panel-section {
  margin-top: 20px;
  max-width: 900px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.workflow-panel-section__header {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.top-alert-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
