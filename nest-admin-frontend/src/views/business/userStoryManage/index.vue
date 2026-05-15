<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList, del, getStatus, getType, getChildren } from './api'
import TableOperation from '@/components/TableOperation.vue'
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

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  canStoryUpdate.value ? { key: 'edit', label: '编辑', onClick: () => handleEdit(row) } : null,
  canStoryDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(row) } : null,
].filter(Boolean)
</script>

<template>
  <div class="user-story-index-page business-list-page">
    <RequestChartTable
      ref="rctRef"
      class="user-story-index-panel business-list-panel"
      :params="params"
      :request="getList"
      :is-selection="true"
      :table-attrs="tableAttrs"
      :table-events="tableEvents"
      @selection-change="handleSelectionChange"
    >
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaSelect v-model="query.type" filterable label="类型" prop="type">
                <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
              </BaSelect>
              <BaSelect v-model="query.status" filterable label="状态" prop="status">
                <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
              </BaSelect>
            </div>
          </div>
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
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>
