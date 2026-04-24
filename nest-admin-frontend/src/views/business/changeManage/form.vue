<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { getOne, save, update, getStatus, getType, getImpact, approve, reject, publishKnowledge, submitApproval, confirmPlanImpact, confirmPlanImpactScope, applyPlanImpactTarget } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'
import { getList as getTaskList } from '@/views/business/taskManage/api'
import { getList as getMilestoneList } from '@/views/business/milestoneManage/api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'

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
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))
const canEditCurrentChange = computed(() => !hasChangeId.value || form.value?.canEdit !== false)
const canSubmitCurrentApproval = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))
const canCloseReturnedInstance = computed(() => form.value.workflowInstanceId && form.value.approvalStatus === '3' && String(form.value.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()
const hasChangeId = computed(() => !!route.query.id)
const confirmImpactLoading = ref(false)
const confirmScopeLoading = ref(false)
const taskOptions = ref([])
const milestoneOptions = ref([])
const sprintOptions = ref([])

const isChangeFormRoute = useCurrentRouteGuard(route, '/changeManage/form')

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
  impactedTaskId: '',
  impactedMilestoneId: '',
  impactedSprintId: '',
})

async function loadChange() {
  if (!isChangeFormRoute()) return
  if (!hasChangeId.value) {
    form.value = {
      ...defaultForm(),
      projectId: String(route.query.projectId || ''),
    }
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
  await loadImpactOptions(String(form.value.projectId || ''))
}

async function loadImpactOptions(projectId) {
  if (!projectId) {
    taskOptions.value = []
    milestoneOptions.value = []
    sprintOptions.value = []
    return
  }
  const [taskRes, milestoneRes, sprintRes] = await Promise.all([
    getTaskList({ pageNum: 1, pageSize: 1000, projectId }),
    getMilestoneList({ pageNum: 1, pageSize: 1000, projectId }),
    getSprintList({ pageNum: 1, pageSize: 1000, projectId }),
  ])
  taskOptions.value = taskRes.list || []
  milestoneOptions.value = milestoneRes.list || []
  sprintOptions.value = sprintRes.list || []
}

watch(
  () => [route.query.id, route.query.action, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    if (!isChangeFormRoute()) return
    loadChange()
  },
  { immediate: true },
)

watch(() => form.value.projectId, (value) => {
  loadImpactOptions(String(value || ''))
})

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

async function handlePublishKnowledge() {
  if (!route.query.id) return
  if (!canArticleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  await confirmRepublishIfNeeded({ articleId: form.value?.knowledgeArticleId, entityLabel: '变更' })
  await publishKnowledge(route.query.id)
  $sdk.msgSuccess('变更结论已沉淀到知识中心')
  reloadCurrent()
}

async function handleConfirmPlanImpact() {
  if (!route.query.id) return
  ElMessageBox.prompt('请输入本次计划影响处理说明（选填）', '确认计划影响已处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '例如：已调整项目计划并同步任务负责人',
  }).then(async ({ value }) => {
    confirmImpactLoading.value = true
    try {
      await confirmPlanImpact(route.query.id, { remark: value || '' })
      $sdk.msgSuccess('已确认计划影响处理')
      reloadCurrent()
    } finally {
      confirmImpactLoading.value = false
    }
  }).catch(() => {})
}

async function handleConfirmPlanImpactScope(scope) {
  if (!route.query.id || !scope) return
  ElMessageBox.prompt('请输入本次分项处理说明（选填）', '确认分项已处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '例如：已调整相关计划并同步责任人',
  }).then(async ({ value }) => {
    confirmScopeLoading.value = true
    try {
      await confirmPlanImpactScope(route.query.id, { scope, remark: value || '' })
      $sdk.msgSuccess('已确认分项处理')
      reloadCurrent()
    } finally {
      confirmScopeLoading.value = false
    }
  }).catch(() => {})
}

async function handleApplyPlanImpact(scope) {
  if (!route.query.id || !scope) return
  const targetId = scope === 'task' ? form.value.impactedTaskId : scope === 'milestone' ? form.value.impactedMilestoneId : form.value.impactedSprintId
  if (!targetId) {
    return $sdk.msgWarning(`请先填写要应用的${scope === 'task' ? '任务' : scope === 'milestone' ? '里程碑' : 'Sprint'} ID`)
  }
  const { value } = await ElMessageBox.prompt('请输入新的计划日期', '应用计划调整', {
    confirmButtonText: '确认应用',
    cancelButtonText: '取消',
    inputPlaceholder: 'YYYY-MM-DD',
  })
  const payload = {
    scope,
    targetId,
    targetName: targetId,
    remark: '已应用计划调整',
  }
  if (scope === 'task') payload.plannedEndDate = value
  if (scope === 'milestone') payload.dueDate = value
  if (scope === 'sprint') payload.endDate = value
  await applyPlanImpactTarget(route.query.id, payload)
  $sdk.msgSuccess('已应用计划调整')
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
  if (hasChangeId.value && !canEditCurrentChange.value) {
    return $sdk.msgWarning('当前无编辑该变更的权限')
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
  <div class="change-form-page">
    <div class="Gcard change-form-shell">
    <div class="change-form-shell__top">
      <el-page-header @back="$router.back()" :title="isReadonly ? '变更详情' : isEdit ? '编辑变更' : '新增变更'">
        <template #extra>
          <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
          <el-button v-if="form.value?.knowledgeArticleId" type="primary" plain @click="router.push({ path: '/content/articleManage/view', query: { id: form.value.knowledgeArticleId } })">查看知识</el-button>
          <el-button v-if="route.query.id && canArticleAdd" type="primary" plain @click="handlePublishKnowledge">{{ form.value?.knowledgeArticleId ? '重新沉淀' : '转知识' }}</el-button>
          <el-button v-if="route.query.id && !form.planImpactScopes?.milestone?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope('milestone')">确认里程碑已处理</el-button>
          <el-button v-if="route.query.id" type="primary" plain @click="handleApplyPlanImpact('milestone')">应用到里程碑</el-button>
          <el-button v-if="route.query.id && !form.planImpactScopes?.sprint?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope('sprint')">确认 Sprint 已处理</el-button>
          <el-button v-if="route.query.id" type="primary" plain @click="handleApplyPlanImpact('sprint')">应用到 Sprint</el-button>
          <el-button v-if="route.query.id && !form.planImpactScopes?.task?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope('task')">确认任务已处理</el-button>
          <el-button v-if="route.query.id" type="primary" plain @click="handleApplyPlanImpact('task')">应用到任务</el-button>
          <el-button v-if="route.query.id && String(form.planImpactConfirmed || '0') !== '1'" :loading="confirmImpactLoading" type="warning" plain @click="handleConfirmPlanImpact">确认计划影响已处理</el-button>
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

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px; --FormItemContentMaxWidth: 100%;">
      <div class="change-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护变更标题、归属项目、类型、影响程度和状态，先把变更基本上下文建立清楚。</div>
          </div>
        </div>
        <div class="change-section-fields">
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
        </div>
      </section>

      <section v-if="hasChangeId" class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">计划影响与处理</div>
            <div class="section-desc">查看整体处理状态、分项处理记录和确认历史，确保计划影响闭环可追踪。</div>
          </div>
        </div>
        <div class="change-section-fields">

      <el-form-item label="计划影响处理" v-if="hasChangeId">
        <ViewTagField :text="String(form.planImpactConfirmed || '0') === '1' ? '已确认处理' : '待确认处理'" :type="String(form.planImpactConfirmed || '0') === '1' ? 'success' : 'warning'" />
      </el-form-item>

      <el-form-item label="分项处理状态" v-if="hasChangeId">
        <div class="change-impact-scope-list">
          <ViewTagField :text="form.planImpactScopes?.milestone?.confirmed ? '里程碑已处理' : '里程碑待处理'" :type="form.planImpactScopes?.milestone?.confirmed ? 'success' : 'warning'" />
          <ViewTagField :text="form.planImpactScopes?.sprint?.confirmed ? 'Sprint已处理' : 'Sprint待处理'" :type="form.planImpactScopes?.sprint?.confirmed ? 'success' : 'warning'" />
          <ViewTagField :text="form.planImpactScopes?.task?.confirmed ? '任务已处理' : '任务待处理'" :type="form.planImpactScopes?.task?.confirmed ? 'success' : 'warning'" />
        </div>
      </el-form-item>

      <el-form-item label="分项处理记录" v-if="hasChangeId">
        <div class="change-impact-record">
          <div v-if="form.planImpactScopes?.milestone?.remark">里程碑处理：{{ form.planImpactScopes.milestone.remark }}</div>
          <div v-if="form.planImpactScopes?.sprint?.remark">Sprint 处理：{{ form.planImpactScopes.sprint.remark }}</div>
          <div v-if="form.planImpactScopes?.task?.remark">任务处理：{{ form.planImpactScopes.task.remark }}</div>
          <div v-if="!form.planImpactScopes?.milestone?.remark && !form.planImpactScopes?.sprint?.remark && !form.planImpactScopes?.task?.remark">暂无分项处理记录</div>
        </div>
      </el-form-item>

      <el-form-item label="处理记录" v-if="hasChangeId && form.planImpactConfirmInfo">
        <div class="change-impact-record">
          <div>确认时间：{{ form.planImpactConfirmInfo.confirmedAt || '-' }}</div>
          <div>确认人：{{ form.planImpactConfirmInfo.confirmedBy || '-' }}</div>
          <div v-if="form.planImpactConfirmInfo.remark">处理说明：{{ form.planImpactConfirmInfo.remark }}</div>
        </div>
      </el-form-item>

      <el-form-item label="确认历史" v-if="hasChangeId && form.confirmHistory?.length">
        <div class="change-impact-history">
          <div v-for="item in form.confirmHistory" :key="item.id" class="change-impact-history__item">
            <div class="change-impact-history__title">{{ { overall: '整体确认', milestone: '里程碑处理', sprint: 'Sprint 处理', task: '任务处理' }[item.scope] || item.scope }}</div>
            <div class="change-impact-history__meta">{{ item.confirmedAt || item.createTime || '-' }} / {{ item.operatorName || item.operatorId || '-' }}</div>
            <div v-if="item.remark" class="change-impact-history__remark">{{ item.remark }}</div>
          </div>
        </div>
      </el-form-item>

      <el-alert
        v-if="hasChangeId && form.approvalStatus === '2'"
        title="该变更已审批通过，可继续推进实施。"
        type="success"
        :closable="false"
        show-icon
        class="mb-16"
      />
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">变更分析</div>
            <div class="section-desc">补充变更原因、影响分析和成本进度影响，便于评估实施范围与风险。</div>
          </div>
        </div>
        <div class="change-section-fields">
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

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="影响任务">
            <ViewField v-if="isReadonly" :value="form.impactedTaskId" />
            <el-select v-else v-model="form.impactedTaskId" placeholder="请选择任务" style="width: 100%" clearable>
              <el-option v-for="item in taskOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="影响里程碑">
            <ViewField v-if="isReadonly" :value="form.impactedMilestoneId" />
            <el-select v-else v-model="form.impactedMilestoneId" placeholder="请选择里程碑" style="width: 100%" clearable>
              <el-option v-for="item in milestoneOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="影响Sprint">
            <ViewField v-if="isReadonly" :value="form.impactedSprintId" />
            <el-select v-else v-model="form.impactedSprintId" placeholder="请选择Sprint" style="width: 100%" clearable>
              <el-option v-for="item in sprintOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-alert
        v-if="Number(form.scheduleImpact || 0) > 0 || Number(form.costImpact || 0) > 0"
        type="warning"
        :closable="false"
        show-icon
        class="mb-16"
      >
        <template #title>
          <div class="change-impact-alert__title">计划影响提示</div>
        </template>
        <div class="change-impact-alert__list">
          <div v-if="Number(form.scheduleImpact || 0) > 0">当前变更会带来 {{ Number(form.scheduleImpact || 0) }} 天的进度影响，建议同步核对项目计划视图中的里程碑、Sprint 与任务安排。</div>
          <div v-if="Number(form.costImpact || 0) > 0">当前变更会带来 {{ Number(form.costImpact || 0) }} 的成本影响，建议同步关注预算偏差和相关交付范围。</div>
        </div>
      </el-alert>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">审批与附件</div>
            <div class="section-desc">维护申请人、审批人、审批意见和变更附件，统一沉淀支撑材料。</div>
          </div>
        </div>
        <div class="change-section-fields">

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

      <el-form-item label="变更附件">
        <ViewFileList v-if="isReadonly" :files="form.attachments || []" />
        <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isReadonly" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>
        </div>
      </section>

      <el-form-item class="footer-actions">
        <el-button v-if="!isReadonly && (isEdit ? canChangeUpdate : canChangeAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isReadonly && isEdit.value && canChangeUpdate && canSubmitCurrentApproval" type="warning" @click="handleSubmitApproval">提交审批</el-button>
        <el-button v-if="!isWorkflowReadonly && isEdit.value && canChangeUpdate && form.status === '2'" type="success" @click="handleApprove">批准</el-button>
        <el-button v-if="!isWorkflowReadonly && isEdit.value && canChangeUpdate && form.status === '2'" type="danger" @click="handleReject">驳回</el-button>
      </el-form-item>
      </div>
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
  </div>
</template>

<style lang="scss" scoped>
.change-form-page {
  min-height: 100%;
}

.change-form-shell__top {
  margin-bottom: 20px;
}

.change-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 22px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.section-header {
  margin-bottom: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.change-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.change-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.change-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

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

.footer-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button) {
  min-width: 112px;
}

.footer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.change-impact-alert__title {
  font-size: 14px;
  font-weight: 600;
}

.change-impact-alert__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.7;
}

.change-impact-record {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.change-impact-scope-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.change-impact-history {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-impact-history__item {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.change-impact-history__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.change-impact-history__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.change-impact-history__remark {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

@media (max-width: 768px) {
  .section-card {
    padding: 18px;
  }
}
</style>
