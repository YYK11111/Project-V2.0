<script setup lang="ts">
import * as api from './api'
import type { HomeMessageItem, HomeProjectItem, HomeUnreadStats } from './api'
import { useUserStore } from '@/stores/user'
import RELEASE from '../../../RELEASE.md?raw'

const router = useRouter()
const userStore = useUserStore()
const sysConfig = window.sysConfig

const greeting = ref('')
const loading = ref(false)
const unread = ref<HomeUnreadStats>({ total: 0, todo: 0, cc: 0 })
const todoList = ref<HomeMessageItem[]>([])
const ccList = ref<HomeMessageItem[]>([])
const projectList = ref<HomeProjectItem[]>([])

interface QuickLinkItem {
  title: string
  desc: string
  path: string
}

interface SummaryCardItem {
  title: string
  value: number
  path: string
}

const quickLinks: QuickLinkItem[] = [
  { title: '消息中心', desc: '查看当前待办和待阅', path: '/user/messages' },
  { title: '项目列表', desc: '进入项目列表与跟进页', path: '/business/projectManage/index' },
  { title: '知识中心', desc: '查阅知识库与复盘内容', path: '/content/articleManage/home' },
  { title: '个人中心', desc: '维护个人资料和偏好', path: '/user/profile' },
]

const workSummaryCards = computed<SummaryCardItem[]>(() => [
  { title: '当前待办', value: unread.value.todo || 0, path: '/user/messages' },
  { title: '当前待阅', value: unread.value.cc || 0, path: '/user/messages' },
  { title: '参与项目', value: projectList.value.length || 0, path: '/business/projectManage/index' },
])

function greetingFun() {
  const date = new Date()
  const hour = date.getHours()
  if (0 <= hour && hour < 8) {
    greeting.value = '早上好'
  } else if (8 <= hour && hour < 12) {
    greeting.value = '上午好'
  } else if (12 <= hour && hour < 14) {
    greeting.value = '中午好'
  } else if (14 <= hour && hour < 18) {
    greeting.value = '下午好'
  } else {
    greeting.value = '晚上好'
  }
}

function goTo(path: string) {
  router.push(path)
}

function getMessageTime(row: HomeMessageItem): string {
  return row.createTime || row.updateTime || row.startTime || '-'
}

function getMessageTitle(row: HomeMessageItem): string {
  return row.title || row.businessTitle || '暂无标题'
}

function getProjectName(row: HomeProjectItem): string {
  return row.projectName || row.name || '-'
}

function getProjectStatus(row: HomeProjectItem): string {
  return row.statusName || row.status || '进行中'
}

function getProjectProgress(row: HomeProjectItem): number {
  return Number(row.progress ?? row.schedule ?? row.planProgress ?? 0)
}

function getProjectOwner(row: HomeProjectItem): string {
  return row.ownerName || row.pmName || row.leaderName || '未分配'
}

async function loadHomeData() {
  loading.value = true
  try {
    const [unreadRes, todoRes, ccRes, projectRes] = await Promise.all([
      api.getHomeUnreadCount(),
      api.getHomeTodoList(),
      api.getHomeCcList(),
      api.getHomeProjectList(),
    ])
    unread.value = unreadRes
    todoList.value = todoRes.list || []
    ccList.value = ccRes.list || []
    projectList.value = projectRes.list || []
  } finally {
    loading.value = false
  }
}

greetingFun()

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="user-home-page">
    <div class="grid grid-cols-[3fr_1fr] --Gap hero-grid">
      <div class="flexBetween --Gap hero-card Gcard">
        <div class="userinfo flex flexAuto flexCenter pointer" @click="goTo('/user/profile')">
          <div class="portrait">
            <img v-if="userStore.avatar" class="portraitImg" :src="userStore.avatar" alt="" />
          </div>
          <div class="hero-copy">
            <el-tooltip :content="userStore.name" placement="top-end" effect="light" :disabled="userStore.name?.length < 7">
              <div class="wel ellipsis --Color">{{ greeting }}，{{ userStore.name }}</div>
            </el-tooltip>
            <div class="hero-desc">围绕消息、项目和知识入口开始今天的工作。</div>
          </div>
        </div>
      </div>

      <div class="Gcard hero-meta">
        <div>
          <span class="--FontBlack5">更新时间：</span>
          <span class="--FontBlack2 blod">{{ sysConfig._packDateTime }}</span>
        </div>
        <div>
          <span class="--FontBlack5">系统版本：</span>
          <span class="--FontBlack2 blod">{{ RELEASE.match('## (.*)')?.[1] }}</span>
        </div>
      </div>
    </div>

    <div class="Gcard --MarginT" v-loading="loading">
      <div class="GcardTitle">我的工作摘要</div>
      <div class="summary-grid">
        <div v-for="item in workSummaryCards" :key="item.title" class="summary-card pointer" @click="goTo(item.path)">
          <div class="summary-title">{{ item.title }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="gridCard --MarginT content-grid">
      <div class="Gcard flexCol stickyPadding" v-loading="loading">
        <div class="GcardTitle stickyTop !top-(--Padding)">我的待办</div>
        <div v-if="todoList.length" class="list-panel">
          <button v-for="item in todoList" :key="item.id || item.title" class="list-item" type="button" @click="goTo('/user/messages')">
            <span class="item-title">{{ getMessageTitle(item) }}</span>
            <span class="item-meta">{{ getMessageTime(item) }}</span>
          </button>
        </div>
        <el-empty v-else description="暂无待办" :image-size="80" />
      </div>

      <div class="Gcard flexCol stickyPadding" v-loading="loading">
        <div class="GcardTitle stickyTop !top-(--Padding)">我的待阅</div>
        <div v-if="ccList.length" class="list-panel">
          <button v-for="item in ccList" :key="item.id || item.title" class="list-item" type="button" @click="goTo('/user/messages')">
            <span class="item-title">{{ getMessageTitle(item) }}</span>
            <span class="item-meta">{{ getMessageTime(item) }}</span>
          </button>
        </div>
        <el-empty v-else description="暂无待阅" :image-size="80" />
      </div>
    </div>

    <div class="gridCard --MarginT content-grid">
      <div class="Gcard flexCol stickyPadding" v-loading="loading">
        <div class="GcardTitle stickyTop !top-(--Padding)">我参与的项目</div>
        <div v-if="projectList.length" class="project-panel">
          <div v-for="item in projectList" :key="item.id || item.projectName || item.name" class="project-card pointer" @click="goTo('/business/projectManage/index')">
            <div class="project-head">
              <div class="project-name">{{ getProjectName(item) }}</div>
              <el-tag size="small" effect="plain">{{ getProjectStatus(item) }}</el-tag>
            </div>
            <div class="project-meta">负责人：{{ getProjectOwner(item) }}</div>
            <div class="project-meta">进度：{{ getProjectProgress(item) }}%</div>
            <el-progress :percentage="Number(getProjectProgress(item)) || 0" :stroke-width="8" />
          </div>
        </div>
        <el-empty v-else description="暂无参与项目" :image-size="80" />
      </div>

      <div class="Gcard flexCol stickyPadding">
        <div class="GcardTitle stickyTop !top-(--Padding)">快捷入口</div>
        <div class="quick-grid">
          <button v-for="item in quickLinks" :key="item.title" class="quick-card" type="button" @click="goTo(item.path)">
            <span class="quick-title">{{ item.title }}</span>
            <span class="quick-desc">{{ item.desc }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-home-page {
  height: 100%;
  overflow: auto;
}

.hero-grid {
  align-items: stretch;
}

.hero-card,
.hero-meta {
  min-height: 120px;
}

.hero-meta {
  display: grid;
  align-content: center;
  gap: 12px;
}

.userinfo {
  &:hover {
    color: var(--Color);
  }

  .portrait {
    position: relative;
    padding-right: 10px;

    .portraitImg {
      display: block;
      margin: 0 auto;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 1px solid var(--BorderBlack10);
    }
  }

  .wel {
    position: relative;
    font-size: 20px;
    font-weight: bold;
    margin: 2px 0 16px;
    width: 100%;
  }
}

.hero-copy {
  max-width: 320px;
}

.hero-desc {
  color: var(--FontBlack5);
}

.summary-grid,
.quick-grid {
  display: grid;
  gap: var(--Margin);
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--Margin);
}

.summary-card,
.quick-card,
.project-card,
.list-item {
  border: 1px solid var(--BorderBlack10);
  border-radius: 12px;
  background: #fff;
}

.summary-card {
  padding: 18px;
}

.summary-title,
.quick-desc,
.item-meta,
.project-meta {
  color: var(--FontBlack5);
}

.summary-value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--Color);
}

.gridCard {
  display: grid;
  grid-template: auto / 1fr 1fr;
  gap: var(--Margin);

  > .Gcard {
    margin-top: 0;
  }
}

.content-grid {
  align-items: start;
}

.list-panel,
.project-panel {
  display: grid;
  gap: 12px;
  margin-top: var(--Margin);
}

.list-item,
.quick-card {
  width: 100%;
  padding: 14px 16px;
  text-align: left;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.item-title,
.project-name,
.quick-title {
  color: var(--FontBlack1);
  font-weight: 600;
}

.project-card {
  padding: 16px;
}

.project-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.quick-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: var(--Margin);
}

.quick-card {
  display: grid;
  gap: 8px;
}

@media (max-width: 960px) {
  .hero-grid,
  .gridCard,
  .summary-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .list-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
