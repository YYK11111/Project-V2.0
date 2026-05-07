<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { checkPermi } from '@/utils/permission'
import {
  disableScheduledJob,
  enableScheduledJob,
  getScheduledJobLogDetail,
  getScheduledJobLogs,
  getScheduledJobs,
  runScheduledJob,
  type ScheduledJobLogDetail,
  type ScheduledJobItem,
  type ScheduledJobLogItem,
} from './api'

const jobList = ref<ScheduledJobItem[]>([])
const logList = ref<ScheduledJobLogItem[]>([])
const logDetail = ref<ScheduledJobLogDetail | null>(null)
const jobListLoading = ref(false)
const logListLoading = ref(false)
const logDetailLoading = ref(false)
const logDetailVisible = ref(false)
const logDetailError = ref('')
const currentJobKey = ref('')
const canViewLogs = computed(() => checkPermi(['system/scheduledJobs/logs']))
const canRunJob = computed(() => checkPermi(['system/scheduledJobs/run']))
const canEnableJob = computed(() => checkPermi(['system/scheduledJobs/enable']))
const canDisableJob = computed(() => checkPermi(['system/scheduledJobs/disable']))
const drawerSize = computed(() => (window.innerWidth <= 768 ? '100%' : '720px'))

const statusTextMap: Record<string, string> = {
  success: '成功',
  failure: '失败',
  running: '运行中',
}

async function loadJobList() {
  jobListLoading.value = true
  try {
    jobList.value = await getScheduledJobs()
  } finally {
    jobListLoading.value = false
  }
}

async function loadLogList(jobKey = currentJobKey.value) {
  logListLoading.value = true
  currentJobKey.value = jobKey
  try {
    logList.value = await getScheduledJobLogs(jobKey ? { jobKey } : {})
  } finally {
    logListLoading.value = false
  }
}

function getEnabledText(enabled: string) {
  return enabled === '0' ? '停用' : '启用'
}

function getStatusText(status?: string) {
  return status ? (statusTextMap[status] || status) : '--'
}

function getDisplayText(value?: string | number | null) {
  if (value === '' || value === null || value === undefined) {
    return '--'
  }
  return String(value)
}

function formatDetailText(value?: Record<string, unknown> | string | null) {
  if (!value) {
    return '--'
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value, null, 2)
}

async function handleRunJob(row: ScheduledJobItem) {
  await runScheduledJob(row.jobKey)
  ElMessage.success('立即执行请求已提交')
  if (canViewLogs.value) {
    await loadLogList(row.jobKey)
  }
}

async function handleEnableJob(row: ScheduledJobItem) {
  await enableScheduledJob(row.jobKey)
  ElMessage.success('启用成功')
  await loadJobList()
}

async function handleDisableJob(row: ScheduledJobItem) {
  await disableScheduledJob(row.jobKey)
  ElMessage.success('停用成功')
  await loadJobList()
}

async function handleViewLogs(row: ScheduledJobItem) {
  await loadLogList(row.jobKey)
}

async function handleViewLogDetail(row: ScheduledJobLogItem) {
  logDetailVisible.value = true
  logDetailLoading.value = true
  logDetailError.value = ''
  logDetail.value = null
  try {
    logDetail.value = await getScheduledJobLogDetail(String(row.id || ''))
  } catch (error) {
    logDetailError.value = error instanceof Error ? error.message : '日志详情加载失败'
  } finally {
    logDetailLoading.value = false
  }
}

onMounted(async () => {
  await loadJobList()
  if (canViewLogs.value) {
    await loadLogList()
  }
})
</script>

<template>
  <div class="scheduled-jobs-page">
    <div class="scheduled-jobs-card Gcard">
      <div class="GcardTitle">定时任务管理</div>
      <el-table v-loading="jobListLoading" :data="jobList" border>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="jobName" label="任务名称" min-width="200" />
        <el-table-column prop="jobKey" label="任务编码" min-width="220" />
        <el-table-column prop="module" label="所属模块" min-width="120" />
        <el-table-column prop="scheduleExpression" label="Cron 表达式" min-width="160" />
        <el-table-column prop="enabled" label="状态" min-width="100">
          <template #default="{ row }">
            {{ getEnabledText(row.enabled) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastRunTime" label="最近执行时间" min-width="180" />
        <el-table-column prop="lastStatus" label="最近结果" min-width="120">
          <template #default="{ row }">
            {{ getStatusText(row.lastStatus) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="260">
          <template #default="{ row }">
            <el-button v-if="canViewLogs" text type="primary" @click="handleViewLogs(row)">运行日志</el-button>
            <el-button v-if="canRunJob" text type="primary" @click="handleRunJob(row)">立即执行</el-button>
            <el-button
              v-if="row.enabled === '0' && canEnableJob"
              text
              type="success"
              @click="handleEnableJob(row)"
            >
              启用
            </el-button>
            <el-button
              v-else-if="row.enabled !== '0' && canDisableJob"
              text
              type="danger"
              @click="handleDisableJob(row)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="canViewLogs" class="scheduled-jobs-card Gcard">
      <div class="GcardTitle">运行日志</div>
      <el-table v-loading="logListLoading" :data="logList" border>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="jobName" label="任务名称" min-width="200" />
        <el-table-column prop="triggerMode" label="触发方式" min-width="120" />
        <el-table-column prop="status" label="执行状态" min-width="120">
          <template #default="{ row }">
            {{ getStatusText(row.status) }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" min-width="180" />
        <el-table-column prop="endTime" label="结束时间" min-width="180" />
        <el-table-column prop="durationMs" label="耗时(ms)" min-width="100" />
        <el-table-column prop="summary" label="结果摘要" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleViewLogDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="logDetailVisible" title="日志详情" :size="drawerSize">
      <div v-loading="logDetailLoading" class="log-detail-body">
        <div v-if="logDetailError" class="log-detail-error">{{ logDetailError }}</div>
        <template v-else-if="logDetail">
          <section class="log-detail-section">
            <div class="log-detail-title">基本信息</div>
            <div class="log-detail-grid">
              <div class="log-detail-item"><span>任务名称</span><strong>{{ getDisplayText(logDetail.jobName) }}</strong></div>
              <div class="log-detail-item"><span>任务编码</span><strong>{{ getDisplayText(logDetail.jobKey) }}</strong></div>
              <div class="log-detail-item"><span>任务类型</span><strong>{{ getDisplayText(logDetail.jobType) }}</strong></div>
              <div class="log-detail-item"><span>所属模块</span><strong>{{ getDisplayText(logDetail.module) }}</strong></div>
              <div class="log-detail-item"><span>触发方式</span><strong>{{ getDisplayText(logDetail.triggerMode) }}</strong></div>
              <div class="log-detail-item"><span>执行状态</span><strong>{{ getStatusText(logDetail.status) }}</strong></div>
              <div class="log-detail-item"><span>开始时间</span><strong>{{ getDisplayText(logDetail.startTime) }}</strong></div>
              <div class="log-detail-item"><span>结束时间</span><strong>{{ getDisplayText(logDetail.endTime) }}</strong></div>
              <div class="log-detail-item"><span>耗时</span><strong>{{ getDisplayText(logDetail.durationMs) }}</strong></div>
              <div class="log-detail-item"><span>操作人 ID</span><strong>{{ getDisplayText(logDetail.operatorId) }}</strong></div>
              <div class="log-detail-item"><span>操作人名称</span><strong>{{ getDisplayText(logDetail.operatorName) }}</strong></div>
            </div>
          </section>

          <section class="log-detail-section">
            <div class="log-detail-title">执行统计</div>
            <div class="log-detail-grid">
              <div class="log-detail-item"><span>处理数量</span><strong>{{ getDisplayText(logDetail.processedCount) }}</strong></div>
              <div class="log-detail-item"><span>成功数量</span><strong>{{ getDisplayText(logDetail.successCount) }}</strong></div>
              <div class="log-detail-item"><span>失败数量</span><strong>{{ getDisplayText(logDetail.failedCount) }}</strong></div>
              <div class="log-detail-item log-detail-item--full"><span>结果摘要</span><strong>{{ getDisplayText(logDetail.summary) }}</strong></div>
            </div>
          </section>

          <section class="log-detail-section">
            <div class="log-detail-title">错误信息</div>
            <div class="log-detail-stack-group">
              <div class="log-detail-stack-item">
                <span>错误摘要</span>
                <pre>{{ formatDetailText(logDetail.errorMessage) }}</pre>
              </div>
              <div class="log-detail-stack-item">
                <span>错误堆栈</span>
                <pre>{{ formatDetailText(logDetail.errorStack) }}</pre>
              </div>
            </div>
          </section>

          <section class="log-detail-section">
            <div class="log-detail-title">执行上下文</div>
            <pre class="log-detail-payload">{{ formatDetailText(logDetail.payload) }}</pre>
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.scheduled-jobs-page {
  display: grid;
  gap: 16px;
  min-height: 100%;
}

.scheduled-jobs-card {
  margin-top: 0;
}

.scheduled-jobs-card :deep(.el-table) {
  margin-top: 16px;
}

.log-detail-body {
  display: grid;
  gap: 16px;
}

.log-detail-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.log-detail-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.log-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.log-detail-item {
  display: grid;
  gap: 4px;
}

.log-detail-item span,
.log-detail-stack-item span {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.log-detail-item strong {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.log-detail-item--full {
  grid-column: 1 / -1;
}

.log-detail-stack-group {
  display: grid;
  gap: 12px;
}

.log-detail-stack-item {
  display: grid;
  gap: 8px;
}

.log-detail-stack-item pre,
.log-detail-payload {
  margin: 0;
  padding: 12px;
  overflow: auto;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-detail-error {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .scheduled-jobs-page {
    gap: 12px;
  }

  .log-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
