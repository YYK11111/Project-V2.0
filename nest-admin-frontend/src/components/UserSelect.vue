<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getOptions as getUserOptions } from '@/views/system/users/api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: undefined,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: '请选择人员',
  },
  filterDept: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false)
const userList = ref([])
const deptTree = ref([])
const deptTreeRef = ref()
const dialogVisible = ref(false)
const pendingValue = ref([])
const searchKeyword = ref('')
const deptSearchKeyword = ref('')
const selectedDeptId = ref('')
const selectedUserMap = ref({})
let searchTimer = 0

function getDisplayName(user) {
  return user?.nickname || user?.name || String(user?.id || user || '-')
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
  const normalizedList = Array.isArray(list) ? list : []
  const nextMap = { ...selectedUserMap.value }
  normalizedList.forEach((user) => {
    if (!user?.id) return
    nextMap[user.id] = user
  })
  selectedUserMap.value = nextMap
}

function normalizeListResponse(res) {
  const page = res?.data?.data || res?.data || res || {}
  if (Array.isArray(page)) return page
  return page.list || page.rows || page.data || []
}

function normalizeDeptTreeResponse(res) {
  const list = normalizeListResponse(res)
  if (!Array.isArray(list) || !list.length) return []
  if (list.some((item) => Array.isArray(item?.children) && item.children.length)) {
    return list.map((item) => ({
      ...item,
      id: String(item.id ?? ''),
      parentId: String(item.parentId ?? '0'),
      children: normalizeDeptTreeResponse({ data: item.children }),
    }))
  }

  const nodeMap = new Map()
  const tree = []

  list.forEach((item) => {
    const id = String(item.id ?? '')
    nodeMap.set(id, {
      ...item,
      id,
      parentId: String(item.parentId ?? '0'),
      children: [],
    })
  })

  nodeMap.forEach((node) => {
    const parentId = String(node.parentId ?? '0')
    if (!parentId || parentId === '0' || !nodeMap.has(parentId)) {
      tree.push(node)
      return
    }
    nodeMap.get(parentId).children.push(node)
  })

  return tree
}

function getSelectedUser(value) {
  if (!value) return null
  return selectedUserMap.value[value] || userList.value.find((user) => user.id === value) || { id: value, name: String(value) }
}

const selectedValues = computed(() => {
  if (!props.multiple) return props.modelValue ? [props.modelValue] : []
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

const fieldUsers = computed(() => selectedValues.value.map((value) => ({ value, user: getSelectedUser(value) })).filter((item) => item.value))
const pendingUsers = computed(() => pendingValue.value.map((value) => ({ value, user: getSelectedUser(value) })).filter((item) => item.value))
const visibleFieldUsers = computed(() => fieldUsers.value.slice(0, 3))
const hiddenFieldUserCount = computed(() => Math.max(fieldUsers.value.length - visibleFieldUsers.value.length, 0))

function loadUserList(keywords = '') {
  loading.value = true
  const query = {
    pageNum: 1,
    pageSize: 100,
    includeAll: '1',
  }

  const keyword = String(keywords || '').trim()
  if (keyword) {
    query.keyword = keyword
    query.name = keyword
  }

  if (selectedDeptId.value) {
    query.deptId = selectedDeptId.value
  }

  getUserOptions(query)
    .then((res) => {
      userList.value = normalizeListResponse(res)
      updateSelectedUserMap(userList.value)
    })
    .finally(() => {
      loading.value = false
    })
}

function loadDeptList() {
  getDeptTrees({ pageNum: 1, pageSize: 1000 }).then((res) => {
    deptTree.value = normalizeDeptTreeResponse(res)
  })
}

function filterDeptNode(keyword, data) {
  const text = String(keyword || '').trim().toLowerCase()
  if (!text) return true
  return String(data?.name || '').toLowerCase().includes(text)
}

function handleDeptSearch(keyword) {
  deptSearchKeyword.value = keyword || ''
  nextTick(() => {
    deptTreeRef.value?.filter?.(deptSearchKeyword.value)
  })
}

function handleDeptNodeClick(node) {
  selectedDeptId.value = node?.id || ''
  loadUserList(searchKeyword.value)
}

function handleSearch(query) {
  searchKeyword.value = query || ''
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadUserList(searchKeyword.value)
  }, 250)
}

function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function handleClear(event) {
  event?.stopPropagation?.()
  if (props.disabled) return
  const nextValue = props.multiple ? [] : undefined
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

function openDialog() {
  if (props.disabled) return
  pendingValue.value = [...selectedValues.value]
  dialogVisible.value = true
  loadUserList(searchKeyword.value)
  if (!deptTree.value.length) {
    loadDeptList()
  }
}

function closeDialog() {
  dialogVisible.value = false
  pendingValue.value = [...selectedValues.value]
}

function isUserSelected(id) {
  return pendingValue.value.includes(id)
}

function getFieldClass() {
  return props.multiple ? 'user-select user-select-field user-select-multiple-field' : 'user-select user-select-field'
}

function togglePendingUser(user) {
  if (!user?.id) return
  updateSelectedUserMap([user])
  if (!props.multiple) {
    pendingValue.value = [user.id]
    return
  }
  if (pendingValue.value.includes(user.id)) {
    pendingValue.value = pendingValue.value.filter((id) => id !== user.id)
    return
  }
  pendingValue.value = [...pendingValue.value, user.id]
}

function selectPendingUser(user) {
  togglePendingUser(user)
}

function removePendingUser(id) {
  pendingValue.value = pendingValue.value.filter((value) => value !== id)
}

function clearPendingUsers() {
  pendingValue.value = []
}

function confirmSelection() {
  const nextValue = props.multiple ? [...pendingValue.value] : pendingValue.value[0]
  handleChange(nextValue)
  dialogVisible.value = false
}

loadUserList()
loadDeptList()

watch(
  () => props.modelValue,
  () => {
    pendingValue.value = [...selectedValues.value]
    nextTick(() => {
      if (!dialogVisible.value) {
        loadUserList(searchKeyword.value)
      }
    })
  },
)

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <div :class="[getFieldClass(), { 'is-disabled': disabled }]" @click="openDialog">
    <div v-if="fieldUsers.length" class="user-select-multiple-field__tags">
      <div v-for="item in visibleFieldUsers" :key="item.value" class="user-select-chip">
        <el-avatar :size="18" :src="item.user?.avatar || undefined">
          {{ getAvatarText(item.user) }}
        </el-avatar>
        <span>{{ getDisplayName(item.user) }}</span>
      </div>
      <span v-if="hiddenFieldUserCount" class="selected-user-overflow">+{{ hiddenFieldUserCount }}</span>
    </div>
    <span v-else class="user-select-multiple-field__placeholder">{{ placeholder }}</span>
    <button v-if="clearable && fieldUsers.length && !disabled" class="user-select-multiple-field__clear" type="button" @click="handleClear">×</button>
    <span class="user-select-multiple-field__suffix">选择</span>
  </div>

  <el-dialog v-model="dialogVisible" title="选择人员" width="1200px" align-center append-to-body @close="closeDialog">
    <div class="user-select-dialog">
      <div class="user-select-dialog__toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名 / 昵称 / 账号"
          clearable
          @input="handleSearch"
          @clear="handleSearch('')"
        />
        <span class="user-select-dialog__badge">默认包含下级部门</span>
      </div>

      <div class="user-select-dialog__body">
        <aside class="user-select-dialog__dept">
          <div class="user-select-dialog__title">部门</div>
          <el-input
            v-model="deptSearchKeyword"
            placeholder="搜索部门"
            clearable
            size="small"
            @input="handleDeptSearch"
            @clear="handleDeptSearch('')"
          />
          <el-tree
            ref="deptTreeRef"
            class="user-select-dialog__dept-tree"
            :data="deptTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            :filter-node-method="filterDeptNode"
            :current-node-key="selectedDeptId"
            highlight-current
            default-expand-all
            @node-click="handleDeptNodeClick"
          />
          <div v-if="!deptTree.length" class="empty-text">暂无部门数据</div>
        </aside>

        <section class="user-select-dialog__users">
          <div class="user-select-dialog__title">
            <span>人员</span>
          </div>
          <div v-loading="loading" class="user-select-dialog__list">
            <button
              v-for="user in userList"
              :key="user.id"
              type="button"
              class="user-select-dialog__user"
              :class="{ 'is-selected': isUserSelected(user.id) }"
              @click="selectPendingUser(user)"
            >
              <el-avatar :size="28" :src="user.avatar || undefined">
                {{ getAvatarText(user) }}
              </el-avatar>
              <span class="user-select-dialog__user-main">
                <span class="user-name">{{ getDisplayName(user) }}</span>
                <span v-if="getSubLabel(user)" class="user-sub">{{ getSubLabel(user) }}</span>
              </span>
              <span v-if="isUserSelected(user.id)" class="user-select-dialog__check">已选</span>
            </button>
            <div v-if="!loading && !userList.length" class="empty-text">暂无数据</div>
          </div>
        </section>
      </div>

      <aside class="user-select-dialog__selected">
        <div class="user-select-dialog__selected-head">
          <span>已选人员 {{ pendingUsers.length }}</span>
          <el-button v-if="pendingUsers.length" link type="primary" @click="clearPendingUsers">清空</el-button>
        </div>
        <div class="user-select-dialog__selected-list">
          <div v-for="item in pendingUsers" :key="item.value" class="user-select-dialog__selected-item">
            <el-avatar :size="24" :src="item.user?.avatar || undefined">
              {{ getAvatarText(item.user) }}
            </el-avatar>
            <span>{{ getDisplayName(item.user) }}</span>
            <button type="button" @click="removePendingUser(item.value)">×</button>
          </div>
          <div v-if="!pendingUsers.length" class="empty-text">暂未选择人员</div>
        </div>
      </aside>
    </div>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="confirmSelection">确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.user-select-field {
  display: flex;
  align-items: center;
  min-height: 32px;
  width: 100%;
  max-width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.user-select-field.is-disabled {
  cursor: not-allowed;
  background: var(--el-disabled-bg-color);
  color: var(--el-disabled-text-color);
}

.user-select-multiple-field {
  min-width: 0;
}

.user-select-multiple-field__tags {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.user-select-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 120px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.user-select-chip :deep(.el-avatar) {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  flex: none;
}

.user-select-chip span,
.user-selected-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-user-overflow {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.user-select-multiple-field__placeholder {
  flex: 1;
  color: var(--el-text-color-placeholder);
}

.user-select-multiple-field__clear {
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.user-select-multiple-field__suffix {
  flex: none;
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.user-select-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: min(78vh, 760px);
  min-height: 560px;
  overflow: hidden;
}

.user-select-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-select-dialog__badge {
  flex: none;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}

.user-select-dialog__body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.user-select-dialog__dept,
.user-select-dialog__users,
.user-select-dialog__selected {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.user-select-dialog__dept,
.user-select-dialog__users {
  padding: 12px;
}

.user-select-dialog__dept {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-select-dialog__dept-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.user-select-dialog__users {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-select-dialog__title,
.user-select-dialog__selected-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.user-select-dialog__hint,
.user-sub,
.empty-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.user-select-dialog__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
  min-height: 0;
  max-height: 420px;
  overflow: auto;
  align-content: start;
}

.user-select-dialog__user {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 60px;
  margin-left: 0;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
}

.user-select-dialog__user.is-selected {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.user-select-dialog__user-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-select-dialog__check {
  flex: none;
  color: var(--el-color-primary);
  font-size: 12px;
}

.user-select-dialog__selected {
  padding: 12px;
  flex: none;
}

.user-select-dialog__selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 140px;
  overflow: auto;
}

.user-select-dialog__selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

.user-select-dialog__selected-item :deep(.el-avatar) {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  flex: none;
}

.user-select-dialog__selected-item span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-select-dialog__selected-item button {
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  margin-left: 0;
}

.user-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.empty-text {
  padding: 16px 0;
  text-align: center;
}
</style>
