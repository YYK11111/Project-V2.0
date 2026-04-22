<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getList, getType, getStatus, del, publishKnowledge, submitApproval } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import { downloadCsv } from '@/utils/csv'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'

const router = useRouter()
const params = ref({})

const type = ref({})
getType().then(({ data }) => (type.value = data))

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const rctRef = ref()
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))
const canTicketDelete = computed(() => checkPermi(['business/tickets/delete']))
const canTicketSubmitApproval = computed(() => checkPermi(['business/tickets/update']))
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))

async function handleSubmitApproval(row) {
  if (!canTicketSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
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
      ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批'),
      row.knowledgeLinked === '1' ? '已关联' : '未关联',
      row.knowledgeArticleId || '-',
      row.createTime || '-',
    ])),
  ]
  downloadCsv('工单列表导出.csv', rows)
}

const canSubmitTicketApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/ticketManage/form') },
  canTicketUpdate.value && row.canEdit !== false ? { key: 'edit', label: '修改', onClick: () => rctRef.value.goRoute(row.id, '/ticketManage/form') } : null,
  row.knowledgeArticleId
    ? { key: 'viewKnowledge', label: '查看知识', type: 'primary', onClick: () => openKnowledgeDetail(row.knowledgeArticleId) }
    : canArticleAdd.value
      ? { key: 'publishKnowledge', label: '转知识', type: 'primary', onClick: () => handlePublishKnowledge(row) }
      : null,
  row.knowledgeArticleId && canArticleAdd.value
    ? { key: 'republishKnowledge', label: '重新沉淀', onClick: () => handlePublishKnowledge(row) }
    : null,
  canTicketSubmitApproval.value && canSubmitTicketApproval(row) ? { key: 'submitApproval', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  canTicketDelete.value && row.canDelete !== false ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="ticket-index-page">
    <RequestChartTable ref="rctRef" class="ticket-index-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
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
      </template>

      <template #operation="{ selectedIds }">
        <div class="ticket-index-operation">
          <div class="ticket-index-operation__left">
            <el-button v-if="canTicketAdd" type="primary" @click="rctRef.goRoute(null, '/ticketManage/form')">新增工单</el-button>
            <el-button @click="exportTicketList">导出</el-button>
          </div>
          <el-button v-if="canTicketDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
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
              :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'info'" 
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="110">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
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

  .ticket-index-operation,
  .ticket-index-operation__left {
    align-items: stretch;
  }
}
</style>
