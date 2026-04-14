<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, getBurndown, startSprint, completeSprint, getStatus } from './api'
import { getList as getStoryList } from '../userStoryManage/api'
import BurndownChart from '@/components/BurndownChart.vue'
import KanbanBoard from '@/components/KanbanBoard.vue'

const route = useRoute()
const router = useRouter()

const sprintId = computed(() => String(route.query.id || ''))
const sprint = ref({})
const statusMap = ref({})
const burndownData = ref({})
const loading = ref(false)
const storyList = ref([])

const isActive = computed(() => sprint.value.status === '2')
const isCompleted = computed(() => sprint.value.status === '3')
const isPlanning = computed(() => sprint.value.status === '1')

const todoList = ref([])
const inProgressList = ref([])
const doneList = ref([])

onMounted(async () => {
  await loadStatus()
  await loadSprint()
  await loadBurndown()
  if (isActive.value) {
    await loadStories()
  }
})

async function loadStatus() {
  const res = await getStatus()
  statusMap.value = res.data || {}
}

async function loadSprint() {
  loading.value = true
  try {
    const res = await getOne(sprintId.value)
    sprint.value = res.data || {}
  } finally {
    loading.value = false
  }
}

async function loadBurndown() {
  try {
    const res = await getBurndown(sprintId.value)
    burndownData.value = res.data || {}
  } catch (e) {
    console.error('Failed to load burndown:', e)
  }
}

async function loadStories() {
  try {
    const res = await getStoryList({ sprintId: sprintId.value, pageNum: 1, pageSize: 100 })
    const stories = res.list || []
    storyList.value = stories
    todoList.value = stories.filter(s => s.status === '1' || s.status === '2')
    inProgressList.value = stories.filter(s => s.status === '3')
    doneList.value = stories.filter(s => s.status === '4' || s.status === '5')
  } catch (e) {
    console.error('Failed to load stories:', e)
  }
}

async function handleStartSprint() {
  try {
    await startSprint(sprintId.value)
    $sdk.msgSuccess('Sprint 已启动')
    await loadSprint()
  } catch (e) {
    $sdk.msgError(e.message || '启动失败')
  }
}

async function handleCompleteSprint() {
  try {
    await completeSprint(sprintId.value)
    $sdk.msgSuccess('Sprint 已完成')
    await loadSprint()
    await loadBurndown()
  } catch (e) {
    $sdk.msgError(e.message || '操作失败')
  }
}

function getStatusType(status) {
  const types = {
    '1': 'info',
    '2': 'primary',
    '3': 'success',
    '4': 'danger',
  }
  return types[status] || 'info'
}

function handleStoryClick(story) {
  router.push(`/business/userStoryManage/form?id=${story.id}`)
}
</script>

<template>
  <div class="Gcard">
    <el-page-header @back="$router.back()" :title="sprint.name || 'Sprint 详情'">
      <template #extra>
        <el-button v-if="isPlanning" type="primary" @click="handleStartSprint">启动 Sprint</el-button>
        <el-button v-if="isActive" type="success" @click="handleCompleteSprint">完成 Sprint</el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20" class="mt20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>Sprint 信息</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="Sprint名称">{{ sprint.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(sprint.status)">{{ statusMap[sprint.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ sprint.startDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ sprint.endDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Sprint目标">{{ sprint.goal || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>故事点统计</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="承诺故事点">{{ sprint.committedPoints || 0 }}</el-descriptions-item>
            <el-descriptions-item label="已完成故事点">
              <span style="color: #67C23A">{{ sprint.completedPoints || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="剩余故事点">
              <span style="color: #E6A23C">{{ (sprint.committedPoints || 0) - (sprint.completedPoints || 0) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>团队容量</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="Scrum Master">
              {{ sprint.scrumMaster?.nickname || sprint.scrumMaster?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="团队容量">{{ sprint.capacity || 0 }} 点</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>燃尽图</template>
          <BurndownChart v-if="burndownData.days?.length > 0" :data="burndownData" height="300px" />
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20" v-if="isActive">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>看板</template>
          <KanbanBoard
            :todo-list="todoList"
            :in-progress-list="inProgressList"
            :done-list="doneList"
            @item-click="handleStoryClick"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>Sprint 回顾</template>
          <el-input
            v-model="sprint.retrospective"
            type="textarea"
            :rows="4"
            placeholder="请输入 Sprint 回顾总结..."
            :disabled="isPlanning"
          />
          <div class="mt10" v-if="!isPlanning">
            <el-button type="primary" size="small" @click="handleSaveRetrospective">保存回顾</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.mt20 {
  margin-top: 20px;
}
</style>
