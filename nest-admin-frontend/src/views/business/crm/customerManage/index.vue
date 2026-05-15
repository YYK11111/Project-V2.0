<script setup>
import { ref } from 'vue'
import { getList, getCustomerTypes, getCustomerLevels, getCustomerStatuses, del, submitApproval, grantCustomerViewAccess, revokeCustomerViewAccess, getCustomerAuthUsers } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import UserSelect from '@/components/UserSelect.vue'

const params = ref({})

const customerTypes = ref({})
getCustomerTypes().then(({ data }) => (customerTypes.value = data))

const customerLevels = ref({})
getCustomerLevels().then(({ data }) => (customerLevels.value = data))

const customerStatuses = ref({})
getCustomerStatuses().then(({ data }) => (customerStatuses.value = data))

const rctRef = ref()
const shareDialogVisible = ref(false)
const shareCustomer = ref(null)
const shareUserIds = ref([])
const originalShareUserIds = ref([])
const canCustomerAdd = computed(() => checkPermi(['business/crm/customers/add']))
const canCustomerUpdate = computed(() => checkPermi(['business/crm/customers/update']))
const canCustomerDelete = computed(() => checkPermi(['business/crm/customers/delete']))
const canCustomerSubmitApproval = computed(() => checkPermi(['business/crm/customers/update']))

async function handleSubmitApproval(row) {
  if (!canCustomerSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该客户审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

const canSubmitCustomerApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

async function handleOpenShareDialog(row) {
  if (!canCustomerUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  shareCustomer.value = row
  shareUserIds.value = []
  shareDialogVisible.value = true
  const res = await getCustomerAuthUsers(row.id)
  const list = res?.data?.data || res?.data || []
  shareUserIds.value = (Array.isArray(list) ? list : []).map((item) => item.userId).filter(Boolean)
  originalShareUserIds.value = [...shareUserIds.value]
}

async function handleGrantViewAccess() {
  if (!shareCustomer.value?.id) return
  const nextUserIds = Array.from(new Set(shareUserIds.value.filter(Boolean)))
  const removedUserIds = originalShareUserIds.value.filter((userId) => !nextUserIds.includes(userId))
  if (nextUserIds.length) {
    await grantCustomerViewAccess(shareCustomer.value.id, nextUserIds)
  }
  for (const userId of removedUserIds) {
    await revokeCustomerViewAccess(shareCustomer.value.id, userId)
  }
  $sdk.msgSuccess('授权成功')
  shareDialogVisible.value = false
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/customerManage/form') },
  canCustomerUpdate.value ? { key: 'edit', label: '编辑', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/crm/customerManage/form') } : null,
  canCustomerUpdate.value ? { key: 'share', label: '授权查看', type: 'success', onClick: () => handleOpenShareDialog(row) } : null,
  canCustomerSubmitApproval.value && canSubmitCustomerApproval(row) ? { key: 'submit', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  canCustomerDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="customer-index-page">
    <RequestChartTable ref="rctRef" class="customer-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.name" label="客户名称" prop="name"></BaInput>
              <BaSelect v-model="query.type" filterable label="客户类型" prop="type">
                <el-option v-for="(value, key) of customerTypes" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-model="query.level" filterable label="客户等级" prop="level">
                <el-option v-for="(value, key) of customerLevels" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-model="query.status" filterable label="客户状态" prop="status">
                <el-option v-for="(value, key) of customerStatuses" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="customer-index-operation">
          <div class="customer-index-operation__left">
            <el-button v-if="canCustomerAdd" type="primary" @click="rctRef.goRoute(null, '/crm/customerManage/form')">新增客户</el-button>
          </div>
          <el-button v-if="canCustomerDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="客户名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="客户简称" prop="shortName" width="120" />
        <el-table-column label="客户编号" prop="code" width="150" />
        <el-table-column label="联系人" prop="contactPerson" width="100" />
        <el-table-column label="联系电话" prop="contactPhone" width="130" />
        <el-table-column label="客户类型" prop="type" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ customerTypes[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户等级" prop="level" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === '1' ? 'danger' : row.level === '2' ? 'warning' : 'info'" size="small">
              {{ customerLevels[row.level] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '3' ? 'success' : row.status === '2' ? 'primary' : 'info'" size="small">
              {{ customerStatuses[row.status] }}
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
        <el-table-column label="所属行业" prop="industry" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="客户价值(万元)" prop="customerValue" width="120" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <el-dialog v-model="shareDialogVisible" title="授权查看客户" width="720px" append-to-body>
      <div class="customer-share-dialog">
        <div class="customer-share-dialog__target">
          <span class="customer-share-dialog__label">客户</span>
          <strong>{{ shareCustomer?.name || '-' }}</strong>
        </div>
        <UserSelect v-model="shareUserIds" multiple filter-dept placeholder="请选择可查看人员" />
      </div>
      <template #footer>
        <el-button @click="shareDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGrantViewAccess">确认授权</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.customer-index-page {
  min-height: 100%;
}

.customer-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.customer-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.customer-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.customer-share-dialog {
  display: grid;
  gap: 16px;
}

.customer-share-dialog__target {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.customer-share-dialog__label {
  color: var(--el-text-color-secondary);
}

.customer-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.customer-index-operation :deep(.el-button) {
  min-width: 112px;
}

.customer-index-panel :deep(.el-table__header-wrapper),
.customer-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.customer-index-panel :deep(.el-tag) {
  font-weight: 500;
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

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .customer-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .customer-index-operation,
  .customer-index-operation__left {
    align-items: stretch;
  }
}
</style>
