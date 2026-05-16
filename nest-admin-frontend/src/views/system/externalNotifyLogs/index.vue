<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { checkPermi } from '@/utils/permission'
import {
  getFeishuCompensationStatus,
  getList,
  getTraceLogs,
  runFeishuPendingDeliveryCompensation,
} from './api'
import TableOperation from '@/components/TableOperation.vue'

const detailVisible = ref(false)
const currentRow = ref<any>({})
const traceList = ref<any[]>([])
const traceLoading = ref(false)
const traceError = ref('')
const compensationSummary = ref<any>(null)
const compensationLoading = ref(false)
const activePlatform = ref('system')
const canList = computed(() => checkPermi(['system/externalNotifyLogs/list']))
const canRunCompensation = computed(() => checkPermi(['system/scheduledJobs/run']))

const platformOptions = [
  { label: '系统内消息', value: 'system' },
  { label: '飞书', value: 'feishu' },
  { label: '钉钉', value: 'dingtalk' },
]
const sendStatusMap = {
  1: { label: '成功', type: 'success' },
  0: { label: '失败', type: 'danger' },
  2: { label: '跳过', type: 'info' },
  3: { label: '待处理', type: 'warning' },
}
const operationTypeMap = {
  create_message: '创建消息',
  send_card: '发送卡片',
  send_text: '发送文本',
  update_card_status: '更新卡片状态',
}

const getButtons = (row: any) => [
  { key: 'view', label: '查看', type: 'primary', onClick: () => openDetail(row) },
]

function getCurrentList(data: any) {
  return getList({
    ...data,
    platform: activePlatform.value,
  })
}

function getPlatformLabel(platform: string) {
  return platformOptions.find((item) => item.value === platform)?.label || platform || '-'
}

function getOperationTypeLabel(operationType: string) {
  return operationTypeMap[operationType] || operationType || '-'
}

function openDetail(row: any) {
  currentRow.value = row
  detailVisible.value = true
  loadTraceLogs(row.messageId)
}

function formatJson(value: any) {
  if (!value) return '-'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function loadTraceLogs(messageId?: string) {
  traceLoading.value = true
  traceError.value = ''
  traceList.value = []
  try {
    if (!messageId) return
    const result = await getTraceLogs(messageId)
    traceList.value = result?.logs || result?.data?.logs || []
  } catch (error) {
    traceError.value = error instanceof Error ? error.message : '统一消息追踪加载失败'
  } finally {
    traceLoading.value = false
  }
}

async function loadCompensationStatus() {
  compensationLoading.value = true
  try {
    const result = await getFeishuCompensationStatus()
    compensationSummary.value = result?.data || result
  } finally {
    compensationLoading.value = false
  }
}

async function handleRunCompensation() {
  await runFeishuPendingDeliveryCompensation()
  ElMessage.success('补偿任务已提交')
  await loadCompensationStatus()
}

onMounted(() => {
  loadCompensationStatus()
})
</script>

<template>
  <div class="external-notify-log-page business-list-page">
    <div v-if="canList" class="external-notify-log-panel business-list-panel">
      <el-tabs v-model="activePlatform" class="notify-log-tabs">
        <el-tab-pane label="系统内消息" name="system" />
        <el-tab-pane label="飞书" name="feishu" />
        <el-tab-pane label="钉钉" name="dingtalk" />
      </el-tabs>

      <div class="external-notify-summary">
        <div class="external-notify-summary__title">补偿概览</div>
        <div v-loading="compensationLoading" class="external-notify-summary__content">
          <div class="external-notify-summary__item">
            <span>待补偿数量</span>
            <strong>{{ compensationSummary?.pendingCount ?? 0 }}</strong>
          </div>
          <div class="external-notify-summary__item">
            <span>最近失败原因</span>
            <strong>{{ compensationSummary?.latestFailedLog?.errorMessage || '-' }}</strong>
          </div>
          <el-button v-if="canRunCompensation" type="primary" plain @click="handleRunCompensation">手动补偿</el-button>
        </div>
      </div>

      <RequestChartTable :key="activePlatform" :request="getCurrentList" :is-selection="false">
        <template #query="{ query }">
          <div class="query-sections">
            <div class="query-section query-section--primary">
              <div class="query-grid">
                <BaInput v-model="query.notificationId" label="通知ID" prop="notificationId" />
                <BaSelect v-model="query.sendStatus" label="发送状态" prop="sendStatus" isAll>
                  <el-option v-for="(item, key) in sendStatusMap" :key="key" :label="item.label" :value="key" />
                </BaSelect>
                <BaSelect v-if="activePlatform !== 'system'" v-model="query.operationType" label="操作类型" prop="operationType" isAll>
                  <el-option v-for="(label, key) in operationTypeMap" :key="key" :label="label" :value="key" />
                </BaSelect>
                <BaInput v-model="query.receiverId" label="接收人ID" prop="receiverId" />
                <BaInput v-model="query.templateKey" label="模板" prop="templateKey" />
              </div>
            </div>
          </div>
        </template>

        <template #table>
          <el-table-column type="index" label="序号" width="70" />
          <el-table-column prop="notificationId" label="通知ID" min-width="180" show-overflow-tooltip />
          <el-table-column prop="sendStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="sendStatusMap[row.sendStatus]?.type || 'info'" size="small" effect="plain">{{ sendStatusMap[row.sendStatus]?.label || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="receiverId" label="接收人ID" width="110" />
          <el-table-column v-if="activePlatform !== 'system'" prop="operationType" label="操作类型" width="130">
            <template #default="{ row }">{{ getOperationTypeLabel(row.operationType) }}</template>
          </el-table-column>
          <el-table-column prop="templateKey" label="模板" width="130" />
          <el-table-column prop="messageId" label="站内消息ID" width="120" />
          <el-table-column v-if="activePlatform !== 'system'" prop="externalUserId" label="外部用户ID" min-width="160" show-overflow-tooltip />
          <el-table-column v-if="activePlatform !== 'system'" prop="externalMessageId" label="外部消息ID" min-width="160" show-overflow-tooltip />
          <el-table-column v-if="activePlatform !== 'system'" prop="retryCount" label="重试次数" width="100" />
          <el-table-column prop="errorMessage" label="错误信息" min-width="220" show-overflow-tooltip />
          <el-table-column prop="createTime" label="发送时间" width="170" />
        </template>

        <template #tableOperation="{ row }">
          <TableOperation :buttons="getButtons(row)" :row="row" />
        </template>
      </RequestChartTable>
    </div>

    <el-empty v-else description="当前操作没有权限" />

    <el-drawer v-model="detailVisible" title="发送日志详情" size="620px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="平台">{{ getPlatformLabel(currentRow.platform) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ sendStatusMap[currentRow.sendStatus]?.label || '-' }}</el-descriptions-item>
        <el-descriptions-item label="通知ID">{{ currentRow.notificationId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getOperationTypeLabel(currentRow.operationType) }}</el-descriptions-item>
        <el-descriptions-item label="接收人ID">{{ currentRow.receiverId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部用户ID">{{ currentRow.externalUserId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部消息ID">{{ currentRow.externalMessageId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ currentRow.retryCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ currentRow.errorMessage || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="log-detail-block">
        <div class="log-detail-title">请求摘要</div>
        <pre>{{ formatJson(currentRow.requestPayload) }}</pre>
      </div>
      <div class="log-detail-block">
        <div class="log-detail-title">响应摘要</div>
        <pre>{{ formatJson(currentRow.responsePayload) }}</pre>
      </div>

      <div class="log-detail-block">
        <div class="log-detail-title">统一消息追踪</div>
        <div v-loading="traceLoading" class="trace-list">
          <div v-if="traceError" class="trace-error">{{ traceError }}</div>
          <template v-else>
            <div v-for="item in traceList" :key="item.id || `${item.platform}-${item.operationType}-${item.createTime}`" class="trace-item">
              <div class="trace-item__head">
                <strong>{{ item.platform || '-' }}</strong>
                <span>{{ item.operationType || '-' }}</span>
                <span>{{ item.sendStatus || '-' }}</span>
                <span>{{ item.createTime || '-' }}</span>
              </div>
              <div class="trace-item__body">
                <span>messageId: {{ item.messageId || '-' }}</span>
                <span>externalMessageId: {{ item.externalMessageId || '-' }}</span>
                <span>receiverId: {{ item.receiverId || '-' }}</span>
                <span>errorMessage: {{ item.errorMessage || '-' }}</span>
              </div>
            </div>
            <div v-if="!traceList.length" class="trace-empty">暂无追踪记录</div>
          </template>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.log-detail-block {
  margin-top: 16px;
}

.log-detail-title {
  margin-bottom: 8px;
  font-weight: 600;
}

.external-notify-summary {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.external-notify-summary__title {
  margin-bottom: 12px;
  font-weight: 600;
}

.external-notify-summary__content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.external-notify-summary__item {
  display: grid;
  gap: 4px;
  min-width: 180px;
}

.external-notify-summary__item span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.trace-list {
  display: grid;
  gap: 12px;
}

.trace-item {
  padding: 12px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.trace-item__head {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.trace-item__body {
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.trace-empty,
.trace-error {
  padding: 12px;
  color: var(--el-text-color-secondary);
}

pre {
  max-height: 280px;
  overflow: auto;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
