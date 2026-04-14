<script setup>
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, getInteractionTypes, del } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const interactionTypes = ref({})
getInteractionTypes().then(({ data }) => (interactionTypes.value = data))

// 获取客户列表用于筛选
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const rctRef = ref()
const canInteractionAdd = computed(() => checkPermi(['business/crm/interactions/add']))
const canInteractionUpdate = computed(() => checkPermi(['business/crm/interactions/update']))
const canInteractionDelete = computed(() => checkPermi(['business/crm/interactions/delete']))

const getButtons = (row) => [
  { key: 'edit', label: '修改', type: 'primary', disabled: !canInteractionUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/crm/interaction/form') },
  { key: 'delete', label: '删除', danger: true, disabled: !canInteractionDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaSelect v-model="query.customerId" filterable label="客户" prop="customerId">
          <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
        </BaSelect>
        <BaSelect v-model="query.interactionType" filterable label="互动类型" prop="interactionType">
          <el-option v-for="(value, key) of interactionTypes" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaDateRange v-model="query.interactionTime" label="互动时间" prop="interactionTime"></BaDateRange>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canInteractionAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/crm/interaction/form')">新增互动记录</el-button>
          <el-button v-if="canInteractionDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="客户名称" prop="customer.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="互动类型" prop="interactionType" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ interactionTypes[row.interactionType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="互动内容" prop="content" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column label="互动时间" prop="interactionTime" width="160" />
        <el-table-column label="互动人" prop="operatorName" width="100" />
        <el-table-column label="下次跟进时间" prop="nextFollowTime" width="160" />
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
