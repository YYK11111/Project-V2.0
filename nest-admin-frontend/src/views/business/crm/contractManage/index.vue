<script setup>
import { ref } from 'vue'
import { getList, getContractStatuses, del } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const contractStatuses = ref({})
getContractStatuses().then(({ data }) => (contractStatuses.value = data))

// 获取客户列表用于筛选
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const rctRef = ref()
const canContractAdd = computed(() => checkPermi(['business/crm/contracts/add']))
const canContractUpdate = computed(() => checkPermi(['business/crm/contracts/update']))
const canContractDelete = computed(() => checkPermi(['business/crm/contracts/delete']))

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/contractManage/form') },
  canContractUpdate.value ? { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/crm/contractManage/form') } : null,
  canContractDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="contract-index-page">
    <RequestChartTable ref="rctRef" class="contract-index-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="合同名称" prop="name"></BaInput>
        <BaSelect v-model="query.customerId" filterable label="客户" prop="customerId">
          <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
        </BaSelect>
        <BaSelect v-model="query.status" filterable label="合同状态" prop="status">
          <el-option v-for="(value, key) of contractStatuses" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="contract-index-operation">
          <div class="contract-index-operation__left">
            <el-button v-if="canContractAdd" type="primary" @click="rctRef.goRoute(null, '/crm/contractManage/form')">新增合同</el-button>
          </div>
          <el-button v-if="canContractDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="合同名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="合同编号" prop="code" width="150" />
        <el-table-column label="客户名称" prop="customer.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="合同金额(元)" prop="amount" width="130" />
        <el-table-column label="已收款(元)" prop="receivedAmount" width="130" />
        <el-table-column label="签订时间" prop="signingDate" width="160" />
        <el-table-column label="合同状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : row.status === '2' ? 'warning' : 'info'" size="small">
              {{ contractStatuses[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="合同负责人" prop="owner.nickname" width="100" />
        <el-table-column label="开始时间" prop="startDate" width="160" />
        <el-table-column label="结束时间" prop="endDate" width="160" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.contract-index-page {
  min-height: 100%;
}

.contract-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.contract-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.contract-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.contract-index-panel :deep(.el-table__header-wrapper),
.contract-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .contract-index-panel {
    padding-top: 18px;
  }

  .contract-index-operation,
  .contract-index-operation__left {
    align-items: stretch;
  }
}
</style>
