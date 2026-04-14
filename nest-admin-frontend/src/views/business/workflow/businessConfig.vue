<script setup lang="ts">
// @ts-nocheck
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBusinessConfigs, saveBusinessConfig, deleteBusinessConfig, generateFieldMappings } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const rctRef = ref()
const params = ref({})

const dialogRef = ref()
const triggerDialogRef = ref()
const canWorkflowConfigAdd = computed(() => checkPermi(['business/workflow/configs/add']))
const canWorkflowConfigUpdate = computed(() => checkPermi(['business/workflow/configs/update']))
const canWorkflowConfigDelete = computed(() => checkPermi(['business/workflow/configs/delete']))
const canWorkflowFieldGenerate = computed(() => checkPermi(['business/workflow/fields/generate']))

const businessTypeOptions = [
  { label: '项目', value: 'project' },
  { label: '客户', value: 'customer' },
  { label: '工单', value: 'ticket' },
  { label: '变更请求', value: 'change' },
]

const triggerEventOptions = [
  { label: '无', value: '' },
  { label: '手动触发', value: 'manual' },
  { label: '创建时自动', value: 'onCreate' },
  { label: '状态变更时', value: 'onStatusChange' },
]

const statusOptions = [
  { label: '待处理', value: '1' },
  { label: '处理中', value: '2' },
  { label: '已解决', value: '3' },
  { label: '已关闭', value: '4' },
]

const rules = {
  businessType: [$sdk.ruleRequiredBlur],
  name: [$sdk.ruleRequiredBlur],
  tableName: [$sdk.ruleRequiredBlur],
}

const getBusinessTypeName = (type: string) => {
  const item = businessTypeOptions.find(o => o.value === type)
  return item ? item.label : type
}

const getTriggerEventName = (event: string) => {
  const item = triggerEventOptions.find(o => o.value === event)
  return item ? item.label : event
}

const parseTriggerConfig = (configStr: string) => {
  if (!configStr) return {}
  try {
    return JSON.parse(configStr)
  } catch {
    return {}
  }
}

const formatTriggerConfig = (config: any) => {
  try {
    return JSON.stringify(config, null, 2)
  } catch {
    return '{}'
  }
}

const currentTriggers = ref<any>({})
const currentBusinessType = ref('')

const handleConfigTriggers = (row: any) => {
  currentBusinessType.value = row.businessType
  currentTriggers.value = parseTriggerConfig(row.triggerConfig || '{}')
  triggerDialogRef.value.visible = true
}

const addTrigger = (event: string) => {
  if (!currentTriggers.value[event]) {
    currentTriggers.value[event] = {
      triggerEvent: event,
      name: '',
      workflowCode: '',
    }
  }
  if (event === 'onStatusChange') {
    currentTriggers.value[event].statusTriggerValues = []
  }
}

const removeTrigger = (event: string) => {
  delete currentTriggers.value[event]
}

const saveTriggers = () => {
  const businessType = currentBusinessType.value
  const triggerConfig = formatTriggerConfig(currentTriggers.value)
  
  getBusinessConfigs(businessType).then((res: any) => {
    const configs = res.list || []
    if (configs.length > 0) {
      saveBusinessConfig({ businessType: configs[0].businessType, triggerConfig }).then(() => {
        ElMessage.success('保存成功')
        triggerDialogRef.value.visible = false
        rctRef.value.getList()
      })
    } else {
      ElMessage.warning('未找到该业务对象配置')
    }
  })
}

const save = (data: any) => {
  if (!((!data.form.value.id && canWorkflowConfigAdd.value) || (data.form.value.id && canWorkflowConfigUpdate.value))) {
    data.loading.value = false
    return $sdk.msgWarning('当前操作没有权限')
  }
  saveBusinessConfig(data.form.value).then(() => {
    ElMessage.success('保存成功')
    data.visible.value = false
    rctRef.value.getList()
  }).finally(() => {
    data.loading.value = false
  })
}

const handleDelete = (row: any) => {
  if (!canWorkflowConfigDelete.value) return $sdk.msgWarning('当前操作没有权限')
  ElMessageBox.confirm('确定删除该业务配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteBusinessConfig(row.id).then(() => {
      ElMessage.success('删除成功')
      rctRef.value.getList()
    })
  })
}

const handleInitFields = async () => {
  try {
    await generateFieldMappings(['project', 'ticket', 'customer', 'change'])
    ElMessage.success('业务字段初始化成功')
  } catch (error) {
    ElMessage.error('初始化失败')
  }
}

const getButtons = (row: any) => [
  { key: 'edit', label: '编辑', disabled: !canWorkflowConfigUpdate.value, onClick: () => dialogRef.value.action(row) },
  { key: 'config', label: '配置触发', type: 'primary', disabled: !canWorkflowConfigUpdate.value, onClick: () => handleConfigTriggers(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canWorkflowConfigDelete.value, onClick: () => handleDelete(row) },
]

const showTriggerDialog = ref(false)
const triggerForm = reactive({
  triggerEvent: '',
  name: '',
  workflowCode: '',
  statusTriggerValues: [] as string[],
})

const openTriggerForm = (event: string) => {
  triggerForm.triggerEvent = event
  triggerForm.name = ''
  triggerForm.workflowCode = ''
  triggerForm.statusTriggerValues = []
  showTriggerDialog.value = true
}

const addTriggerConfig = () => {
  if (!triggerForm.triggerEvent) {
    ElMessage.warning('请选择触发时机')
    return
  }
  if (!triggerForm.name) {
    ElMessage.warning('请输入配置名称')
    return
  }
  if (!triggerForm.workflowCode) {
    ElMessage.warning('请输入工作流编码')
    return
  }
  
  currentTriggers.value[triggerForm.triggerEvent] = {
    triggerEvent: triggerForm.triggerEvent,
    name: triggerForm.name,
    workflowCode: triggerForm.workflowCode,
  }
  
  if (triggerForm.triggerEvent === 'onStatusChange') {
    currentTriggers.value[triggerForm.triggerEvent].statusTriggerValues = [...triggerForm.statusTriggerValues]
  }
  
  showTriggerDialog.value = false
  resetTriggerForm()
}

const removeTriggerByEvent = (event: string) => {
  delete currentTriggers.value[event]
}

const resetTriggerForm = () => {
  triggerForm.triggerEvent = ''
  triggerForm.name = ''
  triggerForm.workflowCode = ''
  triggerForm.statusTriggerValues = []
}

const getTriggerList = (triggers: any) => {
  if (!triggers) return []
  return Object.entries(triggers).map(([key, value]: [string, any]) => ({
    event: key,
    name: value.name || '',
    workflowCode: value.workflowCode || '',
    statusTriggerValues: value.statusTriggerValues || [],
  }))
}
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="getBusinessConfigs">
      <template #query="{ query }">
        <BaSelect v-model="query.businessType" label="业务对象" prop="businessType" isAll>
          <el-option label="项目" value="project" />
          <el-option label="客户" value="customer" />
          <el-option label="工单" value="ticket" />
          <el-option label="变更请求" value="change" />
        </BaSelect>
      </template>
      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <div>
            <el-button v-if="canWorkflowConfigAdd" type="primary" @click="dialogRef.action()">新建配置</el-button>
            <el-button v-if="canWorkflowFieldGenerate" @click="handleInitFields">初始化字段</el-button>
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
        <el-table-column prop="name" label="配置名称" width="150" />
        <el-table-column prop="tableName" label="数据表" width="120" />
        <el-table-column prop="triggerConfig" label="触发配置" min-width="300">
          <template #default="{ row }">
            <div v-if="row.triggerConfig">
              <div v-for="(trigger, key) in parseTriggerConfig(row.triggerConfig)" :key="key" class="trigger-item">
                <el-tag size="small" type="success" class="mr-5">{{ getTriggerEventName(key) }}</el-tag>
                <span class="mr-5">{{ trigger.name }}</span>
                <span class="text-gray" v-if="trigger.workflowCode">({{ trigger.workflowCode }})</span>
              </div>
            </div>
            <span v-else class="text-gray">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive === '1' ? 'success' : 'info'" size="small">
              {{ row.isActive === '1' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </template>
      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog ref="dialogRef" dynamicTitle="业务配置" :rules="rules" width="600" @confirm="save">
      <template #form="{ form }">
        <BaSelect v-model="form.businessType" prop="businessType" label="业务对象" :disabled="!!form.id">
          <el-option label="项目" value="project" />
          <el-option label="客户" value="customer" />
          <el-option label="工单" value="ticket" />
          <el-option label="变更请求" value="change" />
        </BaSelect>
        <BaInput v-model="form.name" prop="name" label="配置名称" />
        <BaInput v-model="form.tableName" prop="tableName" label="数据表名" />
        <BaInput v-model="form.idField" prop="idField" label="ID字段" placeholder="默认为 id" />
      </template>
    </BaDialog>

    <BaDialog ref="triggerDialogRef" dynamicTitle="配置触发时机" width="700px" @confirm="saveTriggers">
      <template #header>
        <div class="trigger-dialog-header">
          <span>业务对象：{{ getBusinessTypeName(currentBusinessType) }}</span>
        </div>
      </template>
      <template #form>
        <div class="trigger-config-container">
          <div class="trigger-list">
            <div class="trigger-list-title">已配置的触发：</div>
            <div v-if="Object.keys(currentTriggers).length === 0" class="text-gray text-center p-20">
              暂无触发配置
            </div>
            <div v-for="(trigger, key) in currentTriggers" :key="key" class="trigger-list-item">
              <div class="trigger-info">
                <el-tag size="small" type="success">{{ getTriggerEventName(key) }}</el-tag>
                <span class="ml-10">{{ trigger.name }}</span>
                <span class="text-gray ml-10" v-if="trigger.workflowCode">({{ trigger.workflowCode }})</span>
                <span v-if="trigger.statusTriggerValues?.length" class="text-gray ml-10">
                  触发状态: {{ trigger.statusTriggerValues.join(', ') }}
                </span>
              </div>
              <el-button type="danger" size="small" text @click="removeTriggerByEvent(key as string)">删除</el-button>
            </div>
          </div>

          <el-divider content-position="left">添加触发</el-divider>

          <div class="add-trigger-form">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-select v-model="triggerForm.triggerEvent" placeholder="选择触发时机" @change="resetTriggerForm">
                  <el-option label="创建时自动" value="onCreate" />
                  <el-option label="状态变更时" value="onStatusChange" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input v-model="triggerForm.name" placeholder="配置名称，如：项目立项审批" />
              </el-col>
              <el-col :span="8">
                <el-input v-model="triggerForm.workflowCode" placeholder="工作流编码" />
              </el-col>
            </el-row>
            
            <div v-if="triggerForm.triggerEvent === 'onStatusChange'" class="mt-10">
              <span class="label">触发状态：</span>
              <el-checkbox-group v-model="triggerForm.statusTriggerValues">
                <el-checkbox v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-checkbox>
              </el-checkbox-group>
            </div>

            <el-button type="primary" size="small" class="mt-10" @click="addTriggerConfig">添加</el-button>
          </div>

          <div class="trigger-preview mt-20" v-if="Object.keys(currentTriggers).length > 0">
            <div class="trigger-preview-title">配置预览：</div>
            <pre class="trigger-preview-code">{{ formatTriggerConfig(currentTriggers) }}</pre>
          </div>
        </div>
      </template>
    </BaDialog>
  </div>
</template>

<style scoped>
.trigger-item {
  margin-bottom: 5px;
}
.trigger-item:last-child {
  margin-bottom: 0;
}
.mr-5 {
  margin-right: 5px;
}
.ml-10 {
  margin-left: 10px;
}
.mt-10 {
  margin-top: 10px;
}
.mt-20 {
  margin-top: 20px;
}
.p-20 {
  padding: 20px;
}
.text-gray {
  color: #999;
}
.text-center {
  text-align: center;
}
.trigger-dialog-header {
  padding: 0 10px;
}
.trigger-config-container {
  padding: 10px;
}
.trigger-list {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}
.trigger-list-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}
.trigger-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
}
.trigger-list-item:last-child {
  border-bottom: none;
}
.trigger-info {
  display: flex;
  align-items: center;
}
.add-trigger-form {
  padding: 10px 0;
}
.label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}
.trigger-preview {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
}
.trigger-preview-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}
.trigger-preview-code {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
</style>
