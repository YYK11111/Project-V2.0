<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as api from './api'
import { useUserStore } from '@/stores/user'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const userStore = useUserStore()
const currentUserId = userStore.id
const params = ref({ status: '', mode: 'participant' })
const rctRef = ref()
const route = useRoute()
const canWorkflowInstanceGetOne = computed(() => checkPermi(['business/workflow/instances/getOne']))
const canWorkflowInstanceCancel = computed(() => checkPermi(['business/workflow/instances/cancel']))
const canWorkflowInstanceWithdraw = computed(() => checkPermi(['business/workflow/instances/withdraw']))

const getButtons = (row: any) => [
  { key: 'detail', label: '详情', disabled: !canWorkflowInstanceGetOne.value, onClick: () => viewDetail(row) },
  { key: 'cancel', label: '终止', type: 'warning', show: canWorkflowInstanceCancel.value && row.status === '1', onClick: () => handleCancel(row) },
  { key: 'withdraw', label: '撤回', danger: true, show: canWorkflowInstanceWithdraw.value && row.status === '1' && row.starterId === currentUserId, onClick: () => handleWithdraw(row) },
]

const detailVisible = ref(false)
const detailTab = ref('info')
const currentInstance = ref<any>(null)
const historyList = ref<any[]>([])

const cancelVisible = ref(false)
const currentCancelInstance = ref<any>(null)
const cancelForm = reactive({ reason: '' })

const withdrawVisible = ref(false)
const currentWithdrawInstance = ref<any>(null)
const withdrawForm = reactive({ comment: '' })

const viewDetail = async (row: any) => {
  if (!canWorkflowInstanceGetOne.value) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  const res = await api.getWorkflowInstance(row.id)
  currentInstance.value = res.data
  detailTab.value = 'info'
  detailVisible.value = true
  const historyRes = await api.getWorkflowHistory(row.id)
  historyList.value = historyRes.data || []
}

const getHistoryItemType = (action: string) => {
  const types: Record<string, string> = { '1': 'success', '2': 'danger', '3': 'warning', '4': 'info', '5': 'primary', '6': 'danger' }
  return types[action] || 'info'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = { '1': '同意', '2': '拒绝', '3': '撤回', '4': '转交', '5': '加签', '6': '终止', 'execute': '执行' }
  return texts[action] || action
}

const handleCancel = (row: any) => { currentCancelInstance.value = row; cancelForm.reason = ''; cancelVisible.value = true }
const submitCancel = () => api.cancelWorkflowInstance(currentCancelInstance.value.id, { reason: cancelForm.reason }).then(() => { ElMessage.success('流程已终止'); cancelVisible.value = false; rctRef.value.getList() })

const handleWithdraw = (row: any) => { currentWithdrawInstance.value = row; withdrawForm.comment = ''; withdrawVisible.value = true }
const submitWithdraw = () => api.withdrawWorkflow(currentWithdrawInstance.value.id, { comment: withdrawForm.comment }).then(() => { ElMessage.success('流程已撤回'); withdrawVisible.value = false; rctRef.value.getList() })

onMounted(async () => {
  const highlightId = route.query.highlight
  if (!highlightId) return
  try {
    const res = await api.getWorkflowInstance(String(highlightId))
    currentInstance.value = res.data
    detailTab.value = 'info'
    detailVisible.value = true
    const historyRes = await api.getWorkflowHistory(String(highlightId))
    historyList.value = historyRes.data || []
  } catch (error) {
    console.warn('打开流程实例详情失败', error)
  }
})
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :params="params" :request="api.getWorkflowInstances">
      <template #query="{ query }">
        <BaSelect v-model="query.mode" label="查看范围" prop="mode">
          <el-option label="我参与的" value="participant" />
          <el-option label="我发起的" value="starter" />
        </BaSelect>
        <BaSelect v-model="query.status" label="状态" prop="status" isAll>
          <el-option label="进行中" value="1" /><el-option label="已完成" value="2" /><el-option label="已取消" value="3" />
        </BaSelect>
      </template>
      <template #table>
        <el-table-column prop="definitionCode" label="流程编码" width="120" />
        <el-table-column prop="businessType" label="业务对象" width="100" />
        <el-table-column prop="businessTitle" label="业务标题" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column prop="businessCode" label="业务编号" width="160" :show-overflow-tooltip="true" />
        <el-table-column prop="businessKey" label="业务单号" width="180" />
        <el-table-column prop="starterId" label="发起人ID" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'warning' : row.status === '2' ? 'success' : 'info'">
              {{ row.status === '1' ? '进行中' : row.status === '2' ? '已完成' : row.status === '3' ? '已取消' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
      </template>
      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog v-model="detailVisible" title="流程实例详情" width="80%">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="info">
          <el-descriptions :column="2" border v-if="currentInstance">
            <el-descriptions-item label="实例ID">{{ currentInstance.id }}</el-descriptions-item>
            <el-descriptions-item label="流程编码">{{ currentInstance.definitionCode }}</el-descriptions-item>
            <el-descriptions-item label="业务对象">{{ currentInstance.businessType }}</el-descriptions-item>
            <el-descriptions-item label="业务标题">{{ currentInstance.businessTitle || '-' }}</el-descriptions-item>
            <el-descriptions-item label="业务单号">{{ currentInstance.businessKey }}</el-descriptions-item>
            <el-descriptions-item label="业务编号">{{ currentInstance.businessCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发起人ID">{{ currentInstance.starterId }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentInstance.status === '1' ? 'warning' : currentInstance.status === '2' ? 'success' : 'info'">
                {{ currentInstance.status === '1' ? '进行中' : currentInstance.status === '2' ? '已完成' : '已取消' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ currentInstance.startTime }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentInstance.endTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ currentInstance.duration ? currentInstance.duration + 'ms' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程变量" :span="2"><pre class="code-block">{{ JSON.stringify(currentInstance.variables, null, 2) }}</pre></el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="审批历史" name="history">
          <el-timeline v-if="historyList.length > 0">
            <el-timeline-item v-for="(item, index) in historyList" :key="index" :timestamp="item.createTime" :type="getHistoryItemType(item.action)" placement="top">
              <el-card>
                <h4>{{ getActionText(item.action) }} - {{ item.nodeName || '流程节点' }}</h4>
                <p v-if="item.operatorId">操作人ID: {{ item.operatorId }}</p>
                <p v-if="item.comment">审批意见: {{ item.comment }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无审批历史" />
        </el-tab-pane>
      </el-tabs>
    </BaDialog>

    <BaDialog v-model="cancelVisible" title="终止流程" width="500" @confirm="submitCancel">
      <template #form><BaInput v-model="cancelForm.reason" prop="reason" type="textarea" label="终止原因" /></template>
    </BaDialog>

    <BaDialog v-model="withdrawVisible" title="撤回流程" width="500" @confirm="submitWithdraw">
      <template #form><BaInput v-model="withdrawForm.comment" prop="comment" type="textarea" label="撤回原因" /></template>
    </BaDialog>
  </div>
</template>

<style scoped>
.code-block { background-color: #f5f7fa; padding: 10px; border-radius: 4px; max-height: 300px; overflow-y: auto; }
</style>
