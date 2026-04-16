<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRecentMessages, getUnreadCount, markMessageRead } from '@/api/system/message'

const router = useRouter()
const unread = ref({ total: 0, todo: 0, cc: 0 })
const messageData = ref<{ todo: any[]; cc: any[] }>({ todo: [], cc: [] })
const activeTab = ref('todo')
let timer: ReturnType<typeof setInterval> | null = null

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

const getMetaText = (row: any) => {
  const starter = row.starterName ? `发起人：${row.starterName}` : ''
  const nodeName = row.nodeName ? `节点：${row.nodeName}` : ''
  return [starter, nodeName].filter(Boolean).join(' · ') || row.content || '-'
}

const loadMessages = async () => {
  const [countRes, recentRes] = await Promise.all([getUnreadCount(), getRecentMessages(10)])
  unread.value = countRes.data || countRes
  messageData.value = recentRes.data || recentRes
}

const goMessage = async (row: any) => {
  if (row.messageType === 'cc') {
    await markMessageRead(row.id)
  }
  const query = row.linkParams || {}
  if (row.linkUrl) {
    router.push({ path: row.linkUrl, query })
  }
  await loadMessages()
}

onMounted(() => {
  loadMessages()
  timer = setInterval(() => {
    loadMessages()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <el-popover placement="bottom-end" :width="520" trigger="click" @show="loadMessages">
    <template #reference>
      <el-badge :value="unread.total" :hidden="!unread.total" class="menuItem message-bell">
        <el-icon-bell class="right-icon" />
      </el-badge>
    </template>
    <div class="message-popover">
      <div class="message-title">消息中心</div>
      <el-tabs v-model="activeTab" class="message-tabs">
        <el-tab-pane :label="`待办 (${unread.todo})`" name="todo">
          <div class="message-section">
            <div v-if="messageData.todo.length" class="message-list">
              <button v-for="row in messageData.todo" :key="row.id" type="button" class="message-item" @click="goMessage(row)">
                <div class="message-item__header">
                  <el-tag size="small" type="warning">{{ getSourceTypeLabel(row.businessType || row.sourceType) }}</el-tag>
                  <span class="message-item__time">{{ row.createTime }}</span>
                </div>
                <div class="message-item__title">{{ row.title }}</div>
                <div class="message-item__meta">{{ getMetaText(row) }}</div>
              </button>
            </div>
            <el-empty v-else description="暂无待办" :image-size="60" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`待阅 (${unread.cc})`" name="cc">
          <div class="message-section">
            <div v-if="messageData.cc.length" class="message-list">
              <button v-for="row in messageData.cc" :key="row.id" type="button" class="message-item" @click="goMessage(row)">
                <div class="message-item__header">
                  <el-tag size="small" type="info">{{ getSourceTypeLabel(row.businessType || row.sourceType) }}</el-tag>
                  <span class="message-item__time">{{ row.createTime }}</span>
                </div>
                <div class="message-item__title">{{ row.title }}</div>
                <div class="message-item__meta">{{ getMetaText(row) }}</div>
              </button>
            </div>
            <el-empty v-else description="暂无待阅" :image-size="60" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <div class="message-footer">
        <el-button link type="primary" @click="router.push('/user/messages')">查看全部消息</el-button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.message-bell {
  margin-right: 8px;
}

.message-popover {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-title {
  font-weight: 600;
  color: #303133;
}

.section-title {
  margin-bottom: 8px;
  font-weight: 500;
}

.message-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.message-section :deep(.el-empty) {
  padding: 12px 0;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.message-item {
  width: 100%;
  text-align: left;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  cursor: pointer;
}

.message-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.message-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.message-item__time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-item__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.5;
}

.message-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
