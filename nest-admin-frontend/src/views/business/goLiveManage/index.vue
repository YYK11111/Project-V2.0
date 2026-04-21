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
        <BaInput v-model="query.title" label="上线标题" prop="title" />
        <BaInput v-model="query.projectId" label="项目ID" prop="projectId" />
        <BaSelect v-model="query.status" label="状态" prop="status">
          <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
        </BaSelect>
      </template>

      <template #operation>
        <el-button type="primary" @click="rctRef.goRoute(null, '/goLiveManage/form')">新增上线单</el-button>
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
