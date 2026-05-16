<script setup>
import { useRoute } from 'vue-router'
import { getList, del, getStatuses } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import { useProjectScopedActions } from '../projectManage/useProjectScopedActions'

const route = useRoute()
const rctRef = ref()
const params = ref({
  projectId: route.query.projectId || '',
})
const statusMap = ref({})
const canGoLiveAdd = computed(() => checkPermi(['business/go-live-records/add']))
const canGoLiveDelete = computed(() => checkPermi(['business/go-live-records/delete']))
const { canCreateProjectScopedRecord, canBatchDeleteProjectScopedRecord, getProjectScopedCreateQuery } = useProjectScopedActions(route)
const canGoLiveCreate = computed(() => canCreateProjectScopedRecord(canGoLiveAdd.value, 'canManageDelivery'))
const canGoLiveBatchDelete = computed(() => canBatchDeleteProjectScopedRecord(canGoLiveDelete.value, 'canManageDelivery'))

getStatuses().then(({ data }) => {
  statusMap.value = data || {}
})

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/goLiveManage/form') },
  row.canEdit === true ? { key: 'edit', label: '编辑', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/goLiveManage/form') } : null,
  row.canDelete === true ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="go-live-index-page business-list-page">
    <RequestChartTable class="go-live-index-panel business-list-panel" ref="rctRef" :params="params" :request="getList" :is-selection="true">
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
        <div class="go-live-index-operation">
          <div class="go-live-index-operation__left">
            <el-button v-if="canGoLiveCreate" type="primary" @click="rctRef.goRoute(getProjectScopedCreateQuery(), '/goLiveManage/form')">新增上线单</el-button>
          </div>
          <el-button v-if="canGoLiveBatchDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
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
