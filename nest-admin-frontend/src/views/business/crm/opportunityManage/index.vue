<script setup>
import { ref } from 'vue'
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
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/opportunityManage/form') },
  canOpportunityUpdate.value ? { key: 'edit', label: '编辑', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/crm/opportunityManage/form') } : null,
  canOpportunityDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="opportunity-index-page">
    <RequestChartTable ref="rctRef" class="opportunity-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.name" label="机会名称" prop="name"></BaInput>
              <BaSelect v-model="query.customerId" filterable label="客户" prop="customerId">
                <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
              </BaSelect>
              <BaSelect v-model="query.stage" filterable label="销售阶段" prop="stage">
                <el-option v-for="(value, key) of stages" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="opportunity-index-operation">
          <div class="opportunity-index-operation__left">
            <el-button v-if="canOpportunityAdd" type="primary" @click="rctRef.goRoute(null, '/crm/opportunityManage/form')">新增销售机会</el-button>
          </div>
          <el-button v-if="canOpportunityDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
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
.opportunity-index-page {
  min-height: 100%;
}

.opportunity-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.opportunity-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.opportunity-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.opportunity-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.opportunity-index-operation :deep(.el-button) {
  min-width: 112px;
}

.opportunity-index-panel :deep(.el-table__header-wrapper),
.opportunity-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.opportunity-index-panel :deep(.el-tag) {
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
  .opportunity-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .opportunity-index-operation,
  .opportunity-index-operation__left {
    align-items: stretch;
  }
}
</style>
