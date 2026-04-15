<template>
  <div class="approver-selector">
    <el-select v-model="sourceType" class="approver-full" @change="onSourceTypeChange" placeholder="选择审批人来源">
      <el-option label="固定人员" value="user" />
      <el-option label="固定部门" value="department" />
      <el-option label="业务字段" value="business_field" />
    </el-select>

    <div class="selector-content">
      <!-- 指定用户 -->
      <UserSelect
        v-if="sourceType === 'user'"
        v-model="config.assigneeValue"
        :multiple="true"
        :placeholder="props.mode === 'notification' ? '选择通知人员（支持多选）' : '选择审批人（支持多选）'"
        @change="emitUpdate"
      />

      <!-- 固定部门 -->
      <div v-if="sourceType === 'department'" class="dept-selector">
        <el-tree-select
          v-model="config.departmentId"
          :data="deptTreeData"
          class="approver-full"
          placeholder="选择部门"
          check-strictly
          :render-after-expand="false"
          @change="emitUpdate"
        />
        <el-select v-model="config.departmentMode" class="approver-full" placeholder="选择取人规则" @change="emitUpdate">
          <el-option label="部门负责人" value="leader" />
          <el-option label="部门成员" value="members" />
        </el-select>
        <span class="field-hint">{{ props.mode === 'notification' ? '选择系统部门，并指定按负责人或成员接收通知' : '选择系统部门，并指定按负责人或成员取人' }}</span>
      </div>

      <!-- 业务字段 -->
      <div v-if="sourceType === 'business_field'" class="field-selector">
        <el-select
          v-model="config.fieldPath"
          class="approver-full"
          placeholder="选择业务字段"
          @change="emitUpdate"
          clearable
          filterable
          :filter-method="onFieldSearch"
        >
          <el-option-group v-for="group in fieldGroups" :key="group.label" :label="group.label">
            <el-option
              v-for="field in group.fields"
              :key="field.fieldName"
              :label="field.fieldLabel"
              :value="field.fieldName"
            >
              <span>{{ field.fieldLabel }}</span>
              <span v-if="field.description" class="field-desc"> - {{ field.description }}</span>
            </el-option>
          </el-option-group>
        </el-select>
        <span class="field-hint">{{ props.mode === 'notification' ? '选择业务对象中的人员字段作为通知对象' : '选择业务对象中的人员字段作为审批人' }}</span>
      </div>

    </div>

    <!-- 人员为空处理 -->
    <div v-if="showEmptyAction" class="empty-action-selector mt-10">
      <el-divider content-position="left">人员为空处理</el-divider>
      <el-select v-model="config.assigneeEmptyAction" class="approver-full" placeholder="人员为空时" @change="emitUpdate" clearable>
        <el-option label="报错终止" value="error" />
        <el-option label="跳过该节点" value="skip" />
        <el-option label="指定备用审批人" value="assign_to" />
      </el-select>
      <UserSelect
        v-if="config.assigneeEmptyAction === 'assign_to'"
        v-model="config.assigneeEmptyFallbackUserId"
        placeholder="请选择备用审批人"
        @change="emitUpdate"
      />
    </div>

    <!-- 会签配置 -->
    <div v-if="showMultiInstance" class="multi-instance-selector mt-10">
      <el-divider content-position="left">审批方式</el-divider>
      <el-select v-model="config.multiInstanceType" class="approver-full" placeholder="选择审批方式" @change="emitUpdate">
        <el-option label="并行会签（任一人处理即可）" value="parallel" />
        <el-option label="串行会签（依次审批）" value="sequential" />
        <el-option label="会审（全部处理）" value="all" />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import UserSelect from '../UserSelect.vue'
import { getBusinessFields } from '@/views/business/workflow/api'
import { getTrees } from '@/views/system/depts/api'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  businessType: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'approval'
  }
})

const emit = defineEmits(['update:modelValue'])
const showEmptyAction = computed(() => props.mode === 'approval')
const showMultiInstance = computed(() => props.mode === 'approval')

const deptTreeData = ref([])
const fieldSearchKeyword = ref('')

const loadDeptTree = async () => {
  try {
    const res = await getTrees()
    deptTreeData.value = res.data || []
  } catch (error) {
    console.warn('Failed to load dept tree:', error)
  }
}

onMounted(() => {
  loadDeptTree()
})

const fieldMappings = ref([])

const loadFieldMappings = async (businessType) => {
  if (!businessType) return
  try {
    const res = await getBusinessFields(businessType)
    if (res.data && res.data.length > 0) {
      fieldMappings.value = res.data
    }
  } catch (error) {
    console.warn('Failed to load field mappings:', error)
  }
}

watch(() => props.businessType, (newType) => {
  if (newType) {
    loadFieldMappings(newType)
  }
}, { immediate: true })

const sourceType = ref('business_field')
const config = ref({
  assigneeType: 'business_field',
  assigneeValue: '',
  departmentId: '',
  departmentMode: 'leader',
  fieldPath: '',
  assigneeEmptyAction: 'error',
  assigneeEmptyFallbackUserId: '',
  multiInstanceType: 'sequential',
})

const fieldOptions = computed(() => {
  return fieldMappings.value
})

const fieldGroups = computed(() => {
  const groups = new Map()
  const keyword = fieldSearchKeyword.value.trim().toLowerCase()
  const filteredFields = keyword
    ? fieldOptions.value.filter((field) => {
        const haystack = [field.fieldLabel, field.fieldName, field.description, field.group]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(keyword)
      })
    : fieldOptions.value

  for (const field of filteredFields) {
    const label = field.group || '业务人员字段'
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label).push(field)
  }
  return Array.from(groups.entries()).map(([label, fields]) => ({ label, fields }))
})

const onFieldSearch = (keyword) => {
  fieldSearchKeyword.value = keyword
}

watch(() => props.modelValue, (val) => {
  if (val && Object.keys(val).length > 0) {
    config.value = {
      assigneeType: val.assigneeType || val.type || 'business_field',
      assigneeValue: val.assigneeValue || val.userId || '',
      departmentId: val.departmentId || val.deptId || '',
      departmentMode: val.departmentMode || (val.assigneeType === 'dept_member' ? 'members' : 'leader'),
      fieldPath: val.fieldPath || '',
      assigneeEmptyAction: val.assigneeEmptyAction || 'error',
      assigneeEmptyFallbackUserId: val.assigneeEmptyFallbackUserId || '',
      multiInstanceType: val.multiInstanceType || 'sequential',
    }
    sourceType.value = config.value.assigneeType
  }
}, { immediate: true, deep: true })

const onSourceTypeChange = () => {
    fieldSearchKeyword.value = ''
    config.value = {
      assigneeType: sourceType.value,
      assigneeValue: '',
      departmentId: '',
      departmentMode: 'leader',
      fieldPath: '',
      assigneeEmptyAction: config.value.assigneeEmptyAction,
      assigneeEmptyFallbackUserId: config.value.assigneeEmptyFallbackUserId,
      multiInstanceType: config.value.multiInstanceType,
  }
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', {
    ...config.value,
    businessType: props.businessType
  })
}
</script>

<style scoped>
.approver-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.selector-content {
  margin-top: 10px;
  width: 100%;
  min-width: 0;
}

.dept-selector,
.field-selector {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  min-width: 0;
}

.approver-full {
  width: 100%;
  min-width: 0;
}

.field-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  word-break: break-word;
}

.field-desc {
  color: #999;
  font-size: 12px;
}

.mt-10 {
  margin-top: 10px;
}

:deep(.approver-full .el-input),
:deep(.approver-full .el-select),
:deep(.approver-full .el-tree-select) {
  width: 100%;
}
</style>
