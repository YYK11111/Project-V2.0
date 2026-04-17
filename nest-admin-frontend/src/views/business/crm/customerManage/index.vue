<script setup>
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, getCustomerTypes, getCustomerLevels, getCustomerStatuses, del, submitApproval } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const customerTypes = ref({})
getCustomerTypes().then(({ data }) => (customerTypes.value = data))

const customerLevels = ref({})
getCustomerLevels().then(({ data }) => (customerLevels.value = data))

const customerStatuses = ref({})
getCustomerStatuses().then(({ data }) => (customerStatuses.value = data))

const rctRef = ref()
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

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/customerManage/form') },
  canCustomerUpdate.value ? { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/crm/customerManage/form') } : null,
  canCustomerSubmitApproval.value && canSubmitCustomerApproval(row) ? { key: 'submit', label: '提交审批', type: 'warning', onClick: () => handleSubmitApproval(row) } : null,
  canCustomerDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
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
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canCustomerAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/crm/customerManage/form')">新增客户</el-button>
          <el-button v-if="canCustomerDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
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
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
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
  </div>
</template>

<style lang="scss" scoped>
.tableOperation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  
  :deep(.el-button) {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 13px;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
