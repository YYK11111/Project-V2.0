<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getStatus, getPriority, getProjectType, getViewContext, submitApproval } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import { closeReturnedWorkflowInstance, getWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { phaseMap, qualityLevelMap, riskLevelMap } from './fieldMaps'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.query.id || ''))
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const approvalRetryFailed = computed(() => route.query.approvalFailed === '1')
const retryApprovalLoading = ref(false)

const memberRoleOptions = {
  '1': '项目经理',
  '2': '交付经理',
  '3': '技术负责人',
  '4': '实施负责人',
  '5': '测试负责人',
  '6': '客户联系人',
  '7': '商务接口人',
  '8': '开发工程师',
  '9': '实施顾问',
  A: '测试工程师',
  B: '运维工程师',
  C: '培训顾问',
  D: '数据迁移工程师',
  E: '驻场支持',
  F: '普通成员',
  G: '访客',
}

const project = ref({
  attachments: [],
  members: [],
  milestones: [],
})
const statusMap = ref({})
const priorityMap = ref({})
const projectTypeMap = ref({})
const customerList = ref([])
const deptMap = ref({})
const workflowPanelRef = ref()
const workflowInstance = ref(null)
const approvalContexts = ref([])
const currentApprovalContext = ref(null)
const selectedApprovalContextId = ref('')
const projectPermissionContext = ref({})

const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => project.value.customer || customerMap.value.get(String(project.value.customerId || '')) || null)
const workflowInstanceId = computed(() => String(route.query.instanceId || currentApprovalContext.value?.workflowInstanceId || project.value?.workflowInstanceId || ''))
const currentApprovalTitle = computed(() => getApprovalContextTitle(currentApprovalContext.value))
const canCloseReturnedInstance = computed(() => project.value?.workflowInstanceId && project.value?.approvalStatus === '3' && String(project.value?.currentNodeName || '').includes('退回发起人'))
const canEditProject = computed(() => projectPermissionContext.value?.canEdit === true && String(project.value?.status || '') !== '3')
const canSubmitApprovalCurrentProject = computed(() => projectPermissionContext.value?.canSubmitApproval === true)
const isApprovalRejected = computed(() => project.value?.approvalStatus === '3')
const isApprovalPassed = computed(() => project.value?.approvalStatus === '2')
const isApprovalRunning = computed(() => project.value?.approvalStatus === '1')
const showWorkflowPanel = computed(() => Boolean(workflowInstanceId.value))
const isWorkflowReadonly = computed(() => !(fromWorkflow.value && workflowTaskId.value))

function getProjectApprovalText(project) {
  if (project?.approvalStatus === '3' && String(project?.currentNodeName || '').includes('退回发起人')) return '已退回发起人'
  return ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[project?.approvalStatus] || '-')
}

function getApprovalType(status) {
  if (status === '2') return 'success'
  if (status === '1') return 'warning'
  if (status === '3') return 'danger'
  return 'info'
}

function getApprovalContextTitle(context) {
  return context?.sceneTitle || ({ initiation: '立项审批', closure: '结项审批', change: '变更审批' }[context?.businessScene] || '审批记录')
}

function getApprovalContextStatusText(context) {
  return ({ '1': '审批中', '2': '已通过', '3': '已结束', '4': '已挂起' }[String(context?.status || '')] || '-')
}

function getApprovalContextStatusType(context) {
  if (String(context?.status || '') === '2') return 'success'
  if (String(context?.status || '') === '1') return 'warning'
  if (String(context?.status || '') === '3') return 'danger'
  return 'info'
}

async function loadWorkflowInstance(instanceId) {
  const finalWorkflowInstanceId = String(instanceId || '')
  const workflowInstanceRes = finalWorkflowInstanceId ? await getWorkflowInstance(finalWorkflowInstanceId) : { data: null }
  workflowInstance.value = finalWorkflowInstanceId ? workflowInstanceRes.data || null : null
}

async function selectApprovalContext(context) {
  currentApprovalContext.value = context || null
  selectedApprovalContextId.value = String(context?.id || '')
  await loadWorkflowInstance(context?.workflowInstanceId)
}

function getRiskLevelType(level) {
  if (level === 'critical') return 'danger'
  if (level === 'high') return 'warning'
  return 'info'
}

function getQualityLevelType(level) {
  if (level === 'excellent') return 'success'
  if (level === 'high') return 'warning'
  return 'info'
}

function getDateRange(startDate, endDate) {
  if (!startDate && !endDate) return '-'
  return `${startDate || '-'} 至 ${endDate || '-'}`
}

async function reloadCurrent() {
  if (!projectId.value) return
  const [statusRes, priorityRes, projectTypeRes, customerRes, deptRes, projectRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getProjectType(),
    getCustomerList({ pageNum: 1, pageSize: 1000 }),
    getDeptTrees({}),
    getViewContext(projectId.value, { instanceId: route.query.instanceId }),
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  projectTypeMap.value = projectTypeRes.data || {}
  customerList.value = customerRes.list || []
  const map = {}
  const walk = (nodes = []) => {
    nodes.forEach((item) => {
      map[item.id] = item.name
      if (item.children?.length) walk(item.children)
    })
  }
  walk(deptRes.data || [])
  deptMap.value = map
  const viewContext = projectRes.data?.project ? projectRes.data : null
  const projectResData = viewContext?.project || projectRes.data || {}
  projectPermissionContext.value = viewContext?.permissionContext || {}
  approvalContexts.value = viewContext?.approvalContexts || []
  currentApprovalContext.value = viewContext?.currentApprovalContext || null
  selectedApprovalContextId.value = String(currentApprovalContext.value?.id || '')
  project.value = {
    attachments: [],
    members: [],
    milestones: [],
    ...projectResData,
    members: projectResData?.members || [],
    milestones: projectResData?.milestones || [],
  }

  const finalWorkflowInstanceId = String(route.query.instanceId || currentApprovalContext.value?.workflowInstanceId || projectResData?.workflowInstanceId || '')
  await loadWorkflowInstance(finalWorkflowInstanceId)
}

function goToEdit() {
  router.push({ path: '/projectManage/form', query: { id: projectId.value } })
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearApprovalFailedFlag() {
  if (!approvalRetryFailed.value) return
  const nextQuery = { ...route.query }
  delete nextQuery.approvalFailed
  router.replace({ path: route.path, query: nextQuery })
}

function handleRetryApproval() {
  if (!canSubmitApprovalCurrentProject.value) return $sdk.msgWarning('当前操作没有权限')
  retryApprovalLoading.value = true
  submitApproval(projectId.value).then(() => {
    $sdk.msgSuccess('立项审批提交成功')
    clearApprovalFailedFlag()
    reloadCurrent()
  }).catch((e) => {
    $sdk.msgError(e.message || '重新发起立项审批失败')
  }).finally(() => {
    retryApprovalLoading.value = false
  })
}

function handleSubmitApproval() {
  if (!canSubmitApprovalCurrentProject.value) return $sdk.msgWarning('当前操作没有权限')
  const request = canCloseReturnedInstance.value
    ? resubmitReturnedWorkflowInstance(project.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(projectId.value)
  request.then(() => {
    $sdk.msgSuccess('立项审批提交成功')
    clearApprovalFailedFlag()
    reloadCurrent()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }).catch((e) => {
    $sdk.msgError(e.message || '提交失败')
  })
}

async function handleCloseReturnedInstance() {
  const { value } = await ElMessageBox.prompt('结束后实例将进入已取消状态，业务对象将同步更新为最终驳回态。', '结束退回实例', {
    confirmButtonText: '确认结束',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入结束原因（选填）',
    inputType: 'textarea',
  })
  await closeReturnedWorkflowInstance(project.value.workflowInstanceId, { reason: value || '发起人确认结束退回实例' })
  $sdk.msgSuccess('退回实例已结束')
  await reloadCurrent()
}

reloadCurrent()

watch(
  () => [route.query.id, route.query.taskId, route.query.instanceId, route.query.fromWorkflow, route.query.approvalFailed],
  () => {
    reloadCurrent()
  },
)
</script>

<template>
  <div class="Gcard project-approval-page">
    <div class="mb20">
      <el-page-header @back="$router.back()" title="项目查看">
        <template #extra>
          <el-button v-if="isApprovalRejected && canEditProject" @click="goToEdit">去编辑项目</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
          <el-button v-if="fromWorkflow && workflowTaskId" type="primary" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        </template>
      </el-page-header>
    </div>

    <el-alert
      v-if="approvalRetryFailed"
      title="项目已保存，但立项审批发起失败，请确认流程配置后重试。"
      type="warning"
      :closable="false"
      show-icon
      class="mb20"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="canSubmitApprovalCurrentProject && project.status === '1'" type="warning" size="small" :loading="retryApprovalLoading" @click="handleRetryApproval">重试发起立项审批</el-button>
        </div>
      </template>
    </el-alert>

    <el-alert
      v-else-if="isApprovalRejected"
      :title="canCloseReturnedInstance ? '项目审批已退回发起人，可修改后重新提交，或直接结束退回实例。' : '项目审批已驳回，请根据意见调整后重新提交。'"
      type="warning"
      :closable="false"
      show-icon
      class="mb20"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="canEditProject" type="primary" size="small" @click="goToEdit">去编辑项目</el-button>
          <el-button v-if="canCloseReturnedInstance && canSubmitApprovalCurrentProject" type="warning" size="small" @click="handleSubmitApproval">重新提交立项审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-alert
      v-else-if="isApprovalPassed"
      title="项目审批已通过，请按当前项目状态继续推进执行或结项。"
      type="success"
      :closable="false"
      show-icon
      class="mb20"
    />

    <el-alert
      v-else-if="isApprovalRunning"
      :title="`${currentApprovalTitle}进行中，请在本页查看流程状态与审批处理进展。`"
      type="info"
      :closable="false"
      show-icon
      class="mb20"
    />

    <div class="approval-sections">
      <section v-if="approvalContexts.length" class="section-card section-card--approval-contexts">
        <div class="section-header">
          <div>
            <div class="section-title">审批记录</div>
            <div class="section-desc">按审批场景查看当前项目关联的流程记录。</div>
          </div>
        </div>

        <div class="approval-context-list">
          <button
            v-for="context in approvalContexts"
            :key="context.id || context.workflowInstanceId"
            type="button"
            class="approval-context-item"
            :class="{ 'is-active': selectedApprovalContextId === String(context.id || '') }"
            @click="selectApprovalContext(context)"
          >
            <span class="approval-context-item__main">
              <span class="approval-context-item__title">{{ getApprovalContextTitle(context) }}</span>
              <span class="approval-context-item__meta">{{ context.startedAt || context.createTime || '-' }}</span>
            </span>
            <el-tag :type="getApprovalContextStatusType(context)" size="small" effect="plain">
              {{ getApprovalContextStatusText(context) }}
            </el-tag>
          </button>
        </div>
      </section>

      <section class="section-card section-card--summary">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">审批摘要</div>
            <div class="section-desc">聚焦展示当前审批决策所需的核心信息与流程状态。</div>
          </div>
        </div>

        <el-row :gutter="20" class="summary-row">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="项目名称">
              <ViewField :value="project.name" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="项目编号">
              <ViewField :value="project.code" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="审批状态">
              <ViewTagField :text="getProjectApprovalText(project)" :type="getApprovalType(project.approvalStatus)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="summary-row summary-row--last">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="发起人">
              <ViewField :value="workflowInstance?.starterName || '-'
              " />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="发起时间">
              <ViewField :value="workflowInstance?.startTime || '-'
              " />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="流程实例号">
              <ViewField :value="workflowInstanceId || '-'
              " />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="summary-row summary-row--last">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="当前审批节点">
              <ViewField :value="project.currentNodeName || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="项目负责人">
              <ViewUser :user="project.leader" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="业务编号">
              <ViewField :value="workflowInstance?.businessCode || project.code || '-'" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="section-card section-card--basic">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">展示项目查看和审批判断所需的基础属性、基线计划和预算信息。</div>
          </div>
        </div>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="所属部门">
              <ViewField :value="deptMap[project.departmentId] || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目分类">
              <ViewField :value="project.category" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="客户">
              <ViewEntity :title="currentCustomer?.name" :subtitle="currentCustomer?.code" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目类型">
              <ViewField :value="projectTypeMap[project.projectType]" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="优先级">
              <ViewTagField :text="priorityMap[project.priority]" :type="project.priority === '3' ? 'danger' : project.priority === '2' ? 'warning' : 'info'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态">
              <ViewTagField :text="statusMap[project.status]" :type="project.status === '6' ? 'success' : project.status === '3' ? 'primary' : project.status === '4' ? 'warning' : project.status === '7' ? 'danger' : 'info'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目阶段">
              <ViewField :value="phaseMap[project.phase] || project.phase || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="阶段起止">
              <ViewField :value="getDateRange(project.phaseStartDate, project.phaseEndDate)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目发起人">
              <ViewUser :user="project.creator" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目标签">
              <ViewField :value="(project.tags || []).join('、')" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="业务线">
              <ViewField :value="project.businessLine || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="行业">
              <ViewField :value="project.industry || '-'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目来源">
              <ViewField :value="project.projectSource || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="实际成本">
              <ViewField :value="project.actualCost" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="风险等级">
              <ViewTagField :text="riskLevelMap[project.riskLevel] || project.riskLevel || '-'" :type="getRiskLevelType(project.riskLevel)" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="质量等级">
              <ViewTagField :text="qualityLevelMap[project.qualityLevel] || project.qualityLevel || '-'" :type="getQualityLevelType(project.qualityLevel)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="计划周期">
              <ViewField :value="getDateRange(project.planStartDate || project.startDate, project.planEndDate || project.endDate)" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="实际周期">
              <ViewField :value="getDateRange(project.actualStartDate, project.actualEndDate)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row basic-info-row--last">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目预算">
              <ViewField :value="project.budget" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="币种">
              <ViewField :value="project.currency" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row basic-info-row--last">
          <el-col :xs="24" :sm="12">
            <el-form-item label="主要交付物">
              <ViewField :value="project.baselineDeliverables || '-'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="范围边界">
              <ViewField :value="project.scopeBoundary || '-'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="basic-info-row basic-info-row--last">
          <el-col :xs="24" :sm="12">
            <el-form-item label="计划说明">
              <ViewField :value="project.baselinePlanNote || '-'" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="section-card section-card--table">
        <div class="section-header">
          <div>
            <div class="section-title">项目成员</div>
            <div class="section-desc">查看项目角色配置和核心成员是否齐备。</div>
          </div>
        </div>

        <div class="table-wrapper">
          <el-table :data="project.members" border class="preview-table members-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column label="成员" width="260">
              <template #default="{ row }">
                <ViewUser :user="row.user" />
              </template>
            </el-table-column>
            <el-table-column label="角色" width="180">
              <template #default="{ row }">
                <ViewField :value="memberRoleOptions[row.role]" />
              </template>
            </el-table-column>
            <el-table-column label="核心成员" width="110">
              <template #default="{ row }">
                <ViewField :value="row.isCore === '1' ? '是' : '否'" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="220">
              <template #default="{ row }">
                <ViewField :value="row.remark" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="section-card section-card--table">
        <div class="section-header">
          <div>
            <div class="section-title">里程碑计划</div>
            <div class="section-desc">查看里程碑、计划日期和关键交付物是否完整。</div>
          </div>
        </div>

        <div class="table-wrapper">
          <el-table :data="project.milestones" border class="preview-table milestones-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column label="里程碑名称" width="220">
              <template #default="{ row }"><ViewField :value="row.name" /></template>
            </el-table-column>
            <el-table-column label="计划完成日期" width="160">
              <template #default="{ row }"><ViewField :value="row.dueDate" /></template>
            </el-table-column>
            <el-table-column label="状态" width="130">
              <template #default="{ row }"><ViewField :value="{ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[row.status]" /></template>
            </el-table-column>
            <el-table-column label="责任人" width="140">
              <template #default="{ row }"><ViewUser :user="row.owner" /></template>
            </el-table-column>
            <el-table-column label="交付物" min-width="260">
              <template #default="{ row }"><ViewField :value="(row.deliverables || []).join('、')" /></template>
            </el-table-column>
            <el-table-column label="描述" min-width="220">
              <template #default="{ row }"><ViewField :value="row.description" /></template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="section-card section-card--content">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">项目附件</div>
            <div class="section-desc">查看项目附件和支撑材料是否齐全。</div>
          </div>
        </div>

        <el-form-item label="项目描述">
          <ViewRichText :html="project.description || '-'" />
        </el-form-item>

        <el-form-item label="项目附件">
          <ViewFileList :files="project.attachments || []" />
        </el-form-item>
      </section>

      <section v-if="showWorkflowPanel" ref="workflowPanelRef" class="section-card section-card--approval">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">{{ isWorkflowReadonly ? '流程图与审批历史' : '审批处理' }}</div>
            <div class="section-desc">{{ isWorkflowReadonly ? '展示当前流程的流转图和审批历史记录。' : '请在核对项目材料后完成审批、驳回、转交或加签操作。' }}</div>
          </div>
        </div>
        <WorkflowApprovalPanel
          :task-id="workflowTaskId"
          :instance-id="workflowInstanceId"
          :node-name="project.currentNodeName"
          :readonly="isWorkflowReadonly"
          @approved="reloadCurrent" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.project-approval-page {
  min-height: 100%;
}

.mb20 {
  margin-bottom: 20px;
}

.approval-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-header--stack {
  justify-content: flex-start;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.summary-row,
.basic-info-row {
  margin-bottom: 8px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.summary-row--last,
.basic-info-row--last {
  margin-bottom: 4px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.approval-context-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.approval-context-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  min-height: 64px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
}

.approval-context-item:hover,
.approval-context-item.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.approval-context-item__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.approval-context-item__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.approval-context-item__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.preview-table {
  width: auto;
}

.preview-table :deep(.cell) {
  overflow: hidden;
  word-break: break-word;
}

.section-card--content :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.top-alert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .approval-context-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .approval-context-list {
    grid-template-columns: 1fr;
  }
}
</style>
