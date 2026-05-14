<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCockpitOverview, getProjectCockpit, getStatus, getPriority } from './api'
import ChartPie from '@/components/ChartPie.vue'
import ChartLine from '@/components/ChartLine.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import { phaseMap, qualityLevelMap, riskLevelMap } from './fieldMaps'
import { downloadCsv } from '@/utils/csv'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const overview = ref({})
const projectCockpit = ref({})
const statusMap = ref({})
const priorityMap = ref({})
const projectId = ref(String(route.query.projectId || ''))
const activeView = ref(projectId.value ? 'project' : 'overview')
const filterState = ref({
  leaderId: String(route.query.leaderId || ''),
  status: String(route.query.status || ''),
  priority: String(route.query.priority || ''),
  category: String(route.query.category || ''),
  riskLevel: String(route.query.riskLevel || ''),
  qualityLevel: String(route.query.qualityLevel || ''),
  healthLevel: String(route.query.healthLevel || ''),
})

const viewOptions = [
  { label: '系统总览', value: 'overview' },
  { label: '项目详情', value: 'project' },
]
const projectOptions = computed(() => overview.value.projectOptions || [])
const leaderOptions = computed(() => {
  const map = new Map()
  projectOptions.value.forEach((item) => {
    if (item.leader?.id) {
      map.set(String(item.leader.id), item.leader.nickname || item.leader.name || '未命名负责人')
    }
  })
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
})
const summary = computed(() => overview.value.summary || {})
const projectDashboard = computed(() => projectCockpit.value || {})
const selectedProjectDetail = computed(() => projectDashboard.value.project || {})
const rankings = computed(() => overview.value.rankings || {})
const selectedTaskSummary = computed(() => projectDashboard.value.summary?.taskSummary || {})
const selectedTicketSummary = computed(() => projectDashboard.value.summary?.ticketSummary || {})
const selectedRiskSummary = computed(() => projectDashboard.value.summary?.riskSummary || {})
const selectedMilestoneSummary = computed(() => projectDashboard.value.summary?.milestoneSummary || {})
const selectedHealthSummary = computed(() => projectDashboard.value.summary?.healthSummary || {})
const selectedKnowledgeSummary = computed(() => projectDashboard.value.summary?.knowledgeSummary || {})
const selectedAlerts = computed(() => projectDashboard.value.focus?.alerts || [])
const selectedTrend = computed(() => projectDashboard.value.trend || {})
const healthDistributionData = computed(() => summary.value.distributions?.health || [])
const progressDistributionData = computed(() => summary.value.distributions?.progress || [])
const knowledgeDistributionData = computed(() => summary.value.distributions?.knowledge || [])
const alertDistributionData = computed(() => summary.value.distributions?.alert || [])
const riskLevelDistributionData = computed(() => summary.value.distributions?.riskLevel || [])
const qualityLevelDistributionData = computed(() => summary.value.distributions?.qualityLevel || [])
const reportSummaryText = computed(() => {
  if (activeView.value === 'project') {
    const lines = ['项目详情驾驶舱汇报摘要']
    if (!selectedProjectDetail.value?.name) {
      lines.push('当前未选择项目')
      return lines.join('\n')
    }

    lines.push(`当前项目：${selectedProjectDetail.value.name}`)
    lines.push(`项目健康度：${selectedHealthSummary.value.totalScore || 0}（${selectedHealthSummary.value.levelLabel || '基本健康'}）`)
    lines.push(`任务完成率：${selectedTaskSummary.value.completionRate || 0}% ，未解决工单：${selectedTicketSummary.value.open || 0}，高风险事项：${selectedRiskSummary.value.high || 0}`)
    lines.push(`里程碑完成率：${selectedMilestoneSummary.value.completionRate || 0}% ，知识最近更新：${selectedKnowledgeSummary.value.recentUpdatedCount || 0}`)
    if (selectedAlerts.value?.length) {
      lines.push('当前项目重点提醒：')
      selectedAlerts.value.slice(0, 5).forEach((item) => {
        lines.push(`- ${item.title}（${item.value}）：${item.desc}`)
      })
    }
    return lines.join('\n')
  }

  const lines = [
    '项目驾驶舱汇报摘要',
    `筛选条件：负责人${filterState.value.leaderId ? `=${leaderOptions.value.find((item) => item.id === filterState.value.leaderId)?.label || '-'}` : '=全部'}，状态${filterState.value.status ? `=${statusMap.value[filterState.value.status] || '-'}` : '=全部'}，优先级${filterState.value.priority ? `=${priorityMap.value[filterState.value.priority] || '-'}` : '=全部'}，分类${filterState.value.category || '全部'}，风险${filterState.value.riskLevel || '全部'}，质量${filterState.value.qualityLevel || '全部'}，健康度${filterState.value.healthLevel || '全部'}`,
    `项目总数：${summary.value.totalProjects || 0}`,
    `进行中项目：${summary.value.activeProjects || 0}，已完成项目：${summary.value.completedProjects || 0}，逾期项目：${summary.value.overdueProjects || 0}`,
    `平均进度：${summary.value.averageProgress || 0}% ，平均健康度：${summary.value.averageHealthScore || 0}，累计工时：${summary.value.spentHoursTotal || 0}`,
    `需关注项目：${summary.value.attentionProjects || 0}，知识活跃项目：${summary.value.knowledgeActiveProjects || 0}`,
  ]
  return lines.join('\n')
})

const taskStatusChartData = computed(() => [
  { value: selectedTaskSummary.value.pending || 0, name: '待处理' },
  { value: selectedTaskSummary.value.inProgress || 0, name: '处理中' },
  { value: selectedTaskSummary.value.completed || 0, name: '已完成' },
  { value: selectedTaskSummary.value.overdue || 0, name: '已逾期' },
].filter(item => item.value > 0))

const focusSections = computed(() => [
  { key: 'dueSoonTasks', title: '即将到期任务', items: projectDashboard.value.focus?.dueSoonTasks || [], empty: '暂无即将到期任务' },
  { key: 'overdueTasks', title: '已逾期任务', items: projectDashboard.value.focus?.overdueTasks || [], empty: '暂无逾期任务' },
  { key: 'criticalTickets', title: '严重缺陷', items: projectDashboard.value.focus?.criticalTickets || [], empty: '暂无严重缺陷' },
  { key: 'highRisks', title: '高风险事项', items: projectDashboard.value.focus?.highRisks || [], empty: '暂无高风险事项' },
  { key: 'pendingChanges', title: '待审批变更', items: projectDashboard.value.focus?.pendingChanges || [], empty: '暂无待审批变更' },
  { key: 'dueSoonMilestones', title: '即将到期里程碑', items: projectDashboard.value.focus?.dueSoonMilestones || [], empty: '暂无即将到期里程碑' },
])

const rankingSections = computed(() => [
  { key: 'overdueProjects', title: '逾期项目排行', items: rankings.value.overdueProjects || [], empty: '暂无逾期项目' },
  { key: 'laggingProjects', title: '低进度项目排行', items: rankings.value.laggingProjects || [], empty: '暂无低进度项目' },
  { key: 'costRiskProjects', title: '成本偏差项目', items: rankings.value.costRiskProjects || [], empty: '暂无成本偏差项目' },
  { key: 'healthRiskProjects', title: '健康度风险项目', items: rankings.value.healthRiskProjects || [], empty: '暂无需关注项目' },
  { key: 'knowledgeActiveProjects', title: '知识沉淀活跃项目', items: rankings.value.knowledgeActiveProjects || [], empty: '暂无活跃项目' },
])

const getHealthTagType = (level) => {
  if (level === 'healthy') return 'success'
  if (level === 'stable') return 'primary'
  if (level === 'attention') return 'warning'
  return 'danger'
}

async function loadCockpit() {
  loading.value = true
  try {
    const [statusRes, priorityRes, cockpitRes] = await Promise.all([
      getStatus(),
      getPriority(),
      getCockpitOverview({
        pageNum: 1,
        pageSize: 200,
        leaderId: filterState.value.leaderId || undefined,
        status: filterState.value.status || undefined,
        priority: filterState.value.priority || undefined,
        category: filterState.value.category || undefined,
        riskLevel: filterState.value.riskLevel || undefined,
        qualityLevel: filterState.value.qualityLevel || undefined,
        healthLevel: filterState.value.healthLevel || undefined,
      }),
    ])
    statusMap.value = statusRes.data || {}
    priorityMap.value = priorityRes.data || {}
    overview.value = cockpitRes.data || {}
    const availableProjectIds = new Set((overview.value.projectOptions || []).map((item) => String(item.id)))
    if (projectId.value && !availableProjectIds.has(String(projectId.value))) {
      projectId.value = ''
      activeView.value = 'overview'
      router.replace({
        path: route.path,
        query: {
          ...route.query,
          view: activeView.value,
          projectId: undefined,
        },
      })
    }

    if (activeView.value === 'project' && projectId.value) {
      const projectRes = await getProjectCockpit(projectId.value)
      projectCockpit.value = projectRes.data || {}
    } else {
      projectCockpit.value = {}
    }
  } finally {
    loading.value = false
  }
}

function syncRouteQuery() {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      view: activeView.value,
      projectId: activeView.value === 'project' ? projectId.value || undefined : undefined,
      leaderId: filterState.value.leaderId || undefined,
      status: filterState.value.status || undefined,
      priority: filterState.value.priority || undefined,
      category: filterState.value.category || undefined,
      riskLevel: filterState.value.riskLevel || undefined,
      qualityLevel: filterState.value.qualityLevel || undefined,
      healthLevel: filterState.value.healthLevel || undefined,
    },
  })
}

function handleViewChange(value) {
  activeView.value = value
  if (value === 'overview') {
    projectCockpit.value = {}
  }
  syncRouteQuery()
}

function handleProjectChange(value) {
  projectId.value = String(value || '')
  activeView.value = projectId.value ? 'project' : 'overview'
  syncRouteQuery()
}

function handleFilterChange() {
  syncRouteQuery()
}

function resetFilters() {
  filterState.value = {
    leaderId: '',
    status: '',
    priority: '',
    category: '',
    riskLevel: '',
    qualityLevel: '',
    healthLevel: '',
  }
  handleFilterChange()
}

function goToProjectDetail() {
  if (!projectId.value) return
  router.push({ path: '/projectManage/detail', query: { id: projectId.value } })
}

function goToProject(row) {
  if (!row?.id) return
  projectId.value = String(row.id)
  activeView.value = 'project'
  syncRouteQuery()
}

function exportCockpitReport() {
  const rows = [
    ['项目名称', '负责人', '状态', '优先级', '项目分类', '风险等级', '质量等级', '币种', '预算', '实际成本', '累计工时', '进度(%)', '健康度', '最近知识更新'],
    ...projectOptions.value.map((item) => [
      item.name || '-',
      item.leader?.nickname || item.leader?.name || '-',
      statusMap.value[item.status] || '-',
      priorityMap.value[item.priority] || '-',
      item.category || '-',
      riskLevelMap[item.riskLevel] || item.riskLevel || '-',
      qualityLevelMap[item.qualityLevel] || item.qualityLevel || '-',
      item.currency || '-',
      Number(item.budget || 0),
      Number(item.actualCost || 0),
      Number(item.spentHours || 0),
      Number(item.progress || 0),
      rankings.value.healthRiskProjects?.find((healthItem) => String(healthItem.id) === String(item.id))?.healthScore || '-',
      rankings.value.knowledgeActiveProjects?.find((knowledgeItem) => String(knowledgeItem.id) === String(item.id))?.recentKnowledgeUpdates || 0,
    ]),
  ]
  downloadCsv('项目驾驶舱导出.csv', rows)
}

async function copyReportSummary() {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(reportSummaryText.value)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = reportSummaryText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  $sdk.msgSuccess('汇报摘要已复制')
}

onMounted(() => {
  loadCockpit()
})

watch(
  () => [route.query.view, route.query.projectId, route.query.leaderId, route.query.status, route.query.priority, route.query.category, route.query.riskLevel, route.query.qualityLevel, route.query.healthLevel],
  (value, oldValue) => {
    const nextView = String(value[0] || '')
    projectId.value = String(value[1] || '')
    activeView.value = nextView === 'project' || projectId.value ? 'project' : 'overview'
    filterState.value = {
      leaderId: String(value[2] || ''),
      status: String(value[3] || ''),
      priority: String(value[4] || ''),
      category: String(value[5] || ''),
      riskLevel: String(value[6] || ''),
      qualityLevel: String(value[7] || ''),
      healthLevel: String(value[8] || ''),
    }
    if (JSON.stringify(value) === JSON.stringify(oldValue)) return
    loadCockpit()
  },
)
</script>

<template>
  <div class="project-cockpit-page" v-loading="loading">
    <el-page-header @back="$router.back()" title="驾驶舱">
      <template #content>
        <div class="cockpit-header-text">聚合查看项目整体健康度、交付风险和执行焦点</div>
      </template>
      <template #extra>
        <el-tabs v-model="activeView" class="cockpit-view-tabs" @tab-change="handleViewChange">
          <el-tab-pane v-for="item in viewOptions" :key="item.value" :label="item.label" :name="item.value" />
        </el-tabs>
        <div v-if="activeView === 'project'" class="cockpit-project-actions">
          <el-select v-model="projectId" placeholder="选择项目" style="width: 260px" @change="handleProjectChange" clearable>
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
          </el-select>
          <el-button @click="copyReportSummary">复制汇报摘要</el-button>
          <el-button @click="exportCockpitReport">导出筛选结果</el-button>
          <el-button type="primary" :disabled="!projectId" @click="goToProjectDetail">项目详情</el-button>
        </div>
      </template>
    </el-page-header>

    <div v-if="activeView === 'overview'" class="cockpit-overview">
      <div class="cockpit-summary-grid mt20">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-card__label">项目总数</div>
          <div class="summary-card__value">{{ summary.totalProjects || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--active">
          <div class="summary-card__label">进行中项目</div>
          <div class="summary-card__value">{{ summary.activeProjects || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--success">
          <div class="summary-card__label">已完成项目</div>
          <div class="summary-card__value">{{ summary.completedProjects || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--alert">
          <div class="summary-card__label">逾期项目</div>
          <div class="summary-card__value">{{ summary.overdueProjects || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card">
          <div class="summary-card__label">总预算</div>
          <div class="summary-card__value">{{ summary.budgetTotal || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card">
          <div class="summary-card__label">总实际成本</div>
          <div class="summary-card__value">{{ summary.actualCostTotal || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card">
          <div class="summary-card__label">累计工时</div>
          <div class="summary-card__value">{{ summary.spentHoursTotal || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--health">
          <div class="summary-card__label">平均健康度</div>
          <div class="summary-card__value">{{ summary.averageHealthScore || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--warning">
          <div class="summary-card__label">需关注项目</div>
          <div class="summary-card__value">{{ summary.attentionProjects || 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="summary-card summary-card--knowledge">
          <div class="summary-card__label">知识活跃项目</div>
          <div class="summary-card__value">{{ summary.knowledgeActiveProjects || 0 }}</div>
        </el-card>
      </div>

      <div class="cockpit-board-grid mt20">
        <el-card shadow="hover" class="board-card">
          <template #header>健康度分布</template>
          <ChartPie v-if="healthDistributionData.length" :series="healthDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无健康度分布数据" />
      </el-card>

      <el-card shadow="hover" class="board-card">
        <template #header>进度分布</template>
        <ChartPie v-if="progressDistributionData.length" :series="progressDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无进度分布数据" />
      </el-card>
    </div>

    <div class="cockpit-board-grid mt20">
      <el-card shadow="hover" class="board-card">
        <template #header>知识活跃度分布</template>
        <ChartPie v-if="knowledgeDistributionData.length" :series="knowledgeDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无知识活跃度分布数据" />
      </el-card>

      <el-card shadow="hover" class="board-card">
        <template #header>异常类型分布</template>
        <ChartPie v-if="alertDistributionData.length" :series="alertDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无异常类型分布数据" />
      </el-card>
    </div>

    <div class="cockpit-board-grid mt20">
      <el-card shadow="hover" class="board-card">
        <template #header>项目风险等级分布</template>
        <ChartPie v-if="riskLevelDistributionData.length" :series="riskLevelDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无项目风险等级数据" />
      </el-card>

      <el-card shadow="hover" class="board-card">
        <template #header>项目质量等级分布</template>
        <ChartPie v-if="qualityLevelDistributionData.length" :series="qualityLevelDistributionData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
        <el-empty v-else description="暂无项目质量等级数据" />
      </el-card>
      </div>

      <div class="cockpit-board-grid mt20">
        <el-card v-for="section in rankingSections" :key="section.key" shadow="hover" class="board-card">
          <template #header>
            <div class="focus-card__header">
              <span>{{ section.title }}</span>
              <span>{{ section.items.length }}</span>
            </div>
          </template>
          <div v-if="section.items.length" class="focus-list">
            <div v-for="item in section.items" :key="item.id" class="focus-list__item focus-list__item--clickable" @click="goToProject(item)">
              <div class="focus-list__title">{{ item.name }}</div>
              <div class="focus-list__meta">
                <span>进度 {{ item.progress || 0 }}%</span>
                <span v-if="item.endDate">/ 截止 {{ item.endDate }}</span>
                <span v-if="Number(item.actualCost || 0) > Number(item.budget || 0)">/ 偏差 {{ Number(item.actualCost || 0) - Number(item.budget || 0) }}</span>
                <span v-if="item.healthScore != null">/ 健康度 {{ item.healthScore }}</span>
                <span v-if="item.recentKnowledgeUpdates != null">/ 最近更新 {{ item.recentKnowledgeUpdates }}</span>
              </div>
            </div>
          </div>
          <div v-else class="focus-list__empty">{{ section.empty }}</div>
        </el-card>
      </div>

      <el-card shadow="hover" class="board-card mt20">
        <template #header>项目总览表</template>
        <el-table :data="projectOptions" stripe>
          <el-table-column prop="name" label="项目名称" min-width="220">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToProject(row)">{{ row.name }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="负责人" min-width="140">
            <template #default="{ row }">{{ row.leader?.nickname || row.leader?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === '6' ? 'success' : row.status === '7' ? 'danger' : 'primary'">{{ statusMap[row.status] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'">{{ priorityMap[row.priority] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="Number(row.progress || 0)" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column label="阶段" width="100">
            <template #default="{ row }">
              {{ phaseMap[row.phase] || row.phase || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="业务线" prop="businessLine" width="120" />
          <el-table-column label="来源" prop="projectSource" width="120" />
        </el-table>
      </el-card>

      <el-card shadow="hover" class="report-card overview-bottom-card">
        <template #header>汇报摘要</template>
        <pre class="report-card__content">{{ reportSummaryText }}</pre>
      </el-card>

      <el-card shadow="hover" class="filter-card overview-bottom-card">
        <template #header>筛选条件</template>
        <div class="filter-card__grid">
          <el-select v-model="filterState.leaderId" placeholder="负责人" clearable @change="handleFilterChange">
            <el-option v-for="item in leaderOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <el-select v-model="filterState.status" placeholder="项目状态" clearable @change="handleFilterChange">
            <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="String(key)" />
          </el-select>
          <el-select v-model="filterState.priority" placeholder="优先级" clearable @change="handleFilterChange">
            <el-option v-for="(label, key) in priorityMap" :key="key" :label="label" :value="String(key)" />
          </el-select>
          <el-input v-model="filterState.category" placeholder="项目分类" clearable @change="handleFilterChange" />
          <el-select v-model="filterState.riskLevel" placeholder="风险等级" clearable @change="handleFilterChange">
            <el-option v-for="(label, key) in riskLevelMap" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="filterState.qualityLevel" placeholder="质量等级" clearable @change="handleFilterChange">
            <el-option v-for="(label, key) in qualityLevelMap" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="filterState.healthLevel" placeholder="健康度区间" clearable @change="handleFilterChange">
            <el-option label="健康" value="healthy" />
            <el-option label="基本健康" value="stable" />
            <el-option label="需关注" value="attention" />
            <el-option label="高风险" value="critical" />
          </el-select>
          <div class="filter-card__actions">
            <el-button @click="resetFilters">重置筛选</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="activeView === 'project' && projectId" class="cockpit-main mt20">
      <el-card shadow="hover" class="report-card">
        <template #header>汇报摘要</template>
        <pre class="report-card__content">{{ reportSummaryText }}</pre>
      </el-card>

      <el-card shadow="hover" class="project-hero-card">
        <div class="project-hero-card__header">
          <div>
            <div class="project-hero-card__title">{{ selectedProjectDetail.name || '未选择项目' }}</div>
            <div class="project-hero-card__meta">
              <el-tag :type="selectedProjectDetail.status === '6' ? 'success' : 'primary'">{{ statusMap[selectedProjectDetail.status] || '-' }}</el-tag>
              <el-tag :type="selectedProjectDetail.priority === '3' ? 'danger' : selectedProjectDetail.priority === '2' ? 'warning' : 'info'">{{ priorityMap[selectedProjectDetail.priority] || '-' }}</el-tag>
              <el-tag v-if="selectedProjectDetail.riskLevel" type="danger">风险 {{ riskLevelMap[selectedProjectDetail.riskLevel] || selectedProjectDetail.riskLevel }}</el-tag>
              <el-tag v-if="selectedProjectDetail.qualityLevel" type="success">质量 {{ qualityLevelMap[selectedProjectDetail.qualityLevel] || selectedProjectDetail.qualityLevel }}</el-tag>
              <span>进度 {{ selectedProjectDetail.progress || 0 }}%</span>
            </div>
          </div>
          <div class="project-hero-card__owner">
            <div class="project-hero-card__owner-label">项目负责人</div>
            <ViewUser :user="selectedProjectDetail.leader" />
          </div>
        </div>
        <div class="project-hero-card__facts">
          <span>分类：{{ selectedProjectDetail.category || '-' }}</span>
          <span>阶段：{{ phaseMap[selectedProjectDetail.phase] || selectedProjectDetail.phase || '-' }}</span>
          <span>业务线：{{ selectedProjectDetail.businessLine || '-' }}</span>
          <span>行业：{{ selectedProjectDetail.industry || '-' }}</span>
          <span>来源：{{ selectedProjectDetail.projectSource || '-' }}</span>
          <span>币种：{{ selectedProjectDetail.currency || '-' }}</span>
          <span>累计工时：{{ selectedProjectDetail.spentHours || 0 }}</span>
        </div>
        <ViewRichText v-if="selectedProjectDetail.description" :html="selectedProjectDetail.description" class="project-hero-card__content" />
        <div v-else class="project-hero-card__empty">暂无项目说明</div>
      </el-card>

      <div class="cockpit-board-grid mt20">
        <el-card shadow="hover" class="board-card">
          <template #header>健康度趋势（最近 7 天）</template>
          <ChartLine
            v-if="selectedTrend.dates?.length"
            :xData="selectedTrend.dates"
            :legend="['健康度']"
            :series="selectedTrend.healthScores || []"
            :bgLinearGradient="false"
          />
          <el-empty v-else description="暂无健康度趋势数据" />
        </el-card>

        <el-card shadow="hover" class="board-card">
          <template #header>风险数量趋势（最近 7 天）</template>
          <ChartLine
            v-if="selectedTrend.dates?.length"
            :xData="selectedTrend.dates"
            :legend="['高风险数量']"
            :series="selectedTrend.riskCounts || []"
            :bgLinearGradient="false"
          />
          <el-empty v-else description="暂无风险趋势数据" />
        </el-card>
      </div>

      <div class="cockpit-board-grid mt20">
        <el-card shadow="hover" class="board-card">
          <template #header>知识活跃趋势（最近 7 天）</template>
          <ChartLine
            v-if="selectedTrend.dates?.length"
            :xData="selectedTrend.dates"
            :legend="['知识最近更新']"
            :series="selectedTrend.knowledgeUpdateCounts || []"
            :bgLinearGradient="false"
          />
          <el-empty v-else description="暂无知识趋势数据" />
        </el-card>

        <el-card shadow="hover" class="board-card">
          <template #header>成本偏差趋势（最近 7 天）</template>
          <ChartLine
            v-if="selectedTrend.dates?.length"
            :xData="selectedTrend.dates"
            :legend="['成本偏差']"
            :series="selectedTrend.costVariances || []"
            :bgLinearGradient="false"
          />
          <el-empty v-else description="暂无成本偏差趋势数据" />
        </el-card>
      </div>

      <div class="cockpit-board-grid mt20">
        <el-card shadow="hover" class="board-card">
          <template #header>任务分布</template>
          <ChartPie v-if="taskStatusChartData.length" :series="taskStatusChartData" :option="{ legend: { y: '84%' }, series: { radius: ['42%', '68%'] } }" />
          <el-empty v-else description="暂无任务数据" />
        </el-card>

        <el-card shadow="hover" class="board-card">
          <template #header>交付总览</template>
          <div class="board-stat-list">
            <div class="board-stat-item"><span>任务完成率</span><strong>{{ selectedTaskSummary.completionRate || 0 }}%</strong></div>
            <div class="board-stat-item"><span>未解决工单</span><strong>{{ selectedTicketSummary.open || 0 }}</strong></div>
            <div class="board-stat-item"><span>高风险事项</span><strong>{{ selectedRiskSummary.high || 0 }}</strong></div>
            <div class="board-stat-item"><span>里程碑完成率</span><strong>{{ selectedMilestoneSummary.completionRate || 0 }}%</strong></div>
            <div class="board-stat-item"><span>健康度</span><strong>{{ selectedHealthSummary.totalScore || 0 }}</strong></div>
            <div class="board-stat-item"><span>知识最近更新</span><strong>{{ selectedKnowledgeSummary.recentUpdatedCount || 0 }}</strong></div>
          </div>
        </el-card>
      </div>

      <div class="cockpit-board-grid mt20">
        <el-card shadow="hover" class="board-card">
          <template #header>健康度剖面</template>
          <div class="health-profile-card">
            <div class="health-profile-card__hero">
              <strong>{{ selectedHealthSummary.totalScore || 0 }}</strong>
              <el-tag :type="getHealthTagType(selectedHealthSummary.level)">{{ selectedHealthSummary.levelLabel || '基本健康' }}</el-tag>
            </div>
            <div class="health-profile-card__grid">
              <div class="health-profile-card__item"><span>进度</span><strong>{{ selectedHealthSummary.dimensions?.progress?.score || 0 }}/25</strong></div>
              <div class="health-profile-card__item"><span>风险</span><strong>{{ selectedHealthSummary.dimensions?.risk?.score || 0 }}/20</strong></div>
              <div class="health-profile-card__item"><span>变更</span><strong>{{ selectedHealthSummary.dimensions?.change?.score || 0 }}/15</strong></div>
              <div class="health-profile-card__item"><span>执行</span><strong>{{ selectedHealthSummary.dimensions?.execution?.score || 0 }}/15</strong></div>
              <div class="health-profile-card__item"><span>交付</span><strong>{{ selectedHealthSummary.dimensions?.delivery?.score || 0 }}/15</strong></div>
              <div class="health-profile-card__item"><span>知识</span><strong>{{ selectedHealthSummary.dimensions?.knowledge?.score || 0 }}/10</strong></div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="board-card">
          <template #header>统一提醒</template>
          <div v-if="selectedAlerts.length" class="cockpit-alert-list">
            <div v-for="item in selectedAlerts" :key="item.title" class="cockpit-alert-item" :class="`cockpit-alert-item--${item.type}`">
              <div class="cockpit-alert-item__header">
                <span>{{ item.title }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div class="cockpit-alert-item__desc">{{ item.desc }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无提醒" />
        </el-card>
      </div>

      <div class="focus-board mt20">
        <el-card v-for="section in focusSections" :key="section.key" shadow="hover" class="focus-card">
          <template #header>
            <div class="focus-card__header">
              <span>{{ section.title }}</span>
              <span>{{ section.items.length }}</span>
            </div>
          </template>
          <div v-if="section.items.length" class="focus-list">
            <div v-for="item in section.items" :key="item.id" class="focus-list__item">
              <div class="focus-list__title">{{ item.name || item.title }}</div>
              <div class="focus-list__meta">{{ item.endDate || item.dueDate || item.createTime || '-' }}</div>
            </div>
          </div>
          <div v-else class="focus-list__empty">{{ section.empty }}</div>
        </el-card>
      </div>

    </div>
    <el-empty v-else-if="activeView === 'project'" class="mt20" description="请选择一个项目查看项目详情驾驶舱" />
  </div>
</template>

<style scoped>
.project-cockpit-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cockpit-header-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.cockpit-view-tabs {
  flex-shrink: 0;
  min-width: 180px;
}

.cockpit-view-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.cockpit-view-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.cockpit-project-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cockpit-overview {
  display: flex;
  flex-direction: column;
}

.overview-bottom-card {
  margin-top: 20px;
}

.filter-card {
  border-radius: 16px;
}

.report-card {
  border-radius: 16px;
}

.report-card__content {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.filter-card__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.filter-card__actions {
  display: flex;
  justify-content: flex-end;
}

.cockpit-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  border-radius: 16px;
}

.summary-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-card__value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.summary-card--active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-extra-light))
  );
}

.summary-card--success {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-success) 16%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-success) 4%, var(--el-fill-color-extra-light))
  );
}

.summary-card--alert {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-danger) 16%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-danger) 4%, var(--el-fill-color-extra-light))
  );
}

.summary-card--health {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-success) 16%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-success) 4%, var(--el-fill-color-extra-light))
  );
}

.summary-card--warning {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-warning) 16%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-warning) 4%, var(--el-fill-color-extra-light))
  );
}

.summary-card--knowledge {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 16%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-extra-light))
  );
}

.project-hero-card {
  border-radius: 18px;
}

.project-hero-card__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.project-hero-card__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.project-hero-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  align-items: center;
  color: var(--el-text-color-secondary);
}

.project-hero-card__owner {
  min-width: 160px;
}

.project-hero-card__owner-label {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.project-hero-card__content {
  margin-top: 18px;
}

.project-hero-card__empty {
  margin-top: 18px;
  color: var(--el-text-color-secondary);
}

.cockpit-board-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
}

.board-card {
  border-radius: 16px;
}

.board-stat-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.board-stat-item {
  padding: 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-stat-item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.board-stat-item strong {
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.health-profile-card__hero {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-profile-card__hero strong {
  font-size: 40px;
  line-height: 1;
  color: var(--el-color-primary);
}

.health-profile-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.health-profile-card__item {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.health-profile-card__item span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.health-profile-card__item strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.cockpit-alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cockpit-alert-item {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.cockpit-alert-item--danger {
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
}

.cockpit-alert-item--warning {
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-warning) 22%, var(--el-border-color-lighter));
}

.cockpit-alert-item--info {
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-lighter));
}

.cockpit-alert-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.cockpit-alert-item__header span {
  font-size: 14px;
  font-weight: 600;
}

.cockpit-alert-item__header strong {
  font-size: 20px;
}

.cockpit-alert-item__desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.focus-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.focus-card {
  border-radius: 16px;
}

.focus-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.focus-list__item {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.focus-list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.focus-list__meta,
.focus-list__empty {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1280px) {
  .filter-card__grid,
  .cockpit-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .focus-board,
  .health-profile-card__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .filter-card__grid,
  .cockpit-summary-grid,
  .cockpit-board-grid,
  .focus-board,
  .board-stat-list,
  .health-profile-card__grid {
    grid-template-columns: 1fr;
  }

  .project-hero-card__header {
    flex-direction: column;
  }
}
</style>
