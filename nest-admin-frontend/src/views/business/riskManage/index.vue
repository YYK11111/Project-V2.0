<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, getLevel, getCategory, resolve, del } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import RiskMatrix from '@/components/RiskMatrix.vue'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const statusMap = ref({})
const levelMap = ref({})
const categoryMap = ref({})
const projectMap = ref({})
const showMatrix = ref(false)
const matrixDialogVisible = ref(false)
const params = ref({
  projectId: route.query.projectId || '',
  status: '',
  level: '',
  category: '',
})
const rctRef = ref()

const canRiskAdd = computed(() => checkPermi(['business/risks/add']))
const canRiskUpdate = computed(() => checkPermi(['business/risks/update']))
const canRiskDelete = computed(() => checkPermi(['business/risks/delete']))

const columns = [
  { prop: 'name', label: '风险名称', minWidth: 150 },
  { prop: 'projectId', label: '所属项目', width: 120, formatter: (row) => projectMap.value[row.projectId] || '-' },
  { prop: 'category', label: '分类', width: 100 },
  { prop: 'level', label: '等级', width: 80 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'dueDate', label: '计划解决日期', width: 120 },
  { prop: 'impactEstimate', label: '影响程度', width: 100 },
]

const fetchAllRisks = async () => {
  const res = await getList({ ...params.value, pageNum: 1, pageSize: 1000 })
  return res.list || []
}

const handleAdd = () => {
  if (!canRiskAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push('/business/riskManage/form')
}

const handleEdit = (row) => {
  if (!canRiskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`/business/riskManage/form?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`/business/riskManage/form?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (!canRiskDelete.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该风险吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

const handleResolve = async (row) => {
  await $sdk.confirm('确定要标记为已解决吗？')
  await resolve(row.id)
  $sdk.msgSuccess('操作成功')
  rctRef.value?.getList()
}

const getStatusType = (status) => {
  const map = { '1': 'info', '2': 'warning', '3': 'primary', '4': 'success', '5': '' }
  return map[status] || 'info'
}

const getLevelType = (level) => {
  const map = { '1': 'info', '2': 'warning', '3': 'danger', '4': 'error' }
  return map[level] || 'info'
}

const handleShowMatrix = async () => {
  showMatrix.value = await fetchAllRisks()
  matrixDialogVisible.value = true
}

const handleRiskClick = (risk) => {
  matrixDialogVisible.value = false
  router.push(`/business/riskManage/form?id=${risk.id}`)
}

const getButtons = (row) => [
  { key: 'resolve', label: '解决', type: 'primary', show: canRiskUpdate.value && row.status !== '4' && row.status !== '5', onClick: () => handleResolve(row) },
]

onMounted(async () => {
  const [statusRes, levelRes, categoryRes, projectRes] = await Promise.all([
    getStatus(), getLevel(), getCategory(), getProjectList({ pageNum: 1, pageSize: 1000 })
  ])
  statusMap.value = statusRes.data || {}
  levelMap.value = levelRes.data || {}
  categoryMap.value = categoryRes.data || {}
  projectMap.value = (projectRes.list || []).reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})
})
</script>

<template>
  <RequestChartTable ref="rctRef" :params="params" :request="getList">
    <template #query="{ query }">
      <el-button type="warning" @click="handleShowMatrix">风险矩阵</el-button>
      <el-select v-model="query.projectId" placeholder="所属项目" clearable style="width: 180px; margin-left: 10px">
        <el-option v-for="(v, k) in projectMap" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px; margin-left: 10px">
        <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="query.level" placeholder="风险等级" clearable style="width: 100px; margin-left: 10px">
        <el-option v-for="(v, k) in levelMap" :key="k" :label="v" :value="k" />
      </el-select>
    </template>

    <template #operation>
      <el-button v-if="canRiskAdd" type="primary" @click="handleAdd">新增</el-button>
    </template>

    <template #table>
      <el-table-column prop="name" label="风险名称" min-width="150" />
      <el-table-column prop="projectId" label="所属项目" width="120"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
      <el-table-column prop="category" label="分类" width="100"><template #default="{ row }">{{ categoryMap[row.category] || '-' }}</template></el-table-column>
      <el-table-column prop="level" label="等级" width="80"><template #default="{ row }"><el-tag :type="getLevelType(row.level)">{{ levelMap[row.level] || '-' }}</el-tag></template></el-table-column>
      <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
      <el-table-column prop="dueDate" label="计划解决日期" width="120" />
      <el-table-column prop="impactEstimate" label="影响程度" width="100" />
    </template>

    <template #tableOperation="{ row }">
      <TableOperation :buttons="[
        { key: 'view', label: '查看', onClick: () => handleView(row) },
        { key: 'edit', label: '修改', disabled: !canRiskUpdate.value, onClick: () => handleEdit(row) },
        { key: 'resolve', label: '解决', type: 'primary', show: canRiskUpdate.value && row.status !== '4' && row.status !== '5', onClick: () => handleResolve(row) },
        { key: 'delete', label: '删除', danger: true, disabled: !canRiskDelete.value, onClick: () => handleDel(row) },
      ]" :row="row" />
    </template>
  </RequestChartTable>

  <el-dialog v-model="matrixDialogVisible" title="风险矩阵" width="800px">
    <RiskMatrix v-if="matrixDialogVisible" :risks="showMatrix" @risk-click="handleRiskClick" />
  </el-dialog>
</template>
