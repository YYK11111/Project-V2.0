<script setup>
import { ref } from 'vue'
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
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/crm/interactionManage/form') },
  canInteractionUpdate.value ? { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/crm/interactionManage/form') } : null,
  canInteractionDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="interaction-index-page">
    <RequestChartTable ref="rctRef" class="interaction-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaSelect v-model="query.customerId" filterable label="客户" prop="customerId">
                <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
              </BaSelect>
              <BaSelect v-model="query.interactionType" filterable label="互动类型" prop="interactionType">
                <el-option v-for="(value, key) of interactionTypes" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaDateRange v-model="query.interactionTime" label="互动时间" prop="interactionTime"></BaDateRange>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="interaction-index-operation">
          <div class="interaction-index-operation__left">
            <el-button v-if="canInteractionAdd" type="primary" @click="rctRef.goRoute(null, '/crm/interactionManage/form')">新增互动记录</el-button>
          </div>
          <el-button v-if="canInteractionDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
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
.interaction-index-page {
  min-height: 100%;
}

.interaction-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.interaction-index-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.interaction-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.interaction-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.interaction-index-operation :deep(.el-button) {
  min-width: 112px;
}

.interaction-index-panel :deep(.el-table__header-wrapper),
.interaction-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.interaction-index-panel :deep(.el-tag) {
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
.query-grid :deep(.el-input),
.query-grid :deep(.el-date-editor) {
  width: 100%;
  flex: 1;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .interaction-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .interaction-index-operation,
  .interaction-index-operation__left {
    align-items: stretch;
  }
}
</style>
