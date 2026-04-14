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
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false)
const userList = ref([])
const deptList = ref([])
const searchDept = ref('')

const selectedUsers = computed(() => {
  const list = userList.value
  if (props.multiple && Array.isArray(props.modelValue)) {
    return list.filter(u => props.modelValue.includes(u.id))
  }
  if (!props.multiple && props.modelValue) {
    const user = list.find(u => u.id === props.modelValue)
    return user ? [user] : []
  }
  return []
})

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

  <template v-if="!compact && selectedUsers.length > 0">
    <div class="selected-list">
      <div
        v-for="user in selectedUsers"
        :key="user.id"
        class="selected-item"
      >
        <el-avatar :size="20" :src="user.avatar || undefined">
          {{ getAvatarText(user) }}
        </el-avatar>
        <span class="selected-name">{{ getDisplayName(user) }}</span>
      </div>
    </div>
  </template>
</template>

<style scoped>
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

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border-radius: 999px;
  border: 1px solid #e4e7ed;
}

.selected-name {
  font-size: 13px;
  color: #303133;
}
</style>
