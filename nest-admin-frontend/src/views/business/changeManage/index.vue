<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, getType, approve, reject, del, submitApproval } from './api'
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
const canChangeSubmitApproval = computed(() => checkPermi(['business/changes/approve']))

const columns = [
  { prop: 'title', label: '变更标题', minWidth: 150 },
  { prop: 'projectId', label: '所属项目', width: 150, formatter: (row) => projectMap.value[row.projectId] || '-' },
  { prop: 'type', label: '变更类型', width: 100 },
  { prop: 'impact', label: '影响程度', width: 100 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'costImpact', label: '成本影响', width: 100 },
  { prop: 'scheduleImpact', label: '进度影响(天)', width: 100 },
]

function getFormPath() {
  return `${route.path.replace(/\/$/, '')}/form`
}

const handleAdd = () => {
  if (!canChangeAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

const handleEdit = (row) => {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (!canChangeDelete.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该变更吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

const handleSubmitApproval = async (row) => {
  if (!canChangeSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该变更审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

const canSubmitChangeApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  canChangeSubmitApproval.value && canSubmitChangeApproval(row) ? { key: 'submit', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  canChangeUpdate.value ? { key: 'edit', label: '修改', onClick: () => handleEdit(row) } : null,
  canChangeDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
]

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

watch(
  () => route.query.projectId,
  (value) => {
    params.value.projectId = value || ''
    rctRef.value?.getList?.(1)
  },
)
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
      <el-table-column prop="approvalStatus" label="审批状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'">
            {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentNodeName" label="当前节点" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column prop="costImpact" label="成本影响" width="100">
        <template #default="{ row }">¥{{ (row.costImpact || 0).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="scheduleImpact" label="进度影响(天)" width="100" />
    </template>

    <template #tableOperation="{ row }">
      <TableOperation :buttons="getButtons(row)" :row="row" />
    </template>
  </RequestChartTable>
</template>
