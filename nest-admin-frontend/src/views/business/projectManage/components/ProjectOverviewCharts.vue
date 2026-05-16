<script setup>
import ChartPie from '@/components/ChartPie.vue'

defineProps({
  isProjectVisitor: {
    type: Boolean,
    default: false,
  },
  hasOverviewCharts: {
    type: Boolean,
    default: false,
  },
  taskStatusChartData: {
    type: Array,
    default: () => [],
  },
  ticketSeverityChartData: {
    type: Array,
    default: () => [],
  },
  riskLevelChartData: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['chartSliceClick'])

const chartOption = {
  legend: { y: '84%' },
  series: { radius: ['42%', '68%'] },
}

function handleTaskSliceClick(slice) {
  const filter = slice.name === '已逾期'
    ? 'overdue'
    : slice.name === '处理中'
      ? 'inProgress'
      : 'all'
  emit('chartSliceClick', 'tasks', filter)
}

function handleTicketSliceClick(slice) {
  emit('chartSliceClick', 'tickets', slice.name === '严重' ? 'critical' : 'open')
}

function handleRiskSliceClick(slice) {
  emit('chartSliceClick', 'risks', ['高', '严重'].includes(slice.name) ? 'high' : 'active')
}
</script>

<template>
  <el-row v-if="!isProjectVisitor && hasOverviewCharts" :gutter="20" class="mt20">
    <el-col :xs="24" :lg="8">
      <el-card shadow="hover" class="panel-card chart-card">
        <template #header>任务状态分布</template>
        <ChartPie key="task-status-chart" :series="taskStatusChartData" :option="chartOption" @slice-click="handleTaskSliceClick" />
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="8">
      <el-card shadow="hover" class="panel-card chart-card">
        <template #header>缺陷严重度分布</template>
        <ChartPie key="ticket-severity-chart" :series="ticketSeverityChartData" :option="chartOption" @slice-click="handleTicketSliceClick" />
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="8">
      <el-card shadow="hover" class="panel-card chart-card">
        <template #header>风险等级分布</template>
        <ChartPie key="risk-level-chart" :series="riskLevelChartData" :option="chartOption" @slice-click="handleRiskSliceClick" />
      </el-card>
    </el-col>
  </el-row>

  <el-card v-else shadow="hover" class="mt20 panel-card overview-empty-card">
    <template #header>统计分布</template>
    <div class="overview-empty-card__content">当前项目还没有足够的任务、缺陷或风险数据可用于生成分布图。</div>
  </el-card>
</template>

<style scoped>
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
</style>
