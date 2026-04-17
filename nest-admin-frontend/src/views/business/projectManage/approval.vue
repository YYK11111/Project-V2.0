<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getOne, getStatus, getPriority, getProjectType, submitApproval } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import { closeReturnedWorkflowInstance, getWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import { checkPermi } from '@/utils/permission'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.query.id || ''))
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || project.value?.workflowInstanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const approvalRetryFailed = computed(() => route.query.approvalFailed === '1')
const canProjectSubmitApproval = computed(() => checkPermi(['business/projects/submitApproval']))
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))
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
const workflowPanelRef = ref()
const workflowInstance = ref(null)

const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => project.value.customer || customerMap.value.get(String(project.value.customerId || '')) || null)
const canCloseReturnedInstance = computed(() => project.value?.workflowInstanceId && project.value?.approvalStatus === '3' && String(project.value?.currentNodeName || '').includes('退回发起人'))
const canEditProject = computed(() => canProjectUpdate.value && String(project.value?.status || '') !== '3')
const isApprovalRejected = computed(() => project.value?.approvalStatus === '3')
const isApprovalPassed = computed(() => project.value?.approvalStatus === '2')
const isApprovalRunning = computed(() => project.value?.approvalStatus === '1')

function getApprovalType(status) {
  if (status === '2') return 'success'
  if (status === '1') return 'warning'
  if (status === '3') return 'danger'
  return 'info'
}

async function reloadCurrent() {
  if (!projectId.value) return
  const [statusRes, priorityRes, projectTypeRes, customerRes, projectRes, workflowRes] = await Promise.all([
    getStatus(),
    getPriority(),
    getProjectType(),
    getCustomerList({ pageNum: 1, pageSize: 1000 }),
    getOne(projectId.value),
    workflowInstanceId.value ? getWorkflowInstance(workflowInstanceId.value) : Promise.resolve({ data: null }),
  ])
  statusMap.value = statusRes.data || {}
  priorityMap.value = priorityRes.data || {}
  projectTypeMap.value = projectTypeRes.data || {}
  customerList.value = customerRes.list || []
  project.value = {
    attachments: [],
    members: [],
    milestones: [],
    ...projectRes.data,
    members: projectRes.data?.members || [],
    milestones: projectRes.data?.milestones || [],
  }
  workflowInstance.value = workflowRes.data || null

  if (!workflowInstance.value && project.value?.workflowInstanceId) {
    const fallbackWorkflowRes = await getWorkflowInstance(project.value.workflowInstanceId)
    workflowInstance.value = fallbackWorkflowRes.data || null
  }
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
  if (!canProjectSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  retryApprovalLoading.value = true
  submitApproval(projectId).then(() => {
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
  if (!canProjectSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  const request = canCloseReturnedInstance.value
    ? resubmitReturnedWorkflowInstance(project.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    : submitApproval(projectId)
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
      <el-page-header @back="$router.back()" title="项目审批">
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
          <el-button v-if="canProjectSubmitApproval && project.status === '1'" type="warning" size="small" :loading="retryApprovalLoading" @click="handleRetryApproval">重试发起立项审批</el-button>
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
          <el-button v-if="canCloseReturnedInstance && canProjectSubmitApproval" type="warning" size="small" @click="handleSubmitApproval">重新提交立项审批</el-button>
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
      title="项目立项审批进行中，请在本页查看流程状态与审批处理进展。"
      type="info"
      :closable="false"
      show-icon
      class="mb20"
    />

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

.top-alert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
