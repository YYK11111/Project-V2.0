<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { getOne, save, update, getStatus, getType, getImpact, approve, reject, submitApproval } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  projectId: '',
  type: '6',
  impact: '2',
  status: '1',
  description: '',
  reason: '',
  impactAnalysis: '',
  attachments: [],
  costImpact: 0,
  scheduleImpact: 0,
  requesterId: '',
  approverId: '',
  approvalComment: '',
  sort: 0,
})

const rules = {
  title: [{ required: true, message: '请输入变更标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

const statusMap = ref({})
const typeMap = ref({})
const impactMap = ref({})

getStatus().then(({ data }) => (statusMap.value = data || {}))
getType().then(({ data }) => (typeMap.value = data || {}))
getImpact().then(({ data }) => (impactMap.value = data || {}))

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const isWorkflowReadonly = computed(() => fromWorkflow.value && !!workflowTaskId.value)
const isReadonly = computed(() => isView.value || isWorkflowReadonly.value)
const canChangeAdd = computed(() => checkPermi(['business/changes/add']))
const canChangeUpdate = computed(() => checkPermi(['business/changes/update']))
const canSubmitCurrentApproval = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))
const canCloseReturnedInstance = computed(() => form.value.workflowInstanceId && form.value.approvalStatus === '3' && String(form.value.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()
const hasChangeId = computed(() => !!route.query.id)

const defaultForm = () => ({
  title: '',
  projectId: '',
  type: '6',
  impact: '2',
  status: '1',
  description: '',
  reason: '',
  impactAnalysis: '',
  attachments: [],
  costImpact: 0,
  scheduleImpact: 0,
  requesterId: '',
  approverId: '',
  approvalComment: '',
  sort: 0,
})

async function loadChange() {
  if (!hasChangeId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
}

watch(
  () => [route.query.id, route.query.action, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    loadChange()
  },
  { immediate: true },
)

function reloadCurrent() {
  loadChange()
}

async function handleApprove() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  const approverId = $store.user?.id || ''
  await approve(route.query.id, { approverId, comment: form.value.approvalComment || '同意' })
  $sdk.msgSuccess('审批通过')
  router.back()
}

async function handleReject() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  const approverId = $store.user?.id || ''
  await reject(route.query.id, { approverId, comment: form.value.approvalComment || '不同意' })
  $sdk.msgSuccess('已驳回')
  router.back()
}

async function handleSubmitApproval() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
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
  router.push({ path: '/changeManage/form', query: { id: route.query.id } })
}

function submit() {
  if (isReadonly.value || (isEdit.value && !canChangeUpdate.value) || (!isEdit.value && !canChangeAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  formRef.value.validate((valid) => {
    if (valid) {
      const api = isEdit.value ? update : save
      api(form.value).then(() => {
        $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
        router.back()
      })
    }
  })
}

function cancel() {
  router.back()
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '变更详情' : isEdit ? '编辑变更' : '新增变更'">
        <template #extra>
          <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </template>
      </el-page-header>
    </div>

    <el-alert
      v-if="(isEdit.value || isView.value) && form.approvalStatus === '3'"
      :title="String(form.currentNodeName || '').includes('退回发起人') ? '该变更已退回发起人，可修改后重新提交，或直接结束退回实例。' : '该变更已驳回，可调整内容后重新提交审批。'"
      type="warning"
      :closable="false"
      show-icon
      class="mb-16"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="isView" type="primary" size="small" @click="goToEdit">去编辑</el-button>
          <el-button v-if="isEdit && canChangeUpdate && canSubmitCurrentApproval" type="warning" size="small" @click="handleSubmitApproval">重新提交审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="变更标题" prop="title">
        <ViewField v-if="isReadonly" :value="form.title" />
        <el-input v-else v-model="form.title" placeholder="请输入变更标题" maxlength="200" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="变更类型">
              <ViewField v-if="isReadonly" :value="typeMap[form.type]" />
              <el-select v-else v-model="form.type" placeholder="类型" style="width: 100%">
               <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
             </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="影响程度">
              <ViewField v-if="isReadonly" :value="impactMap[form.impact]" />
              <el-select v-else v-model="form.impact" placeholder="影响" style="width: 100%">
               <el-option v-for="(v, k) in impactMap" :key="k" :label="v" :value="k" />
             </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="变更状态" v-if="hasChangeId">
              <ViewTagField v-if="isReadonly" :text="statusMap[form.status]" :type="form.status === '3' ? 'success' : form.status === '2' ? 'warning' : form.status === '4' ? 'danger' : 'info'" />
              <el-select v-else v-model="form.status" placeholder="状态" style="width: 100%">
               <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
             </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="8" v-if="hasChangeId">
          <el-form-item label="审批状态">
            <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[form.approvalStatus] || '无需审批'" :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="当前审批节点" v-if="hasChangeId && form.currentNodeName">
        <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
      </el-form-item>

      <el-alert
        v-if="hasChangeId && form.approvalStatus === '2'"
        title="该变更已审批通过，可继续推进实施。"
        type="success"
        :closable="false"
        show-icon
        class="mb-16"
      />
      <el-form-item label="变更原因">
        <ViewField v-if="isReadonly" :value="form.reason" />
        <el-input v-else v-model="form.reason" type="textarea" :rows="2" placeholder="请输入变更原因" />
      </el-form-item>

      <el-form-item label="变更描述">
        <ViewField v-if="isReadonly" :value="form.description" />
        <el-input v-else v-model="form.description" type="textarea" :rows="3" placeholder="请输入变更描述" />
      </el-form-item>

      <el-form-item label="影响分析">
        <ViewField v-if="isReadonly" :value="form.impactAnalysis" />
        <el-input v-else v-model="form.impactAnalysis" type="textarea" :rows="3" placeholder="请输入影响分析" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="成本影响">
            <ViewField v-if="isReadonly" :value="form.costImpact" />
            <el-input-number v-else v-model="form.costImpact" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="进度影响(天)">
            <ViewField v-if="isReadonly" :value="form.scheduleImpact" />
            <el-input-number v-else v-model="form.scheduleImpact" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="申请人">
        <ViewUser v-if="isReadonly" :user="form.requester" />
        <UserSelect v-else v-model="form.requesterId" placeholder="请选择申请人" clearable />
      </el-form-item>

      <el-form-item label="审批人">
        <ViewUser v-if="isReadonly" :user="form.approver" />
        <UserSelect v-else v-model="form.approverId" placeholder="请选择审批人" clearable />
      </el-form-item>

      <el-form-item label="审批意见" v-if="hasChangeId">
        <ViewField v-if="isReadonly" :value="form.approvalComment" />
        <el-input v-else v-model="form.approvalComment" type="textarea" :rows="2" />
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isReadonly" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canChangeUpdate : canChangeAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isReadonly && isEdit.value && canChangeUpdate && canSubmitCurrentApproval" type="warning" @click="handleSubmitApproval">提交审批</el-button>
        <el-button v-if="!isWorkflowReadonly && isEdit.value && canChangeUpdate && form.status === '2'" type="success" @click="handleApprove">批准</el-button>
        <el-button v-if="!isWorkflowReadonly && isEdit.value && canChangeUpdate && form.status === '2'" type="danger" @click="handleReject">驳回</el-button>
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
.workflow-panel-section {
  margin-top: 20px;
  max-width: 800px;
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
