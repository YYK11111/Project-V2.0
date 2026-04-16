<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, getStatus, getPriority, getProjectType } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import { getWorkflowInstance } from '@/views/business/workflow/api'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

const route = useRoute()
const router = useRouter()

const projectId = String(route.query.id || '')
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')

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
const workflowPanelRef = ref()
const workflowInstance = ref(null)

const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => project.value.customer || customerMap.value.get(String(project.value.customerId || '')) || null)
const canCloseReturnedInstance = computed(() => project.value?.workflowInstanceId && project.value?.approvalStatus === '3' && String(project.value?.currentNodeName || '').includes('退回发起人'))

function getApprovalType(status) {
  if (status === '2') return 'success'
  if (status === '1') return 'warning'
  if (status === '3') return 'danger'
  return 'info'
}

async function reloadCurrent() {
  const [statusRes, priorityRes, projectTypeRes, customerRes, projectRes, workflowRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getProjectType(),
    getCustomerList({ pageNum: 1, pageSize: 1000 }),
    getOne(projectId),
    workflowInstanceId.value ? getWorkflowInstance(workflowInstanceId.value) : Promise.resolve({ data: null }),
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  projectTypeMap.value = projectTypeRes.data || {}
  customerList.value = customerRes.list || []
  workflowInstance.value = workflowRes.data || null
  project.value = {
    attachments: [],
    members: [],
    milestones: [],
    ...projectRes.data,
    members: projectRes.data?.members || [],
    milestones: projectRes.data?.milestones || [],
  }
}

function goToProjectDetail() {
  router.push({ path: '/projectManage/detail', query: { id: projectId } })
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

reloadCurrent()
</script>

<template>
  <div class="Gcard project-approval-page">
    <div class="mb20">
      <el-page-header @back="$router.back()" title="项目审批">
        <template #extra>
          <el-button @click="goToProjectDetail">查看完整项目详情</el-button>
          <el-button v-if="fromWorkflow && workflowTaskId" type="primary" @click="scrollToWorkflowPanel">跳转审批区</el-button>
        </template>
      </el-page-header>
    </div>

    <div class="approval-sections">
      <section class="section-card section-card--summary">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">审批摘要</div>
            <div class="section-desc">聚焦展示立项审批决策所需的核心信息与当前流程状态。</div>
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
              <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[project.approvalStatus] || '无需审批'" :type="getApprovalType(project.approvalStatus)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="summary-row summary-row--last">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="发起人">
              <ViewField :value="workflowInstance?.starterName || workflowInstance?.starterId || '-'
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
            <el-form-item label="进度(%)">
              <ViewField :value="project.progress" />
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
            <div class="section-desc">查看立项审批所需的项目基础属性、负责人、时间计划和预算信息。</div>
          </div>
        </div>

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
            <el-form-item label="开始时间">
              <ViewField :value="project.startDate" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="结束时间">
              <ViewField :value="project.endDate" />
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
            <el-form-item label="实际成本">
              <ViewField :value="project.actualCost" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="section-card section-card--table">
        <div class="section-header">
          <div>
            <div class="section-title">项目成员</div>
            <div class="section-desc">审批时快速判断项目角色配置和核心成员是否齐备。</div>
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
            <div class="section-desc">审批时核对里程碑、计划日期和关键交付物是否完整。</div>
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
            <div class="section-title">项目描述与附件</div>
            <div class="section-desc">审批重点关注项目背景、范围说明和相关立项材料。</div>
          </div>
        </div>

        <el-form-item label="项目描述">
          <ViewRichText :html="project.description" />
        </el-form-item>

        <el-form-item label="项目附件">
          <ViewFileList :files="project.attachments || []" />
        </el-form-item>
      </section>

      <section v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="section-card section-card--approval">
        <div class="section-header section-header--stack">
          <div>
            <div class="section-title">审批处理</div>
            <div class="section-desc">请在核对项目立项材料后完成审批、驳回、转交或加签操作。</div>
          </div>
        </div>
        <WorkflowApprovalPanel
          :task-id="workflowTaskId"
          :instance-id="workflowInstanceId"
          :node-name="project.currentNodeName"
          @approved="reloadCurrent" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.project-approval-page {
  min-height: 100%;
}

.approval-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
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
  color: #303133;
}

.section-desc {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.summary-row,
.basic-info-row {
  margin-bottom: 8px;
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
</style>
