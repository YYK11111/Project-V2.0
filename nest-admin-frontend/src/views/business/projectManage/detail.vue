<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { getDashboard, getStatus, getPriority, getProjectType, submitApproval, submitClose } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import { checkPermi } from '@/utils/permission'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ChartPie from '@/components/ChartPie.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

const route = useRoute()
const router = useRouter()
const projectId = String(route.query.id || '')
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')

const project = ref({})
const statusMap = ref({})
const priorityMap = ref({})
const projectTypeMap = ref({})
const customerList = ref([])
const dashboard = ref({})
const tasks = ref([])
const tickets = ref([])
const milestones = ref([])
const risks = ref([])
const changes = ref([])
const sprints = ref([])
const activeTab = ref('overview')
const taskFilter = ref('all')
const ticketFilter = ref('all')
const milestoneFilter = ref('all')
const riskFilter = ref('all')
const changeFilter = ref('all')
const sprintFilter = ref('all')
const canProjectSubmitApproval = computed(() => checkPermi(['business/projects/submitApproval']))
const canProjectSubmitClose = computed(() => checkPermi(['business/projects/submitClose']))
const canCloseReturnedInstance = computed(() => project.value?.workflowInstanceId && project.value?.approvalStatus === '3' && String(project.value?.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()

const today = computed(() => new Date())
const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => project.value.customer || customerMap.value.get(String(project.value.customerId || '')) || null)
const completedTaskStatuses = ['3', '4']
const resolvedTicketStatuses = ['3', '4']
const closedRiskStatuses = ['4', '5']
const dueSoonDays = 7
const validTabs = new Set(['overview', 'focus', 'tasks', 'tickets', 'milestones', 'risks', 'changes', 'sprints'])
const validFilters = {
  taskFilter: new Set(['all', 'overdue', 'dueSoon', 'inProgress']),
  ticketFilter: new Set(['all', 'open', 'critical', 'unassigned']),
  milestoneFilter: new Set(['all', 'dueSoon', 'overdue', 'delayed']),
  riskFilter: new Set(['all', 'active', 'high', 'overdue', 'unassigned']),
  changeFilter: new Set(['all', 'pending', 'highImpact', 'implemented']),
  sprintFilter: new Set(['all', 'active', 'planning', 'dueSoon']),
}

function getDateValue(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function getDaysDiff(targetDate) {
  const date = getDateValue(targetDate)
  if (!date) return null
  const diff = date.getTime() - today.value.getTime()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

function formatDiffLabel(targetDate, overdueLabel = '已逾期', dueSoonLabel = '临近截止') {
  const diff = getDaysDiff(targetDate)
  if (diff === null) return '-'
  if (diff < 0) return `${overdueLabel} ${Math.abs(diff)} 天`
  if (diff <= dueSoonDays) return `${dueSoonLabel} ${diff} 天`
  return `${diff} 天后`
}

function isTaskCompleted(task) {
  return completedTaskStatuses.includes(String(task?.status || ''))
}

function isTicketResolved(ticket) {
  return resolvedTicketStatuses.includes(String(ticket?.status || ''))
}

function isRiskClosed(risk) {
  return closedRiskStatuses.includes(String(risk?.status || ''))
}

function getProjectStatusType(status) {
  if (status === '6') return 'success'
  if (status === '3') return 'primary'
  if (status === '4' || status === '5') return 'warning'
  if (status === '7') return 'danger'
  return 'info'
}

function getPriorityType(priority) {
  if (priority === '3') return 'danger'
  if (priority === '2') return 'warning'
  return 'info'
}

function getApprovalType(status) {
  if (status === '2') return 'success'
  if (status === '1') return 'warning'
  if (status === '3') return 'danger'
  return 'info'
}

function getTicketSeverityType(severity) {
  if (severity === '1') return 'danger'
  if (severity === '2') return 'warning'
  if (severity === '3') return 'info'
  return 'success'
}

function getRiskLevelType(level) {
  if (level === '4') return 'danger'
  if (level === '3') return 'warning'
  if (level === '2') return 'primary'
  return 'info'
}

function getChangeImpactType(impact) {
  if (impact === '3') return 'danger'
  if (impact === '2') return 'warning'
  return 'info'
}

const taskSummary = computed(() => dashboard.value.summary?.taskSummary || { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, dueSoon: 0, completionRate: 0 })
const ticketSummary = computed(() => dashboard.value.summary?.ticketSummary || { total: 0, open: 0, critical: 0 })
const riskSummary = computed(() => dashboard.value.summary?.riskSummary || { total: 0, active: 0, high: 0, overdue: 0 })
const changeSummary = computed(() => dashboard.value.summary?.changeSummary || { total: 0, pendingApproval: 0, highImpact: 0, implemented: 0 })
const milestoneSummary = computed(() => dashboard.value.summary?.milestoneSummary || { total: 0, completed: 0, delayed: 0, dueSoon: 0, overdue: 0, completionRate: 0 })
const sprintSummary = computed(() => dashboard.value.summary?.sprintSummary || { total: 0, active: 0, planning: 0, current: null })
const costVariance = computed(() => Number(dashboard.value.summary?.costVariance || 0))

const dueSoonTasks = computed(() => dashboard.value.focus?.dueSoonTasks || [])
const overdueTasks = computed(() => dashboard.value.focus?.overdueTasks || [])
const criticalTickets = computed(() => dashboard.value.focus?.criticalTickets || [])
const highRisks = computed(() => dashboard.value.focus?.highRisks || [])
const pendingChanges = computed(() => dashboard.value.focus?.pendingChanges || [])
const dueSoonMilestones = computed(() => dashboard.value.focus?.dueSoonMilestones || [])
const delayedMilestones = computed(() => milestones.value.filter(item => String(item.status || '') === '3').slice(0, 5))
const coreMembers = computed(() => (project.value.members || []).filter(item => String(item.isCore || '0') === '1'))
const overdueMilestoneCount = computed(() => milestoneSummary.value.overdue || 0)
const overdueRiskCount = computed(() => riskSummary.value.overdue || 0)
const implementedChangeCount = computed(() => changeSummary.value.implemented || 0)
const activeSprintCount = computed(() => sprintSummary.value.active || 0)
const milestoneTimelineData = computed(() => {
  return [...milestones.value]
    .sort((a, b) => {
      const aDate = getDateValue(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
      const bDate = getDateValue(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
      return aDate - bDate
    })
    .slice(0, 8)
})

const taskStatusChartData = computed(() => {
  return [
    { value: taskSummary.value.pending || 0, name: '待处理' },
    { value: taskSummary.value.inProgress || 0, name: '处理中' },
    { value: taskSummary.value.completed || 0, name: '已完成' },
    { value: taskSummary.value.overdue || 0, name: '已逾期' },
  ].filter(item => item.value > 0)
})

const ticketSeverityChartData = computed(() => {
  const severityMap = { '1': '严重', '2': '高', '3': '中', '4': '低' }
  return Object.entries(severityMap).map(([key, label]) => ({
    name: label,
    value: tickets.value.filter(item => String(item.severity || '') === key).length,
  })).filter(item => item.value > 0)
})

const riskLevelChartData = computed(() => {
  const levelMap = { '1': '低', '2': '中', '3': '高', '4': '严重' }
  return Object.entries(levelMap).map(([key, label]) => ({
    name: label,
    value: risks.value.filter(item => String(item.level || '') === key).length,
  })).filter(item => item.value > 0)
})

const hasOverviewCharts = computed(() => {
  return taskStatusChartData.value.length > 0 || ticketSeverityChartData.value.length > 0 || riskLevelChartData.value.length > 0
})

const taskTableData = computed(() => {
  const filteredTasks = [...tasks.value].filter((task) => {
    if (taskFilter.value === 'all') return true
    if (taskFilter.value === 'overdue') return !isTaskCompleted(task) && (getDaysDiff(task.endDate) ?? 1) < 0
    if (taskFilter.value === 'dueSoon') {
      const diff = getDaysDiff(task.endDate)
      return !isTaskCompleted(task) && diff !== null && diff >= 0 && diff <= dueSoonDays
    }
    if (taskFilter.value === 'inProgress') return String(task.status || '') === '2'
    return true
  })

  return filteredTasks.sort((a, b) => {
    const overdueA = !isTaskCompleted(a) && (getDaysDiff(a.endDate) ?? 1) < 0 ? 1 : 0
    const overdueB = !isTaskCompleted(b) && (getDaysDiff(b.endDate) ?? 1) < 0 ? 1 : 0
    if (overdueA !== overdueB) return overdueB - overdueA
    const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0)
    if (priorityDiff !== 0) return priorityDiff
    return (getDaysDiff(a.endDate) ?? 999) - (getDaysDiff(b.endDate) ?? 999)
  })
})

const ticketTableData = computed(() => {
  const filteredTickets = [...tickets.value].filter((ticket) => {
    if (ticketFilter.value === 'all') return true
    if (ticketFilter.value === 'open') return !isTicketResolved(ticket)
    if (ticketFilter.value === 'critical') return String(ticket.severity || '') === '1' && !isTicketResolved(ticket)
    if (ticketFilter.value === 'unassigned') return !ticket.handlerId
    return true
  })
  return filteredTickets.sort((a, b) => Number(a.severity || 0) - Number(b.severity || 0))
})

const riskTableData = computed(() => {
  const filteredRisks = [...risks.value].filter((risk) => {
    if (riskFilter.value === 'all') return true
    if (riskFilter.value === 'active') return !isRiskClosed(risk)
    if (riskFilter.value === 'high') return ['3', '4'].includes(String(risk.level || '')) && !isRiskClosed(risk)
    if (riskFilter.value === 'overdue') return !isRiskClosed(risk) && (getDaysDiff(risk.dueDate) ?? 1) < 0
    if (riskFilter.value === 'unassigned') return !risk.riskOwnerId
    return true
  })
  return filteredRisks.sort((a, b) => Number(b.level || 0) - Number(a.level || 0))
})

const changeTableData = computed(() => {
  const filteredChanges = [...changes.value].filter((change) => {
    if (changeFilter.value === 'all') return true
    if (changeFilter.value === 'pending') return String(change.status || '') === '2'
    if (changeFilter.value === 'highImpact') return String(change.impact || '') === '3' && String(change.status || '') !== '5'
    if (changeFilter.value === 'implemented') return String(change.status || '') === '5'
    return true
  })
  return filteredChanges.sort((a, b) => Number(b.impact || 0) - Number(a.impact || 0))
})

const milestoneTableData = computed(() => {
  return [...milestones.value].filter((item) => {
    if (milestoneFilter.value === 'all') return true
    if (milestoneFilter.value === 'dueSoon') {
      const diff = getDaysDiff(item.dueDate)
      return String(item.status || '') !== '2' && diff !== null && diff >= 0 && diff <= dueSoonDays
    }
    if (milestoneFilter.value === 'overdue') return String(item.status || '') !== '2' && (getDaysDiff(item.dueDate) ?? 1) < 0
    if (milestoneFilter.value === 'delayed') return String(item.status || '') === '3'
    return true
  })
})

const sprintTableData = computed(() => {
  return [...sprints.value].filter((item) => {
    if (sprintFilter.value === 'all') return true
    if (sprintFilter.value === 'active') return String(item.status || '') === '2'
    if (sprintFilter.value === 'planning') return String(item.status || '') === '1'
    if (sprintFilter.value === 'dueSoon') return String(item.status || '') === '2' && (getDaysDiff(item.endDate) ?? 99) <= dueSoonDays && (getDaysDiff(item.endDate) ?? -1) >= 0
    return true
  })
})

onMounted(async () => {
  applyQueryState()
  await reloadCurrent()
})

watch(
  () => route.query,
  () => {
    applyQueryState()
  }
)

async function reloadCurrent() {
  const [statusRes, priorityRes, projectTypeRes, customerRes, dashboardRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getProjectType(),
    getCustomerList({ pageNum: 1, pageSize: 1000 }),
    getDashboard(projectId),
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  projectTypeMap.value = projectTypeRes.data || {}
  customerList.value = customerRes.list || []
  dashboard.value = dashboardRes.data || {}
  project.value = dashboard.value.project || {}
  tasks.value = dashboard.value.tasks || []
  tickets.value = dashboard.value.tickets || []
  milestones.value = dashboard.value.milestones || []
  risks.value = dashboard.value.risks || []
  changes.value = dashboard.value.changes || []
  sprints.value = dashboard.value.sprints || []
}

function handleSubmitApproval() {
  if (!canProjectSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  const request = canCloseReturnedInstance.value
    ? resubmitReturnedWorkflowInstance(project.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(projectId)
  request.then(() => {
    $sdk.msgSuccess('提交成功，请等待审批')
    reloadCurrent()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }).catch(e => {
    $sdk.msgError(e.message || '提交失败')
  })
}

function handleSubmitClose() {
  if (!canProjectSubmitClose.value) return $sdk.msgWarning('当前操作没有权限')
  submitClose(projectId).then(() => {
    $sdk.msgSuccess('结项申请已提交')
    reloadCurrent()
  }).catch(e => {
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

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goToEdit() {
  if (!projectId) return
  router.push({ path: '/projectManage/form', query: { id: projectId } })
}

function goToCockpit() {
  router.push({ path: '/cockpit', query: { projectId } })
}

function goToTab(tabName) {
  activeTab.value = tabName
  syncQueryState()
}

function resetTabFilters() {
  taskFilter.value = 'all'
  ticketFilter.value = 'all'
  milestoneFilter.value = 'all'
  riskFilter.value = 'all'
  changeFilter.value = 'all'
  sprintFilter.value = 'all'
}

function getValidTab(value) {
  const tab = String(value || 'overview')
  return validTabs.has(tab) ? tab : 'overview'
}

function getValidFilter(filterName, value) {
  const normalizedValue = String(value || 'all')
  return validFilters[filterName]?.has(normalizedValue) ? normalizedValue : 'all'
}

function applyQueryState() {
  activeTab.value = getValidTab(route.query.tab)
  taskFilter.value = getValidFilter('taskFilter', route.query.taskFilter)
  ticketFilter.value = getValidFilter('ticketFilter', route.query.ticketFilter)
  milestoneFilter.value = getValidFilter('milestoneFilter', route.query.milestoneFilter)
  riskFilter.value = getValidFilter('riskFilter', route.query.riskFilter)
  changeFilter.value = getValidFilter('changeFilter', route.query.changeFilter)
  sprintFilter.value = getValidFilter('sprintFilter', route.query.sprintFilter)
}

function syncQueryState() {
  const nextQuery = {
    ...route.query,
    id: projectId,
  }

  if (activeTab.value && activeTab.value !== 'overview') nextQuery.tab = activeTab.value
  else delete nextQuery.tab

  const filterEntries = [
    ['taskFilter', taskFilter.value],
    ['ticketFilter', ticketFilter.value],
    ['milestoneFilter', milestoneFilter.value],
    ['riskFilter', riskFilter.value],
    ['changeFilter', changeFilter.value],
    ['sprintFilter', sprintFilter.value],
  ]

  filterEntries.forEach(([key, value]) => {
    if (value && value !== 'all') nextQuery[key] = value
    else delete nextQuery[key]
  })

  router.replace({ path: route.path, query: nextQuery })
}

function clearTabFilter(tabName) {
  if (tabName === 'tasks') taskFilter.value = 'all'
  if (tabName === 'tickets') ticketFilter.value = 'all'
  if (tabName === 'milestones') milestoneFilter.value = 'all'
  if (tabName === 'risks') riskFilter.value = 'all'
  if (tabName === 'changes') changeFilter.value = 'all'
  if (tabName === 'sprints') sprintFilter.value = 'all'
  syncQueryState()
}

function goToTabWithFilter(tabName, filter = 'all') {
  resetTabFilters()
  activeTab.value = tabName
  if (tabName === 'tasks') taskFilter.value = filter
  if (tabName === 'tickets') ticketFilter.value = filter
  if (tabName === 'milestones') milestoneFilter.value = filter
  if (tabName === 'risks') riskFilter.value = filter
  if (tabName === 'changes') changeFilter.value = filter
  if (tabName === 'sprints') sprintFilter.value = filter
  syncQueryState()
}

function handleChartSliceClick(tabName, filter = 'all') {
  goToTabWithFilter(tabName, filter)
}

function handleMetricCardClick(tabName, filter = 'all') {
  goToTabWithFilter(tabName, filter)
}

function goToDetail(path, id, query = {}) {
  if (!id) return
  router.push({ path, query: { id, action: 'view', ...query } })
}
</script>

<template>
  <div class="project-detail-page">
    <el-page-header @back="$router.back()" title="项目详情">
      <template #extra>
        <el-button @click="goToCockpit">进入驾驶舱</el-button>
        <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        <el-button type="primary" @click="handleSubmitApproval" v-if="canProjectSubmitApproval && project.status === '1'">提交立项审批</el-button>
        <el-button type="warning" @click="handleSubmitClose" v-if="canProjectSubmitClose && project.status === '3'">提交结项申请</el-button>
      </template>
    </el-page-header>

    <el-alert
      v-if="project.approvalStatus === '3'"
      :title="String(project.currentNodeName || '').includes('退回发起人') ? '项目审批已退回发起人，可修改后重新提交，或直接结束退回实例。' : '项目审批已驳回，请根据意见调整后重新提交。'"
      type="warning"
      :closable="false"
      show-icon
      class="mt20"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button type="primary" size="small" @click="goToEdit">去编辑</el-button>
          <el-button v-if="canProjectSubmitApproval && project.status === '1'" type="warning" size="small" @click="handleSubmitApproval">重新提交审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-alert
      v-else-if="project.approvalStatus === '2'"
      title="项目审批已通过，请按当前项目状态继续推进执行或结项。"
      type="success"
      :closable="false"
      show-icon
      class="mt20"
    />

    <div class="project-hero mt20">
      <div class="project-hero__main">
        <div class="project-hero__title-row">
          <div>
            <div class="project-hero__title">{{ project.name || '-' }}</div>
            <div class="project-hero__code">{{ project.code || '-' }}</div>
          </div>
          <div class="project-hero__tags">
            <ViewTagField :text="statusMap[project.status]" :type="getProjectStatusType(project.status)" />
            <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[project.approvalStatus] || '无需审批'" :type="getApprovalType(project.approvalStatus)" />
            <ViewTagField :text="priorityMap[project.priority]" :type="getPriorityType(project.priority)" />
          </div>
        </div>

        <div class="project-meta-grid">
          <div class="project-meta-item">
            <span class="project-meta-item__label">负责人</span>
            <ViewUser :user="project.leader" />
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">客户</span>
            <ViewEntity :title="currentCustomer?.name" :subtitle="currentCustomer?.code" />
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目类型</span>
            <div class="project-meta-item__value">{{ projectTypeMap[project.projectType] || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">当前审批节点</span>
            <div class="project-meta-item__value">{{ project.currentNodeName || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">开始时间</span>
            <div class="project-meta-item__value">{{ project.startDate || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">结束时间</span>
            <div class="project-meta-item__value">{{ project.endDate || '-' }}</div>
          </div>
        </div>
      </div>

      <div class="project-hero__side">
        <div class="hero-stat-card">
          <div class="hero-stat-card__label">预算</div>
          <div class="hero-stat-card__value">¥ {{ Number(project.budget || 0).toLocaleString() }}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-card__label">实际成本</div>
          <div class="hero-stat-card__value">¥ {{ Number(project.actualCost || 0).toLocaleString() }}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-card__label">总体进度</div>
          <el-progress :percentage="project.progress || 0" :stroke-width="10" />
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="mt20 project-tabs">
      <el-tab-pane label="概览" name="overview">
        <div class="metric-grid">
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('tasks', 'all')">
            <div class="metric-card__value">{{ taskSummary.total }}</div>
            <div class="metric-card__label">总任务数</div>
            <div class="metric-card__desc">已完成 {{ taskSummary.completed }}，逾期 {{ taskSummary.overdue }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('tickets', 'open')">
            <div class="metric-card__value">{{ ticketSummary.open }}</div>
            <div class="metric-card__label">打开缺陷</div>
            <div class="metric-card__desc">严重缺陷 {{ ticketSummary.critical }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('risks', 'active')">
            <div class="metric-card__value">{{ riskSummary.active }}</div>
            <div class="metric-card__label">活跃风险</div>
            <div class="metric-card__desc">高风险 {{ riskSummary.high }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('changes', 'pending')">
            <div class="metric-card__value">{{ changeSummary.pendingApproval }}</div>
            <div class="metric-card__label">待审批变更</div>
            <div class="metric-card__desc">高影响 {{ changeSummary.highImpact }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('sprints', 'active')">
            <div class="metric-card__value">{{ sprintSummary.active }}</div>
            <div class="metric-card__label">当前 Sprint</div>
            <div class="metric-card__desc">总 Sprint {{ sprintSummary.total }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('milestones', 'delayed')">
            <div class="metric-card__value">{{ milestoneSummary.completionRate }}%</div>
            <div class="metric-card__label">里程碑达成率</div>
            <div class="metric-card__desc">延期 {{ milestoneSummary.delayed }}，临近 {{ milestoneSummary.dueSoon }}</div>
          </el-card>
        </div>

        <div class="focus-grid mt20">
          <el-card shadow="hover" class="focus-card">
            <template #header>
              <div class="focus-card__header">
                <span>即将到期任务</span>
                <el-button link type="primary" @click="goToTab('tasks')">查看全部</el-button>
              </div>
            </template>
            <div v-if="dueSoonTasks.length" class="focus-list">
              <div v-for="item in dueSoonTasks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">截止 {{ item.endDate || '-' }} / {{ priorityMap[item.priority] || '普通' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无即将到期任务</div>
          </el-card>

          <el-card shadow="hover" class="focus-card focus-card--alert">
            <template #header>
              <div class="focus-card__header">
                <span>已逾期任务</span>
                <el-button link type="primary" @click="goToTab('tasks')">查看全部</el-button>
              </div>
            </template>
            <div v-if="overdueTasks.length" class="focus-list">
              <div v-for="item in overdueTasks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">截止 {{ item.endDate || '-' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无逾期任务</div>
          </el-card>

          <el-card shadow="hover" class="focus-card focus-card--alert">
            <template #header>
              <div class="focus-card__header">
                <span>严重缺陷</span>
                <el-button link type="primary" @click="goToTab('tickets')">查看全部</el-button>
              </div>
            </template>
            <div v-if="criticalTickets.length" class="focus-list">
              <div v-for="item in criticalTickets" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.title }}</div>
                <div class="focus-list__meta">{{ item.handler?.nickname || item.handler?.name || '未分配处理人' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无严重缺陷</div>
          </el-card>

          <el-card shadow="hover" class="focus-card">
            <template #header>
              <div class="focus-card__header">
                <span>高风险事项</span>
                <el-button link type="primary" @click="goToTab('risks')">查看全部</el-button>
              </div>
            </template>
            <div v-if="highRisks.length" class="focus-list">
              <div v-for="item in highRisks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">{{ item.mitigation || '待补充应对措施' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无高风险事项</div>
          </el-card>
        </div>

        <el-row v-if="hasOverviewCharts" :gutter="20" class="mt20">
          <el-col :xs="24" :lg="8">
            <el-card shadow="hover" class="panel-card chart-card">
              <template #header>任务状态分布</template>
              <ChartPie :key="`task-${activeTab}`" :series="taskStatusChartData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" @slice-click="handleChartSliceClick('tasks', $event.name === '已逾期' ? 'overdue' : $event.name === '处理中' ? 'inProgress' : $event.name === '待处理' ? 'all' : 'all')" />
            </el-card>
          </el-col>
          <el-col :xs="24" :lg="8">
            <el-card shadow="hover" class="panel-card chart-card">
              <template #header>缺陷严重度分布</template>
              <ChartPie :key="`ticket-${activeTab}`" :series="ticketSeverityChartData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" @slice-click="handleChartSliceClick('tickets', $event.name === '严重' ? 'critical' : 'open')" />
            </el-card>
          </el-col>
          <el-col :xs="24" :lg="8">
            <el-card shadow="hover" class="panel-card chart-card">
              <template #header>风险等级分布</template>
              <ChartPie :key="`risk-${activeTab}`" :series="riskLevelChartData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" @slice-click="handleChartSliceClick('risks', ['高', '严重'].includes($event.name) ? 'high' : 'active')" />
            </el-card>
          </el-col>
        </el-row>

        <el-card v-else shadow="hover" class="mt20 panel-card overview-empty-card">
          <template #header>统计分布</template>
          <div class="overview-empty-card__content">当前项目还没有足够的任务、缺陷或风险数据可用于生成分布图。</div>
        </el-card>

        <el-row :gutter="20" class="mt20">
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="panel-card">
              <template #header>进度与成本</template>
              <div class="panel-progress-list">
                <div class="panel-progress-item">
                  <div class="panel-progress-item__header">
                    <span>总体进度</span>
                    <span>{{ project.progress || 0 }}%</span>
                  </div>
                  <el-progress :percentage="project.progress || 0" :stroke-width="10" />
                </div>
                <div class="panel-progress-item">
                  <div class="panel-progress-item__header">
                    <span>任务完成率</span>
                    <span>{{ taskSummary.completionRate }}%</span>
                  </div>
                  <el-progress :percentage="taskSummary.completionRate" :stroke-width="10" status="success" />
                </div>
                <div class="panel-progress-item">
                  <div class="panel-progress-item__header">
                    <span>里程碑完成率</span>
                    <span>{{ milestoneSummary.completionRate }}%</span>
                  </div>
                  <el-progress :percentage="milestoneSummary.completionRate" :stroke-width="10" color="#9096f9" />
                </div>
              </div>
              <div class="cost-grid">
                <div class="cost-card">
                  <div class="cost-card__label">项目预算</div>
                  <div class="cost-card__value">¥ {{ Number(project.budget || 0).toLocaleString() }}</div>
                </div>
                <div class="cost-card">
                  <div class="cost-card__label">实际成本</div>
                  <div class="cost-card__value">¥ {{ Number(project.actualCost || 0).toLocaleString() }}</div>
                </div>
                <div class="cost-card" :class="{ 'cost-card--warning': costVariance > 0 }">
                  <div class="cost-card__label">成本偏差</div>
                  <div class="cost-card__value">¥ {{ Math.abs(costVariance).toLocaleString() }}</div>
                  <div class="cost-card__desc">{{ costVariance > 0 ? '超出预算' : '预算内' }}</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="panel-card">
              <template #header>团队与里程碑</template>
              <div class="side-panel-block">
                <div class="side-panel-block__title">核心成员</div>
                <div v-if="coreMembers.length" class="core-member-list">
                  <div v-for="item in coreMembers" :key="item.id || item.userId" class="core-member-item">
                    <ViewUser :user="item.user" />
                    <div class="core-member-item__role">{{ item.role ? item.role : '-' }}</div>
                  </div>
                </div>
                <div v-else class="focus-list__empty">暂无核心成员</div>
              </div>
              <div class="side-panel-block">
                <div class="side-panel-block__title">近期里程碑</div>
                <div v-if="dueSoonMilestones.length || delayedMilestones.length" class="focus-list">
                  <div v-for="item in [...dueSoonMilestones, ...delayedMilestones].slice(0, 5)" :key="item.id" class="focus-list__item">
                    <div class="focus-list__title">{{ item.name }}</div>
                    <div class="focus-list__meta">{{ item.dueDate || '-' }} / {{ { '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[item.status] || '-' }}</div>
                  </div>
                </div>
                <div v-else class="focus-list__empty">暂无关键里程碑提醒</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" class="mt20 panel-card">
          <template #header>项目描述</template>
          <ViewRichText :html="project.description" />
        </el-card>

        <el-card shadow="hover" class="mt20 panel-card">
          <template #header>项目成员</template>
          <el-table :data="project.members || []" size="small" border>
            <el-table-column label="成员" min-width="180">
              <template #default="{ row }">
                <ViewUser :user="row.user" />
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="140">
              <template #default="{ row }">
                {{ { '1': '项目经理', '2': '交付经理', '3': '技术负责人', '4': '实施负责人', '5': '测试负责人', '6': '客户联系人', '7': '商务接口人', '8': '开发工程师', '9': '实施顾问', 'A': '测试工程师', 'B': '运维工程师', 'C': '培训顾问', 'D': '数据迁移工程师', 'E': '驻场支持', 'F': '普通成员', 'G': '访客' }[row.role] || row.role }}
              </template>
            </el-table-column>
            <el-table-column prop="isCore" label="核心成员" width="100">
              <template #default="{ row }">
                <ViewTagField :text="row.isCore === '1' ? '是' : '否'" :type="row.isCore === '1' ? 'success' : 'info'" />
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="交付焦点" name="focus">
        <div class="focus-board">
          <el-card shadow="hover" class="focus-card focus-card--alert">
            <template #header>
              <div class="focus-card__header"><span>已逾期任务</span><span>{{ overdueTasks.length }}</span></div>
            </template>
            <div v-if="overdueTasks.length" class="focus-list">
              <div v-for="item in overdueTasks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">截止 {{ item.endDate || '-' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无逾期任务</div>
          </el-card>

          <el-card shadow="hover" class="focus-card">
            <template #header>
              <div class="focus-card__header"><span>即将到期任务</span><span>{{ dueSoonTasks.length }}</span></div>
            </template>
            <div v-if="dueSoonTasks.length" class="focus-list">
              <div v-for="item in dueSoonTasks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">截止 {{ item.endDate || '-' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无即将到期任务</div>
          </el-card>

          <el-card shadow="hover" class="focus-card focus-card--alert">
            <template #header>
              <div class="focus-card__header"><span>严重缺陷</span><span>{{ criticalTickets.length }}</span></div>
            </template>
            <div v-if="criticalTickets.length" class="focus-list">
              <div v-for="item in criticalTickets" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.title }}</div>
                <div class="focus-list__meta">{{ item.handler?.nickname || item.handler?.name || '未分配处理人' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无严重缺陷</div>
          </el-card>

          <el-card shadow="hover" class="focus-card focus-card--alert">
            <template #header>
              <div class="focus-card__header"><span>高风险事项</span><span>{{ highRisks.length }}</span></div>
            </template>
            <div v-if="highRisks.length" class="focus-list">
              <div v-for="item in highRisks" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">{{ item.dueDate || '未设置计划解决日期' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无高风险事项</div>
          </el-card>

          <el-card shadow="hover" class="focus-card">
            <template #header>
              <div class="focus-card__header"><span>待审批变更</span><span>{{ pendingChanges.length }}</span></div>
            </template>
            <div v-if="pendingChanges.length" class="focus-list">
              <div v-for="item in pendingChanges" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.title }}</div>
                <div class="focus-list__meta">影响等级 {{ { '1': '低', '2': '中', '3': '高' }[item.impact] || '-' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无待审批变更</div>
          </el-card>

          <el-card shadow="hover" class="focus-card">
            <template #header>
              <div class="focus-card__header"><span>即将到期里程碑</span><span>{{ dueSoonMilestones.length }}</span></div>
            </template>
            <div v-if="dueSoonMilestones.length" class="focus-list">
              <div v-for="item in dueSoonMilestones" :key="item.id" class="focus-list__item">
                <div class="focus-list__title">{{ item.name }}</div>
                <div class="focus-list__meta">截止 {{ item.dueDate || '-' }}</div>
              </div>
            </div>
            <div v-else class="focus-list__empty">暂无即将到期里程碑</div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="任务" name="tasks">
        <div v-if="taskFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { overdue: '已逾期任务', dueSoon: '即将到期任务', inProgress: '处理中任务' }[taskFilter] || '任务' }}</span>
          <el-button link type="primary" @click="clearTabFilter('tasks')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总任务</span><strong>{{ taskSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>进行中</span><strong>{{ taskSummary.inProgress }}</strong></div>
          <div class="tab-summary-card"><span>已完成</span><strong>{{ taskSummary.completed }}</strong></div>
          <div class="tab-summary-card"><span>即将到期</span><strong>{{ taskSummary.dueSoon }}</strong></div>
          <div class="tab-summary-card"><span>已逾期</span><strong>{{ taskSummary.overdue }}</strong></div>
        </div>
        <el-table :data="taskTableData" stripe class="mt16">
          <el-table-column prop="name" label="任务名称" min-width="200">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/taskManage/form', row.id)">{{ row.name || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="负责人" min-width="140">
            <template #default="{ row }">
              {{ row.leader?.nickname || row.leader?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="statusMap[row.status] || '-'" :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <ViewTagField :text="priorityMap[row.priority] || '-'" :type="getPriorityType(row.priority)" />
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始时间" width="120" />
          <el-table-column prop="endDate" label="截止时间" width="120" />
          <el-table-column label="时间状态" width="120">
            <template #default="{ row }">
              {{ !isTaskCompleted(row) && row.endDate ? formatDiffLabel(row.endDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="风险提示" width="110">
            <template #default="{ row }">
              <ViewTagField v-if="!isTaskCompleted(row) && (getDaysDiff(row.endDate) ?? 1) < 0" text="已逾期" type="danger" />
              <ViewTagField v-else-if="!isTaskCompleted(row) && (getDaysDiff(row.endDate) ?? 99) <= dueSoonDays" text="临近截止" type="warning" />
              <span v-else class="detail-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/taskManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="缺陷" name="tickets">
        <div v-if="ticketFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { open: '未解决缺陷', critical: '严重缺陷', unassigned: '待分配缺陷' }[ticketFilter] || '缺陷' }}</span>
          <el-button link type="primary" @click="clearTabFilter('tickets')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总缺陷</span><strong>{{ ticketSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>未解决</span><strong>{{ ticketSummary.open }}</strong></div>
          <div class="tab-summary-card"><span>严重缺陷</span><strong>{{ ticketSummary.critical }}</strong></div>
        </div>
        <el-table :data="ticketTableData" stripe class="mt16">
          <el-table-column prop="title" label="缺陷标题" min-width="220">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/ticketManage/form', row.id)">{{ row.title || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <ViewTagField :text="row.type === '2' ? '任务问题' : 'Bug'" type="info" />
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="110">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '严重', '2': '高', '3': '中', '4': '低' }[row.severity] || '-'" :type="getTicketSeverityType(row.severity)" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="statusMap[row.status] || '-'" :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'danger'" />
            </template>
          </el-table-column>
          <el-table-column label="处理人" min-width="140">
            <template #default="{ row }">
              {{ row.handler?.nickname || row.handler?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="处置提示" width="120">
            <template #default="{ row }">
              <el-tag v-if="String(row.severity || '') === '1' && !isTicketResolved(row)" type="danger" size="small">优先处理</el-tag>
              <el-tag v-else-if="!row.handlerId" type="warning" size="small">待分配</el-tag>
              <span v-else class="detail-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="rootCauseCategory" label="根因分类" width="120">
            <template #default="{ row }">
              {{ row.rootCauseCategory ? { 'code_defect': '代码缺陷', 'design_issue': '设计问题', 'requirement_gap': '需求缺失', 'test_gap': '测试遗漏', 'environment': '环境问题', 'other': '其他' }[row.rootCauseCategory] : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/ticketManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="里程碑" name="milestones">
        <div v-if="milestoneFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { dueSoon: '即将到期里程碑', overdue: '已超期里程碑', delayed: '已延期里程碑' }[milestoneFilter] || '里程碑' }}</span>
          <el-button link type="primary" @click="clearTabFilter('milestones')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总里程碑</span><strong>{{ milestoneSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>已完成</span><strong>{{ milestoneSummary.completed }}</strong></div>
          <div class="tab-summary-card"><span>已延期</span><strong>{{ milestoneSummary.delayed }}</strong></div>
          <div class="tab-summary-card"><span>即将到期</span><strong>{{ milestoneSummary.dueSoon }}</strong></div>
          <div class="tab-summary-card"><span>已超期</span><strong>{{ overdueMilestoneCount }}</strong></div>
        </div>
        <div class="milestone-timeline-rail mt16">
          <div v-for="(item, index) in milestoneTimelineData" :key="item.id" class="milestone-timeline-rail__item">
            <div class="milestone-timeline-rail__axis">
              <div class="milestone-timeline-rail__dot" :class="`milestone-timeline-rail__dot--${item.status}`" />
              <div v-if="index !== milestoneTimelineData.length - 1" class="milestone-timeline-rail__line" />
            </div>
            <div class="milestone-timeline-rail__card">
              <div class="milestone-timeline-rail__header">
                <div>
                  <div class="milestone-timeline-rail__title">{{ item.name }}</div>
                  <div class="milestone-timeline-rail__meta">计划 {{ item.dueDate || '-' }} / {{ formatDiffLabel(item.dueDate, '已超期', '即将到期') }}</div>
                </div>
                <ViewTagField :text="{ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[item.status] || '-'" :type="item.status === '2' ? 'success' : item.status === '3' ? 'danger' : 'info'" />
              </div>
              <div class="milestone-timeline-rail__body">
                <div class="milestone-timeline-rail__stat">
                  <span>关联任务</span>
                  <strong>{{ item.taskCount || 0 }}</strong>
                </div>
                <div class="milestone-timeline-rail__stat">
                  <span>已完成</span>
                  <strong>{{ item.completedTaskCount || 0 }}</strong>
                </div>
                <div class="milestone-timeline-rail__progress">
                  <el-progress :percentage="item.taskCount > 0 ? Math.round((item.completedTaskCount / item.taskCount) * 100) : 0" :stroke-width="8" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-table :data="milestoneTableData" stripe class="mt16">
          <el-table-column prop="name" label="里程碑名称" min-width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/milestoneManage/form', row.id)">{{ row.name || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="计划完成日期" width="130" />
          <el-table-column label="时间状态" width="120">
            <template #default="{ row }">
              {{ String(row.status || '') !== '2' && row.dueDate ? formatDiffLabel(row.dueDate, '已超期', '即将到期') : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[row.status] || '-'" :type="row.status === '2' ? 'success' : row.status === '3' ? 'danger' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column prop="taskCount" label="关联任务" width="100" />
          <el-table-column prop="completedTaskCount" label="已完成" width="100" />
          <el-table-column label="进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.taskCount > 0 ? Math.round((row.completedTaskCount / row.taskCount) * 100) : 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/milestoneManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="风险" name="risks">
        <div v-if="riskFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { active: '活跃风险', high: '高风险事项', overdue: '已超期风险', unassigned: '待分配风险' }[riskFilter] || '风险' }}</span>
          <el-button link type="primary" @click="clearTabFilter('risks')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总风险</span><strong>{{ riskSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>活跃风险</span><strong>{{ riskSummary.active }}</strong></div>
          <div class="tab-summary-card"><span>高风险</span><strong>{{ riskSummary.high }}</strong></div>
          <div class="tab-summary-card"><span>已超期</span><strong>{{ overdueRiskCount }}</strong></div>
        </div>
        <el-table :data="riskTableData" stripe class="mt16">
          <el-table-column prop="name" label="风险名称" min-width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/riskManage/form', row.id)">{{ row.name || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100">
            <template #default="{ row }">
              {{ { '1': '进度', '2': '预算', '3': '资源', '4': '技术', '5': '需求', '6': '质量', '7': '外部', '8': '其他' }[row.category] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '低', '2': '中', '3': '高', '4': '严重' }[row.level] || '-'" :type="getRiskLevelType(row.level)" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '已识别', '2': '评估中', '3': '处理中', '4': '已解决', '5': '已关闭' }[row.status] || '-'" :type="row.status === '4' ? 'success' : row.status === '5' ? 'info' : 'warning'" />
            </template>
          </el-table-column>
          <el-table-column label="责任人" min-width="140">
            <template #default="{ row }">
              {{ row.riskOwner?.nickname || row.riskOwner?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="计划解决日期" width="130" />
          <el-table-column label="时间状态" width="120">
            <template #default="{ row }">
              {{ !isRiskClosed(row) && row.dueDate ? formatDiffLabel(row.dueDate, '已超期', '即将到期') : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="处置提示" width="120">
            <template #default="{ row }">
              <el-tag v-if="['3', '4'].includes(String(row.level || '')) && !isRiskClosed(row)" type="danger" size="small">优先跟进</el-tag>
              <el-tag v-else-if="!row.riskOwnerId" type="warning" size="small">待分配</el-tag>
              <span v-else class="detail-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="mitigation" label="应对措施" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/riskManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="变更" name="changes">
        <div v-if="changeFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { pending: '待审批变更', highImpact: '高影响变更', implemented: '已实施变更' }[changeFilter] || '变更' }}</span>
          <el-button link type="primary" @click="clearTabFilter('changes')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总变更</span><strong>{{ changeSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>待审批</span><strong>{{ changeSummary.pendingApproval }}</strong></div>
          <div class="tab-summary-card"><span>高影响</span><strong>{{ changeSummary.highImpact }}</strong></div>
          <div class="tab-summary-card"><span>已实施</span><strong>{{ implementedChangeCount }}</strong></div>
        </div>
        <el-table :data="changeTableData" stripe class="mt16">
          <el-table-column prop="title" label="变更标题" min-width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/changeManage/form', row.id)">{{ row.title || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ { '1': '范围', '2': '进度', '3': '预算', '4': '资源', '5': '需求', '6': '其他' }[row.type] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="impact" label="影响" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '低', '2': '中', '3': '高' }[row.impact] || '-'" :type="getChangeImpactType(row.impact)" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '草稿', '2': '待审批', '3': '已批准', '4': '已驳回', '5': '已实施' }[row.status] || '-'" :type="row.status === '3' || row.status === '5' ? 'success' : row.status === '4' ? 'danger' : row.status === '2' ? 'warning' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column label="处置提示" width="120">
            <template #default="{ row }">
              <el-tag v-if="String(row.status || '') === '2'" type="warning" size="small">等待审批</el-tag>
              <el-tag v-else-if="String(row.impact || '') === '3' && String(row.status || '') !== '5'" type="danger" size="small">高影响</el-tag>
              <span v-else class="detail-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="costImpact" label="成本影响" width="110">
            <template #default="{ row }">¥{{ Number(row.costImpact || 0).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="scheduleImpact" label="进度影响(天)" width="110" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/changeManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Sprint" name="sprints">
        <div v-if="sprintFilter !== 'all'" class="tab-filter-tip">
          <span>当前已聚焦：{{ { active: '进行中 Sprint', planning: '计划中 Sprint', dueSoon: '临近结束 Sprint' }[sprintFilter] || 'Sprint' }}</span>
          <el-button link type="primary" @click="clearTabFilter('sprints')">查看全部</el-button>
        </div>
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>总 Sprint</span><strong>{{ sprintSummary.total }}</strong></div>
          <div class="tab-summary-card"><span>进行中</span><strong>{{ activeSprintCount }}</strong></div>
          <div class="tab-summary-card"><span>计划中</span><strong>{{ sprintSummary.planning }}</strong></div>
        </div>
        <el-card v-if="sprintSummary.current" shadow="hover" class="mt16 current-sprint-card">
          <div class="current-sprint-card__header">当前关注 Sprint</div>
          <div class="current-sprint-card__title">{{ sprintSummary.current.name }}</div>
          <div class="current-sprint-card__meta">{{ sprintSummary.current.startDate || '-' }} 至 {{ sprintSummary.current.endDate || '-' }}</div>
          <el-progress :percentage="sprintSummary.current.totalStoryPoints > 0 ? Math.round((((sprintSummary.current.totalCompletedStoryPoints ?? sprintSummary.current.completedPoints) || 0) / sprintSummary.current.totalStoryPoints) * 100) : 0" :stroke-width="10" />
        </el-card>
        <el-table :data="sprintTableData" stripe class="mt16">
          <el-table-column prop="name" label="Sprint 名称" min-width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/sprintManage/form', row.id)">{{ row.name || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '计划中', '2': '进行中', '3': '已完成', '4': '已取消' }[row.status] || '-'" :type="row.status === '2' ? 'primary' : row.status === '3' ? 'success' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column label="节奏提示" width="120">
            <template #default="{ row }">
              <el-tag v-if="String(row.status || '') === '2' && (getDaysDiff(row.endDate) ?? 99) <= dueSoonDays && (getDaysDiff(row.endDate) ?? -1) >= 0" type="warning" size="small">临近结束</el-tag>
              <el-tag v-else-if="String(row.status || '') === '2' && (getDaysDiff(row.endDate) ?? 1) < 0" type="danger" size="small">已超期</el-tag>
              <span v-else class="detail-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalStoryPoints" label="故事点" width="90" />
          <el-table-column label="进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.totalStoryPoints > 0 ? Math.round((((row.totalCompletedStoryPoints ?? row.completedPoints) || 0) / row.totalStoryPoints) * 100) : 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/sprintManage/form', row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <div v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="workflow-panel-section">
      <div class="workflow-panel-section__header">审批操作区</div>
      <WorkflowApprovalPanel :task-id="workflowTaskId" :instance-id="workflowInstanceId" :node-name="project.currentNodeName" @approved="reloadCurrent" />
    </div>
  </div>
</template>

<style scoped>
.project-detail-page {
  padding: 20px;
}

.project-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 55%, #f5f7ff 100%);
}

.project-hero__title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.project-hero__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.project-hero__code {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.project-hero__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.project-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 20px;
  margin-top: 20px;
}

.project-meta-item {
  min-width: 0;
}

.project-meta-item__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.project-meta-item__value {
  min-height: 36px;
  display: flex;
  align-items: center;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.project-hero__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-stat-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
}

.hero-stat-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hero-stat-card__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  border-radius: 14px;
}

.metric-card--clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card--clickable:hover {
  transform: translateY(-2px);
}

.metric-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.metric-card__label {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-card__desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.focus-grid,
.focus-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.focus-card {
  border-radius: 14px;
}

.focus-card--alert {
  border-color: rgba(245, 108, 108, 0.24);
}

.focus-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.focus-list__item {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.focus-list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.focus-list__meta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.focus-list__empty,
.detail-empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.panel-card {
  border-radius: 14px;
}

.chart-card :deep(.chart) {
  min-width: 100%;
  min-height: 280px;
}

.overview-empty-card__content {
  min-height: 72px;
  display: flex;
  align-items: center;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.panel-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-progress-item__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.cost-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.cost-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.cost-card--warning {
  background: rgba(245, 108, 108, 0.08);
}

.cost-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cost-card__value {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.cost-card__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.side-panel-block + .side-panel-block {
  margin-top: 20px;
}

.side-panel-block__title,
.current-sprint-card__header {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.core-member-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.core-member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.core-member-item__role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tab-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.tab-filter-tip {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tab-summary-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: #fff;
}

.tab-summary-card span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tab-summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.milestone-timeline-rail {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.milestone-timeline-rail__item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 14px;
}

.milestone-timeline-rail__axis {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.milestone-timeline-rail__dot {
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--el-color-info);
  flex-shrink: 0;
}

.milestone-timeline-rail__dot--2 {
  background: var(--el-color-success);
}

.milestone-timeline-rail__dot--3 {
  background: var(--el-color-danger);
}

.milestone-timeline-rail__dot--4 {
  background: var(--el-color-info);
}

.milestone-timeline-rail__line {
  flex: 1;
  width: 2px;
  margin-top: 6px;
  background: var(--el-border-color-lighter);
}

.milestone-timeline-rail__card {
  padding: 14px 16px;
  margin-bottom: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
}

.milestone-timeline-rail__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.milestone-timeline-rail__title,
.current-sprint-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.milestone-timeline-rail__meta,
.current-sprint-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.milestone-timeline-rail__body {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.milestone-timeline-rail__stat {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.milestone-timeline-rail__stat span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.milestone-timeline-rail__stat strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.milestone-timeline-rail__progress {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.current-sprint-card {
  border-radius: 14px;
}

.project-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.workflow-panel-section {
  margin-top: 20px;
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

@media (max-width: 1200px) {
  .project-hero {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .project-meta-grid,
  .cost-grid,
  .tab-summary-grid,
  .milestone-timeline-rail__body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .project-detail-page {
    padding: 14px;
  }

  .project-hero,
  .metric-grid,
  .focus-grid,
  .focus-board,
  .project-meta-grid,
  .cost-grid,
  .tab-summary-grid,
  .milestone-timeline-rail__body {
    grid-template-columns: 1fr;
  }

  .project-hero__title-row {
    flex-direction: column;
  }

  .project-hero__tags {
    justify-content: flex-start;
  }
}
</style>
