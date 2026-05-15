<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from 'vue'
import { checkPermi } from '@/utils/permission'
import { getList } from './api'
import TableOperation from '@/components/TableOperation.vue'

const detailVisible = ref(false)
const currentRow = ref<any>({})
const activePlatform = ref('system')
const canList = computed(() => checkPermi(['system/externalNotifyLogs/list']))

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
  { key: 'detail', label: '详情', type: 'primary', onClick: () => openDetail(row) },
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
}

function formatJson(value: any) {
  if (!value) return '-'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

<template>
  <div class="external-notify-log-page business-list-page">
    <div v-if="canList" class="external-notify-log-panel business-list-panel">
      <el-tabs v-model="activePlatform" class="notify-log-tabs">
        <el-tab-pane label="系统内消息" name="system" />
        <el-tab-pane label="飞书" name="feishu" />
        <el-tab-pane label="钉钉" name="dingtalk" />
      </el-tabs>

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
