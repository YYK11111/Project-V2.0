<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, getType, approve, reject, del } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const statusMap = ref({})
const typeMap = ref({})
const projectMap = ref({})
const params = ref({
  projectId: route.query.projectId || '',
  status: '',
  type: '',
})
const rctRef = ref()

const canChangeAdd = computed(() => checkPermi(['business/changes/add']))
const canChangeUpdate = computed(() => checkPermi(['business/changes/update']))
const canChangeDelete = computed(() => checkPermi(['business/changes/delete']))

const columns = [
  { prop: 'title', label: '变更标题', minWidth: 150 },
  { prop: 'projectId', label: '所属项目', width: 150, formatter: (row) => projectMap.value[row.projectId] || '-' },
  { prop: 'type', label: '变更类型', width: 100 },
  { prop: 'impact', label: '影响程度', width: 100 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'costImpact', label: '成本影响', width: 100 },
  { prop: 'scheduleImpact', label: '进度影响(天)', width: 100 },
]

const handleAdd = () => {
  if (!canChangeAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push('/business/changeManage/form')
}

const handleEdit = (row) => {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`/business/changeManage/form?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`/business/changeManage/form?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (!canChangeDelete.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该变更吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

const getStatusType = (status) => {
  const map = { '1': 'info', '2': 'warning', '3': 'success', '4': 'danger', '5': 'primary' }
  return map[status] || 'info'
}

const getImpactType = (impact) => {
  const map = { '1': 'info', '2': 'warning', '3': 'danger' }
  return map[impact] || 'info'
}

onMounted(async () => {
  const [statusRes, typeRes, projectRes] = await Promise.all([getStatus(), getType(), getProjectList({ pageNum: 1, pageSize: 1000 })])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
  projectMap.value = (projectRes.list || []).reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})
})
</script>

<template>
  <RequestChartTable ref="rctRef" :params="params" :request="getList">
    <template #query="{ query }">
      <el-select v-model="query.projectId" placeholder="所属项目" clearable style="width: 180px; margin-right: 10px">
        <el-option v-for="(v, k) in projectMap" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px; margin-right: 10px">
        <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="query.type" placeholder="变更类型" clearable style="width: 120px">
        <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
      </el-select>
    </template>

    <template #operation>
      <el-button v-if="canChangeAdd" type="primary" @click="handleAdd">新增</el-button>
    </template>

    <template #table>
      <el-table-column prop="title" label="变更标题" min-width="150" />
      <el-table-column prop="projectId" label="所属项目" width="150">
        <template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="type" label="变更类型" width="100" />
      <el-table-column prop="impact" label="影响程度" width="100">
        <template #default="{ row }"><el-tag :type="getImpactType(row.impact)">{{ { '1': '低', '2': '中', '3': '高' }[row.impact] || '-' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="costImpact" label="成本影响" width="100">
        <template #default="{ row }">¥{{ (row.costImpact || 0).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="scheduleImpact" label="进度影响(天)" width="100" />
    </template>

    <template #tableOperation="{ row }">
      <TableOperation :buttons="[
        { key: 'view', label: '查看', onClick: () => handleView(row) },
        { key: 'edit', label: '修改', disabled: !canChangeUpdate.value, onClick: () => handleEdit(row) },
        { key: 'delete', label: '删除', danger: true, disabled: !canChangeDelete.value, onClick: () => handleDel(row) },
      ]" :row="row" />
    </template>
  </RequestChartTable>
</template>
