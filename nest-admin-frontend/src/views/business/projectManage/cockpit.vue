<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCockpit, getStatus, getPriority } from './api'
import ChartPie from '@/components/ChartPie.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const cockpit = ref({})
const statusMap = ref({})
const priorityMap = ref({})
const projectId = ref(String(route.query.projectId || ''))

const projectOptions = computed(() => cockpit.value.projectOptions || [])
const summary = computed(() => cockpit.value.summary || {})
const selectedProject = computed(() => cockpit.value.selectedProject || {})
const projectDashboard = computed(() => selectedProject.value || {})
const selectedProjectDetail = computed(() => projectDashboard.value.project || {})
const rankings = computed(() => cockpit.value.rankings || {})
const selectedTaskSummary = computed(() => projectDashboard.value.summary?.taskSummary || {})
const selectedTicketSummary = computed(() => projectDashboard.value.summary?.ticketSummary || {})
const selectedRiskSummary = computed(() => projectDashboard.value.summary?.riskSummary || {})
const selectedMilestoneSummary = computed(() => projectDashboard.value.summary?.milestoneSummary || {})

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
])

async function loadCockpit() {
  loading.value = true
  try {
    const [statusRes, priorityRes, cockpitRes] = await Promise.all([
      getStatus(),
      getPriority(),
      getCockpit({ pageNum: 1, pageSize: 200, projectId: projectId.value || undefined }),
    ])
    statusMap.value = statusRes.data || {}
    priorityMap.value = priorityRes.data || {}
    cockpit.value = cockpitRes.data || {}
    if (!projectId.value && cockpit.value.selectedProjectId) {
      projectId.value = String(cockpit.value.selectedProjectId)
    }
  } finally {
    loading.value = false
  }
}

function handleProjectChange(value) {
  projectId.value = String(value || '')
  router.replace({ path: route.path, query: { ...route.query, projectId: projectId.value } })
  loadCockpit()
}

function goToProjectDetail() {
  if (!projectId.value) return
  router.push({ path: '/projectManage/detail', query: { id: projectId.value } })
}

function goToProject(row) {
  if (!row?.id) return
  router.push({ path: '/projectManage/detail', query: { id: String(row.id) } })
}

onMounted(() => {
  loadCockpit()
})

watch(() => route.query.projectId, (value) => {
  projectId.value = String(value || '')
})
</script>

<template>
  <div class="project-cockpit-page" v-loading="loading">
    <el-page-header @back="$router.back()" title="驾驶舱">
      <template #content>
        <div class="cockpit-header-text">聚合查看项目整体健康度、交付风险和执行焦点</div>
      </template>
      <template #extra>
        <el-select v-model="projectId" placeholder="选择项目" style="width: 260px" @change="handleProjectChange" clearable>
          <el-option v-for="item in projectOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
        </el-select>
        <el-button type="primary" :disabled="!projectId" @click="goToProjectDetail">查看项目详情</el-button>
      </template>
    </el-page-header>

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
    </div>

    <div v-if="projectId" class="cockpit-main mt20">
      <el-card shadow="hover" class="project-hero-card">
        <div class="project-hero-card__header">
          <div>
            <div class="project-hero-card__title">{{ selectedProjectDetail.name || '未选择项目' }}</div>
            <div class="project-hero-card__meta">
              <el-tag :type="selectedProjectDetail.status === '6' ? 'success' : 'primary'">{{ statusMap[selectedProjectDetail.status] || '-' }}</el-tag>
              <el-tag :type="selectedProjectDetail.priority === '3' ? 'danger' : selectedProjectDetail.priority === '2' ? 'warning' : 'info'">{{ priorityMap[selectedProjectDetail.priority] || '-' }}</el-tag>
              <span>进度 {{ selectedProjectDetail.progress || 0 }}%</span>
            </div>
          </div>
          <div class="project-hero-card__owner">
            <div class="project-hero-card__owner-label">项目负责人</div>
            <ViewUser :user="selectedProjectDetail.leader" />
          </div>
        </div>
        <ViewRichText v-if="selectedProjectDetail.description" :html="selectedProjectDetail.description" class="project-hero-card__content" />
        <div v-else class="project-hero-card__empty">暂无项目说明</div>
      </el-card>

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
          </div>
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
        </el-table>
      </el-card>
    </div>
    <el-empty v-else class="mt20" description="暂无可展示项目，请先创建项目或选择目标项目" />
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
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.03));
}

.summary-card--success {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.12), rgba(103, 194, 58, 0.03));
}

.summary-card--alert {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.12), rgba(245, 108, 108, 0.03));
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
  .cockpit-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .focus-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cockpit-summary-grid,
  .cockpit-board-grid,
  .focus-board,
  .board-stat-list {
    grid-template-columns: 1fr;
  }

  .project-hero-card__header {
    flex-direction: column;
  }
}
</style>
