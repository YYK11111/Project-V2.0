<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { getDashboard, getStatus, getPriority, getProjectType, publishCloseReview, submitClose, syncProjectAlerts, getFieldPermissions } from './api'
import { confirmPlanImpact, confirmPlanImpactScope, confirmPlanImpactTarget } from '@/views/business/changeManage/api'
import { getKnowledgeTypes } from '@/views/content/articleManage/api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import { phaseMap } from './fieldMaps'
import ChartPie from '@/components/ChartPie.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

const route = useRoute()
const router = useRouter()
const projectId = computed(() => String(route.query.id || ''))

const project = ref({})
const statusMap = ref({})
const priorityMap = ref({})
const projectTypeMap = ref({})
const knowledgeTypeMap = ref({})
const customerList = ref([])
const deptMap = ref({})
const dashboard = ref({})
const tasks = ref([])
const tickets = ref([])
const milestones = ref([])
const risks = ref([])
const changes = ref([])
const sprints = ref([])
const knowledgeSummary = ref({})
const knowledgeArticles = ref([])
const projectPermissionContext = ref({})
const fieldPermissionResult = ref(null)
const activeTab = ref('overview')
const taskFilter = ref('all')
const ticketFilter = ref('all')
const milestoneFilter = ref('all')
const riskFilter = ref('all')
const changeFilter = ref('all')
const sprintFilter = ref('all')
const canOperateProject = computed(() => projectPermissionContext.value?.isVisitor !== true)
const canAddTaskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)
const canAddTicketInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)
const canAddRiskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageRisks === true)
const canAddChangeInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageChanges === true)
const canAddSprintInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageExecution === true)
const canAddKnowledgeInProject = computed(() => canOperateProject.value && (projectPermissionContext.value?.canEdit === true || projectPermissionContext.value?.canManageExecution === true || projectPermissionContext.value?.canManageDelivery === true))
const canManagePlanInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManagePlan === true)
const canManageDeliveryInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageDelivery === true)
const canEditCurrentProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canEdit === true && String(project.value?.status || '') === '1')
const canSubmitCloseCurrentProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canSubmitClose === true)
const isProjectVisitor = computed(() => projectPermissionContext.value?.isVisitor === true)
const groupPermissions = computed(() => fieldPermissionResult.value?.groups || {})

function canViewGroup(groupCode) {
  return (groupPermissions.value[groupCode] || 'editable') !== 'hidden'
}

const publishReviewLoading = ref(false)
const confirmPlanImpactLoading = ref(false)
const confirmScopeLoading = ref(false)
const confirmTargetLoading = ref(false)

const today = computed(() => new Date())
const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => project.value.customer || customerMap.value.get(String(project.value.customerId || '')) || null)
const displayPlanStartDate = computed(() => project.value?.planStartDate || project.value?.startDate || '')
const displayPlanEndDate = computed(() => project.value?.planEndDate || project.value?.endDate || '')
const displayActualStartDate = computed(() => project.value?.actualStartDate || '')
const displayActualEndDate = computed(() => project.value?.actualEndDate || '')
const completedTaskStatuses = ['3']
const resolvedTicketStatuses = ['3', '4']
const closedRiskStatuses = ['4', '5']
const dueSoonDays = 7
const validTabs = new Set(['overview', 'focus', 'plan', 'tasks', 'tickets', 'milestones', 'risks', 'changes', 'sprints', 'knowledge', 'closure'])
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

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return '-'
  return `${startDate || '-'} 至 ${endDate || '-'}`
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

function getHealthTagType(level) {
  if (level === 'healthy') return 'success'
  if (level === 'stable') return 'primary'
  if (level === 'attention') return 'warning'
  return 'danger'
}

const taskSummary = computed(() => dashboard.value.summary?.taskSummary || { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, dueSoon: 0, completionRate: 0 })
const ticketSummary = computed(() => dashboard.value.summary?.ticketSummary || { total: 0, open: 0, critical: 0 })
const riskSummary = computed(() => dashboard.value.summary?.riskSummary || { total: 0, active: 0, high: 0, overdue: 0 })
const changeSummary = computed(() => dashboard.value.summary?.changeSummary || { total: 0, pendingApproval: 0, highImpact: 0, implemented: 0 })
const milestoneSummary = computed(() => dashboard.value.summary?.milestoneSummary || { total: 0, completed: 0, delayed: 0, dueSoon: 0, overdue: 0, completionRate: 0 })
const sprintSummary = computed(() => dashboard.value.summary?.sprintSummary || { total: 0, active: 0, planning: 0, current: null })
const projectKnowledgeSummary = computed(() => knowledgeSummary.value || { total: 0, faq: 0, experience: 0, delivery: 0, recentUpdatedCount: 0 })
const projectHealthSummary = computed(() => dashboard.value.summary?.healthSummary || { totalScore: 0, level: 'stable', levelLabel: '基本健康', dimensions: {}, alerts: [] })
const changeImpactSummary = computed(() => dashboard.value.summary?.changeImpactSummary || { total: 0, scheduleChanged: 0, costChanged: 0, impactedMilestones: [], impactedSprints: [], impactedTasks: [] })
const costVariance = computed(() => Number(dashboard.value.summary?.costVariance || 0))

const dueSoonTasks = computed(() => dashboard.value.focus?.dueSoonTasks || [])
const overdueTasks = computed(() => dashboard.value.focus?.overdueTasks || [])
const criticalTickets = computed(() => dashboard.value.focus?.criticalTickets || [])
const highRisks = computed(() => dashboard.value.focus?.highRisks || [])
const pendingChanges = computed(() => dashboard.value.focus?.pendingChanges || [])
const dueSoonMilestones = computed(() => dashboard.value.focus?.dueSoonMilestones || [])
const latestKnowledgeArticles = computed(() => knowledgeArticles.value || [])
const projectAlerts = computed(() => dashboard.value.focus?.alerts || [])
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

const executionPlanMilestones = computed(() => {
  return [...milestones.value]
    .map((milestone) => {
      const linkedTasks = tasks.value.filter((task) => String(task.milestoneId || '') === String(milestone.id || ''))
      return {
        ...milestone,
        linkedTasks,
        taskCount: linkedTasks.length,
        completedTaskCount: linkedTasks.filter((task) => isTaskCompleted(task)).length,
      }
    })
    .sort((a, b) => {
      const aDate = getDateValue(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
      const bDate = getDateValue(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER
      if (aDate !== bDate) return aDate - bDate
      return Number(a.sort || 0) - Number(b.sort || 0)
    })
})

const sprintExecutionPlan = computed(() => {
  return [...sprints.value]
    .map((sprint) => {
      const sprintTasks = tasks.value.filter((task) => String(task.sprintId || '') === String(sprint.id || ''))
      const completedTaskCount = sprintTasks.filter((task) => isTaskCompleted(task)).length
      const storyPoints = sprintTasks.reduce((sum, task) => sum + Number(task.storyPoints || 0), 0)
      return {
        ...sprint,
        sprintTasks,
        linkedMilestones: executionPlanMilestones.value.filter((milestone) => milestone.linkedTasks.some((task) => String(task.sprintId || '') === String(sprint.id || ''))),
        completedTaskCount,
        storyPoints,
      }
    })
    .sort((a, b) => {
      const aDate = getDateValue(a.startDate)?.getTime() || Number.MAX_SAFE_INTEGER
      const bDate = getDateValue(b.startDate)?.getTime() || Number.MAX_SAFE_INTEGER
      return aDate - bDate
    })
})

const unplannedTasks = computed(() => {
  return tasks.value
    .filter((task) => !String(task.sprintId || '').trim())
    .sort((a, b) => {
      const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0)
      if (priorityDiff !== 0) return priorityDiff
      return (getDaysDiff(a.endDate) ?? 999) - (getDaysDiff(b.endDate) ?? 999)
    })
})

const executionPlanSummary = computed(() => ({
  milestones: executionPlanMilestones.value.length,
  sprints: sprintExecutionPlan.value.length,
  plannedTasks: tasks.value.length - unplannedTasks.value.length,
  unplannedTasks: unplannedTasks.value.length,
}))

const executionPlanProgress = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((executionPlanSummary.value.plannedTasks / tasks.value.length) * 100)
})

const delayedMilestonesForPlan = computed(() => {
  return executionPlanMilestones.value.filter((item) => String(item.status || '') === '3' || (String(item.status || '') !== '2' && (getDaysDiff(item.dueDate) ?? 1) < 0))
})

const delayedSprintsForPlan = computed(() => {
  return sprintExecutionPlan.value.filter((item) => String(item.status || '') === '2' && (getDaysDiff(item.endDate) ?? 1) < 0)
})

const dueSoonPlannedTasks = computed(() => {
  return tasks.value.filter((task) => String(task.sprintId || '').trim() && !isTaskCompleted(task) && (getDaysDiff(task.endDate) ?? 99) >= 0 && (getDaysDiff(task.endDate) ?? 99) <= dueSoonDays)
})

const overduePlannedTasks = computed(() => {
  return tasks.value.filter((task) => String(task.sprintId || '').trim() && !isTaskCompleted(task) && (getDaysDiff(task.endDate) ?? 1) < 0)
})

const planDeviationSummary = computed(() => ({
  delayedMilestones: delayedMilestonesForPlan.value.length,
  delayedSprints: delayedSprintsForPlan.value.length,
  overduePlannedTasks: overduePlannedTasks.value.length,
  dueSoonPlannedTasks: dueSoonPlannedTasks.value.length,
  unplannedTasks: unplannedTasks.value.length,
}))

const planDeviationAlerts = computed(() => {
  const alerts = []
  if (planDeviationSummary.value.delayedMilestones > 0) {
    alerts.push({
      type: 'danger',
      title: '里程碑已出现延期',
      desc: `当前共有 ${planDeviationSummary.value.delayedMilestones} 个里程碑已延期或超期，建议优先核对交付节点和任务完成情况。`,
    })
  }
  if (planDeviationSummary.value.delayedSprints > 0) {
    alerts.push({
      type: 'warning',
      title: 'Sprint 进度偏慢',
      desc: `当前共有 ${planDeviationSummary.value.delayedSprints} 个进行中的 Sprint 已超出计划结束日期，建议尽快调整任务范围或结束节奏。`,
    })
  }
  if (planDeviationSummary.value.overduePlannedTasks > 0) {
    alerts.push({
      type: 'danger',
      title: '计划内任务已逾期',
      desc: `当前共有 ${planDeviationSummary.value.overduePlannedTasks} 个已纳入执行计划的任务逾期，说明执行计划和实际推进已经产生明显偏差。`,
    })
  }
  if (planDeviationSummary.value.unplannedTasks > 0) {
    alerts.push({
      type: 'info',
      title: '仍有任务未纳入执行计划',
      desc: `当前仍有 ${planDeviationSummary.value.unplannedTasks} 个任务未归入 Sprint，建议尽快纳入执行编排，避免工作项游离于计划之外。`,
    })
  }
  if (!alerts.length) {
    alerts.push({
      type: 'success',
      title: '当前计划偏差可控',
      desc: '目前未发现明显的延期节点和计划异常，建议持续关注临近到期任务与 Sprint 结束节奏。',
    })
  }
  return alerts
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

watch(
  () => route.query.id,
  async () => {
    await reloadCurrent()
  },
)

async function reloadCurrent() {
  if (!projectId.value) return
  const [statusRes, priorityRes, projectTypeRes, knowledgeTypeRes, customerRes, deptRes, dashboardRes, fieldPermissionsRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getProjectType(),
    getKnowledgeTypes(),
    getCustomerList({ pageNum: 1, pageSize: 1000 }),
    getDeptTrees({}),
    getDashboard(projectId.value),
    getFieldPermissions(projectId.value),
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  projectTypeMap.value = projectTypeRes.data || {}
  knowledgeTypeMap.value = knowledgeTypeRes.data || {}
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
  dashboard.value = dashboardRes.data || {}
  fieldPermissionResult.value = fieldPermissionsRes?.data || fieldPermissionsRes || null
  projectPermissionContext.value = {
    ...(dashboard.value.permissionContext || {}),
    ...(fieldPermissionResult.value?.permissionContext || {}),
  }
  project.value = dashboard.value.project || {}
  tasks.value = dashboard.value.tasks || []
  tickets.value = dashboard.value.tickets || []
  milestones.value = dashboard.value.milestones || []
  risks.value = dashboard.value.risks || []
  changes.value = dashboard.value.changes || []
  sprints.value = dashboard.value.sprints || []
  knowledgeSummary.value = dashboard.value.summary?.knowledgeSummary || {}
  knowledgeArticles.value = dashboard.value.focus?.latestKnowledgeArticles || []
  syncProjectAlerts(projectId.value).catch(() => {})
}

function goToProjectKnowledgeList() {
  if (!project.value?.knowledgeCatalogId) return
  router.push({ path: '/content/articleManage/manage', query: { catalogId: project.value.knowledgeCatalogId } })
}

function goToProjectKnowledgeCreate() {
  if (!canAddKnowledgeInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!project.value?.knowledgeCatalogId) return
  router.push({ path: '/content/aev', query: { catalogId: project.value.knowledgeCatalogId } })
}

function goToProjectKnowledgeTemplate(template) {
  if (!canAddKnowledgeInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!project.value?.knowledgeCatalogId) return
  router.push({ path: '/content/aev', query: { catalogId: project.value.knowledgeCatalogId, template } })
}

function goToKnowledgeDetail(id) {
  if (!id) return
  router.push({ path: '/content/articleManage/view', query: { id } })
}

function createProjectScopedRecord(path) {
  if (!projectId.value) return
  router.push({ path, query: { projectId: projectId.value } })
}

function handleSubmitClose() {
  if (!canSubmitCloseCurrentProject.value) return $sdk.msgWarning('当前操作没有权限')
  submitClose(projectId.value).then(() => {
    $sdk.msgSuccess('结项申请已提交')
    reloadCurrent()
  }).catch(e => {
    $sdk.msgError(e.message || '提交失败')
  })
}

function handlePublishCloseReview() {
  if (!canAddKnowledgeInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!projectId.value) return
  if (!project.value?.closeReview?.trim()) {
    return $sdk.msgWarning('请先完善项目复盘后再沉淀到知识中心')
  }
  publishReviewLoading.value = true
  publishCloseReview(projectId.value).then((res) => {
    $sdk.msgSuccess('项目复盘已沉淀到知识中心')
    const articleId = res?.data?.articleId || res?.articleId
    if (articleId) {
      goToKnowledgeDetail(articleId)
    } else {
      goToProjectKnowledgeList()
    }
  }).catch((e) => {
    $sdk.msgError(e.message || '沉淀项目复盘失败')
  }).finally(() => {
    publishReviewLoading.value = false
  })
}

function goToEdit() {
  if (!projectId.value) return
  router.push({ path: '/projectManage/form', query: { id: projectId.value } })
}

function goToProjectChange(type = '6') {
  if (!projectId.value) return
  router.push({ path: '/changeManage/form', query: { projectId: projectId.value, type } })
}

function goToCockpit() {
  router.push({ path: '/projectManage/cockpit', query: { projectId: projectId.value } })
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
  if (isProjectVisitor.value && ['focus', 'plan', 'tasks', 'tickets', 'milestones', 'risks', 'changes', 'sprints', 'closure'].includes(tab)) {
    return 'overview'
  }
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
    id: projectId.value,
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

function handleProjectAlertClick(item) {
  if (!item?.tab) return
  if (item.tab === 'plan' || item.tab === 'closure' || item.filter === 'unplanned' || item.filter === 'incomplete') {
    goToTab(item.tab)
    return
  }
  goToTabWithFilter(item.tab, item.filter || 'all')
}

function handleOpenImpactedItem(type, item) {
  if (!item?.id) return
  const pathMap = {
    milestone: '/milestoneManage/form',
    sprint: '/sprintManage/form',
    task: '/taskManage/form',
  }
  goToDetail(pathMap[type], item.id)
}

function handleOpenImpactedGroup(type) {
  const firstItemMap = {
    milestone: changeImpactSummary.value?.impactedMilestones?.[0],
    sprint: changeImpactSummary.value?.impactedSprints?.[0],
    task: changeImpactSummary.value?.impactedTasks?.[0],
  }
  handleOpenImpactedItem(type, firstItemMap[type])
}

function handleConfirmPlanImpact(changeId) {
  if (!canManagePlanInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!changeId) return
  ElMessageBox.prompt('请输入本次计划影响处理说明（选填）', '确认已处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '例如：已调整里程碑日期并同步相关任务负责人',
  }).then(({ value }) => {
    confirmPlanImpactLoading.value = true
    confirmPlanImpact(changeId, { remark: value || '' }).then(() => {
      $sdk.msgSuccess('已确认计划影响处理')
      reloadCurrent()
    }).catch((e) => {
      $sdk.msgError(e.message || '确认失败')
    }).finally(() => {
      confirmPlanImpactLoading.value = false
    })
  }).catch(() => {})
}

function handleConfirmPlanImpactScope(changeId, scope) {
  if (!canManagePlanInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!changeId || !scope) return
  ElMessageBox.prompt('请输入本次分项处理说明（选填）', '确认分项已处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '例如：已调整相关里程碑日期并同步责任人',
  }).then(({ value }) => {
    confirmScopeLoading.value = true
    confirmPlanImpactScope(changeId, { scope, remark: value || '' }).then(() => {
      $sdk.msgSuccess('已确认分项处理')
      reloadCurrent()
    }).catch((e) => {
      $sdk.msgError(e.message || '确认失败')
    }).finally(() => {
      confirmScopeLoading.value = false
    })
  }).catch(() => {})
}

function handleConfirmPlanImpactTarget(changeId, scope, target) {
  if (!canManagePlanInProject.value) return $sdk.msgWarning('当前操作没有权限')
  if (!changeId || !scope || !target?.id) return
  ElMessageBox.prompt('请输入本次对象处理说明（选填）', '确认对象已处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '例如：已更新该对象的时间安排并同步相关责任人',
  }).then(({ value }) => {
    confirmTargetLoading.value = true
    confirmPlanImpactTarget(changeId, {
      scope,
      targetId: target.id,
      targetName: target.name,
      remark: value || '',
    }).then(() => {
      $sdk.msgSuccess('已确认对象处理')
      reloadCurrent()
    }).catch((e) => {
      $sdk.msgError(e.message || '确认失败')
    }).finally(() => {
      confirmTargetLoading.value = false
    })
  }).catch(() => {})
}

function goToDetail(path, id, query = {}) {
  if (!id) return
  router.push({ path, query: { id, action: 'view', ...query } })
}

function getProjectApprovalText(project) {
  if (project?.approvalStatus === '0') return '未提交审批'
  const hasApprovalStarted = Boolean(project?.workflowInstanceId) || !['', '0', undefined, null].includes(project?.approvalStatus)
  if (!hasApprovalStarted) return '-'
  if (project?.approvalStatus === '3' && String(project?.currentNodeName || '').includes('退回发起人')) return '已退回发起人'
  return ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[project?.approvalStatus] || '-')
}
</script>

<template>
  <div class="project-detail-page">
    <el-page-header @back="$router.back()" title="项目详情">
      <template #extra>
        <el-button @click="goToCockpit">进入驾驶舱</el-button>
        <el-button v-if="canEditCurrentProject" type="primary" @click="goToEdit">编辑项目</el-button>
        <el-button v-if="canSubmitCloseCurrentProject && project.status === '3'" type="warning" @click="handleSubmitClose">提交结项申请</el-button>
      </template>
    </el-page-header>

    <div class="project-hero mt20">
      <div class="project-hero__main">
        <div class="project-hero__title-row">
          <div>
            <div class="project-hero__title">{{ project.name || '-' }}</div>
            <div class="project-hero__code">{{ project.code || '-' }}</div>
          </div>
            <div class="project-hero__tags">
              <ViewTagField :text="statusMap[project.status]" :type="getProjectStatusType(project.status)" />
              <ViewTagField :text="getProjectApprovalText(project)" :type="getApprovalType(project.approvalStatus)" />
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
            <span class="project-meta-item__label">来源合同</span>
            <ViewEntity v-if="project.contract" :title="project.contract?.name" :subtitle="project.contract?.code" />
            <div v-else class="project-meta-item__value">-</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目类型</span>
            <div class="project-meta-item__value">{{ projectTypeMap[project.projectType] || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">来源商机</span>
            <ViewEntity v-if="project.opportunity" :title="project.opportunity?.name" :subtitle="project.opportunity?.code" />
            <div v-else class="project-meta-item__value">-</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">所属部门</span>
            <div class="project-meta-item__value">{{ deptMap[project.departmentId] || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目分类</span>
            <div class="project-meta-item__value">{{ project.category || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目阶段</span>
            <div class="project-meta-item__value">{{ phaseMap[project.phase] || project.phase || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目发起人</span>
            <div class="project-meta-item__value">{{ project.creator?.nickname || project.creator?.name || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">计划周期</span>
            <div class="project-meta-item__value">{{ formatDateRange(displayPlanStartDate, displayPlanEndDate) }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">实际周期</span>
            <div class="project-meta-item__value">{{ formatDateRange(displayActualStartDate, displayActualEndDate) }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">业务线</span>
            <div class="project-meta-item__value">{{ project.businessLine || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">行业</span>
            <div class="project-meta-item__value">{{ project.industry || '-' }}</div>
          </div>
          <div class="project-meta-item">
            <span class="project-meta-item__label">项目来源</span>
            <div class="project-meta-item__value">{{ project.projectSource || '-' }}</div>
          </div>
        </div>
      </div>

      <div class="project-hero__side">
        <div v-if="!isProjectVisitor" class="hero-action-card">
          <div class="hero-action-card__title">快捷发起</div>
          <div class="hero-action-card__desc">从项目上下文直接发起核心业务动作，把任务、风险、变更、工单、Sprint 和知识收口到同一个工作台。</div>
          <div class="hero-action-card__grid">
            <el-button v-if="canAddTaskInProject" @click="createProjectScopedRecord('/taskManage/form')">新增任务</el-button>
            <el-button v-if="canAddRiskInProject" @click="createProjectScopedRecord('/projectManage/riskManage/form')">新增风险</el-button>
            <el-button v-if="canAddChangeInProject" @click="createProjectScopedRecord('/changeManage/form')">新增变更</el-button>
            <el-button v-if="canAddTicketInProject" @click="createProjectScopedRecord('/ticketManage/form')">新增工单</el-button>
            <el-button v-if="canAddSprintInProject" @click="createProjectScopedRecord('/sprintManage/form')">新增 Sprint</el-button>
            <el-button v-if="canAddKnowledgeInProject" type="primary" @click="goToProjectKnowledgeCreate">新增知识</el-button>
          </div>
        </div>

        <div class="hero-stat-card">
          <div class="hero-stat-card__label">预算</div>
          <div class="hero-stat-card__value">{{ project.currency || 'CNY' }} {{ Number(project.budget || 0).toLocaleString() }}</div>
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
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('tasks', 'all')">
            <div class="metric-card__value">{{ taskSummary.total }}</div>
            <div class="metric-card__label">总任务数</div>
            <div class="metric-card__desc">已完成 {{ taskSummary.completed }}，逾期 {{ taskSummary.overdue }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('tickets', 'open')">
            <div class="metric-card__value">{{ ticketSummary.open }}</div>
            <div class="metric-card__label">打开缺陷</div>
            <div class="metric-card__desc">严重缺陷 {{ ticketSummary.critical }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('risks', 'active')">
            <div class="metric-card__value">{{ riskSummary.active }}</div>
            <div class="metric-card__label">活跃风险</div>
            <div class="metric-card__desc">高风险 {{ riskSummary.high }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('changes', 'pending')">
            <div class="metric-card__value">{{ changeSummary.pendingApproval }}</div>
            <div class="metric-card__label">待审批变更</div>
            <div class="metric-card__desc">高影响 {{ changeSummary.highImpact }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('sprints', 'active')">
            <div class="metric-card__value">{{ sprintSummary.active }}</div>
            <div class="metric-card__label">当前 Sprint</div>
            <div class="metric-card__desc">总 Sprint {{ sprintSummary.total }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick('milestones', 'delayed')">
            <div class="metric-card__value">{{ milestoneSummary.completionRate }}%</div>
            <div class="metric-card__label">里程碑达成率</div>
            <div class="metric-card__desc">延期 {{ milestoneSummary.delayed }}，临近 {{ milestoneSummary.dueSoon }}</div>
          </el-card>
          <el-card shadow="hover" class="metric-card metric-card--clickable" @click="goToTab('knowledge')">
            <div class="metric-card__value">{{ projectKnowledgeSummary.total || 0 }}</div>
            <div class="metric-card__label">项目知识</div>
            <div class="metric-card__desc">最近更新 {{ projectKnowledgeSummary.recentUpdatedCount || 0 }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="goToTab('plan')">
            <div class="metric-card__value">{{ executionPlanProgress }}%</div>
            <div class="metric-card__label">执行计划覆盖率</div>
            <div class="metric-card__desc">已纳入 {{ executionPlanSummary.plannedTasks }} / 总任务 {{ taskSummary.total }}</div>
          </el-card>
          <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card">
            <div class="metric-card__value">{{ projectHealthSummary.totalScore || 0 }}</div>
            <div class="metric-card__label">项目健康度</div>
            <div class="metric-card__desc">
              <ViewTagField :text="projectHealthSummary.levelLabel || '基本健康'" :type="getHealthTagType(projectHealthSummary.level)" />
            </div>
          </el-card>
          <el-card v-if="!isProjectVisitor && canViewGroup('projectClosure')" shadow="hover" class="metric-card metric-card--clickable" @click="goToTab('closure')">
            <div class="metric-card__value">{{ project.closeReview ? '已补齐' : '待完善' }}</div>
            <div class="metric-card__label">结项资料</div>
            <div class="metric-card__desc">验收说明、交付清单、遗留问题与项目复盘</div>
          </el-card>
        </div>

        <el-card shadow="hover" class="mt20 panel-card">
          <template #header>统一提醒</template>
          <div v-if="!isProjectVisitor && projectAlerts.length" class="project-alert-grid">
            <div v-for="item in projectAlerts" :key="`${item.tab}-${item.title}`" class="project-alert-card" :class="`project-alert-card--${item.type}`" @click="handleProjectAlertClick(item)">
              <div class="project-alert-card__header">
                <span>{{ item.title }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div class="project-alert-card__desc">{{ item.desc }}</div>
            </div>
          </div>
          <div v-else class="focus-list__empty">{{ isProjectVisitor ? '访客角色不展示项目执行提醒' : '当前项目暂无需要重点跟进的提醒' }}</div>
        </el-card>

        <div v-if="!isProjectVisitor" class="focus-grid mt20">
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

        <el-row v-if="!isProjectVisitor && hasOverviewCharts" :gutter="20" class="mt20">
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
                    <span class="panel-progress-item__label">
                      总体进度
                      <el-tooltip content="按项目下已完成任务数 / 总任务数自动计算" placement="top">
                        <el-icon class="panel-progress-item__tip"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
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
                <div v-if="canViewGroup('projectMember') && coreMembers.length" class="core-member-list">
                  <div v-for="item in coreMembers" :key="item.id || item.userId" class="core-member-item">
                    <ViewUser :user="item.user" />
                    <div class="core-member-item__role">{{ item.role ? item.role : '-' }}</div>
                  </div>
                </div>
                <div v-else class="focus-list__empty">{{ canViewGroup('projectMember') ? '暂无核心成员' : '当前角色无权查看项目成员' }}</div>
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

        <el-row :gutter="20" class="mt20">
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="panel-card">
              <template #header>项目健康度</template>
              <div class="health-score-card">
                <div class="health-score-card__main">
                  <div class="health-score-card__score">{{ projectHealthSummary.totalScore || 0 }}</div>
                  <ViewTagField :text="projectHealthSummary.levelLabel || '基本健康'" :type="getHealthTagType(projectHealthSummary.level)" />
                </div>
                <div class="health-score-card__desc">基于进度、风险、变更、执行透明度、交付达成和知识沉淀六个维度综合评估当前项目运行状态。</div>
              </div>
              <div class="health-dimension-grid">
                <div class="health-dimension-card">
                  <span>进度</span>
                  <strong>{{ projectHealthSummary.dimensions?.progress?.score || 0 }}/25</strong>
                </div>
                <div class="health-dimension-card">
                  <span>风险</span>
                  <strong>{{ projectHealthSummary.dimensions?.risk?.score || 0 }}/20</strong>
                </div>
                <div class="health-dimension-card">
                  <span>变更</span>
                  <strong>{{ projectHealthSummary.dimensions?.change?.score || 0 }}/15</strong>
                </div>
                <div class="health-dimension-card">
                  <span>执行</span>
                  <strong>{{ projectHealthSummary.dimensions?.execution?.score || 0 }}/15</strong>
                </div>
                <div class="health-dimension-card">
                  <span>交付</span>
                  <strong>{{ projectHealthSummary.dimensions?.delivery?.score || 0 }}/15</strong>
                </div>
                <div class="health-dimension-card">
                  <span>知识</span>
                  <strong>{{ projectHealthSummary.dimensions?.knowledge?.score || 0 }}/10</strong>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="panel-card">
              <template #header>健康度异常提示</template>
              <div v-if="projectHealthSummary.alerts?.length" class="health-alert-list">
                <div v-for="item in projectHealthSummary.alerts" :key="item" class="health-alert-item">
                  {{ item }}
                </div>
              </div>
              <div v-else class="focus-list__empty">当前暂无健康度异常提示</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" class="mt20 panel-card">
          <template #header>项目描述</template>
          <ViewRichText :html="project.description" />
        </el-card>

        <el-card v-if="canViewGroup('projectMember')" shadow="hover" class="mt20 panel-card">
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

      <el-tab-pane v-if="!isProjectVisitor" label="交付焦点" name="focus">
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

      <el-tab-pane v-if="!isProjectVisitor" label="计划" name="plan">
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>关键里程碑</span><strong>{{ executionPlanSummary.milestones }}</strong></div>
          <div class="tab-summary-card"><span>Sprint 数量</span><strong>{{ executionPlanSummary.sprints }}</strong></div>
          <div class="tab-summary-card"><span>已纳入执行计划任务</span><strong>{{ executionPlanSummary.plannedTasks }}</strong></div>
          <div class="tab-summary-card"><span>待纳入执行计划任务</span><strong>{{ executionPlanSummary.unplannedTasks }}</strong></div>
          <div class="tab-summary-card"><span>执行计划覆盖率</span><strong>{{ executionPlanProgress }}%</strong></div>
        </div>

        <div class="tab-summary-grid mt16">
          <div class="tab-summary-card tab-summary-card--warning"><span>延期里程碑</span><strong>{{ planDeviationSummary.delayedMilestones }}</strong></div>
          <div class="tab-summary-card tab-summary-card--warning"><span>延期 Sprint</span><strong>{{ planDeviationSummary.delayedSprints }}</strong></div>
          <div class="tab-summary-card tab-summary-card--danger"><span>逾期计划内任务</span><strong>{{ planDeviationSummary.overduePlannedTasks }}</strong></div>
          <div class="tab-summary-card"><span>临近到期计划内任务</span><strong>{{ planDeviationSummary.dueSoonPlannedTasks }}</strong></div>
          <div class="tab-summary-card"><span>计划外任务</span><strong>{{ planDeviationSummary.unplannedTasks }}</strong></div>
        </div>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>变更影响回写计划</template>
          <div class="plan-impact-actions">
            <el-button :disabled="!changeImpactSummary.impactedMilestones?.length" @click="handleOpenImpactedGroup('milestone')">处理受影响里程碑</el-button>
            <el-button :disabled="!changeImpactSummary.impactedSprints?.length" @click="handleOpenImpactedGroup('sprint')">处理受影响 Sprint</el-button>
            <el-button :disabled="!changeImpactSummary.impactedTasks?.length" type="primary" @click="handleOpenImpactedGroup('task')">处理受影响任务</el-button>
          </div>
          <div class="tab-summary-grid">
            <div class="tab-summary-card"><span>已生效变更</span><strong>{{ changeImpactSummary.total || 0 }}</strong></div>
            <div class="tab-summary-card"><span>待确认处理</span><strong>{{ changeImpactSummary.pendingConfirm || 0 }}</strong></div>
            <div class="tab-summary-card"><span>进度受影响变更</span><strong>{{ changeImpactSummary.scheduleChanged || 0 }}</strong></div>
            <div class="tab-summary-card"><span>成本受影响变更</span><strong>{{ changeImpactSummary.costChanged || 0 }}</strong></div>
            <div class="tab-summary-card"><span>受影响里程碑</span><strong>{{ changeImpactSummary.impactedMilestones?.length || 0 }}</strong></div>
            <div class="tab-summary-card"><span>受影响 Sprint</span><strong>{{ changeImpactSummary.impactedSprints?.length || 0 }}</strong></div>
            <div class="tab-summary-card"><span>受影响任务</span><strong>{{ changeImpactSummary.impactedTasks?.length || 0 }}</strong></div>
          </div>
          <div v-if="changeImpactSummary.actionableChanges?.length" class="plan-impact-confirm-list mt16">
            <div v-for="item in changeImpactSummary.actionableChanges" :key="item.id" class="plan-impact-confirm-item">
              <div>
                <div class="plan-impact-confirm-item__title">{{ item.title }}</div>
                <div class="plan-impact-confirm-item__meta">进度影响 {{ item.scheduleImpact || 0 }} 天 / 成本影响 {{ item.costImpact || 0 }}</div>
                <div v-if="String(item.planImpactConfirmed || '0') === '1' && item.planImpactConfirmRemark" class="plan-impact-confirm-item__remark">处理记录：{{ item.planImpactConfirmRemark }}</div>
                <div class="plan-impact-confirm-item__scopes">
                  <ViewTagField :text="item.planImpactScopes?.milestone?.confirmed ? '里程碑已处理' : '里程碑待处理'" :type="item.planImpactScopes?.milestone?.confirmed ? 'success' : 'warning'" />
                  <ViewTagField :text="item.planImpactScopes?.sprint?.confirmed ? 'Sprint已处理' : 'Sprint待处理'" :type="item.planImpactScopes?.sprint?.confirmed ? 'success' : 'warning'" />
                  <ViewTagField :text="item.planImpactScopes?.task?.confirmed ? '任务已处理' : '任务待处理'" :type="item.planImpactScopes?.task?.confirmed ? 'success' : 'warning'" />
                </div>
                <div class="plan-impact-confirm-item__scope-records">
                  <div v-if="item.planImpactScopes?.milestone?.remark">里程碑处理：{{ item.planImpactScopes.milestone.remark }}</div>
                  <div v-if="item.planImpactScopes?.sprint?.remark">Sprint 处理：{{ item.planImpactScopes.sprint.remark }}</div>
                  <div v-if="item.planImpactScopes?.task?.remark">任务处理：{{ item.planImpactScopes.task.remark }}</div>
                </div>
              </div>
              <div class="plan-impact-confirm-item__actions">
                <ViewTagField :text="String(item.planImpactConfirmed || '0') === '1' ? '已确认处理' : '待确认处理'" :type="String(item.planImpactConfirmed || '0') === '1' ? 'success' : 'warning'" />
                <el-button link type="primary" @click="goToDetail('/changeManage/form', item.id)">详情</el-button>
                <el-button v-if="canManagePlanInProject && !item.planImpactScopes?.milestone?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope(item.id, 'milestone')">确认里程碑已处理</el-button>
                <el-button v-if="canManagePlanInProject && !item.planImpactScopes?.sprint?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope(item.id, 'sprint')">确认 Sprint 已处理</el-button>
                <el-button v-if="canManagePlanInProject && !item.planImpactScopes?.task?.confirmed" :loading="confirmScopeLoading" @click="handleConfirmPlanImpactScope(item.id, 'task')">确认任务已处理</el-button>
                <el-button v-if="canManagePlanInProject && String(item.planImpactConfirmed || '0') !== '1'" :loading="confirmPlanImpactLoading" type="primary" @click="handleConfirmPlanImpact(item.id)">确认已处理</el-button>
              </div>
            </div>
          </div>
          <div class="plan-deviation-grid mt16">
            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">受影响里程碑</div>
              <div v-if="changeImpactSummary.impactedMilestones?.length" class="focus-list">
                <div v-for="item in changeImpactSummary.impactedMilestones.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">
                    <el-button link type="primary" @click="handleOpenImpactedItem('milestone', item)">{{ item.name }}</el-button>
                  </div>
                  <div class="focus-list__meta">计划完成 {{ item.dueDate || '-' }}</div>
                  <div class="focus-list__actions">
                    <template v-for="change in changeImpactSummary.actionableChanges" :key="change.id">
                      <el-button v-if="canManagePlanInProject && !item.confirms?.some((confirm) => confirm.changeId === change.id)" link type="warning" :loading="confirmTargetLoading" @click="handleConfirmPlanImpactTarget(change.id, 'milestone', item)">确认 {{ change.title }} 已处理</el-button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无受影响里程碑</div>
            </div>

            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">受影响 Sprint</div>
              <div v-if="changeImpactSummary.impactedSprints?.length" class="focus-list">
                <div v-for="item in changeImpactSummary.impactedSprints.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">
                    <el-button link type="primary" @click="handleOpenImpactedItem('sprint', item)">{{ item.name }}</el-button>
                  </div>
                  <div class="focus-list__meta">{{ item.startDate || '-' }} 至 {{ item.endDate || '-' }}</div>
                  <div class="focus-list__actions">
                    <template v-for="change in changeImpactSummary.actionableChanges" :key="change.id">
                      <el-button v-if="canManagePlanInProject && !item.confirms?.some((confirm) => confirm.changeId === change.id)" link type="warning" :loading="confirmTargetLoading" @click="handleConfirmPlanImpactTarget(change.id, 'sprint', item)">确认 {{ change.title }} 已处理</el-button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无受影响 Sprint</div>
            </div>

            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">受影响任务</div>
              <div v-if="changeImpactSummary.impactedTasks?.length" class="focus-list">
                <div v-for="item in changeImpactSummary.impactedTasks.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">
                    <el-button link type="primary" @click="handleOpenImpactedItem('task', item)">{{ item.name }}</el-button>
                  </div>
                  <div class="focus-list__meta">截止 {{ item.endDate || '-' }}</div>
                  <div class="focus-list__actions">
                    <template v-for="change in changeImpactSummary.actionableChanges" :key="change.id">
                      <el-button v-if="canManagePlanInProject && !item.confirms?.some((confirm) => confirm.changeId === change.id)" link type="warning" :loading="confirmTargetLoading" @click="handleConfirmPlanImpactTarget(change.id, 'task', item)">确认 {{ change.title }} 已处理</el-button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无受影响任务</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>计划异常提示</template>
          <div class="plan-alert-list">
            <div v-for="item in planDeviationAlerts" :key="item.title" class="plan-alert-item" :class="`plan-alert-item--${item.type}`">
              <div class="plan-alert-item__title">{{ item.title }}</div>
              <div class="plan-alert-item__desc">{{ item.desc }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card plan-action-card">
          <div class="plan-action-card__header">
            <div>
              <div class="plan-action-card__title">执行计划编排动作</div>
              <div class="plan-action-card__desc">先维护里程碑和基线计划，再把任务纳入 Sprint，逐步把执行过程从零散推进转成结构化计划。</div>
            </div>
            <div class="plan-action-card__actions">
              <el-button v-if="canAddSprintInProject" @click="createProjectScopedRecord('/sprintManage/form')">新增 Sprint</el-button>
              <el-button v-if="canAddTaskInProject" @click="createProjectScopedRecord('/taskManage/form')">新增任务</el-button>
              <el-button v-if="canManagePlanInProject" type="primary" @click="goToProjectChange('2')">调整基线计划</el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>
            <div class="focus-card__header">
              <span>执行计划说明</span>
            </div>
          </template>
          <div class="plan-intro-card">
            <div class="plan-intro-card__block">
              <div class="plan-intro-card__label">计划边界</div>
              <div class="plan-intro-card__value">{{ project.scopeBoundary || '暂未填写范围边界说明' }}</div>
            </div>
            <div class="plan-intro-card__block">
              <div class="plan-intro-card__label">主要交付物</div>
              <div class="plan-intro-card__value">{{ project.baselineDeliverables || '暂未填写主要交付物' }}</div>
            </div>
            <div class="plan-intro-card__block">
              <div class="plan-intro-card__label">计划说明</div>
              <div class="plan-intro-card__value">{{ project.baselinePlanNote || '暂未补充执行计划说明' }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>关键里程碑时间轴</template>
          <div v-if="executionPlanMilestones.length" class="plan-milestone-list">
            <div v-for="item in executionPlanMilestones" :key="item.id" class="plan-milestone-item">
              <div class="plan-milestone-item__date">{{ item.dueDate || '-' }}</div>
              <div class="plan-milestone-item__body">
                <div class="plan-milestone-item__header">
                  <div class="plan-milestone-item__title">{{ item.name }}</div>
                  <ViewTagField :text="{ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[item.status] || '-'" :type="item.status === '2' ? 'success' : item.status === '3' ? 'danger' : 'info'" />
                </div>
                <div class="plan-milestone-item__meta">关联任务 {{ item.taskCount || 0 }} / 已完成 {{ item.completedTaskCount || 0 }} / {{ formatDiffLabel(item.dueDate, '已超期', '即将到期') }}</div>
                <div class="plan-milestone-item__desc">{{ item.description || '暂未补充里程碑说明' }}</div>
                <div v-if="item.linkedTasks?.length" class="plan-milestone-item__tasks">
                  <div v-for="task in item.linkedTasks.slice(0, 5)" :key="task.id" class="plan-milestone-item__task-chip">
                    <el-button link type="primary" @click="goToDetail('/taskManage/form', task.id)">{{ task.name || '-' }}</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="focus-list__empty">当前项目暂无可展示的执行里程碑</div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>延期识别与偏差清单</template>
          <div class="plan-deviation-grid">
            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">延期里程碑</div>
              <div v-if="delayedMilestonesForPlan.length" class="focus-list">
                <div v-for="item in delayedMilestonesForPlan.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">{{ item.name }}</div>
                  <div class="focus-list__meta">计划 {{ item.dueDate || '-' }} / {{ formatDiffLabel(item.dueDate, '已超期', '即将到期') }}</div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无延期里程碑</div>
            </div>

            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">延期 Sprint</div>
              <div v-if="delayedSprintsForPlan.length" class="focus-list">
                <div v-for="item in delayedSprintsForPlan.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">{{ item.name }}</div>
                  <div class="focus-list__meta">结束 {{ item.endDate || '-' }} / {{ formatDiffLabel(item.endDate, '已超期', '临近结束') }}</div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无延期 Sprint</div>
            </div>

            <div class="plan-deviation-block">
              <div class="plan-deviation-block__title">逾期计划内任务</div>
              <div v-if="overduePlannedTasks.length" class="focus-list">
                <div v-for="item in overduePlannedTasks.slice(0, 5)" :key="item.id" class="focus-list__item">
                  <div class="focus-list__title">{{ item.name }}</div>
                  <div class="focus-list__meta">负责人 {{ item.leader?.nickname || item.leader?.name || '-' }} / 截止 {{ item.endDate || '-' }}</div>
                </div>
              </div>
              <div v-else class="focus-list__empty">暂无逾期计划内任务</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>Sprint 执行编排</template>
          <div v-if="sprintExecutionPlan.length" class="plan-sprint-list">
            <div v-for="item in sprintExecutionPlan" :key="item.id" class="plan-sprint-card">
              <div class="plan-sprint-card__header">
                <div>
                  <div class="plan-sprint-card__title">{{ item.name }}</div>
                  <div class="plan-sprint-card__meta">{{ item.startDate || '-' }} 至 {{ item.endDate || '-' }}</div>
                </div>
                <ViewTagField :text="{ '1': '计划中', '2': '进行中', '3': '已完成', '4': '已取消' }[item.status] || '-'" :type="item.status === '2' ? 'primary' : item.status === '3' ? 'success' : 'info'" />
              </div>
              <div class="plan-sprint-card__stats">
                <div><span>任务</span><strong>{{ item.sprintTasks.length }}</strong></div>
                <div><span>已完成</span><strong>{{ item.completedTaskCount }}</strong></div>
                <div><span>故事点</span><strong>{{ item.storyPoints }}</strong></div>
                <div><span>关联里程碑</span><strong>{{ item.linkedMilestones.length }}</strong></div>
              </div>
              <div class="plan-sprint-card__links" v-if="item.linkedMilestones.length">
                <span v-for="milestone in item.linkedMilestones" :key="milestone.id" class="plan-sprint-card__link-item">{{ milestone.name }}</span>
              </div>
              <div v-if="item.sprintTasks.length" class="plan-sprint-card__task-list">
                <div v-for="task in item.sprintTasks.slice(0, 5)" :key="task.id" class="plan-sprint-card__task-item">
                  <el-button link type="primary" class="plan-sprint-card__task-name" @click="goToDetail('/taskManage/form', task.id)">{{ task.name || '-' }}</el-button>
                  <div class="plan-sprint-card__task-meta">
                    <span>{{ task.leader?.nickname || task.leader?.name || '未分配负责人' }}</span>
                    <span>{{ task.endDate || '未设置截止时间' }}</span>
                    <ViewTagField :text="priorityMap[task.priority] || '-'" :type="getPriorityType(task.priority)" />
                  </div>
                </div>
              </div>
              <div v-else class="focus-list__empty plan-sprint-card__empty">当前 Sprint 暂未分配任务</div>
            </div>
          </div>
          <div v-else class="focus-list__empty">当前项目暂无 Sprint 编排，建议先创建 Sprint 承接执行计划。</div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>待纳入执行计划任务</template>
          <el-table :data="unplannedTasks" stripe>
            <el-table-column prop="name" label="任务名称" min-width="220">
              <template #default="{ row }">
                <el-button link type="primary" @click="goToDetail('/taskManage/form', row.id)">{{ row.name || '-' }}</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="leader" label="负责人" min-width="140">
              <template #default="{ row }">{{ row.leader?.nickname || row.leader?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <ViewTagField :text="priorityMap[row.priority] || '-'" :type="getPriorityType(row.priority)" />
              </template>
            </el-table-column>
            <el-table-column prop="endDate" label="截止时间" width="120" />
            <el-table-column label="时间状态" width="120">
              <template #default="{ row }">{{ row.endDate ? formatDiffLabel(row.endDate, '已超期', '即将到期') : '-' }}</template>
            </el-table-column>
            <el-table-column label="处置建议" min-width="220">
              <template #default="{ row }">{{ row.endDate ? '建议尽快纳入对应 Sprint 或阶段计划，避免执行与基线计划脱节。' : '建议补齐时间安排并纳入 Sprint 或里程碑关联。' }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="任务" name="tasks">
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
          <el-table-column label="里程碑" min-width="150">
            <template #default="{ row }">
              {{ row.milestone?.name || '-' }}
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
              <el-button link type="primary" @click="goToDetail('/taskManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="缺陷" name="tickets">
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
              <el-button link type="primary" @click="goToDetail('/ticketManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="里程碑" name="milestones">
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
          <el-table-column label="责任人" min-width="140">
            <template #default="{ row }">
              {{ row.owner?.nickname || row.owner?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="phase" label="阶段" width="120" />
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
          <el-table-column prop="delayReason" label="延期原因" min-width="200" show-overflow-tooltip />
          <el-table-column label="变更影响" width="100">
            <template #default="{ row }">{{ row.changeImpactFlag === '1' ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="风险影响" width="100">
            <template #default="{ row }">{{ row.riskImpactFlag === '1' ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToDetail('/milestoneManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="风险" name="risks">
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
              <el-button link type="primary" @click="goToDetail('/projectManage/riskManage/form', row.id)">{{ row.name || '-' }}</el-button>
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
              <el-button link type="primary" @click="goToDetail('/projectManage/riskManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="变更" name="changes">
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
              <el-button link type="primary" @click="goToDetail('/changeManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor" label="Sprint" name="sprints">
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
          <el-table-column label="变更影响" width="100">
            <template #default="{ row }">{{ row.changeImpactFlag === '1' ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column prop="healthScoreSnapshot" label="健康度快照" width="110" />
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
              <el-button link type="primary" @click="goToDetail('/sprintManage/form', row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane v-if="canViewGroup('projectKnowledge')" label="知识" name="knowledge">
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>知识总数</span><strong>{{ projectKnowledgeSummary.total || 0 }}</strong></div>
          <div class="tab-summary-card"><span>FAQ</span><strong>{{ projectKnowledgeSummary.faq || 0 }}</strong></div>
          <div class="tab-summary-card"><span>项目经验</span><strong>{{ projectKnowledgeSummary.experience || 0 }}</strong></div>
          <div class="tab-summary-card"><span>交付文档</span><strong>{{ projectKnowledgeSummary.delivery || 0 }}</strong></div>
          <div class="tab-summary-card"><span>最近更新</span><strong>{{ projectKnowledgeSummary.recentUpdatedCount || 0 }}</strong></div>
        </div>

        <el-card shadow="hover" class="mt16 panel-card knowledge-summary-card">
          <div class="knowledge-summary-card__header">
            <div>
              <div class="knowledge-summary-card__title">项目知识空间</div>
              <div class="knowledge-summary-card__desc">统一沉淀项目概况、方案、交付、运维支持和复盘知识，让项目资料和经验可以持续积累与复用。{{ isProjectVisitor ? '当前以访客身份访问，可查看项目知识但不可编辑。' : '' }}</div>
            </div>
            <div class="knowledge-summary-card__actions">
              <el-button :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeList">查看全部</el-button>
              <el-button v-if="canAddKnowledgeInProject" type="primary" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeCreate">新增知识</el-button>
              <el-button v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate('implementationGuide')">实施模板</el-button>
              <el-button v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate('faq')">FAQ 模板</el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>
            <div class="focus-card__header">
              <span>最近更新知识</span>
              <el-button link type="primary" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeList">进入知识空间</el-button>
            </div>
          </template>
          <div v-if="latestKnowledgeArticles.length" class="knowledge-list">
            <div v-for="item in latestKnowledgeArticles" :key="item.id" class="knowledge-list__item">
              <el-button link type="primary" class="knowledge-list__title" @click="goToKnowledgeDetail(item.id)">{{ item.title || '-' }}</el-button>
              <div class="knowledge-list__meta">
                <span>{{ item.catalog?.name || '-' }}</span>
                <span>{{ knowledgeTypeMap[item.knowledgeType] || '-' }}</span>
                <span>{{ item.maintainer?.nickname || item.maintainer?.name || item.author?.nickname || item.author?.name || '-' }}</span>
                <span>{{ item.updateTime || item.createTime || '-' }}</span>
              </div>
              <div class="knowledge-list__summary">{{ item.summary || item.desc || '暂无摘要' }}</div>
            </div>
          </div>
          <div v-else class="focus-list__empty">当前项目暂无知识内容</div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane v-if="!isProjectVisitor && canViewGroup('projectClosure')" label="结项" name="closure">
        <div class="tab-summary-grid">
          <div class="tab-summary-card"><span>验收日期</span><strong>{{ project.acceptanceDate || '-' }}</strong></div>
          <div class="tab-summary-card"><span>验收说明</span><strong>{{ project.closeSummary ? '已补齐' : '待补齐' }}</strong></div>
          <div class="tab-summary-card"><span>交付清单</span><strong>{{ project.closeDeliverables ? '已补齐' : '待补齐' }}</strong></div>
          <div class="tab-summary-card"><span>上线记录</span><strong>{{ project.goLiveSummary?.successCount || 0 }} 条成功</strong></div>
          <div class="tab-summary-card"><span>验收单</span><strong>{{ project.acceptanceSummary?.passedCount || 0 }} 条通过</strong></div>
          <div class="tab-summary-card"><span>运维交接</span><strong>{{ project.handoverSummary?.confirmedCount || 0 }} 条确认</strong></div>
          <div class="tab-summary-card"><span>遗留问题</span><strong>{{ project.closeOpenIssues ? '已记录' : '暂无' }}</strong></div>
          <div class="tab-summary-card"><span>项目复盘</span><strong>{{ project.closeReview ? '已补齐' : '待补齐' }}</strong></div>
        </div>

        <el-card shadow="hover" class="mt16 panel-card plan-action-card">
          <div class="plan-action-card__header">
            <div>
              <div class="plan-action-card__title">结项资料与沉淀动作</div>
              <div class="plan-action-card__desc">在这里维护结项资料、交付凭证和项目复盘沉淀，提交结项申请统一从页面顶部发起。</div>
            </div>
            <div class="plan-action-card__actions">
              <el-button v-if="canSubmitCloseCurrentProject" @click="goToProjectChange('6')">去完善结项资料</el-button>
              <el-button v-if="canManageDeliveryInProject" @click="createProjectScopedRecord('/goLiveManage/form')">新增上线单</el-button>
              <el-button v-if="canManageDeliveryInProject" @click="createProjectScopedRecord('/acceptanceManage/form')">新增验收单</el-button>
              <el-button v-if="canManageDeliveryInProject" @click="createProjectScopedRecord('/handoverManage/form')">新增运维交接单</el-button>
              <el-button v-if="canAddKnowledgeInProject" :loading="publishReviewLoading" :disabled="!project.closeReview" @click="handlePublishCloseReview">沉淀到知识中心</el-button>
              <el-button v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate('review')">复盘模板</el-button>
            </div>
          </div>
        </el-card>

        <div class="closure-grid mt16">
          <el-card shadow="hover" class="panel-card">
            <template #header>验收说明</template>
            <div class="closure-content">{{ project.closeSummary || '暂未填写验收说明' }}</div>
          </el-card>

          <el-card shadow="hover" class="panel-card">
            <template #header>交付清单</template>
            <div class="closure-content">{{ project.closeDeliverables || '暂未填写交付清单' }}</div>
          </el-card>

          <el-card shadow="hover" class="panel-card">
            <template #header>遗留问题</template>
            <div class="closure-content">{{ project.closeOpenIssues || '暂无遗留问题记录' }}</div>
          </el-card>

          <el-card shadow="hover" class="panel-card">
            <template #header>项目复盘</template>
            <div class="closure-content">{{ project.closeReview || '暂未填写项目复盘' }}</div>
          </el-card>
        </div>

        <el-card shadow="hover" class="mt16 panel-card">
          <template #header>结项佐证</template>
          <div class="closure-evidence-grid">
            <div class="closure-evidence-item"><span>上线记录</span><strong>{{ project.goLiveSummary?.successCount || 0 }} 条成功</strong></div>
            <div class="closure-evidence-item"><span>验收单</span><strong>{{ project.acceptanceSummary?.passedCount || 0 }} 条通过</strong></div>
            <div class="closure-evidence-item"><span>运维交接</span><strong>{{ project.handoverSummary?.confirmedCount || 0 }} 条确认</strong></div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

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
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--Color) 4%, var(--el-bg-color)) 0%,
    var(--el-bg-color) 55%,
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-extra-light)) 100%
  );
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.project-meta-item__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.project-meta-item__value {
  min-height: 36px;
  display: flex;
  align-items: center;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  justify-content: flex-end;
  text-align: right;
}

.project-hero__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-action-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light));
}

.hero-action-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hero-action-card__desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.hero-action-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.hero-action-card__grid :deep(.el-button) {
  margin-left: 0;
}

.hero-stat-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light));
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

.project-alert-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.project-alert-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.project-alert-card:hover {
  transform: translateY(-2px);
}

.project-alert-card--danger {
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
}

.project-alert-card--warning {
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-warning) 22%, var(--el-border-color-lighter));
}

.project-alert-card--info {
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-lighter));
}

.project-alert-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.project-alert-card__header span {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.project-alert-card__header strong {
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.project-alert-card__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
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
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
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

.plan-intro-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.plan-action-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.plan-action-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-action-card__desc {
  margin-top: 8px;
  max-width: 760px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.plan-action-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.plan-impact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.plan-impact-confirm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-impact-confirm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.plan-impact-confirm-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-impact-confirm-item__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.plan-impact-confirm-item__remark {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.plan-impact-confirm-item__scopes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.plan-impact-confirm-item__scope-records {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.focus-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.plan-impact-confirm-item__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.plan-alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-alert-item {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.plan-alert-item--danger {
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
}

.plan-alert-item--warning {
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-warning) 22%, var(--el-border-color-lighter));
}

.plan-alert-item--info {
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-lighter));
}

.plan-alert-item--success {
  background: color-mix(in srgb, var(--el-color-success) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-success) 22%, var(--el-border-color-lighter));
}

.plan-alert-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-alert-item__desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.plan-intro-card__block {
  padding: 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.plan-intro-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.plan-intro-card__value {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.plan-milestone-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-milestone-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  align-items: start;
}

.plan-milestone-item__date {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--Color) 4%, var(--el-fill-color-extra-light));
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
}

.plan-milestone-item__body {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.plan-milestone-item__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.plan-milestone-item__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-milestone-item__meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.plan-milestone-item__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.plan-milestone-item__tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.plan-milestone-item__task-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
}

.plan-sprint-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.plan-sprint-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light)) 100%
  );
}

.plan-sprint-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.plan-sprint-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-sprint-card__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.plan-sprint-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.plan-sprint-card__stats > div {
  padding: 10px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.plan-sprint-card__stats span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.plan-sprint-card__stats strong {
  display: block;
  margin-top: 6px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.plan-sprint-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.plan-sprint-card__link-item {
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
  color: var(--el-color-primary);
  font-size: 12px;
}

.plan-sprint-card__task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.plan-sprint-card__task-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.plan-sprint-card__task-name {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
}

.plan-sprint-card__task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  align-items: center;
}

.plan-sprint-card__empty {
  margin-top: 14px;
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

.panel-progress-item__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.panel-progress-item__tip {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  cursor: help;
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
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-fill-color-extra-light));
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

.health-score-card__main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-score-card__score {
  font-size: 40px;
  line-height: 1;
  font-weight: 700;
  color: var(--el-color-primary);
}

.health-score-card__desc {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.health-dimension-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.health-dimension-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.health-dimension-card span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.health-dimension-card strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.health-alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-alert-item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 18%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--el-bg-color));
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.closure-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.closure-content {
  min-height: 120px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
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
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-fill-color-extra-light));
}

.tab-summary-card--warning {
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color));
}

.tab-summary-card--danger {
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
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
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    color-mix(in srgb, var(--el-bg-color) 90%, var(--el-fill-color-extra-light)) 100%
  );
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

.knowledge-summary-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.knowledge-summary-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.knowledge-summary-card__desc {
  margin-top: 8px;
  max-width: 760px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.knowledge-summary-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.knowledge-list__item {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    color-mix(in srgb, var(--el-bg-color) 90%, var(--el-fill-color-extra-light)) 100%
  );
}

.knowledge-list__title {
  padding: 0;
  font-size: 15px;
  font-weight: 600;
}

.knowledge-list__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.knowledge-list__summary {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.plan-deviation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.plan-deviation-block {
  padding: 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.plan-deviation-block__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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

  .project-alert-grid,
  .hero-action-card__grid,
  .closure-grid,
  .health-dimension-grid,
  .plan-deviation-grid,
  .plan-intro-card,
  .plan-sprint-list,
  .plan-sprint-card__stats,
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
  .project-alert-grid,
  .hero-action-card__grid,
  .closure-grid,
  .health-dimension-grid,
  .plan-deviation-grid,
  .plan-intro-card,
  .plan-sprint-list,
  .plan-sprint-card__stats,
  .project-meta-grid,
  .cost-grid,
  .tab-summary-grid,
  .milestone-timeline-rail__body {
    grid-template-columns: 1fr;
  }

  .plan-milestone-item {
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
