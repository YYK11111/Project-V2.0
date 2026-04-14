<template>
  <div class="condition-builder">
    <div class="condition-row">
      <el-select v-model="condition.fieldSource" @change="onFieldSourceChange" style="width: 120px;">
        <el-option label="业务字段" value="field" />
        <el-option label="表达式" value="expression" />
      </el-select>

      <!-- 字段选择 -->
      <template v-if="condition.fieldSource === 'field'">
        <el-cascader
          v-model="condition.field"
          :options="fieldOptions"
          :props="{ label: 'label', value: 'name', checkStrictly: true }"
          placeholder="选择字段"
          @change="emitUpdate"
          clearable
          style="width: 200px;"
        />
      </template>
      <el-input
        v-else
        v-model="condition.field"
        placeholder="${project.budget}"
        @input="emitUpdate"
        style="width: 200px;"
      />

      <!-- 操作符 -->
      <el-select v-model="condition.operator" @change="emitUpdate" style="width: 100px;">
        <el-option label="等于" value="eq" />
        <el-option label="不等于" value="neq" />
        <el-option label="大于" value="gt" />
        <el-option label="大于等于" value="gte" />
        <el-option label="小于" value="lt" />
        <el-option label="小于等于" value="lte" />
        <el-option label="包含" value="contains" />
        <el-option label="为空" value="isNull" />
        <el-option label="不为空" value="isNotNull" />
      </el-select>

      <!-- 值输入 -->
      <template v-if="!['isNull', 'isNotNull'].includes(condition.operator)">
        <!-- 枚举类型显示下拉框 -->
        <el-select
          v-if="selectedFieldDef?.type === 'enum'"
          v-model="condition.value"
          placeholder="选择值"
          @change="emitUpdate"
          style="width: 150px;"
          clearable
        >
          <el-option
            v-for="opt in selectedFieldDef.enumValues"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <!-- 数字类型 -->
        <el-input
          v-else-if="selectedFieldDef?.type === 'number'"
          v-model="condition.value"
          type="number"
          placeholder="输入数字"
          @input="emitUpdate"
          style="width: 150px;"
        />
        <!-- 其他 -->
        <el-input
          v-else
          v-model="condition.value"
          placeholder="输入值"
          @input="emitUpdate"
          style="width: 150px;"
        />
      </template>

      <el-button type="danger" @click="$emit('remove')">删除</el-button>
    </div>

    <div class="condition-expr-preview">
      <span>表达式预览: </span>
      <code>{{ expressionPreview }}</code>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getBusinessConfig } from '@/views/business/workflow/api'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  businessType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'remove'])

// 默认字段定义（备用）
const defaultFieldDefinitions = {
  project: [
    { name: 'budget', label: '预算', type: 'number' },
    { name: 'actualCost', label: '实际成本', type: 'number' },
    { name: 'status', label: '状态', type: 'enum', enumValues: [
      { label: '草稿', value: '1' },
      { label: '立项审批中', value: '2' },
      { label: '执行中', value: '3' },
      { label: '暂停中', value: '4' },
      { label: '结项审批中', value: '5' },
      { label: '已结项', value: '6' },
      { label: '已取消', value: '7' },
    ]},
    { name: 'priority', label: '优先级', type: 'enum', enumValues: [
      { label: '低', value: '1' },
      { label: '中', value: '2' },
      { label: '高', value: '3' },
    ]},
    { name: 'progress', label: '进度(%)', type: 'number' },
  ],
  customer: [
    { name: 'type', label: '客户类型', type: 'enum', enumValues: [
      { label: '企业客户', value: '1' },
      { label: '个人客户', value: '2' },
    ]},
    { name: 'level', label: '客户等级', type: 'enum', enumValues: [
      { label: 'VIP', value: '1' },
      { label: '重要', value: '2' },
      { label: '普通', value: '3' },
    ]},
    { name: 'status', label: '客户状态', type: 'enum', enumValues: [
      { label: '潜在', value: '1' },
      { label: '意向', value: '2' },
      { label: '成交', value: '3' },
      { label: '流失', value: '4' },
    ]},
    { name: 'customerValue', label: '客户价值(万元)', type: 'number' },
  ],
  ticket: [
    { name: 'type', label: '类型', type: 'enum', enumValues: [
      { label: '缺陷', value: '1' },
      { label: '需求', value: '2' },
      { label: '反馈', value: '3' },
    ]},
    { name: 'severity', label: '严重程度', type: 'enum', enumValues: [
      { label: '致命', value: '1' },
      { label: '高', value: '2' },
      { label: '中', value: '3' },
      { label: '低', value: '4' },
    ]},
    { name: 'status', label: '状态', type: 'enum', enumValues: [
      { label: '待处理', value: '1' },
      { label: '处理中', value: '2' },
      { label: '已解决', value: '3' },
      { label: '已关闭', value: '4' },
    ]},
  ],
  change: [
    { name: 'type', label: '变更类型', type: 'enum', enumValues: [
      { label: '范围变更', value: '1' },
      { label: '进度变更', value: '2' },
      { label: '预算变更', value: '3' },
      { label: '资源变更', value: '4' },
      { label: '需求变更', value: '5' },
      { label: '其他变更', value: '6' },
    ]},
    { name: 'impact', label: '影响程度', type: 'enum', enumValues: [
      { label: '低', value: '1' },
      { label: '中', value: '2' },
      { label: '高', value: '3' },
    ]},
    { name: 'status', label: '状态', type: 'enum', enumValues: [
      { label: '草稿', value: '1' },
      { label: '待审批', value: '2' },
      { label: '已批准', value: '3' },
      { label: '已驳回', value: '4' },
      { label: '已实施', value: '5' },
    ]},
    { name: 'costImpact', label: '成本影响', type: 'number' },
    { name: 'scheduleImpact', label: '进度影响(天)', type: 'number' },
  ]
}

const fieldDefinitions = ref(defaultFieldDefinitions)

// 从API加载字段定义
const loadFieldDefinitions = async (businessType) => {
  if (!businessType) return
  try {
    const res = await getBusinessConfig(businessType)
    if (res.data?.fieldDefinitions) {
      const parsed = JSON.parse(res.data.fieldDefinitions)
      if (parsed && parsed.length > 0) {
        fieldDefinitions.value = { ...defaultFieldDefinitions, [businessType]: parsed }
      }
    }
  } catch (error) {
    console.warn('Failed to load field definitions, using defaults:', error)
  }
}

watch(() => props.businessType, (newType) => {
  if (newType) {
    loadFieldDefinitions(newType)
  }
}, { immediate: true })

const condition = ref({
  fieldSource: 'field',
  field: [],
  operator: 'eq',
  value: ''
})

const fieldOptions = computed(() => {
  if (!props.businessType) return []
  return fieldDefinitions.value[props.businessType] || []
})

const selectedFieldDef = computed(() => {
  if (!condition.value.field?.length) return null
  const fieldName = condition.value.field[condition.value.field.length - 1]
  return fieldOptions.value.find(f => f.name === fieldName)
})

const expressionPreview = computed(() => {
  let fieldExpr = ''
  if (condition.value.fieldSource === 'field' && condition.value.field?.length) {
    fieldExpr = '${' + condition.value.field.join('.') + '}'
  } else {
    fieldExpr = condition.value.field || '...'
  }

  let valueExpr = ''
  if (['isNull', 'isNotNull'].includes(condition.value.operator)) {
    valueExpr = ''
  } else if (selectedFieldDef.value?.type === 'enum') {
    valueExpr = condition.value.value || '...'
  } else {
    valueExpr = condition.value.value || '...'
  }

  return `${fieldExpr} ${condition.value.operator} ${valueExpr}`
})

watch(() => props.modelValue, (val) => {
  if (val && Object.keys(val).length > 0) {
    condition.value = { ...condition.value, ...val }
    if (val.field && typeof val.field === 'string' && val.field.includes('${')) {
      condition.value.fieldSource = 'expression'
      condition.value.field = val.field.replace(/\$\{([^}]+)\}/, '$1')
    } else if (Array.isArray(val.field)) {
      condition.value.fieldSource = 'field'
      condition.value.field = val.field
    }
  }
}, { immediate: true, deep: true })

const onFieldSourceChange = () => {
  condition.value.field = []
  condition.value.value = ''
  emitUpdate()
}

const emitUpdate = () => {
  let fieldValue = condition.value.field
  if (condition.value.fieldSource === 'expression' && condition.value.field) {
    fieldValue = '${' + condition.value.field + '}'
  }

  emit('update:modelValue', {
    field: fieldValue,
    operator: condition.value.operator,
    value: condition.value.value
  })
}
</script>

<style scoped>
.condition-builder {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.condition-expr-preview {
  font-size: 12px;
  color: #666;
}

.condition-expr-preview code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
