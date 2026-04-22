<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, getLevel, getCategory, resolve, del, publishKnowledge } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import RiskMatrix from '@/components/RiskMatrix.vue'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import { downloadCsv } from '@/utils/csv'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'

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
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))

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

function getFormPath() {
  return '/projectManage/riskManage/form'
}

const handleAdd = () => {
  if (!canRiskAdd.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(getFormPath())
}

const handleEdit = (row) => {
  if (!canRiskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
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

const handlePublishKnowledge = async (row) => {
  if (!canArticleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  await confirmRepublishIfNeeded({ articleId: row.knowledgeArticleId, entityLabel: '风险' })
  await publishKnowledge(row.id)
  $sdk.msgSuccess('风险案例已沉淀到知识中心')
  rctRef.value?.getList?.()
}

const openKnowledgeDetail = (articleId) => {
  if (!articleId) return
  router.push({ path: '/content/articleManage/view', query: { id: articleId } })
}

function exportRiskList() {
  const rows = [
    ['风险名称', '所属项目', '分类', '等级', '状态', '计划解决日期', '影响程度', '知识回流', '知识文章ID'],
    ...((rctRef.value?.data || []).map((row) => [
      row.name || '-',
      projectMap.value[row.projectId] || '-',
      categoryMap.value[row.category] || '-',
      levelMap.value[row.level] || '-',
      statusMap.value[row.status] || '-',
      row.dueDate || '-',
      row.impactEstimate || '-',
      row.knowledgeLinked === '1' ? '已关联' : '未关联',
      row.knowledgeArticleId || '-',
    ])),
  ]
  downloadCsv('风险列表导出.csv', rows)
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
  router.push(`${getFormPath()}?id=${risk.id}`)
}

onMounted(async () => {
  const [statusRes, levelRes, categoryRes, projectRes] = await Promise.all([
    getStatus(), getLevel(), getCategory(), getProjectList({ pageNum: 1, pageSize: 1000 })
  ])
  statusMap.value = statusRes.data || {}
  levelMap.value = levelRes.data || {}
  categoryMap.value = categoryRes.data || {}
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
  canRiskUpdate.value && row.canEdit !== false ? { key: 'edit', label: '修改', onClick: () => handleEdit(row) } : null,
  row.knowledgeArticleId
    ? { key: 'viewKnowledge', label: '查看知识', type: 'primary', onClick: () => openKnowledgeDetail(row.knowledgeArticleId) }
    : canArticleAdd.value
      ? { key: 'publishKnowledge', label: '转知识', type: 'primary', onClick: () => handlePublishKnowledge(row) }
      : null,
  row.knowledgeArticleId && canArticleAdd.value
    ? { key: 'republishKnowledge', label: '重新沉淀', onClick: () => handlePublishKnowledge(row) }
    : null,
  canRiskUpdate.value && row.status !== '4' && row.status !== '5' ? { key: 'resolve', label: '解决', type: 'primary', onClick: () => handleResolve(row) } : null,
  canRiskDelete.value && row.canDelete !== false ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
]
</script>

<template>
  <div class="risk-index-page">
    <RequestChartTable ref="rctRef" class="risk-index-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="native-query-grid">
          <div class="native-query-item">
            <div class="native-query-label">所属项目</div>
            <el-select v-model="query.projectId" placeholder="请选择所属项目" clearable>
              <el-option v-for="(v, k) in projectMap" :key="k" :label="v" :value="k" />
            </el-select>
          </div>
          <div class="native-query-item">
            <div class="native-query-label">状态</div>
            <el-select v-model="query.status" placeholder="请选择状态" clearable>
              <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
            </el-select>
          </div>
          <div class="native-query-item">
            <div class="native-query-label">风险等级</div>
            <el-select v-model="query.level" placeholder="请选择风险等级" clearable>
              <el-option v-for="(v, k) in levelMap" :key="k" :label="v" :value="k" />
            </el-select>
          </div>
          <div class="native-query-item">
            <div class="native-query-label">知识回流</div>
            <el-select v-model="query.knowledgeLinked" placeholder="请选择知识回流" clearable>
              <el-option label="已关联" value="1" />
              <el-option label="未关联" value="0" />
            </el-select>
          </div>
        </div>
      </template>

      <template #extraButtons>
        <el-button type="warning" @click="handleShowMatrix">风险矩阵</el-button>
      </template>

      <template #operation="{ selectedIds }">
        <div class="risk-index-operation">
          <div class="risk-index-operation__left">
            <el-button v-if="canRiskAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button @click="exportRiskList">导出</el-button>
          </div>
          <el-button v-if="canRiskDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="风险名称" min-width="150" />
        <el-table-column prop="projectId" label="所属项目" width="120"><template #default="{ row }">{{ projectMap[row.projectId] || '-' }}</template></el-table-column>
        <el-table-column prop="category" label="分类" width="100"><template #default="{ row }">{{ categoryMap[row.category] || '-' }}</template></el-table-column>
        <el-table-column prop="level" label="等级" width="80"><template #default="{ row }"><el-tag :type="getLevelType(row.level)">{{ levelMap[row.level] || '-' }}</el-tag></template></el-table-column>
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ statusMap[row.status] || '-' }}</el-tag></template></el-table-column>
        <el-table-column prop="dueDate" label="计划解决日期" width="120" />
        <el-table-column prop="impactEstimate" label="影响程度" width="100" />
        <el-table-column label="知识回流" width="100"><template #default="{ row }"><el-tag :type="row.knowledgeLinked === '1' ? 'success' : 'info'" size="small">{{ row.knowledgeLinked === '1' ? '已关联' : '未关联' }}</el-tag></template></el-table-column>
        <el-table-column label="知识文章" width="120"><template #default="{ row }"><el-button v-if="row.knowledgeArticleId" link type="primary" @click="$router.push({ path: '/content/articleManage/view', query: { id: row.knowledgeArticleId } })">查看知识</el-button><span v-else>-</span></template></el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" />
      </template>
    </RequestChartTable>
  </div>

  <el-dialog v-model="matrixDialogVisible" title="风险矩阵" width="800px">
    <RiskMatrix v-if="matrixDialogVisible" :risks="showMatrix" @risk-click="handleRiskClick" />
  </el-dialog>
</template>

<style scoped>
.risk-index-page {
  min-height: 100%;
}

.risk-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.risk-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.risk-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.risk-index-panel :deep(.el-table__header-wrapper),
.risk-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.risk-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.native-query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.native-query-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.native-query-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
}

.native-query-grid :deep(.el-select),
.native-query-grid :deep(.el-input) {
  flex: 1;
  min-width: 0;
  width: 100%;
}

@media (max-width: 1200px) {
  .native-query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .risk-index-panel {
    padding-top: 18px;
  }

  .native-query-grid {
    grid-template-columns: 1fr;
  }

  .risk-index-operation,
  .risk-index-operation__left {
    align-items: stretch;
  }
}
</style>
