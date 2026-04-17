<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBusinessConfigs, saveBusinessConfig, deleteBusinessConfig } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

type TriggerRow = {
  triggerEvent: string
  businessScene: string
  statusTriggerValues: string[]
  enabled: boolean
}

type ConfigForm = {
  businessType: string
  triggerEvent: string
  businessScene: string
  statusTriggerValues: string[]
  isActive: string
}

const rctRef = ref()
const params = ref({})
const dialogRef = ref()
const editingTriggerConfig = ref<Record<string, any>>({})

const canWorkflowConfigAdd = computed(() => checkPermi(['business/workflow/configs/add']))
const canWorkflowConfigUpdate = computed(() => checkPermi(['business/workflow/configs/update']))
const canWorkflowConfigDelete = computed(() => checkPermi(['business/workflow/configs/delete']))

const businessTypeOptions = [
  { label: '项目', value: 'project' },
  { label: '任务', value: 'task' },
  { label: '客户', value: 'customer' },
  { label: '工单', value: 'ticket' },
  { label: '变更请求', value: 'change' },
]

const triggerEventOptions = [
  { label: '创建时自动', value: 'onCreate' },
  { label: '状态变更时', value: 'onStatusChange' },
]

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

const statusOptions = [
  { label: '待处理', value: '1' },
  { label: '处理中', value: '2' },
  { label: '已解决', value: '3' },
  { label: '已关闭', value: '4' },
  { label: '草稿', value: '1' },
  { label: '审批中', value: '2' },
  { label: '已通过', value: '3' },
  { label: '已驳回', value: '4' },
]

const rules = {
  businessType: [$sdk.ruleRequiredBlur],
  triggerEvent: [$sdk.ruleRequiredBlur],
  businessScene: [$sdk.ruleRequiredBlur],
}

const getBusinessTypeName = (type: string) => businessTypeOptions.find((o) => o.value === type)?.label || type
const getTriggerEventName = (event: string) => triggerEventOptions.find((o) => o.value === event)?.label || event
const getBusinessSceneName = (businessType: string, businessScene: string) => businessSceneOptions[businessType]?.find((o) => o.value === businessScene)?.label || businessScene

const parseTriggerConfig = (configStr: string) => {
  if (!configStr) return {}
  try {
    return typeof configStr === 'string' ? JSON.parse(configStr) : configStr
  } catch {
    return {}
  }
}

const getTriggerRows = (row: any): TriggerRow[] => {
  const config = parseTriggerConfig(row.triggerConfig || '{}')
  return Object.entries(config).map(([key, value]: [string, any]) => ({
    triggerEvent: key,
    businessScene: value.businessScene,
    statusTriggerValues: value.statusTriggerValues || [],
    enabled: value.enabled !== false,
  }))
}

const save = (data: any) => {
  if (!((!data.form.value.businessType && canWorkflowConfigAdd.value) || (data.form.value.businessType && canWorkflowConfigUpdate.value))) {
    data.loading.value = false
    ElMessage.warning('当前操作没有权限')
    return
  }

  const triggerConfig = {
    ...editingTriggerConfig.value,
    [data.form.value.triggerEvent]: {
      triggerEvent: data.form.value.triggerEvent,
      businessScene: data.form.value.businessScene,
      statusTriggerValues: data.form.value.triggerEvent === 'onStatusChange' ? (data.form.value.statusTriggerValues || []) : [],
      enabled: data.form.value.isActive === '1',
    },
  }

  saveBusinessConfig({
    businessType: data.form.value.businessType,
    name: getBusinessTypeName(data.form.value.businessType),
    triggerConfig: JSON.stringify(triggerConfig),
    isActive: data.form.value.isActive,
  }).then(() => {
    ElMessage.success('保存成功')
    data.visible.value = false
    rctRef.value.getList()
  }).finally(() => {
    data.loading.value = false
  })
}

const handleDelete = (row: any) => {
  if (!canWorkflowConfigDelete.value) {
    ElMessage.warning('当前操作没有权限')
    return
  }
  ElMessageBox.confirm('确定删除该自动触发配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteBusinessConfig(row.businessType).then(() => {
      ElMessage.success('删除成功')
      rctRef.value.getList()
    })
  })
}

const openDialog = (row?: any, triggerRow?: TriggerRow) => {
  editingTriggerConfig.value = row ? { ...parseTriggerConfig(row.triggerConfig || '{}') } : {}
  const triggers = row ? getTriggerRows(row) : []
  const trigger: TriggerRow = triggerRow || triggers[0] || {
    triggerEvent: '',
    businessScene: '',
    statusTriggerValues: [],
    enabled: true,
  }
  dialogRef.value.action({
    businessType: row?.businessType || '',
    triggerEvent: trigger.triggerEvent || '',
    businessScene: trigger.businessScene || '',
    statusTriggerValues: trigger.statusTriggerValues || [],
    isActive: row?.isActive || '1',
  } as ConfigForm)
}

const removeTrigger = (row: any, triggerEvent: string) => {
  if (!canWorkflowConfigDelete.value) {
    ElMessage.warning('当前操作没有权限')
    return
  }

  const config = { ...parseTriggerConfig(row.triggerConfig || '{}') }
  delete config[triggerEvent]

  saveBusinessConfig({
    businessType: row.businessType,
    name: row.name || getBusinessTypeName(row.businessType),
    triggerConfig: JSON.stringify(config),
    isActive: Object.keys(config).length ? row.isActive : '0',
  }).then(() => {
    ElMessage.success('自动触发规则已移除')
    rctRef.value.getList()
  })
}

const getButtons = (row: any) => [
  canWorkflowConfigUpdate.value ? { key: 'edit', label: '新增/编辑规则', onClick: () => openDialog(row) } : null,
  canWorkflowConfigDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(row) } : null,
].filter(Boolean)
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="getBusinessConfigs">
      <template #query="{ query }">
        <BaSelect v-model="query.businessType" label="业务对象" prop="businessType" isAll>
          <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <div>
            <el-button v-if="canWorkflowConfigAdd" type="primary" @click="openDialog()">新增自动触发配置</el-button>
          </div>
          <el-button v-if="canWorkflowConfigDelete" :disabled="!selectedIds.length" @click="rctRef.del(deleteBusinessConfig)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column prop="businessType" label="业务对象" width="120">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ getBusinessTypeName(row.businessType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerConfig" label="自动触发规则" min-width="420">
          <template #default="{ row }">
            <div v-for="trigger in getTriggerRows(row)" :key="trigger.triggerEvent" class="trigger-item">
              <el-tag size="small" type="success" class="mr-5">{{ getTriggerEventName(trigger.triggerEvent) }}</el-tag>
              <span class="mr-5">{{ getBusinessSceneName(row.businessType, trigger.businessScene) }}</span>
              <el-tag size="small" :type="trigger.enabled ? 'success' : 'info'" class="mr-5">{{ trigger.enabled ? '规则启用' : '规则停用' }}</el-tag>
              <span v-if="trigger.statusTriggerValues?.length" class="text-gray">触发状态：{{ trigger.statusTriggerValues.join(', ') }}</span>
              <el-button v-if="canWorkflowConfigUpdate" link type="primary" class="ml-8" @click="openDialog(row, trigger)">编辑</el-button>
              <el-button v-if="canWorkflowConfigDelete" link type="danger" @click="removeTrigger(row, trigger.triggerEvent)">移除</el-button>
            </div>
            <span v-if="!getTriggerRows(row).length" class="text-gray">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive === '1' ? 'success' : 'info'" size="small">{{ row.isActive === '1' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog ref="dialogRef" dynamicTitle="自动触发配置" :rules="rules" width="600" @confirm="save">
      <template #form="{ form }: any">
        <BaSelect v-model="form.businessType" prop="businessType" label="业务对象" :disabled="!!form.businessType">
          <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <BaSelect v-model="form.triggerEvent" prop="triggerEvent" label="触发时机">
          <el-option v-for="item in triggerEventOptions" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <BaSelect v-model="form.businessScene" prop="businessScene" label="业务场景">
          <el-option v-for="item in (businessSceneOptions[form.businessType] || [])" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <el-form-item v-if="form.triggerEvent === 'onStatusChange'" label="触发状态">
          <el-checkbox-group v-model="form.statusTriggerValues">
            <el-checkbox v-for="item in statusOptions" :key="item.value + item.label" :label="item.value">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="form.isActive">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
    </BaDialog>
  </div>
</template>

<style scoped>
.trigger-item {
  margin-bottom: 6px;
}

.trigger-item:last-child {
  margin-bottom: 0;
}

.mr-5 {
  margin-right: 5px;
}

.text-gray {
  color: #909399;
}

.ml-8 {
  margin-left: 8px;
}
</style>
