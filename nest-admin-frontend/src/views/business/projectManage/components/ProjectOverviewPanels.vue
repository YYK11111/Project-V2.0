<script setup>
import { computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

const props = defineProps({
  project: {
    type: Object,
    default: () => ({}),
  },
  taskSummary: {
    type: Object,
    default: () => ({}),
  },
  milestoneSummary: {
    type: Object,
    default: () => ({}),
  },
  projectHealthSummary: {
    type: Object,
    default: () => ({}),
  },
  dueSoonMilestones: {
    type: Array,
    default: () => [],
  },
  milestones: {
    type: Array,
    default: () => [],
  },
  canViewProjectMember: {
    type: Boolean,
    default: false,
  },
  costVariance: {
    type: Number,
    default: 0,
  },
})

const coreMembers = computed(() =>
  (props.project.members || []).filter((item) => String(item.isCore || '0') === '1'),
)

const delayedMilestones = computed(() =>
  (props.milestones || [])
    .filter((item) => String(item.status || '') === '3')
    .slice(0, 5),
)

const milestoneStatusMap = {
  1: '待完成',
  2: '已完成',
  3: '已延期',
  4: '已取消',
}

const memberRoleMap = {
  1: '项目经理',
  2: '交付经理',
  3: '技术负责人',
  4: '实施负责人',
  5: '测试负责人',
  6: '客户联系人',
  7: '商务接口人',
  8: '开发工程师',
  9: '实施顾问',
  A: '测试工程师',
  B: '运维工程师',
  C: '培训顾问',
  D: '数据迁移工程师',
  E: '驻场支持',
  F: '普通成员',
  G: '访客',
}

function getHealthTagType(level) {
  if (level === 'healthy') return 'success'
  if (level === 'stable') return 'primary'
  if (level === 'attention') return 'warning'
  return 'danger'
}
</script>

<template>
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
          <div v-if="canViewProjectMember && coreMembers.length" class="core-member-list">
            <div v-for="item in coreMembers" :key="item.id || item.userId" class="core-member-item">
              <ViewUser :user="item.user" />
              <div class="core-member-item__role">{{ item.role ? item.role : '-' }}</div>
            </div>
          </div>
          <div v-else class="focus-list__empty">{{ canViewProjectMember ? '暂无核心成员' : '当前角色无权查看项目成员' }}</div>
        </div>
        <div class="side-panel-block">
          <div class="side-panel-block__title">近期里程碑</div>
          <div v-if="dueSoonMilestones.length || delayedMilestones.length" class="focus-list">
            <div v-for="item in [...dueSoonMilestones, ...delayedMilestones].slice(0, 5)" :key="item.id" class="focus-list__item">
              <div class="focus-list__title">{{ item.name }}</div>
              <div class="focus-list__meta">{{ item.dueDate || '-' }} / {{ milestoneStatusMap[item.status] || '-' }}</div>
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

  <el-card v-if="canViewProjectMember" shadow="hover" class="mt20 panel-card">
    <template #header>项目成员</template>
    <el-table :data="project.members || []" size="small" border>
      <el-table-column label="成员" min-width="180">
        <template #default="{ row }">
          <ViewUser :user="row.user" />
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" min-width="140">
        <template #default="{ row }">
          {{ memberRoleMap[row.role] || row.role }}
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
</template>

<style scoped>
.panel-card {
  border-radius: 14px;
}

.panel-progress-list {
  display: grid;
  gap: 16px;
}

.panel-progress-item {
  display: grid;
  gap: 10px;
}

.panel-progress-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-primary);
}

.panel-progress-item__label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.panel-progress-item__tip {
  color: var(--el-text-color-secondary);
}

.cost-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.cost-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.cost-card--warning {
  background: color-mix(in srgb, var(--el-color-warning) 12%, var(--el-fill-color-extra-light));
}

.cost-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cost-card__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.cost-card__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.side-panel-block + .side-panel-block {
  margin-top: 16px;
}

.side-panel-block__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.core-member-list {
  display: grid;
  gap: 12px;
}

.core-member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.core-member-item__role {
  color: var(--el-text-color-secondary);
  font-size: 12px;
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

.health-score-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.health-score-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.health-score-card__score {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.health-score-card__desc {
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
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

.health-dimension-card span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.health-dimension-card strong {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.health-alert-list {
  display: grid;
  gap: 10px;
}

.health-alert-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-fill-color-extra-light));
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .cost-grid,
  .health-dimension-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .cost-grid,
  .health-dimension-grid {
    grid-template-columns: 1fr;
  }
}
</style>
