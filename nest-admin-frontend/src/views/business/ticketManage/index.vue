<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getList, getType, getStatus, del, publishKnowledge, submitApproval, dispatchTicket, transferTicket, batchDispatchTickets } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import { downloadCsv } from '@/utils/csv'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'
import { useProjectScopedActions } from '../projectManage/useProjectScopedActions'
import UserSelect from '@/components/UserSelect.vue'

const router = useRouter()
const route = useRoute()
const params = ref({
  projectId: route.query.projectId || '',
})

const type = ref({})
getType().then(({ data }) => (type.value = data))

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const rctRef = ref()
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))
const canTicketDelete = computed(() => checkPermi(['business/tickets/delete']))
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))
const { canCreateProjectScopedRecord, canBatchDeleteProjectScopedRecord, getProjectScopedCreateQuery } = useProjectScopedActions(route)
const canTicketCreate = computed(() => canCreateProjectScopedRecord(canTicketAdd.value, 'canManageTasks'))
const canTicketBatchDelete = computed(() => canBatchDeleteProjectScopedRecord(canTicketDelete.value, 'canManageTasks'))
const canTicketBatchDispatch = computed(() => canBatchDeleteProjectScopedRecord(canTicketUpdate.value, 'canManageTasks'))
const selectedRows = ref([])
const dispatchDialogVisible = ref(false)
const dispatchDialogLoading = ref(false)
const dispatchDialogMode = ref('dispatch')
const dispatchDialogRow = ref(null)
const dispatchForm = ref({
  handlerId: '',
})

async function handleSubmitApproval(row) {
  if (row.canEdit !== true) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该工单审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

async function handlePublishKnowledge(row) {
  if (!canArticleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  await confirmRepublishIfNeeded({ articleId: row.knowledgeArticleId, entityLabel: '工单' })
  await publishKnowledge(row.id)
  $sdk.msgSuccess('工单已沉淀到知识中心')
  rctRef.value?.getList?.()
}

function openKnowledgeDetail(articleId) {
  if (!articleId) return
  router.push({ path: '/content/articleManage/view', query: { id: articleId } })
}

function exportTicketList() {
  const rows = [
    ['工单标题', '类型', '提交人', '处理人', '所属项目', '状态', '审批状态', '知识回流', '知识文章ID', '创建时间'],
    ...((rctRef.value?.data || []).map((row) => [
      row.title || '-',
      type.value[row.type] || '-',
      row.submitter?.nickname || row.submitter?.name || '-',
      row.handler?.nickname || row.handler?.name || '-',
      row.project?.name || '-',
      status.value[row.status] || '-',
      ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '未提交审批'),
      row.knowledgeLinked === '1' ? '已关联' : '未关联',
      row.knowledgeArticleId || '-',
      row.createTime || '-',
    ])),
  ]
  downloadCsv('工单列表导出.csv', rows)
}

const canSubmitTicketApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

function handleSelectionChange(rows) {
  selectedRows.value = Array.isArray(rows) ? rows : []
}

function openDispatchDialog(mode, row = null) {
  dispatchDialogMode.value = mode
  dispatchDialogRow.value = row
  dispatchForm.value = {
    handlerId: String(row?.handlerId || ''),
  }
  dispatchDialogVisible.value = true
}

function closeDispatchDialog() {
  dispatchDialogVisible.value = false
  dispatchDialogLoading.value = false
  dispatchDialogRow.value = null
}

function getBatchDispatchableIds() {
  return selectedRows.value
    .filter((row) => row?.canEdit === true && String(row?.status || '') === '1')
    .map((row) => row.id)
}

async function submitDispatchDialog() {
  if (!dispatchForm.value.handlerId) return $sdk.msgWarning('请选择处理人')
  dispatchDialogLoading.value = true
  try {
    if (dispatchDialogMode.value === 'batchDispatch') {
      const ids = getBatchDispatchableIds()
      if (!ids.length) return $sdk.msgWarning('选中项里没有可分派的待分派工单')
      const res = await batchDispatchTickets(ids, { handlerId: dispatchForm.value.handlerId })
      const successCount = Number(res?.successCount || 0)
      const failedCount = Number(res?.failedCount || 0)
      if (failedCount > 0 && successCount > 0) {
        $sdk.msgWarning(`部分分派成功：成功 ${successCount} 条，失败 ${failedCount} 条`)
      } else if (failedCount > 0) {
        $sdk.msgError(res?.failed?.[0]?.reason || '批量分派失败')
      } else {
        $sdk.msgSuccess('批量分派成功')
      }
    } else if (dispatchDialogMode.value === 'transfer') {
      await transferTicket(dispatchDialogRow.value.id, { handlerId: dispatchForm.value.handlerId })
      $sdk.msgSuccess('转派成功')
    } else {
      await dispatchTicket(dispatchDialogRow.value.id, { handlerId: dispatchForm.value.handlerId })
      $sdk.msgSuccess('分派成功')
    }
    closeDispatchDialog()
    rctRef.value?.getList?.()
  } finally {
    dispatchDialogLoading.value = false
  }
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/ticketManage/form') },
  row.canEdit === true && row.status === '1' ? { key: 'dispatch', label: '分派', type: 'primary', onClick: () => openDispatchDialog('dispatch', row) } : null,
  row.canEdit === true && row.status === '2' ? { key: 'transfer', label: '转派', onClick: () => openDispatchDialog('transfer', row) } : null,
  row.canEdit === true ? { key: 'edit', label: '编辑', onClick: () => rctRef.value.goRoute(row.id, '/ticketManage/form') } : null,
  row.knowledgeArticleId
    ? { key: 'viewKnowledge', label: '查看知识', type: 'primary', onClick: () => openKnowledgeDetail(row.knowledgeArticleId) }
    : canArticleAdd.value
      ? { key: 'publishKnowledge', label: '转知识', type: 'primary', onClick: () => handlePublishKnowledge(row) }
      : null,
  row.knowledgeArticleId && canArticleAdd.value
    ? { key: 'republishKnowledge', label: '重新沉淀', onClick: () => handlePublishKnowledge(row) }
    : null,
  row.canEdit === true && canSubmitTicketApproval(row) ? { key: 'submitApproval', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  row.canDelete === true ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="ticket-index-page">
    <RequestChartTable ref="rctRef" class="ticket-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true" @selectionChange="handleSelectionChange">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.title" label="工单标题" prop="title" />
              <BaSelect v-model="query.type" filterable label="类型" prop="type">
                <el-option v-for="(value, key) of type" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-model="query.status" filterable label="状态" prop="status">
                <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-model="query.knowledgeLinked" filterable label="知识回流" prop="knowledgeLinked">
                <el-option label="已关联" value="1"></el-option>
                <el-option label="未关联" value="0"></el-option>
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="ticket-index-operation">
          <div class="ticket-index-operation__left">
            <el-button v-if="canTicketCreate" type="primary" @click="rctRef.goRoute(getProjectScopedCreateQuery(), '/ticketManage/form')">新增工单</el-button>
            <el-button v-if="canTicketBatchDispatch" :disabled="!selectedIds.length" @click="openDispatchDialog('batchDispatch')">批量分派</el-button>
            <el-button @click="exportTicketList">导出</el-button>
          </div>
          <el-button v-if="canTicketBatchDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="工单标题" prop="title" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="类型" prop="type" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '1' ? 'danger' : row.type === '2' ? 'primary' : 'info'" size="small">
              {{ type[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" prop="submitter.nickname" width="100" />
        <el-table-column label="处理人" prop="handler.nickname" width="100" />
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '4' ? 'success' : row.status === '3' ? 'warning' : row.status === '2' ? 'primary' : 'info'" 
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="110">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '未提交审批') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="知识回流" width="100"><template #default="{ row }"><el-tag :type="row.knowledgeLinked === '1' ? 'success' : 'info'" size="small">{{ row.knowledgeLinked === '1' ? '已关联' : '未关联' }}</el-tag></template></el-table-column>
        <el-table-column label="知识文章" width="120"><template #default="{ row }"><el-button v-if="row.knowledgeArticleId" link type="primary" @click="router.push({ path: '/content/articleManage/view', query: { id: row.knowledgeArticleId } })">查看知识</el-button><span v-else>-</span></template></el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <el-dialog v-model="dispatchDialogVisible" :title="{ dispatch: '分派工单', transfer: '转派工单', batchDispatch: '批量分派工单' }[dispatchDialogMode] || '工单分派'" width="520px" @closed="closeDispatchDialog">
      <el-form label-width="90px">
        <el-form-item label="处理人">
          <UserSelect v-model="dispatchForm.handlerId" placeholder="请选择处理人" clearable />
        </el-form-item>
        <div v-if="dispatchDialogMode === 'batchDispatch'" class="dispatch-dialog-tip">
          本次将处理 {{ getBatchDispatchableIds().length }} 条可分派工单，非待分派或无权限工单会自动跳过。
        </div>
      </el-form>
      <template #footer>
        <el-button @click="closeDispatchDialog">取消</el-button>
        <el-button type="primary" :loading="dispatchDialogLoading" @click="submitDispatchDialog">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ticket-index-page {
  min-height: 100%;
}

.ticket-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.ticket-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ticket-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ticket-index-panel :deep(.el-table__header-wrapper),
.ticket-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.dispatch-dialog-tip {
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  line-height: 1.6;
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

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-grid :deep(.el-form-item) {
  display: flex;
  width: 100%;
  margin-bottom: 0;
}

.query-grid :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input) {
  width: 100%;
  flex: 1;
}

.advanced-filter-toggle {
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ticket-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .ticket-index-operation,
  .ticket-index-operation__left {
    align-items: stretch;
  }
}
</style>
