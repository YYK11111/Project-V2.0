<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList, del, getStatus, getType, getChildren } from './api'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const route = useRoute()

const rctRef = ref()
const params = ref({
  projectId: '',
  sprintId: '',
  type: '',
  status: '',
})

const statusMap = ref({})
const typeMap = ref({})
const expandedRows = ref([])
const selectedIds = ref([])
const canStoryAdd = computed(() => checkPermi(['business/stories/add']))
const canStoryUpdate = computed(() => checkPermi(['business/stories/update']))
const canStoryDelete = computed(() => checkPermi(['business/stories/delete']))
const tableAttrs = computed(() => ({
  rowKey: 'id',
  treeProps: { children: '_children', hasChildren: 'hasChildren' },
  defaultExpandAll: true,
  expandRowKeys: expandedRows.value,
}))
const tableEvents = {
  'expand-change': handleExpand,
}

onMounted(async () => {
  await loadStatus()
})

async function loadStatus() {
  const [statusRes, typeRes] = await Promise.all([getStatus(), getType()])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map((row) => row.id)
}

function getFormPath() {
  return `${route.path.replace(/\/$/, '')}/form`
}

function handleAdd() {
  if (!canStoryAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

function handleEdit(row) {
  if (!canStoryUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

function handleView(row) {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

function handleDelete(row) {
  if (!canStoryDelete.value) return $sdk.msgWarning('当前操作没有权限')
  if (row.children?.length > 0) {
    $sdk.msgWarning('请先删除子故事')
    return
  }
  $sdk.msgConfirm('确认删除？').then(() => {
    del(row.id).then(() => {
      $sdk.msgSuccess('删除成功')
      rctRef.value?.getList?.()
    })
  })
}

function handleBatchDelete() {
  if (!canStoryDelete.value) return $sdk.msgWarning('当前操作没有权限')
  if (!selectedIds.value.length) return $sdk.msgWarning('请选择需要删除的故事')
  $sdk.msgConfirm('确认批量删除？').then(async () => {
    await Promise.all(selectedIds.value.map((id) => del(id)))
    $sdk.msgSuccess('删除成功')
    selectedIds.value = []
    rctRef.value?.getList?.()
  })
}

async function handleExpand(row, expanded) {
  if (expanded && row.type === '1' && row.children?.length === undefined) {
    try {
      const res = await getChildren(row.id)
      const children = res.list || []
      const updateItem = rctRef.value?.data?.find?.((item) => item.id === row.id)
      if (updateItem) {
        updateItem._children = children
      }
    } catch (e) {
      console.error(e)
    }
  }
}

function getStatusType(status) {
  const types = {
    '1': 'info',
    '2': 'primary',
    '3': 'warning',
    '4': 'success',
    '5': 'success',
    '6': 'danger',
  }
  return types[status] || 'info'
}

function getTypeTag(type) {
  const types = {
    '1': 'danger',
    '2': 'warning',
    '3': 'info',
  }
  return types[type] || 'info'
}
</script>

<template>
  <div class="user-story-index-page">
    <RequestChartTable
      ref="rctRef"
      class="user-story-index-panel"
      :params="params"
      :request="getList"
      :is-selection="true"
      :table-attrs="tableAttrs"
      :table-events="tableEvents"
      @selection-change="handleSelectionChange"
    >
      <template #query="{ query }">
        <div class="query-grid">
          <BaSelect v-model="query.type" filterable label="类型" prop="type">
            <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
          </BaSelect>
          <BaSelect v-model="query.status" filterable label="状态" prop="status">
            <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
          </BaSelect>
        </div>
      </template>

      <template #operation>
        <div class="user-story-index-operation">
          <div class="user-story-index-operation__left">
            <el-button v-if="canStoryAdd" type="primary" @click="handleAdd">新增</el-button>
          </div>
          <el-button v-if="canStoryDelete" :disabled="!selectedIds.length" type="danger" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ typeMap[row.type] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ statusMap[row.status] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storyPoints" label="故事点" width="80" align="center" />
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column prop="sprintId" label="所属Sprint" width="120">
          <template #default="{ row }">
            {{ row.sprint?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="100">
          <template #default="{ row }">
            {{ row.assignee?.nickname || row.assignee?.name || '-' }}
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <el-button link type="primary" @click="handleView(row)">详情</el-button>
        <el-button v-if="canStoryUpdate" link type="primary" @click="handleEdit(row)">修改</el-button>
        <el-button v-if="canStoryDelete" link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.user-story-index-page {
  min-height: 100%;
}

.user-story-index-panel {
  padding-top: 20px;
}

.user-story-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.filter-container {
  margin-bottom: 16px;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-grid :deep(.el-form-item) {
  display: flex;
  width: 100%;
  margin-bottom: 0;
}

.query-grid :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input) {
  width: 100%;
  flex: 1;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.user-story-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-story-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-story-index-table :deep(.el-table__header-wrapper),
.user-story-index-table :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .user-story-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .user-story-index-operation,
  .user-story-index-operation__left {
    align-items: stretch;
  }
}
</style>
