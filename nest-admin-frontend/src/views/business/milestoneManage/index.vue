<script setup>
import { ref, onMounted, computed, watch } from 'vue'
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
const projectList = ref([])
const projectMap = ref({})
const showAdvancedFilters = ref(false)
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
const canMilestoneDelete = computed(() => checkPermi(['business/milestones/delete']))

function getFormPath() {
  return `${route.path.replace(/\/$/, '')}/form`
}

const handleAdd = () => {
  if (!canMilestoneAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

const handleEdit = (row) => {
  if (row.canEdit !== true) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (row.canDelete !== true) return $sdk.msgWarning('当前操作没有权限')
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

function handleQueryChange() {
  rctRef.value?.getList?.(1)
}

function exportMilestoneList() {
  const rows = [
    ['里程碑名称', '所属项目', '计划完成日期', '责任人', '阶段', '状态', '延期原因', '变更影响', '风险影响', '关联任务', '已完成'],
    ...((rctRef.value?.data || []).map((row) => [
      row.name || '-',
      projectMap.value[row.projectId] || '-',
      row.dueDate || '-',
      row.owner?.nickname || row.owner?.name || '-',
      row.phase || '-',
      statusMap.value[row.status] || '-',
      row.delayReason || '-',
      row.changeImpactFlag === '1' ? '是' : '否',
      row.riskImpactFlag === '1' ? '是' : '否',
      row.taskCount || 0,
      row.completedTaskCount || 0,
    ])),
  ]
  downloadCsv('里程碑列表导出.csv', rows)
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  row.canEdit === true ? { key: 'edit', label: '编辑', onClick: () => handleEdit(row) } : null,
  row.canDelete === true ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
]
</script>

<template>
  <div class="milestone-index-page">
    <RequestChartTable ref="rctRef" class="milestone-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <div class="query-select-item">
                <div class="query-select-label">所属项目</div>
                <el-select v-model="query.projectId" placeholder="请选择所属项目" clearable>
                  <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">责任人</div>
                <UserSelect v-model="query.ownerId" placeholder="请选择责任人" clearable @change="handleQueryChange" />
              </div>
              <div class="query-select-item">
                <div class="query-select-label">里程碑阶段</div>
                <el-input v-model="query.phase" placeholder="请输入里程碑阶段" clearable @change="handleQueryChange" />
              </div>
              <div class="query-select-item">
                <div class="query-select-label">状态</div>
                <el-select v-model="query.status" placeholder="请选择状态" clearable @change="handleQueryChange">
                  <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
                </el-select>
              </div>
            </div>
          </div>
          <div class="query-section query-section--advanced">
            <div class="query-section__header">
              <div>
                <div class="query-section__title">高级筛选</div>
                <div class="query-section__desc">按影响来源进一步定位里程碑偏差信息</div>
              </div>
              <el-button class="advanced-filter-toggle" link type="primary" @click="showAdvancedFilters = !showAdvancedFilters">
                {{ showAdvancedFilters ? '收起筛选' : '展开筛选' }}
              </el-button>
            </div>
            <div v-if="showAdvancedFilters" class="query-grid">
              <div class="query-select-item">
                <div class="query-select-label">变更影响</div>
                <el-select v-model="query.changeImpactFlag" placeholder="请选择变更影响" clearable @change="handleQueryChange">
                  <el-option label="是" value="1" />
                  <el-option label="否" value="0" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">风险影响</div>
                <el-select v-model="query.riskImpactFlag" placeholder="请选择风险影响" clearable @change="handleQueryChange">
                  <el-option label="是" value="1" />
                  <el-option label="否" value="0" />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="milestone-index-operation">
          <div class="milestone-index-operation__left">
            <el-button v-if="canMilestoneAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button @click="exportMilestoneList">导出</el-button>
          </div>
          <el-button v-if="canMilestoneDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="里程碑名称" min-width="150" />
        <el-table-column prop="projectId" label="所属项目" width="150"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
        <el-table-column prop="dueDate" label="计划完成日期" width="120" />
        <el-table-column label="责任人" width="120">
          <template #default="{ row }">{{ row.owner?.nickname || row.owner?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="phase" label="阶段" width="120" />
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
        <el-table-column prop="delayReason" label="延期原因" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="变更影响" width="100"><template #default="{ row }">{{ row.changeImpactFlag === '1' ? '是' : '否' }}</template></el-table-column>
        <el-table-column label="风险影响" width="100"><template #default="{ row }">{{ row.riskImpactFlag === '1' ? '是' : '否' }}</template></el-table-column>
        <el-table-column prop="taskCount" label="关联任务" width="100" />
        <el-table-column prop="completedTaskCount" label="已完成" width="100" />
        <el-table-column label="进度" width="150"><template #default="{ row }"><el-progress :percentage="row.taskCount > 0 ? Math.round((row.completedTaskCount / row.taskCount) * 100) : 0" :stroke-width="8" /></template></el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
.milestone-index-page {
  min-height: 100%;
}

.milestone-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.milestone-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.milestone-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.milestone-index-operation__left {
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

.query-section--advanced {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-fill-color-extra-light) 72%, transparent);
}

.query-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.query-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.query-section__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.advanced-filter-toggle {
  flex-shrink: 0;
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

.milestone-index-panel :deep(.el-table__header-wrapper),
.milestone-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .milestone-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .milestone-index-operation,
  .milestone-index-operation__left {
    align-items: stretch;
  }
}
</style>
