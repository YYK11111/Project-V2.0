<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRecentMessages, getUnreadCount, markMessageRead } from '@/api/system/message'
import { useRouter } from 'vue-router'

const router = useRouter()
const unread = ref({ total: 0, todo: 0, cc: 0 })
const messageData = ref<{ todo: any[]; cc: any[] }>({ todo: [], cc: [] })

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
  return map[sourceType] || sourceType
}

const loadMessages = async () => {
  const [countRes, recentRes] = await Promise.all([getUnreadCount(), getRecentMessages(10)])
  unread.value = countRes.data || countRes
  messageData.value = recentRes.data || recentRes
}

const goMessage = async (row: any) => {
  await markMessageRead(row.id)
  const query = row.linkParams || {}
  if (row.linkUrl) {
    router.push({ path: row.linkUrl, query })
  }
  await loadMessages()
}

onMounted(() => {
  loadMessages()
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

      <el-card shadow="never" class="mb-16">
        <template #header>待办</template>
        <el-table :data="messageData.todo" border>
          <el-table-column prop="sourceType" label="业务对象" width="100">
            <template #default="{ row }">{{ getSourceTypeLabel(row.sourceType) }}</template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="240">
            <template #default="{ row }">
              <el-button link type="primary" @click="goMessage(row)">{{ row.title }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="摘要" min-width="260" :show-overflow-tooltip="true" />
          <el-table-column prop="createTime" label="时间" width="180" />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>待阅</template>
        <el-table :data="messageData.cc" border>
          <el-table-column prop="sourceType" label="业务对象" width="100">
            <template #default="{ row }">{{ getSourceTypeLabel(row.sourceType) }}</template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="240">
            <template #default="{ row }">
              <el-button link type="primary" @click="goMessage(row)">{{ row.title }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="摘要" min-width="260" :show-overflow-tooltip="true" />
          <el-table-column prop="createTime" label="时间" width="180" />
        </el-table>
      </el-card>
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
</style>
