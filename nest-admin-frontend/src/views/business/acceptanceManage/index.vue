<script setup>
import { getList, del, getResults } from './api'
import TableOperation from '@/components/TableOperation.vue'

const rctRef = ref()
const params = ref({})
const resultMap = ref({})

getResults().then(({ data }) => {
  resultMap.value = data || {}
})

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/acceptanceManage/form') },
  { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/acceptanceManage/form') },
  { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <BaInput v-model="query.title" label="验收标题" prop="title" />
        <BaInput v-model="query.projectId" label="项目ID" prop="projectId" />
        <BaSelect v-model="query.result" label="结果" prop="result">
          <el-option v-for="(label, key) in resultMap" :key="key" :label="label" :value="key" />
        </BaSelect>
      </template>

      <template #operation>
        <el-button type="primary" @click="rctRef.goRoute(null, '/acceptanceManage/form')">新增验收单</el-button>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="验收标题" prop="title" min-width="180" />
        <el-table-column label="项目ID" prop="projectId" width="180" />
        <el-table-column label="验收日期" prop="acceptanceDate" width="140" />
        <el-table-column label="客户验收人" prop="customerApprover" width="140" />
        <el-table-column label="结果" width="120">
          <template #default="{ row }">{{ resultMap[row.result] || '-' }}</template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>
