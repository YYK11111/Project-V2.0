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
            <el-table v-if="messageData.todo.length" :data="messageData.todo" size="small" max-height="260">
              <el-table-column prop="sourceType" label="业务对象" width="90">
                <template #default="{ row }">{{ getSourceTypeLabel(row.sourceType) }}</template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="180">
                <template #default="{ row }">
                  <el-button link type="primary" @click="goMessage(row)">{{ row.title }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="时间" width="160" />
            </el-table>
            <el-empty v-else description="暂无待办" :image-size="60" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`待阅 (${unread.cc})`" name="cc">
          <div class="message-section">
            <el-table v-if="messageData.cc.length" :data="messageData.cc" size="small" max-height="260">
              <el-table-column prop="sourceType" label="业务对象" width="90">
                <template #default="{ row }">{{ getSourceTypeLabel(row.sourceType) }}</template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="180">
                <template #default="{ row }">
                  <el-button link type="primary" @click="goMessage(row)">{{ row.title }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="时间" width="160" />
            </el-table>
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
</style>
