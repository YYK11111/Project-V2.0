<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMessageList, getUnreadCount, markMessageRead } from '@/api/system/message'
import { getMyHandledWorkflowHistory } from '@/views/business/workflow/api'

type MessageTab = 'todoCurrent' | 'todoHistory' | 'ccCurrent' | 'ccHistory'

const router = useRouter()
const activeTab = ref<MessageTab>('todoCurrent')
const unread = ref({ total: 0, todo: 0, cc: 0 })
const loading = ref(false)
const listData = ref<any[]>([])
const total = ref(0)
const query = reactive({
  pageNum: 1,
  pageSize: 10,
})

const tabConfig = computed(() => ({
  todoCurrent: { label: `当前待办 (${unread.value.todo})` },
  todoHistory: { label: '历史待办' },
  ccCurrent: { label: `当前待阅 (${unread.value.cc})` },
  ccHistory: { label: '历史待阅' },
}))

const getActionTagType = (actionText: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'primary'> = {
    同意: 'success',
    驳回: 'danger',
    撤回: 'warning',
    转交: 'info',
    加签: 'primary',
    终止: 'danger',
    发起人重新提交: 'primary',
  }
  return map[actionText] || 'info'
}

const getSummaryText = (row: any) => {
  if (activeTab.value === 'todoHistory') {
    return row.comment || '无审批意见'
  }
  if (activeTab.value === 'ccHistory') {
    return row.content || '已阅消息'
  }
  return row.content || '无摘要'
}

const getTimeLabel = computed(() => {
  if (activeTab.value === 'todoHistory') return '处理时间'
  if (activeTab.value === 'ccHistory') return '发送时间'
  return '时间'
})

const getSourceTypeLabel = (sourceType: string) => {
  const map: Record<string, string> = {
    project: '项目',
    task: '任务',
    ticket: '工单',
    change: '变更',
    customer: '客户',
    workflow_task: '待办',
    workflow_instance: '流程',
  }
  return map[sourceType] || sourceType || '-'
}

const isHistoryTab = computed(() => activeTab.value === 'todoHistory' || activeTab.value === 'ccHistory')

const loadUnread = async () => {
  const countRes = await getUnreadCount()
  unread.value = countRes.data || countRes
}

const loadList = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'todoHistory') {
      const res = await getMyHandledWorkflowHistory({ ...query })
      total.value = res.total || res.data?.total || 0
      listData.value = res.list || res.data?.list || []
      return
    }

    const paramsMap: Record<MessageTab, Record<string, any>> = {
      todoCurrent: { messageType: 'todo', scope: 'current' },
      todoHistory: {},
      ccCurrent: { messageType: 'cc', scope: 'current' },
      ccHistory: { messageType: 'cc', scope: 'history' },
    }
    const res = await getMessageList({ ...query, ...paramsMap[activeTab.value] })
    total.value = res.total || res.data?.total || 0
    listData.value = res.list || res.data?.list || []
  } finally {
    loading.value = false
  }
}

const reload = async () => {
  await Promise.all([loadUnread(), loadList()])
}

const goMessage = async (row: any) => {
  if (activeTab.value === 'ccCurrent') {
    await markMessageRead(row.id)
  }
  const queryParams = row.linkParams || {}
  if (row.linkUrl) {
    await router.push({ path: row.linkUrl, query: queryParams })
  }
  if (activeTab.value === 'ccCurrent') {
    await reload()
  }
}

const handleTabChange = async () => {
  query.pageNum = 1
  await loadList()
}

const handlePageChange = async (pageNum: number) => {
  query.pageNum = pageNum
  await loadList()
}

onMounted(() => {
  reload()
})
</script>

<template>
  <div class="message-center-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-title">消息中心</div>
      </template>
      <el-descriptions :column="3" border class="mb-16">
        <el-descriptions-item label="未读总数">{{ unread.total }}</el-descriptions-item>
        <el-descriptions-item label="待办未读">{{ unread.todo }}</el-descriptions-item>
        <el-descriptions-item label="待阅未读">{{ unread.cc }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane v-for="(item, key) in tabConfig" :key="key" :label="item.label" :name="key">
          <el-table :data="listData" border v-loading="loading">
            <el-table-column prop="businessType" label="业务对象" width="100">
              <template #default="{ row }">{{ getSourceTypeLabel(row.businessType || row.sourceType) }}</template>
            </el-table-column>
            <el-table-column prop="businessCode" label="业务编号" width="160" :show-overflow-tooltip="true">
              <template #default="{ row }">{{ row.businessCode || '-' }}</template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="240">
              <template #default="{ row }">
                <el-button link type="primary" @click="goMessage(row)">{{ row.title || row.businessTitle || '-' }}</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="starterName" label="发起人" width="120">
              <template #default="{ row }">{{ row.starterName || '-' }}</template>
            </el-table-column>
            <el-table-column prop="nodeName" label="节点" min-width="160">
              <template #default="{ row }">{{ row.nodeName || '-' }}</template>
            </el-table-column>
            <el-table-column v-if="activeTab === 'todoHistory'" prop="actionText" label="处理结果" width="120">
              <template #default="{ row }">
                <el-tag :type="getActionTagType(row.actionText)" size="small">{{ row.actionText || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="摘要/意见" min-width="260" :show-overflow-tooltip="true">
              <template #default="{ row }">{{ getSummaryText(row) }}</template>
            </el-table-column>
            <el-table-column v-if="activeTab === 'ccHistory'" prop="readTime" label="阅读时间" width="180" />
            <el-table-column prop="createTime" :label="getTimeLabel" width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :current-page="query.pageNum"
              :page-size="query.pageSize"
              :total="total"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.message-center-page {
  padding: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.mb-16 {
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.message-center-page :deep(.el-table .cell) {
  line-height: 1.5;
}
</style>
