<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, del } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const statusMap = ref({})
const projectMap = ref({})
const params = ref({
  projectId: route.query.projectId || '',
  status: '',
})
const rctRef = ref()

const columns = [
  { prop: 'name', label: 'Sprint名称', minWidth: 120 },
  { prop: 'projectId', label: '所属项目', width: 150, formatter: (row) => projectMap.value[row.projectId] || '-' },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'startDate', label: '开始日期', width: 110 },
  { prop: 'endDate', label: '结束日期', width: 110 },
  { prop: 'totalStoryPoints', label: '故事点', width: 80 },
  { prop: 'completedStoryPoints', label: '完成', width: 80 },
  { prop: 'progress', label: '进度', width: 150, type: 'progress' },
]

const canSprintAdd = computed(() => checkPermi(['business/sprints/add']))
const canSprintUpdate = computed(() => checkPermi(['business/sprints/update']))
const canSprintDelete = computed(() => checkPermi(['business/sprints/delete']))

function getFormPath() {
  return `${route.path.replace(/\/$/, '')}/form`
}

const handleAdd = () => {
  if (!canSprintAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

const handleEdit = (row) => {
  if (!canSprintUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (!canSprintDelete.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该Sprint吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

const getStatusType = (status) => {
  const map = { '1': 'info', '2': 'primary', '3': 'success', '4': 'danger' }
  return map[status] || 'info'
}

onMounted(async () => {
  const [statusRes, projectRes] = await Promise.all([getStatus(), getProjectList({ pageNum: 1, pageSize: 1000 })])
  statusMap.value = statusRes.data || {}
  projectMap.value = (projectRes.list || []).reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})
})
</script>

<template>
  <RequestChartTable ref="rctRef" :params="params" :request="getList">
    <template #query="{ query }">
      <el-select v-model="query.projectId" placeholder="所属项目" clearable style="width: 200px; margin-right: 10px">
        <el-option v-for="(v, k) in projectMap" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px">
        <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
      </el-select>
    </template>

    <template #operation>
      <el-button v-if="canSprintAdd" type="primary" @click="handleAdd">新增</el-button>
    </template>

    <template #table>
      <el-table-column prop="name" label="Sprint名称" min-width="150" />
      <el-table-column prop="projectId" label="所属项目" width="150"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
      <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="120" />
      <el-table-column prop="endDate" label="结束日期" width="120" />
      <el-table-column prop="totalStoryPoints" label="总故事点" width="100" />
      <el-table-column prop="completedStoryPoints" label="完成故事点" width="110" />
      <el-table-column label="进度" width="150"><template #default="{ row }"><el-progress :percentage="row.totalStoryPoints > 0 ? Math.round((row.completedStoryPoints / row.totalStoryPoints) * 100) : 0" :stroke-width="8" /></template></el-table-column>
    </template>

    <template #tableOperation="{ row }">
      <TableOperation :buttons="[
        { key: 'view', label: '查看', onClick: () => handleView(row) },
        { key: 'edit', label: '修改', disabled: !canSprintUpdate.value, onClick: () => handleEdit(row) },
        { key: 'delete', label: '删除', danger: true, disabled: !canSprintDelete.value, onClick: () => handleDel(row) },
      ]" :row="row" />
    </template>
  </RequestChartTable>
</template>
