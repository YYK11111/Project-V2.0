<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, del } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const statusMap = ref({})
const projectList = ref([])
const projectMap = ref({})
const params = ref({
  projectId: route.query.projectId || '',
  status: '',
})
const rctRef = ref()

const columns = [
  { prop: 'name', label: '里程碑名称', minWidth: 150 },
  { prop: 'projectId', label: '所属项目', width: 150, formatter: (row) => projectMap.value[row.projectId] || '-' },
  { prop: 'dueDate', label: '计划完成日期', width: 120 },
  { prop: 'status', label: '状态', width: 100, type: 'tag' },
  { prop: 'taskCount', label: '关联任务', width: 100 },
  { prop: 'completedTaskCount', label: '已完成', width: 100 },
  { prop: 'progress', label: '进度', width: 150, type: 'progress' },
]

const canMilestoneAdd = computed(() => checkPermi(['business/milestones/add']))
const canMilestoneUpdate = computed(() => checkPermi(['business/milestones/update']))
const canMilestoneDelete = computed(() => checkPermi(['business/milestones/delete']))

function getFormPath() {
  return `${route.path.replace(/\/$/, '')}/form`
}

const handleAdd = () => {
  if (!canMilestoneAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

const handleEdit = (row) => {
  if (!canMilestoneUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (!canMilestoneDelete.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该里程碑吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

onMounted(async () => {
  const [statusRes, projectRes] = await Promise.all([getStatus(), getProjectList({ pageNum: 1, pageSize: 1000 })])
  statusMap.value = statusRes.data || {}
  projectList.value = projectRes.list || []
  projectMap.value = projectList.value.reduce((acc, p) => {
    acc[p.id] = p.name
    return acc
  }, {})
})

watch(
  () => route.query.projectId,
  (value) => {
    params.value.projectId = value || ''
    rctRef.value?.getList?.(1)
  },
)

const getStatusType = (status) => {
  const map = { '1': 'info', '2': 'success', '3': 'danger', '4': '' }
  return map[status] || 'info'
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  canMilestoneUpdate.value ? { key: 'edit', label: '修改', onClick: () => handleEdit(row) } : null,
  canMilestoneDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
]
</script>

<template>
  <RequestChartTable ref="rctRef" :params="params" :request="getList">
    <template #query="{ query }">
      <el-select v-model="query.projectId" placeholder="所属项目" clearable style="width: 200px; margin-right: 10px">
        <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 150px">
        <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
      </el-select>
    </template>

    <template #operation>
      <el-button v-if="canMilestoneAdd" type="primary" @click="handleAdd">新增</el-button>
    </template>

    <template #table>
      <el-table-column prop="name" label="里程碑名称" min-width="150" />
      <el-table-column prop="projectId" label="所属项目" width="150"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
      <el-table-column prop="dueDate" label="计划完成日期" width="120" />
      <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
      <el-table-column prop="taskCount" label="关联任务" width="100" />
      <el-table-column prop="completedTaskCount" label="已完成" width="100" />
      <el-table-column label="进度" width="150"><template #default="{ row }"><el-progress :percentage="row.taskCount > 0 ? Math.round((row.completedTaskCount / row.taskCount) * 100) : 0" :stroke-width="8" /></template></el-table-column>
    </template>

    <template #tableOperation="{ row }">
      <TableOperation :buttons="getButtons(row)" :row="row" />
    </template>
  </RequestChartTable>
</template>
