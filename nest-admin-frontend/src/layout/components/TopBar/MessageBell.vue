<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRecentMessages, getUnreadCount, markMessageRead } from '@/api/system/message'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const unread = ref({ total: 0, todo: 0, cc: 0 })
const messageData = ref<{ todo: any[]; cc: any[] }>({ todo: [], cc: [] })
const activeTab = ref('todo')
const popoverVisible = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
const projectAlertMessages = computed(() => messageData.value.cc.filter((item) => item.sourceType === 'project_alert'))
const otherCcMessages = computed(() => messageData.value.cc.filter((item) => item.sourceType !== 'project_alert'))

const getMetaText = (row: any) => {
  const starterText = `发起人：${row.starterName || '-'}`
  const timeText = row.createTime || '-'
  return `${starterText}  |  ${timeText}`
}

const getMessageRoute = (row: any) => {
  const query = row.linkParams || {}
  const isProjectWorkflowTodo =
    (row.businessType === 'project' || row.sourceType === 'workflow_task')
    && query.fromWorkflow === '1'
    && query.taskId
    && query.id

  if (isProjectWorkflowTodo && row.linkUrl === '/projectManage/detail') {
    return { path: '/projectManage/approval', query }
  }

  if (!row.linkUrl) return null
  return { path: row.linkUrl, query }
}

const loadMessages = async () => {
  if (!userStore.name) {
    unread.value = { total: 0, todo: 0, cc: 0 }
    messageData.value = { todo: [], cc: [] }
    return
  }
  const [countRes, recentRes] = await Promise.all([getUnreadCount(), getRecentMessages(10)])
  unread.value = countRes.data || countRes
  messageData.value = recentRes.data || recentRes
}

const goMessage = async (row: any) => {
  if (row.messageType === 'cc') {
    await markMessageRead(row.id)
  }
  const target = getMessageRoute(row)
  if (target) {
    popoverVisible.value = false
    await router.push(target)
  }
  await loadMessages()
}

const goMessageCenter = () => {
  popoverVisible.value = false
  router.push('/user/messages')
}

onMounted(() => {
  if (!userStore.name) {
    return
  }
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
  <el-popover v-model:visible="popoverVisible" placement="bottom-end" :width="420" trigger="click" @show="loadMessages">
    <template #reference>
      <el-badge :value="unread.total" :hidden="!unread.total" class="menuItem message-bell topbar-icon-button">
        <el-icon-bell class="right-icon message-bell__icon" />
      </el-badge>
    </template>
    <div class="message-popover">
      <div class="message-title">消息中心</div>
      <el-tabs v-model="activeTab" class="message-tabs">
        <el-tab-pane :label="`待办 (${unread.todo})`" name="todo">
          <div class="message-section">
            <div v-if="messageData.todo.length" class="message-list">
              <button v-for="row in messageData.todo" :key="row.id" type="button" class="message-item" @click="goMessage(row)">
                <div class="message-item__title">{{ row.title }}</div>
                <div class="message-item__meta">{{ getMetaText(row) }}</div>
              </button>
            </div>
            <el-empty v-else description="暂无待办" :image-size="60" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`待阅 (${unread.cc})`" name="cc">
          <div class="message-section">
            <div v-if="messageData.cc.length" class="message-group-list">
              <div v-if="projectAlertMessages.length" class="message-group">
                <div class="message-group__title">项目提醒</div>
                <div class="message-list">
                  <button v-for="row in projectAlertMessages" :key="row.id" type="button" class="message-item message-item--project" @click="goMessage(row)">
                    <div class="message-item__title">{{ row.title }}</div>
                    <div class="message-item__meta">{{ getMetaText(row) }}</div>
                  </button>
                </div>
              </div>

              <div v-if="otherCcMessages.length" class="message-group">
                <div class="message-group__title">其他待阅</div>
                <div class="message-list">
                  <button v-for="row in otherCcMessages" :key="row.id" type="button" class="message-item" @click="goMessage(row)">
                    <div class="message-item__title">{{ row.title }}</div>
                    <div class="message-item__meta">{{ getMetaText(row) }}</div>
                  </button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无待阅" :image-size="60" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <div class="message-footer">
        <el-button link type="primary" @click="goMessageCenter">查看全部消息</el-button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.message-bell {
  color: var(--Color);
}

.topbar-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 6px;
  border-radius: 6px;
}

.message-bell__icon {
  font-size: 20px;
  color: currentColor;
}

.message-bell :deep(.el-badge__content) {
  background-color: var(--Color);
  border-color: var(--Color);
}

.message-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin-bottom: 4px;
}

.message-section :deep(.el-empty) {
  padding: 8px 0;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.message-group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-group__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.message-item {
  width: 100%;
  text-align: left;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--el-bg-color);
  cursor: pointer;
}

.message-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.message-item--project {
  border-color: rgba(230, 162, 60, 0.24);
  background: rgba(230, 162, 60, 0.08);
}

.message-item__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 1px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.message-item__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
