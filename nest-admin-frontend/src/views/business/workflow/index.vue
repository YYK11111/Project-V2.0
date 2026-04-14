<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getWorkflowDefinitions, createWorkflowDefinition, updateWorkflowDefinition, deleteWorkflowDefinition, publishWorkflowDefinition, unpublishWorkflowDefinition, startWorkflow, copyWorkflowDefinition } from './api'
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
  const action = form.value.id ? updateWorkflowDefinition(form.value.id, form.value) : createWorkflowDefinition(form.value)
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
  { key: 'edit', label: '修改', disabled: !canWorkflowUpdate.value, onClick: () => dialogRef.value.action(row) },
  { key: 'publish', label: row.isActive !== '1' ? '发布' : '停用', disabled: !canWorkflowPublish.value, type: row.isActive !== '1' ? 'success' : 'info', onClick: () => row.isActive !== '1' ? handlePublish(row) : handleUnpublish(row) },
  { key: 'start', label: '发起', type: 'warning', disabled: !canWorkflowStart.value, onClick: () => handleStart(row) },
  { key: 'copy', label: '复制', type: 'info', disabled: !canWorkflowCopy.value, onClick: () => handleCopy(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canWorkflowDelete.value, onClick: () => rctRef.value.del(deleteWorkflowDefinition, row.id) },
]
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="getWorkflowDefinitions">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="流程名称" prop="name" />
        <BaInput v-model="query.code" label="流程编码" prop="code" />
        <BaSelect v-model="query.isActive" label="状态" prop="isActive" isAll>
          <el-option label="已发布" value="1" /><el-option label="未发布" value="0" />
        </BaSelect>
      </template>
      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canWorkflowAdd" type="primary" @click="dialogRef.action()">新建流程</el-button>
          <el-button v-if="canWorkflowDelete" :disabled="!selectedIds.length" @click="rctRef.del(deleteWorkflowDefinition)" type="danger">批量删除</el-button>
        </div>
      </template>
      <template #table>
        <el-table-column prop="name" label="流程名称" width="150" />
        <el-table-column prop="code" label="流程编码" width="150" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="category" label="分类" width="100" />
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
          <el-option label="人事审批" value="HR" /><el-option label="财务审批" value="Finance" />
          <el-option label="项目管理" value="Project" /><el-option label="行政办公" value="Admin" />
          <el-option label="其他" value="Other" />
        </BaSelect>
        <BaSelect v-model="form.businessType" prop="businessType" label="业务对象">
          <el-option label="项目" value="project" />
          <el-option label="任务" value="task" />
          <el-option label="客户" value="customer" />
          <el-option label="工单" value="ticket" />
          <el-option label="变更请求" value="change" />
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
