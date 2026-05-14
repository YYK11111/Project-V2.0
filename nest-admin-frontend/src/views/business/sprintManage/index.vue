<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, del } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'
import { downloadCsv } from '@/utils/csv'

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

function handleQueryChange() {
  rctRef.value?.getList?.(1)
}

function exportSprintList() {
  const rows = [
    ['Sprint名称', '所属项目', '状态', '负责人', '开始日期', '结束日期', '偏差说明', '变更影响', '健康度快照', '总故事点', '完成故事点'],
    ...((rctRef.value?.data || []).map((row) => [
      row.name || '-',
      projectMap.value[row.projectId] || '-',
      statusMap.value[row.status] || '-',
      row.owner?.nickname || row.owner?.name || '-',
      row.startDate || '-',
      row.endDate || '-',
      row.delayReason || '-',
      row.changeImpactFlag === '1' ? '是' : '否',
      row.healthScoreSnapshot || 0,
      row.totalStoryPoints || 0,
      row.completedStoryPoints || 0,
    ])),
  ]
  downloadCsv('Sprint列表导出.csv', rows)
}

onMounted(async () => {
  const [statusRes, projectRes] = await Promise.all([getStatus(), getProjectList({ pageNum: 1, pageSize: 1000 })])
  statusMap.value = statusRes.data || {}
  projectMap.value = (projectRes.list || []).reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})
})

watch(
  () => route.query.projectId,
  (value) => {
    params.value.projectId = value || ''
    rctRef.value?.getList?.(1)
  },
)

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  canSprintUpdate.value ? { key: 'edit', label: '修改', onClick: () => handleEdit(row) } : null,
  canSprintDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
]
</script>

<template>
  <div class="sprint-index-page">
    <RequestChartTable ref="rctRef" class="sprint-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <div class="query-select-item">
                <div class="query-select-label">所属项目</div>
                <el-select v-model="query.projectId" placeholder="请选择所属项目" clearable>
                  <el-option v-for="(v, k) in projectMap" :key="k" :label="v" :value="k" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">负责人</div>
                <UserSelect v-model="query.ownerId" placeholder="请选择负责人" clearable @change="handleQueryChange" />
              </div>
              <div class="query-select-item">
                <div class="query-select-label">变更影响</div>
                <el-select v-model="query.changeImpactFlag" placeholder="请选择变更影响" clearable @change="handleQueryChange">
                  <el-option label="是" value="1" />
                  <el-option label="否" value="0" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">状态</div>
                <el-select v-model="query.status" placeholder="请选择状态" clearable @change="handleQueryChange">
                  <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="sprint-index-operation">
          <div class="sprint-index-operation__left">
            <el-button v-if="canSprintAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button @click="exportSprintList">导出</el-button>
          </div>
          <el-button v-if="canSprintDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="Sprint名称" min-width="150" />
        <el-table-column prop="projectId" label="所属项目" width="150"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
        <el-table-column label="负责人" width="120"><template #default="{ row }">{{ row.owner?.nickname || row.owner?.name || '-' }}</template></el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="delayReason" label="偏差说明" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="变更影响" width="100"><template #default="{ row }">{{ row.changeImpactFlag === '1' ? '是' : '否' }}</template></el-table-column>
        <el-table-column prop="healthScoreSnapshot" label="健康度快照" width="110" />
        <el-table-column prop="totalStoryPoints" label="总故事点" width="100" />
        <el-table-column prop="completedStoryPoints" label="完成故事点" width="110" />
        <el-table-column label="进度" width="150"><template #default="{ row }"><el-progress :percentage="row.totalStoryPoints > 0 ? Math.round((row.completedStoryPoints / row.totalStoryPoints) * 100) : 0" :stroke-width="8" /></template></el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
.sprint-index-page {
  min-height: 100%;
}

.sprint-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.sprint-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sprint-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sprint-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.query-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.query-section {
  min-width: 0;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.query-select-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  width: auto;
  min-width: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input),
.query-grid :deep(.user-select) {
  flex: 1;
  min-width: 0;
  width: 100%;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.sprint-index-panel :deep(.el-table__header-wrapper),
.sprint-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .sprint-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .sprint-index-operation,
  .sprint-index-operation__left {
    align-items: stretch;
  }
}
</style>
