<script setup>
import { ref } from 'vue'
import { getList, getType, getStatus, del, submitApproval } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const type = ref({})
getType().then(({ data }) => (type.value = data))

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const rctRef = ref()
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))
const canTicketDelete = computed(() => checkPermi(['business/tickets/delete']))
const canTicketSubmitApproval = computed(() => checkPermi(['business/tickets/update']))

async function handleSubmitApproval(row) {
  if (!canTicketSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该工单审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}

const canSubmitTicketApproval = (row) => row.status === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))

const getButtons = (row) => [
  { key: 'view', label: '查看', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/ticketManage/form') },
  { key: 'edit', label: '修改', disabled: !canTicketUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/ticketManage/form') },
  { key: 'submitApproval', label: '提交审批', type: 'warning', disabled: !canTicketSubmitApproval.value || !canSubmitTicketApproval(row), onClick: () => handleSubmitApproval(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canTicketDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.title" label="工单标题" prop="title"></BaInput>
        <BaSelect v-model="query.type" filterable label="类型" prop="type">
          <el-option v-for="(value, key) of type" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaSelect v-model="query.status" filterable label="状态" prop="status">
          <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canTicketAdd" type="primary" @click="rctRef.goRoute(null, '/ticketManage/form')">新增工单</el-button>
          <el-button v-if="canTicketDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="工单标题" prop="title" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="类型" prop="type" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '1' ? 'danger' : row.type === '2' ? 'primary' : 'info'" size="small">
              {{ type[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" prop="submitter.nickname" width="100" />
        <el-table-column label="处理人" prop="handler.nickname" width="100" />
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'info'" 
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="110">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" prop="createTime" width="160" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>
