<script setup>
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, getStages, del } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const stages = ref({})
getStages().then(({ data }) => (stages.value = data))

// 获取客户列表用于筛选
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const rctRef = ref()
const canOpportunityAdd = computed(() => checkPermi(['business/crm/opportunities/add']))
const canOpportunityUpdate = computed(() => checkPermi(['business/crm/opportunities/update']))
const canOpportunityDelete = computed(() => checkPermi(['business/crm/opportunities/delete']))

const getButtons = (row) => [
  { key: 'view', label: '查看', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/opportunityManage/form') },
  { key: 'edit', label: '修改', type: 'primary', disabled: !canOpportunityUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/crm/opportunityManage/form') },
  { key: 'delete', label: '删除', danger: true, disabled: !canOpportunityDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="机会名称" prop="name"></BaInput>
        <BaSelect v-model="query.customerId" filterable label="客户" prop="customerId">
          <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
        </BaSelect>
        <BaSelect v-model="query.stage" filterable label="销售阶段" prop="stage">
          <el-option v-for="(value, key) of stages" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canOpportunityAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/crm/opportunityManage/form')">新增销售机会</el-button>
          <el-button v-if="canOpportunityDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="机会名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="机会编号" prop="code" width="150" />
        <el-table-column label="客户名称" prop="customer.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="预期金额(元)" prop="expectedAmount" width="130" />
        <el-table-column label="销售阶段" prop="stage" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ stages[row.stage] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成功概率" prop="successRate" width="100">
          <template #default="{ row }">
            {{ row.successRate }}%
          </template>
        </el-table-column>
        <el-table-column label="预计成交时间" prop="expectedCloseDate" width="160" />
        <el-table-column label="销售负责人" prop="sales.nickname" width="100" />
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
