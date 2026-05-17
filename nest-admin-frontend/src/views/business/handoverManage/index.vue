<script setup>
import { useRoute } from 'vue-router'
import { getList, del, getStatuses } from './api'
import TableOperation from '@/components/TableOperation.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import { checkPermi } from '@/utils/permission'
import { useProjectScopedActions } from '../projectManage/useProjectScopedActions'

const route = useRoute()
const rctRef = ref()
const params = ref({
  projectId: route.query.projectId || '',
})
const statusMap = ref({})
const canHandoverAdd = computed(() => checkPermi(['business/handover-records/add']))
const canHandoverDelete = computed(() => checkPermi(['business/handover-records/delete']))
const { canCreateProjectScopedRecord, canBatchDeleteProjectScopedRecord, getProjectScopedCreateQuery } = useProjectScopedActions(route)
const canHandoverCreate = computed(() => canCreateProjectScopedRecord(canHandoverAdd.value, 'canManageDelivery'))
const canHandoverBatchDelete = computed(() => canBatchDeleteProjectScopedRecord(canHandoverDelete.value, 'canManageDelivery'))

getStatuses().then(({ data }) => {
  statusMap.value = data || {}
})

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/handoverManage/form') },
  row.canEdit === true ? { key: 'edit', label: '编辑', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/handoverManage/form') } : null,
  row.canDelete === true ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="handover-index-page business-list-page">
    <RequestChartTable class="handover-index-panel business-list-panel" ref="rctRef" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.title" label="交接标题" prop="title" />
              <ProjectSelect v-model="query.projectId" placeholder="请选择所属项目" />
              <BaSelect v-model="query.status" label="状态" prop="status">
                <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="handover-index-operation">
          <div class="handover-index-operation__left">
            <el-button v-if="canHandoverCreate" type="primary" @click="rctRef.goRoute(getProjectScopedCreateQuery(), '/handoverManage/form')">新增运维交接单</el-button>
          </div>
          <el-button v-if="canHandoverBatchDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="交接标题" prop="title" min-width="180" />
        <el-table-column label="所属项目" width="180">
          <template #default="{ row }">{{ row.project?.name || row.projectName || '-' }}</template>
        </el-table-column>
        <el-table-column label="接维对象" prop="handoverTo" width="140" />
        <el-table-column label="交接日期" prop="handoverDate" width="140" />
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
