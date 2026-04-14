<template>
  <div class="condition-builder">
    <div class="condition-row">
      <el-select v-model="condition.fieldSource" @change="onFieldSourceChange" style="width: 120px;" :disabled="disabled">
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
          :disabled="disabled"
          style="width: 200px;"
        />
      </template>
      <el-input
        v-else
        v-model="condition.field"
        placeholder="${project.budget}"
        @input="emitUpdate"
        :disabled="disabled"
        style="width: 200px;"
      />

      <!-- 操作符 -->
      <el-select v-model="condition.operator" @change="emitUpdate" style="width: 140px;" :disabled="disabled">
        <el-option v-for="op in operatorOptions" :key="op.value" :label="op.label" :value="op.value" />
      </el-select>

      <!-- 值输入 -->
      <template v-if="!['isNull', 'isNotNull'].includes(condition.operator)">
        <!-- 枚举类型显示下拉框 -->
        <el-select
          v-if="normalizedFieldType === 'enum'"
          v-model="condition.value"
          placeholder="选择值"
          @change="emitUpdate"
          style="width: 150px;"
          clearable
          :disabled="disabled"
        >
          <el-option
            v-for="opt in selectedFieldDef.enumValues"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <!-- 用户类型 -->
        <el-cascader
          v-else-if="normalizedFieldType === 'user' && ['memberOf', 'memberOfOrSubDept'].includes(condition.operator)"
          v-model="condition.value"
          :options="deptTreeData"
          :props="{ label: 'name', value: 'id', checkStrictly: true, emitPath: false }"
          placeholder="选择部门"
          clearable
          style="width: 150px;"
          @change="emitUpdate"
          :disabled="disabled"
        />
        <UserSelect
          v-else-if="normalizedFieldType === 'user'"
          v-model="condition.value"
          placeholder="请选择人员"
          clearable
          style="width: 150px;"
          :disabled="disabled"
        />
        <!-- 部门类型 -->
        <el-cascader
          v-else-if="normalizedFieldType === 'department'"
          v-model="condition.value"
          :options="deptTreeData"
          :props="{ label: 'name', value: 'id', checkStrictly: true, emitPath: false }"
          placeholder="选择部门"
          clearable
          style="width: 150px;"
          @change="emitUpdate"
          :disabled="disabled"
        />
        <!-- 用户数组 -->
        <UserSelect
          v-else-if="normalizedFieldType === 'userArray'"
          v-model="condition.value"
          placeholder="请选择人员"
          clearable
          multiple
          style="width: 150px;"
          :disabled="disabled"
        />
        <!-- 部门数组 -->
        <el-cascader
          v-else-if="normalizedFieldType === 'departmentArray'"
          v-model="condition.value"
          :options="deptTreeData"
          :props="{ label: 'name', value: 'id', checkStrictly: true, multiple: true, emitPath: false }"
          placeholder="选择部门"
          clearable
          style="width: 150px;"
          @change="emitUpdate"
          :disabled="disabled"
        />
        <!-- 数字类型 -->
        <el-input
          v-else-if="normalizedFieldType === 'number'"
          v-model="condition.value"
          type="number"
          placeholder="输入数字"
          @input="emitUpdate"
          style="width: 150px;"
          :disabled="disabled"
        />
        <!-- 其他 -->
        <el-input
          v-else
          v-model="condition.value"
          placeholder="输入值"
          @input="emitUpdate"
          style="width: 150px;"
          :disabled="disabled"
        />
      </template>

      <el-button type="danger" @click="$emit('remove')" :disabled="disabled">删除</el-button>
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
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import UserSelect from '@/components/UserSelect.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  businessType: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'remove'])

// 默认字段定义（备用）
const defaultFieldDefinitions = {
  project: [
    { name: 'name', label: '项目名称', type: 'string' },
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
    { name: 'leaderId', label: '项目负责人', type: 'user' },
    { name: 'memberIds', label: '项目成员', type: 'userArray' },
    { name: 'priority', label: '优先级', type: 'enum', enumValues: [
      { label: '低', value: '1' },
      { label: '中', value: '2' },
      { label: '高', value: '3' },
    ]},
    { name: 'progress', label: '进度(%)', type: 'number' },
  ],
  customer: [
    { name: 'name', label: '客户名称', type: 'string' },
    { name: 'type', label: '客户类型', type: 'enum', enumValues: [
      { label: '企业客户', value: '1' },
      { label: '个人客户', value: '2' },
    ]},
    { name: 'salesId', label: '销售负责人', type: 'user' },
    { name: 'deptId', label: '所属部门', type: 'department' },
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
    { name: 'title', label: '标题', type: 'string' },
    { name: 'type', label: '类型', type: 'enum', enumValues: [
      { label: '缺陷', value: '1' },
      { label: '需求', value: '2' },
      { label: '反馈', value: '3' },
    ]},
    { name: 'submitterId', label: '提交人', type: 'user' },
    { name: 'handlerId', label: '处理人', type: 'user' },
    { name: 'projectId', label: '所属项目', type: 'string' },
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
    { name: 'title', label: '变更标题', type: 'string' },
    { name: 'type', label: '变更类型', type: 'enum', enumValues: [
      { label: '范围变更', value: '1' },
      { label: '进度变更', value: '2' },
      { label: '预算变更', value: '3' },
      { label: '资源变更', value: '4' },
      { label: '需求变更', value: '5' },
      { label: '其他变更', value: '6' },
    ]},
    { name: 'requesterId', label: '申请人', type: 'user' },
    { name: 'approverId', label: '审批人', type: 'user' },
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
const deptTreeData = ref([])

// 从API加载字段定义
const loadFieldDefinitions = async (businessType) => {
  if (!businessType) return
  try {
    const res = await getBusinessConfig(businessType)
    if (res.data?.fieldDefinitions) {
      const parsed = JSON.parse(res.data.fieldDefinitions)
      if (parsed && parsed.length > 0) {
        const fallback = defaultFieldDefinitions[businessType] || []
        fieldDefinitions.value = { ...defaultFieldDefinitions, [businessType]: [...parsed, ...fallback] }
      }
    }
  } catch (error) {
    console.warn('Failed to load field definitions, using defaults:', error)
  }
}

const loadDeptTrees = async () => {
  try {
    const res = await getDeptTrees({})
    deptTreeData.value = res.data || []
  } catch (error) {
    console.warn('Failed to load dept tree:', error)
  }
}

watch(() => props.businessType, (newType) => {
  if (newType) {
    loadFieldDefinitions(newType)
  }
}, { immediate: true })

loadDeptTrees()

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

const normalizedFieldType = computed(() => {
  const def = selectedFieldDef.value
  const type = def?.type || 'string'
  const label = def?.label || ''
  const name = def?.name || ''
  if (type === 'array') {
    if (label.includes('部门') || /dept|department/i.test(name)) return 'departmentArray'
    return 'userArray'
  }
  if (type === 'string') {
    if (label.includes('部门') || /dept|department/i.test(name)) return 'department'
  }
  if (type === 'relation') return 'string'
  return type
})

const operatorOptions = computed(() => {
  const fieldType = normalizedFieldType.value || 'string'
  const commonNullOps = [
    { label: '为空', value: 'isNull' },
    { label: '不为空', value: 'isNotNull' },
  ]
  if (['number', 'date'].includes(fieldType)) {
    return [
      { label: '等于', value: 'eq' },
      { label: '不等于', value: 'neq' },
      { label: '大于', value: 'gt' },
      { label: '大于等于', value: 'gte' },
      { label: '小于', value: 'lt' },
      { label: '小于等于', value: 'lte' },
      ...commonNullOps,
    ]
  }
  if (fieldType === 'user') {
    return [
      { label: '等于', value: 'eq' },
      { label: '属于部门', value: 'memberOf' },
      { label: '属于部门或子部门', value: 'memberOfOrSubDept' },
      ...commonNullOps,
    ]
  }
  if (fieldType === 'department') {
    return [
      { label: '等于', value: 'eq' },
      ...commonNullOps,
    ]
  }
  if (fieldType === 'userArray') {
    return [
      { label: '包含人员', value: 'containsUser' },
      ...commonNullOps,
    ]
  }
  if (fieldType === 'departmentArray') {
    return [
      { label: '包含部门', value: 'containsDept' },
      ...commonNullOps,
    ]
  }
  if (fieldType === 'enum') {
    return [
      { label: '等于', value: 'eq' },
      { label: '不等于', value: 'neq' },
      ...commonNullOps,
    ]
  }
  return [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'neq' },
    { label: '包含', value: 'contains' },
    ...commonNullOps,
  ]
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

watch(operatorOptions, (options) => {
  if (!options.length) return
  const valid = options.some((item) => item.value === condition.value.operator)
  if (!valid) {
    condition.value.operator = options[0].value
    condition.value.value = ''
    emitUpdate()
  }
})

const onFieldSourceChange = () => {
  condition.value.field = []
  condition.value.value = ''
  condition.value.operator = 'eq'
  emitUpdate()
}

const emitUpdate = () => {
  let fieldValue = condition.value.field
  if (condition.value.fieldSource === 'expression' && condition.value.field) {
    fieldValue = '${' + condition.value.field + '}'
  }

  emit('update:modelValue', {
    fieldSource: condition.value.fieldSource,
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
