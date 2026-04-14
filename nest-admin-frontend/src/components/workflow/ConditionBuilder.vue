<template>
  <div class="condition-builder">
    <div class="condition-row">
      <el-select v-model="condition.fieldSource" @change="onFieldSourceChange" style="width: 120px;" :disabled="disabled">
        <el-option label="业务字段" value="field" />
        <el-option label="表达式" value="expression" />
      </el-select>

      <!-- 字段选择 -->
      <template v-if="condition.fieldSource === 'field'">
        <el-select
          v-model="condition.field"
          placeholder="选择字段"
          @change="emitUpdate"
          clearable
          filterable
          :disabled="disabled"
          style="width: 240px;"
        >
          <el-option-group v-for="group in fieldGroups" :key="group.label" :label="group.label">
            <el-option
              v-for="opt in group.fields"
              :key="opt.fieldName"
              :label="opt.fieldLabel"
              :value="opt.fieldName"
            >
              <span>{{ opt.fieldLabel }}</span>
              <span v-if="opt.description" class="field-desc"> - {{ opt.description }}</span>
            </el-option>
          </el-option-group>
        </el-select>
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
import { getBusinessFields } from '@/views/business/workflow/api'
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

const fieldMappings = ref([])
const deptTreeData = ref([])

const loadFieldMappings = async (businessType) => {
  if (!businessType) return
  try {
    const res = await getBusinessFields(businessType, { scope: 'all' })
    const list = res.data?.data || res.data || []
    fieldMappings.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.warn('Failed to load business fields:', error)
    fieldMappings.value = []
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
    loadFieldMappings(newType)
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
  return fieldMappings.value
})

const fieldGroups = computed(() => {
  const groups = new Map()
  for (const field of fieldOptions.value) {
    const label = field.group || '业务字段'
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label).push(field)
  }
  return Array.from(groups.entries()).map(([label, fields]) => ({ label, fields }))
})

const selectedFieldDef = computed(() => {
  if (!condition.value.field) return null
  return fieldOptions.value.find(f => f.fieldName === condition.value.field)
})

const normalizedFieldType = computed(() => {
  const def = selectedFieldDef.value
  const type = def?.type || 'string'
  const label = def?.fieldLabel || ''
  const name = def?.fieldName || ''
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
  if (condition.value.fieldSource === 'field' && condition.value.field) {
    fieldExpr = '${' + condition.value.field + '}'
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
      condition.value.field = val.field.join('.')
    } else if (typeof val.field === 'string') {
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
