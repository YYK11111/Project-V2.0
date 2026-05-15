<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getWorkflowDefinitionList, createWorkflowDefinition, updateWorkflowDefinitionById, deleteWorkflowDefinition, publishWorkflowDefinition, unpublishWorkflowDefinition, startWorkflow, copyWorkflowDefinition } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const rctRef = ref()
const params = ref({})
const rules = { name: [$sdk.ruleRequiredBlur], businessType: [$sdk.ruleRequiredBlur], businessScene: [$sdk.ruleRequiredBlur], triggerEvent: [$sdk.ruleRequiredBlur] }

const dialogRef = ref()
const currentDefinition = ref<any>(null)
const startDialogRef = ref()
const startForm = reactive({ businessKey: '', variablesJson: '{}' })
const canWorkflowAdd = computed(() => checkPermi(['business/workflow/definitions/add']))
const canWorkflowUpdate = computed(() => checkPermi(['business/workflow/definitions/update']))
const canWorkflowDelete = computed(() => checkPermi(['business/workflow/definitions/delete']))
const canWorkflowPublish = computed(() => checkPermi(['business/workflow/definitions/publish']))
const canWorkflowStart = computed(() => checkPermi(['business/workflow/definitions/start']))
const canWorkflowCopy = computed(() => checkPermi(['business/workflow/definitions/copy']))

const generateWorkflowCode = (businessType: string) => {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '')
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `WF_${businessType || 'default'}_${ym}${seq}`
}

const workflowCategoryOptions = [
  { label: '人事审批', value: 'HR' },
  { label: '财务审批', value: 'Finance' },
  { label: '项目管理', value: 'Project' },
  { label: '行政办公', value: 'Admin' },
  { label: '其他', value: 'Other' },
]

const workflowCategoryNameMap = {
  HR: '人事审批',
  hr: '人事审批',
  Finance: '财务审批',
  finance: '财务审批',
  Project: '项目管理',
  project: '项目管理',
  Admin: '行政办公',
  admin: '行政办公',
  Other: '其他',
  other: '其他',
}

const normalizeWorkflowCategory = (category = '') => {
  const value = String(category || '').trim()
  if (!value) return ''
  if (value === 'project') return 'Project'
  if (value === 'finance') return 'Finance'
  if (value === 'admin') return 'Admin'
  if (value === 'other') return 'Other'
  if (value === 'hr') return 'HR'
  return value
}

const getWorkflowCategoryName = (category: string) => workflowCategoryNameMap[category] || category || '-'

watch(() => dialogRef.value?.visible, (visible) => {
  if (visible && !dialogRef.value?.form?.value?.id) {
    dialogRef.value.form.value.code = generateWorkflowCode(dialogRef.value.form.value.businessType || '')
  }
})

watch(() => dialogRef.value?.form?.value?.businessType, (bt) => {
  if (bt && !dialogRef.value?.form?.value?.id) {
    dialogRef.value.form.value.code = generateWorkflowCode(bt)
  }
})

const save = (data: any) => {
  if (!((!data.form.value.id && canWorkflowAdd.value) || (data.form.value.id && canWorkflowUpdate.value))) {
    data.loading.value = false
    return $sdk.msgWarning('当前操作没有权限')
  }
  const form = data.form
  form.value.category = normalizeWorkflowCategory(form.value.category)
  const action = form.value.id ? updateWorkflowDefinitionById(form.value.id, form.value) : createWorkflowDefinition(form.value)
  action.then(() => {
    ElMessage.success('保存成功')
    data.visible.value = false
    rctRef.value.getList()
  }).finally(() => {
    data.loading.value = false
  })
}

const handleDesign = (row: any) => router.push({ path: '/workflow/designer', query: { id: row.id } })

const handlePublish = (row: any) => publishWorkflowDefinition(row.id).then(() => { ElMessage.success('发布成功'); rctRef.value.getList() })
const handleUnpublish = (row: any) => unpublishWorkflowDefinition(row.id).then(() => { ElMessage.success('停用成功'); rctRef.value.getList() })

const handleStart = (row: any) => {
  currentDefinition.value = row
  startForm.businessKey = `${row.code}_${Date.now()}`
  startForm.variablesJson = '{}'
  startDialogRef.value.visible = true
}

const submitStart = () => {
  try {
    const variables = JSON.parse(startForm.variablesJson || '{}')
    startWorkflow({ code: currentDefinition.value.code, businessKey: startForm.businessKey, variables }).then(() => {
      ElMessage.success('流程发起成功')
      startDialogRef.value.visible = false
    })
  } catch (e) { ElMessage.error('JSON格式错误') }
}

const handleCopy = (row: any) => copyWorkflowDefinition(row.id).then(() => { ElMessage.success('复制成功'); rctRef.value.getList() })

const businessTypeMap = {
  project: '项目',
  task: '任务',
  customer: '客户',
  ticket: '工单',
  change: '变更请求',
  goLive: '上线单',
  acceptance: '验收单',
  handover: '运维交接单',
}

const businessSceneOptions = {
  project: [
    { label: '立项审批', value: 'initiation' },
    { label: '结项审批', value: 'closure' },
  ],
  task: [{ label: '任务审批', value: 'approval' }],
  ticket: [{ label: '工单审批', value: 'approval' }],
  change: [{ label: '变更审批', value: 'approval' }],
  customer: [{ label: '客户审批', value: 'approval' }],
  goLive: [{ label: '上线审批', value: 'approval' }],
  acceptance: [{ label: '验收审批', value: 'approval' }],
  handover: [{ label: '运维交接审批', value: 'approval' }],
}

const businessSceneLabelMap = {
  initiation: '立项审批',
  closure: '结项审批',
  approval: '审批流程',
}

const triggerEventMap = {
  manual: '手动',
  onCreate: '创建时',
  onStatusChange: '状态变更',
}

const triggerEventTypeMap = {
  manual: 'info',
  onCreate: 'success',
  onStatusChange: 'warning',
}

const getBusinessTypeName = (type: string) => businessTypeMap[type] || type
const getBusinessSceneName = (scene: string) => businessSceneLabelMap[scene] || scene || '-'
const getTriggerEventName = (event: string) => triggerEventMap[event] || event
const getTriggerEventType = (event: string) => triggerEventTypeMap[event] || 'info'

const getButtons = (row: any) => [
  { key: 'design', label: '设计', onClick: () => router.push({ path: '/workflow/designer', query: { id: row.id } }) },
  canWorkflowUpdate.value ? { key: 'edit', label: '编辑', onClick: () => dialogRef.value.action({ ...row, category: normalizeWorkflowCategory(row.category) }) } : null,
  canWorkflowPublish.value ? { key: 'publish', label: row.isActive !== '1' ? '发布' : '停用', type: row.isActive !== '1' ? 'success' : 'info', onClick: () => row.isActive !== '1' ? handlePublish(row) : handleUnpublish(row) } : null,
  canWorkflowStart.value ? { key: 'start', label: '发起', type: 'warning', onClick: () => handleStart(row) } : null,
  canWorkflowCopy.value ? { key: 'copy', label: '复制', type: 'info', onClick: () => handleCopy(row) } : null,
  canWorkflowDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(deleteWorkflowDefinition, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="workflow-index-page">
    <RequestChartTable ref="rctRef" class="workflow-index-panel business-list-panel" :params="params" :request="getWorkflowDefinitionList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.name" label="流程名称" prop="name" />
              <BaInput v-model="query.code" label="流程编码" prop="code" />
              <BaSelect v-model="query.isActive" label="状态" prop="isActive" isAll>
                <el-option label="已发布" value="1" /><el-option label="未发布" value="0" />
              </BaSelect>
            </div>
          </div>
        </div>
      </template>
      <template #operation="{ selectedIds }">
        <div class="workflow-index-operation">
          <div class="workflow-index-operation__left">
            <el-button v-if="canWorkflowAdd" type="primary" @click="dialogRef.action()">新增流程</el-button>
          </div>
          <el-button v-if="canWorkflowDelete" :disabled="!selectedIds.length" @click="rctRef.del(deleteWorkflowDefinition)" type="danger">批量删除</el-button>
        </div>
      </template>
      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="流程名称" width="150" />
        <el-table-column prop="code" label="流程编码" width="150" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">{{ getWorkflowCategoryName(row.category) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="businessType" label="业务对象" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.businessType" size="small">{{ getBusinessTypeName(row.businessType) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="businessScene" label="业务场景" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.businessScene" type="warning" size="small">{{ getBusinessSceneName(row.businessScene) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="triggerEvent" label="触发时机" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.triggerEvent" size="small" :type="getTriggerEventType(row.triggerEvent)">{{ getTriggerEventName(row.triggerEvent) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.isActive === '1' ? 'success' : 'info'">{{ row.isActive === '1' ? '已发布' : '未发布' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </template>
      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog ref="dialogRef" dynamicTitle="流程" :rules="rules" width="600" @confirm="save">
      <template #form="{ form }">
        <BaInput v-model="form.name" prop="name" label="流程名称" />
        <BaInput v-model="form.code" prop="code" label="流程编码" disabled />
        <BaSelect v-model="form.category" prop="category" label="流程分类">
          <el-option v-for="item in workflowCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <BaSelect v-model="form.businessType" prop="businessType" label="业务对象">
          <el-option label="项目" value="project" />
          <el-option label="任务" value="task" />
          <el-option label="客户" value="customer" />
          <el-option label="工单" value="ticket" />
          <el-option label="变更请求" value="change" />
          <el-option label="上线单" value="goLive" />
          <el-option label="验收单" value="acceptance" />
          <el-option label="运维交接单" value="handover" />
        </BaSelect>
        <BaSelect v-model="form.businessScene" prop="businessScene" label="业务场景">
          <el-option v-for="item in (businessSceneOptions[form.businessType] || [])" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <BaSelect v-model="form.triggerEvent" prop="triggerEvent" label="触发时机">
          <el-option label="手动触发" value="manual" />
          <el-option label="创建时自动" value="onCreate" />
          <el-option label="状态变更时" value="onStatusChange" />
        </BaSelect>
        <BaInput v-model="form.description" prop="description" type="textarea" label="描述" />
      </template>
    </BaDialog>

    <BaDialog ref="startDialogRef" dynamicTitle="发起流程" width="500" @confirm="submitStart">
      <template #form="{ form }">
        <BaInput v-model="form.businessKey" prop="businessKey" label="业务单号" />
        <BaInput v-model="form.variablesJson" prop="variablesJson" type="textarea" label="流程变量" placeholder='{"days": 3}' />
      </template>
    </BaDialog>
  </div>
</template>

<style scoped>
.workflow-index-page {
  min-height: 100%;
}

.workflow-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.workflow-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.workflow-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.workflow-index-panel :deep(.el-table__header-wrapper),
.workflow-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-grid :deep(.el-form-item) {
  display: flex;
  width: 100%;
  margin-bottom: 0;
}

.query-grid :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input) {
  width: 100%;
  flex: 1;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workflow-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .workflow-index-operation,
  .workflow-index-operation__left {
    align-items: stretch;
  }
}
</style>
