<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getList, getStatus, getType, approve, reject, del, publishKnowledge, submitApproval } from './api'
import { getList as getProjectList } from '../projectManage/api'
import RequestChartTable from '@/components/RequestChartTable.vue'
import { checkPermi } from '@/utils/permission'
import { downloadCsv } from '@/utils/csv'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'

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
const canChangeDelete = computed(() => checkPermi(['business/changes/delete']))
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))

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
  if (row.canEdit !== true) return $sdk.msgWarning('当前操作没有权限')
  router.push(`${getFormPath()}?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`${getFormPath()}?id=${row.id}&action=view`)
}

const handleDel = async (row) => {
  if (row.canDelete !== true) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定要删除该变更吗？')
  await del(row.id)
  $sdk.msgSuccess('删除成功')
  rctRef.value?.getList()
}

const handleSubmitApproval = async (row) => {
  if (row.canEdit !== true) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该变更审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

const handlePublishKnowledge = async (row) => {
  if (!canArticleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  await confirmRepublishIfNeeded({ articleId: row.knowledgeArticleId, entityLabel: '变更' })
  await publishKnowledge(row.id)
  $sdk.msgSuccess('变更结论已沉淀到知识中心')
  rctRef.value?.getList?.()
}

const openKnowledgeDetail = (articleId) => {
  if (!articleId) return
  router.push({ path: '/content/articleManage/view', query: { id: articleId } })
}

function exportChangeList() {
  const rows = [
    ['变更标题', '所属项目', '变更类型', '影响程度', '状态', '审批状态', '成本影响', '进度影响(天)', '知识回流', '知识文章ID'],
    ...((rctRef.value?.data || []).map((row) => [
      row.title || '-',
      projectMap.value[row.projectId] || '-',
      typeMap.value[row.type] || row.type || '-',
      { '1': '低', '2': '中', '3': '高' }[row.impact] || '-',
      statusMap.value[row.status] || '-',
      ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '未提交审批'),
      row.costImpact || 0,
      row.scheduleImpact || 0,
      row.knowledgeLinked === '1' ? '已关联' : '未关联',
      row.knowledgeArticleId || '-',
    ])),
  ]
  downloadCsv('变更列表导出.csv', rows)
}

const canSubmitChangeApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => handleView(row) },
  row.knowledgeArticleId
    ? { key: 'viewKnowledge', label: '查看知识', type: 'primary', onClick: () => openKnowledgeDetail(row.knowledgeArticleId) }
    : canArticleAdd.value
      ? { key: 'publishKnowledge', label: '转知识', type: 'primary', onClick: () => handlePublishKnowledge(row) }
      : null,
  row.knowledgeArticleId && canArticleAdd.value
    ? { key: 'republishKnowledge', label: '重新沉淀', onClick: () => handlePublishKnowledge(row) }
    : null,
  row.canEdit === true && canSubmitChangeApproval(row) ? { key: 'submit', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  row.canEdit === true ? { key: 'edit', label: '编辑', onClick: () => handleEdit(row) } : null,
  row.canDelete === true ? { key: 'delete', label: '删除', danger: true, onClick: () => handleDel(row) } : null,
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
  <div class="change-index-page">
    <RequestChartTable ref="rctRef" class="change-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
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
                <div class="query-select-label">状态</div>
                <el-select v-model="query.status" placeholder="请选择状态" clearable>
                  <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">变更类型</div>
                <el-select v-model="query.type" placeholder="请选择变更类型" clearable>
                  <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">知识回流</div>
                <el-select v-model="query.knowledgeLinked" placeholder="请选择知识回流" clearable>
                  <el-option label="已关联" value="1" />
                  <el-option label="未关联" value="0" />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="change-index-operation">
          <div class="change-index-operation__left">
            <el-button v-if="canChangeAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button @click="exportChangeList">导出</el-button>
          </div>
          <el-button v-if="canChangeDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
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
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '未提交审批') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentNodeName" label="当前节点" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column prop="costImpact" label="成本影响" width="100">
          <template #default="{ row }">¥{{ (row.costImpact || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="scheduleImpact" label="进度影响(天)" width="100" />
        <el-table-column label="知识回流" width="100"><template #default="{ row }"><el-tag :type="row.knowledgeLinked === '1' ? 'success' : 'info'" size="small">{{ row.knowledgeLinked === '1' ? '已关联' : '未关联' }}</el-tag></template></el-table-column>
        <el-table-column label="知识文章" width="120"><template #default="{ row }"><el-button v-if="row.knowledgeArticleId" link type="primary" @click="$router.push({ path: '/content/articleManage/view', query: { id: row.knowledgeArticleId } })">查看知识</el-button><span v-else>-</span></template></el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
.change-index-page {
  min-height: 100%;
}

.change-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.change-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.change-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.change-index-panel :deep(.el-table__header-wrapper),
.change-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.change-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
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
.query-grid :deep(.el-input) {
  flex: 1;
  min-width: 0;
  width: 100%;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .change-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .change-index-operation,
  .change-index-operation__left {
    align-items: stretch;
  }
}
</style>
