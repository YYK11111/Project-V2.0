<script setup>
import ViewTagField from '@/components/view/ViewTagField.vue'

defineProps({
  isProjectVisitor: {
    type: Boolean,
    default: false,
  },
  taskSummary: {
    type: Object,
    default: () => ({}),
  },
  ticketSummary: {
    type: Object,
    default: () => ({}),
  },
  riskSummary: {
    type: Object,
    default: () => ({}),
  },
  changeSummary: {
    type: Object,
    default: () => ({}),
  },
  sprintSummary: {
    type: Object,
    default: () => ({}),
  },
  milestoneSummary: {
    type: Object,
    default: () => ({}),
  },
  projectKnowledgeSummary: {
    type: Object,
    default: () => ({}),
  },
  executionPlanSummary: {
    type: Object,
    default: () => ({}),
  },
  projectHealthSummary: {
    type: Object,
    default: () => ({}),
  },
  projectAlerts: {
    type: Array,
    default: () => [],
  },
  dueSoonTasks: {
    type: Array,
    default: () => [],
  },
  overdueTasks: {
    type: Array,
    default: () => [],
  },
  criticalTickets: {
    type: Array,
    default: () => [],
  },
  highRisks: {
    type: Array,
    default: () => [],
  },
  priorityMap: {
    type: Object,
    default: () => ({}),
  },
  project: {
    type: Object,
    default: () => ({}),
  },
  executionPlanProgress: {
    type: Number,
    default: 0,
  },
  canViewProjectClosure: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['metricCardClick', 'goToTab', 'projectAlertClick'])

function emitMetricCardClick(type, filter) {
  emit('metricCardClick', type, filter)
}

function emitGoToTab(tab) {
  emit('goToTab', tab)
}

function emitProjectAlertClick(item) {
  emit('projectAlertClick', item)
}

function getHealthTagType(level) {
  if (level === 'healthy') return 'success'
  if (level === 'stable') return 'primary'
  if (level === 'attention') return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="metric-grid">
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('tasks', 'all')">
      <div class="metric-card__value">{{ taskSummary.total }}</div>
      <div class="metric-card__label">总任务数</div>
      <div class="metric-card__desc">已完成 {{ taskSummary.completed }}，逾期 {{ taskSummary.overdue }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('tickets', 'open')">
      <div class="metric-card__value">{{ ticketSummary.open }}</div>
      <div class="metric-card__label">打开缺陷</div>
      <div class="metric-card__desc">严重缺陷 {{ ticketSummary.critical }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('risks', 'active')">
      <div class="metric-card__value">{{ riskSummary.active }}</div>
      <div class="metric-card__label">活跃风险</div>
      <div class="metric-card__desc">高风险 {{ riskSummary.high }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('changes', 'pending')">
      <div class="metric-card__value">{{ changeSummary.pendingApproval }}</div>
      <div class="metric-card__label">待审批变更</div>
      <div class="metric-card__desc">高影响 {{ changeSummary.highImpact }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('sprints', 'active')">
      <div class="metric-card__value">{{ sprintSummary.active }}</div>
      <div class="metric-card__label">当前 Sprint</div>
      <div class="metric-card__desc">总 Sprint {{ sprintSummary.total }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick('milestones', 'delayed')">
      <div class="metric-card__value">{{ milestoneSummary.completionRate }}%</div>
      <div class="metric-card__label">里程碑达成率</div>
      <div class="metric-card__desc">延期 {{ milestoneSummary.delayed }}，临近 {{ milestoneSummary.dueSoon }}</div>
    </el-card>
    <el-card shadow="hover" class="metric-card metric-card--clickable" @click="emitGoToTab('knowledge')">
      <div class="metric-card__value">{{ projectKnowledgeSummary.total || 0 }}</div>
      <div class="metric-card__label">项目知识</div>
      <div class="metric-card__desc">最近更新 {{ projectKnowledgeSummary.recentUpdatedCount || 0 }}</div>
    </el-card>
    <el-card v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitGoToTab('plan')">
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
    <el-card v-if="!isProjectVisitor && canViewProjectClosure" shadow="hover" class="metric-card metric-card--clickable" @click="emitGoToTab('closure')">
      <div class="metric-card__value">{{ project.closeReview ? '已补齐' : '待完善' }}</div>
      <div class="metric-card__label">结项资料</div>
      <div class="metric-card__desc">验收说明、交付清单、遗留问题与项目复盘</div>
    </el-card>
  </div>

  <el-card shadow="hover" class="mt20 panel-card">
    <template #header>统一提醒</template>
    <div v-if="!isProjectVisitor && projectAlerts.length" class="project-alert-grid">
      <div v-for="item in projectAlerts" :key="`${item.tab}-${item.title}`" class="project-alert-card" :class="`project-alert-card--${item.type}`" @click="emitProjectAlertClick(item)">
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
          <el-button link type="primary" @click="emitGoToTab('tasks')">查看全部</el-button>
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
          <el-button link type="primary" @click="emitGoToTab('tasks')">查看全部</el-button>
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
          <el-button link type="primary" @click="emitGoToTab('tickets')">查看全部</el-button>
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
          <el-button link type="primary" @click="emitGoToTab('risks')">查看全部</el-button>
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
</template>

<style scoped>
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

.panel-card {
  border-radius: 14px;
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

.focus-grid {
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

.focus-list__empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .project-alert-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .metric-grid,
  .focus-grid,
  .project-alert-grid {
    grid-template-columns: 1fr;
  }
}
</style>
