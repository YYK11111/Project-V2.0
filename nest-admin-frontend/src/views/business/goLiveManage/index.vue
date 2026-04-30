<script setup>
import { getList, del, getStatuses } from './api'
import TableOperation from '@/components/TableOperation.vue'

const rctRef = ref()
const params = ref({})
const statusMap = ref({})

getStatuses().then(({ data }) => {
  statusMap.value = data || {}
})

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/goLiveManage/form') },
  { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/goLiveManage/form') },
  { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.title" label="上线标题" prop="title" />
              <BaInput v-model="query.projectId" label="项目ID" prop="projectId" />
              <BaSelect v-model="query.status" label="状态" prop="status">
                <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="closure-index-operation">
          <div class="closure-index-operation__left">
            <el-button type="primary" @click="rctRef.goRoute(null, '/goLiveManage/form')">新增上线单</el-button>
          </div>
          <el-button :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="上线标题" prop="title" min-width="180" />
        <el-table-column label="项目ID" prop="projectId" width="180" />
        <el-table-column label="计划上线" prop="plannedGoLiveTime" width="140" />
        <el-table-column label="实际上线" prop="actualGoLiveTime" width="140" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">{{ statusMap[row.status] || '-' }}</template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
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

.closure-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.closure-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .closure-index-operation,
  .closure-index-operation__left {
    align-items: stretch;
  }
}
</style>
