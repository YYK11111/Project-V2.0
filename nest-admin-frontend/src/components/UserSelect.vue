<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { getList as getUserList } from '@/views/system/users/api'
import { getList as getDeptList } from '@/views/system/depts/api'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: undefined
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '请选择人员'
  },
  filterDept: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false)
const userList = ref([])
const deptList = ref([])
const searchDept = ref('')
const selectedUserMap = ref({})

function getDisplayName(user) {
  return user?.nickname || user?.name || '-'
}

function getSubLabel(user) {
  const parts = []
  if (user?.name && user?.nickname && user.name !== user.nickname) {
    parts.push(user.name)
  }
  if (user?.dept?.name) {
    parts.push(user.dept.name)
  }
  return parts.join(' / ')
}

function getAvatarText(user) {
  return getDisplayName(user)?.charAt(0) || '?'
}

function updateSelectedUserMap(list = []) {
  const nextMap = { ...selectedUserMap.value }
  list.forEach((user) => {
    if (!user?.id) return
    nextMap[user.id] = user
  })
  selectedUserMap.value = nextMap
}

function getSelectedUser(value) {
  if (!value) return null
  return selectedUserMap.value[value] || userList.value.find((user) => user.id === value) || null
}

const selectedUsers = computed(() => {
  if (props.multiple) {
    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    return values.map((value) => ({ value, user: getSelectedUser(value) })).filter((item) => item.value)
  }
  if (!props.modelValue) return []
  return [{ value: props.modelValue, user: getSelectedUser(props.modelValue) }]
})

function loadUserList(keywords = '') {
  loading.value = true
  const query = {
    pageNum: 1,
    pageSize: 100
  }
  
  if (keywords) {
    query.name = keywords
  }
  
  if (props.filterDept && searchDept.value) {
    query.deptId = searchDept.value
  }
  
  getUserList(query)
    .then(({ data }) => {
      userList.value = data || []
      updateSelectedUserMap(userList.value)
    })
    .finally(() => {
      loading.value = false
    })
}

function loadDeptList() {
  getDeptList({ pageNum: 1, pageSize: 1000 }).then(({ data }) => {
    deptList.value = data || []
  })
}

function handleSearch(query) {
  loadUserList(query)
}

function handleDeptChange() {
  loadUserList()
}

function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function handleClear() {
  emit('update:modelValue', props.multiple ? [] : undefined)
  emit('change', props.multiple ? [] : undefined)
}

function handleVisibleChange(visible) {
  if (visible) {
    loadUserList()
  }
}

loadUserList()
if (props.filterDept) {
  loadDeptList()
}

watch(() => props.modelValue, () => {
  nextTick(() => {
    loadUserList()
  })
})
</script>

<template>
  <el-select
    class="user-select"
    :model-value="modelValue"
    :multiple="multiple"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :filterable="true"
    :remote="true"
    :reserve-keyword="false"
    :loading="loading"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    :remote-method="handleSearch"
    @change="handleChange"
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    style="width: 100%"
  >
    <template v-if="!multiple" #label>
      <div v-if="selectedUsers[0]?.user" class="user-selected-label">
        <el-avatar :size="20" :src="selectedUsers[0].user.avatar || undefined">
          {{ getAvatarText(selectedUsers[0].user) }}
        </el-avatar>
        <span class="user-selected-text">{{ getDisplayName(selectedUsers[0].user) }}</span>
      </div>
    </template>

    <template #header v-if="filterDept">
      <el-select
        v-model="searchDept"
        placeholder="筛选部门"
        clearable
        filterable
        size="small"
        style="width: 100%; margin-bottom: 4px"
        @change="handleDeptChange"
      >
        <el-option
          v-for="dept in deptList"
          :key="dept.id"
          :label="dept.name"
          :value="dept.id"
        />
      </el-select>
    </template>
    
    <el-option
      v-for="user in userList"
      :key="user.id"
      :label="getDisplayName(user)"
      :value="user.id"
    >
      <div class="user-option">
        <el-avatar :size="24" :src="user.avatar || undefined">
          {{ getAvatarText(user) }}
        </el-avatar>
        <div class="user-main">
          <div class="user-name">{{ getDisplayName(user) }}</div>
          <div v-if="getSubLabel(user)" class="user-sub">{{ getSubLabel(user) }}</div>
        </div>
      </div>
    </el-option>

    <template #empty>
      <div class="empty-text">暂无数据</div>
    </template>
  </el-select>

  <div v-if="multiple && selectedUsers.length" class="selected-user-preview">
    <div v-for="item in selectedUsers" :key="item.value" class="selected-user-preview__item">
      <el-avatar :size="20" :src="item.user?.avatar || undefined">
        {{ getAvatarText(item.user) }}
      </el-avatar>
      <span class="selected-user-preview__text">{{ getDisplayName(item.user) }}</span>
    </div>
  </div>

</template>

<style scoped>
.selected-user-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.selected-user-preview__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.selected-user-preview__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.user-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.user-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.user-sub {
  color: #909399;
  font-size: 12px;
  line-height: 1.2;
}

.empty-text {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.user-selected-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  line-height: 1;
}

.user-selected-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

:deep(.el-select__tags) {
  gap: 4px;
}

:deep(.el-select__tags .el-tag) {
  max-width: 220px;
}

:deep(.el-select__tags .el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
