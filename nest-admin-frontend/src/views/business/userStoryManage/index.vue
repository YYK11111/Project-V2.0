<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getList, del, getStatus, getType, getChildren } from './api'
import { checkPermi } from '@/utils/permission'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 20,
  projectId: '',
  sprintId: '',
  type: '',
  status: '',
})

const statusMap = ref({})
const typeMap = ref({})
const expandedRows = ref([])
const canStoryAdd = computed(() => checkPermi(['business/stories/add']))
const canStoryUpdate = computed(() => checkPermi(['business/stories/update']))
const canStoryDelete = computed(() => checkPermi(['business/stories/delete']))

onMounted(async () => {
  await loadStatus()
  loadData()
})

async function loadStatus() {
  const [statusRes, typeRes] = await Promise.all([getStatus(), getType()])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
}

function loadData() {
  loading.value = true
  getList(queryParams.value)
    .then((res) => {
      list.value = res.list || []
      total.value = res.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  loadData()
}

function handleReset() {
  queryParams.value = {
    pageNum: 1,
    pageSize: 20,
    projectId: '',
    sprintId: '',
    type: '',
    status: '',
  }
  loadData()
}

function handleAdd() {
  if (!canStoryAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push('/business/userStoryManage/form')
}

function handleEdit(row) {
  if (!canStoryUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`/business/userStoryManage/form?id=${row.id}`)
}

function handleView(row) {
  router.push(`/business/userStoryManage/form?id=${row.id}&action=view`)
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
      loadData()
    })
  })
}

async function handleExpand(row, expanded) {
  if (expanded && row.type === '1' && row.children?.length === undefined) {
    try {
      const res = await getChildren(row.id)
      const children = res.list || []
      const updateItem = list.value.find(item => item.id === row.id)
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
  <div class="Gcard">
    <div class="filter-container">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="类型">
          <el-select v-model="queryParams.type" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-operate">
      <el-button v-if="canStoryAdd" type="primary" @click="handleAdd">新增</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      :tree-props="{ children: '_children', hasChildren: 'hasChildren' }"
      row-key="id"
      :expand-row-keys="expandedRows"
      @expand-change="handleExpand"
      default-expand-all
    >
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
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button v-if="canStoryUpdate" link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="canStoryDelete" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt20"
      v-model:current-page="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadData"
      @current-change="loadData"
    />
  </div>
</template>

<style lang="scss" scoped>
.filter-container {
  margin-bottom: 16px;
}

.table-operate {
  margin-bottom: 16px;
}
</style>
