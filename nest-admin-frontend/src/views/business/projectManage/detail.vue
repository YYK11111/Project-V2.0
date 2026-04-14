<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOne, getStatus, getPriority, submitApproval, submitClose } from './api'
import { getList as getTaskList } from '../taskManage/api'
import { getList as getTicketList } from '../ticketManage/api'
import { getList as getMilestoneList } from '../milestoneManage/api'
import { getList as getRiskList } from '../riskManage/api'
import { getList as getChangeList } from '../changeManage/api'
import { getList as getSprintList } from '../sprintManage/api'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const projectId = route.query.id

const project = ref({})
const statusMap = ref({})
const priorityMap = ref({})
const tasks = ref([])
const tickets = ref([])
const milestones = ref([])
const risks = ref([])
const changes = ref([])
const sprints = ref([])
const activeTab = ref('overview')
const canProjectSubmitApproval = computed(() => checkPermi(['business/projects/submitApproval']))
const canProjectSubmitClose = computed(() => checkPermi(['business/projects/submitClose']))

onMounted(async () => {
  const [statusRes, priorityRes, oneRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getOne(projectId)
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  project.value = oneRes.data || {}

  const [taskRes, ticketRes, milestoneRes, riskRes, changeRes, sprintRes] = await Promise.all([
    getTaskList({ projectId }),
    getTicketList({ projectId }),
    getMilestoneList({ projectId }),
    getRiskList({ projectId }),
    getChangeList({ projectId }),
    getSprintList({ projectId })
  ])
  tasks.value = taskRes.list || []
  tickets.value = ticketRes.list || []
  milestones.value = (oneRes.data?.milestones?.length ? oneRes.data.milestones : milestoneRes.list) || []
  risks.value = riskRes.list || []
  changes.value = changeRes.list || []
  sprints.value = sprintRes.list || []
})

const getStatusType = (s) => {
  const types = { '1': 'info', '2': 'warning', '3': 'primary', '4': 'warning', '5': 'warning', '6': 'success', '7': 'danger' }
  return types[s] || 'info'
}

const getSeverityType = (s) => {
  const types = { '1': 'danger', '2': 'warning', '3': 'info', '4': 'success' }
  return types[s] || 'info'
}

function handleSubmitApproval() {
  if (!canProjectSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  submitApproval(projectId).then(() => {
    $sdk.msgSuccess('提交成功，请等待审批')
    getOne(projectId).then(({ data }) => {
      project.value = data || {}
    })
  }).catch(e => {
    $sdk.msgError(e.message || '提交失败')
  })
}

function handleSubmitClose() {
  if (!canProjectSubmitClose.value) return $sdk.msgWarning('当前操作没有权限')
  submitClose(projectId).then(() => {
    $sdk.msgSuccess('结项申请已提交')
    getOne(projectId).then(({ data }) => {
      project.value = data || {}
    })
  }).catch(e => {
    $sdk.msgError(e.message || '提交失败')
  })
}
</script>

<template>
  <div class="project-detail">
    <el-page-header @back="$router.back()" title="项目详情">
      <template #extra>
        <el-button type="primary" @click="handleSubmitApproval" v-if="canProjectSubmitApproval && project.status === '1'">
          提交立项审批
        </el-button>
        <el-button type="warning" @click="handleSubmitClose" v-if="canProjectSubmitClose && project.status === '3'">
          提交结项申请
        </el-button>
      </template>
    </el-page-header>

    <el-tabs v-model="activeTab" class="mt20">
      <el-tab-pane label="概览" name="overview">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>基本信息</template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
                <el-descriptions-item label="项目编号">{{ project.code || '-' }}</el-descriptions-item>
                <el-descriptions-item label="负责人">{{ project.leader?.nickname || '-' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(project.status)">{{ statusMap[project.status] || '-' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="优先级">
                  <el-tag :type="project.priority === '3' ? 'danger' : project.priority === '2' ? 'warning' : 'info'">
                    {{ priorityMap[project.priority] || '-' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ project.startDate || '-' }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ project.endDate || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>预算与进度</template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="客户">{{ project.customerId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="项目预算">¥ {{ (project.budget || 0).toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="实际成本">¥ {{ (project.actualCost || 0).toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="进度">
                  <el-progress :percentage="project.progress || 0" :stroke-width="10" />
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>关键指标</template>
              <div class="metrics">
                <div class="metric-item">
                  <div class="metric-value">{{ tasks.length }}</div>
                  <div class="metric-label">总任务数</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">{{ tasks.filter(t => t.status === '3').length }}</div>
                  <div class="metric-label">已完成</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">{{ tickets.length }}</div>
                  <div class="metric-label">缺陷数</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">{{ tickets.filter(t => t.severity === '1').length }}</div>
                  <div class="metric-label">严重缺陷</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" class="mt20">
          <template #header>项目描述</template>
          <div v-html="project.description || '无描述'" class="project-desc" />
        </el-card>

        <el-card shadow="hover" class="mt20">
          <template #header>项目成员</template>
          <el-table :data="project.members || []" size="small" border>
            <el-table-column prop="user.nickname" label="成员" min-width="140">
              <template #default="{ row }">
                {{ row.user?.nickname || row.user?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="140">
              <template #default="{ row }">
                {{ { '1': '项目经理', '2': '交付经理', '3': '技术负责人', '4': '实施负责人', '5': '测试负责人', '6': '客户联系人', '7': '商务接口人', '8': '开发工程师', '9': '实施顾问', 'A': '测试工程师', 'B': '运维工程师', 'C': '培训顾问', 'D': '数据迁移工程师', 'E': '驻场支持', 'F': '普通成员', 'G': '访客' }[row.role] || row.role }}
              </template>
            </el-table-column>
            <el-table-column prop="isCore" label="核心成员" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isCore === '1' ? 'success' : 'info'" size="small">{{ row.isCore === '1' ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="任务列表" name="tasks">
        <el-table :data="tasks" stripe>
          <el-table-column prop="name" label="任务名称" min-width="150" />
          <el-table-column prop="leaderId" label="负责人" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" size="small">
                {{ priorityMap[row.priority] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始时间" width="120" />
          <el-table-column prop="endDate" label="结束时间" width="120" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="缺陷列表" name="tickets">
        <el-table :data="tickets" stripe>
          <el-table-column prop="title" label="缺陷标题" min-width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.type === 'bug' ? 'Bug' : '问题' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.severity)" size="small">
                {{ { '1': '严重', '2': '高', '3': '中', '4': '低' }[row.severity] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rootCauseCategory" label="根因分类" width="120">
            <template #default="{ row }">
              {{ row.rootCauseCategory ? { 'code_defect': '代码缺陷', 'design_issue': '设计问题', 'requirement_gap': '需求缺失', 'test_gap': '测试遗漏', 'environment': '环境问题', 'other': '其他' }[row.rootCauseCategory] : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="里程碑" name="milestones">
        <el-table :data="milestones" stripe>
          <el-table-column prop="name" label="里程碑名称" min-width="150" />
          <el-table-column prop="dueDate" label="计划完成日期" width="130" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '2' ? 'success' : row.status === '3' ? 'danger' : 'info'" size="small">
                {{ { '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="taskCount" label="关联任务" width="100" />
          <el-table-column prop="completedTaskCount" label="已完成" width="100" />
          <el-table-column label="进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.taskCount > 0 ? Math.round((row.completedTaskCount / row.taskCount) * 100) : 0" :stroke-width="8" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="风险" name="risks">
        <el-table :data="risks" stripe>
          <el-table-column prop="name" label="风险名称" min-width="150" />
          <el-table-column prop="category" label="分类" width="100">
            <template #default="{ row }">
              {{ { '1': '进度', '2': '预算', '3': '资源', '4': '技术', '5': '需求', '6': '质量', '7': '外部', '8': '其他' }[row.category] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="80">
            <template #default="{ row }">
              <el-tag :type="row.level === '4' ? 'error' : row.level === '3' ? 'danger' : row.level === '2' ? 'warning' : 'info'" size="small">
                {{ { '1': '低', '2': '中', '3': '高', '4': '严重' }[row.level] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '4' ? 'success' : row.status === '5' ? 'info' : 'warning'" size="small">
                {{ { '1': '已识别', '2': '评估中', '3': '处理中', '4': '已解决', '5': '已关闭' }[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="计划解决日期" width="130" />
          <el-table-column prop="mitigation" label="应对措施" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="变更" name="changes">
        <el-table :data="changes" stripe>
          <el-table-column prop="title" label="变更标题" min-width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ { '1': '范围', '2': '进度', '3': '预算', '4': '资源', '5': '需求', '6': '其他' }[row.type] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="impact" label="影响" width="80">
            <template #default="{ row }">
              <el-tag :type="row.impact === '3' ? 'danger' : row.impact === '2' ? 'warning' : 'info'" size="small">
                {{ { '1': '低', '2': '中', '3': '高' }[row.impact] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '3' ? 'success' : row.status === '4' ? 'danger' : row.status === '2' ? 'warning' : 'info'" size="small">
                {{ { '1': '草稿', '2': '待审批', '3': '已批准', '4': '已驳回', '5': '已实施' }[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="costImpact" label="成本影响" width="100">
            <template #default="{ row }">¥{{ (row.costImpact || 0).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="scheduleImpact" label="进度影响(天)" width="100" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Sprint" name="sprints">
        <el-table :data="sprints" stripe>
          <el-table-column prop="name" label="Sprint名称" min-width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '2' ? 'primary' : row.status === '3' ? 'success' : 'info'" size="small">
                {{ { '1': '计划中', '2': '进行中', '3': '已完成', '4': '已取消' }[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="110" />
          <el-table-column prop="endDate" label="结束日期" width="110" />
          <el-table-column prop="totalStoryPoints" label="故事点" width="80" />
          <el-table-column label="进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.totalStoryPoints > 0 ? Math.round((row.completedStoryPoints / row.totalStoryPoints) * 100) : 0" :stroke-width="8" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.project-detail {
  padding: 20px;
}
.metrics {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}
.metric-item {
  text-align: center;
}
.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}
.metric-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
.project-desc {
  min-height: 100px;
  line-height: 1.6;
}
</style>
