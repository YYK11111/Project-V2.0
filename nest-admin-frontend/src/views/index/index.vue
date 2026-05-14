<script setup lang="ts">
import * as api from './api'
import type { HomeMessageItem, HomeProjectItem, HomeUnreadStats } from './api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const sysConfig = window.sysConfig

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
  {
    title: '我负责项目',
    value: projectList.value.filter((item) => getProjectOwner(item) === userStore.name).length,
    path: '/business/projectManage/index',
  },
])

function goTo(path: string) {
  router.push(path)
}

function getMessageTime(row: HomeMessageItem): string {
  return row.createTime || row.updateTime || row.startTime || '-'
}

function getTodoRoute(row: HomeMessageItem) {
  const queryParams = row.linkParams || {}
  const normalizedLinkUrl = row.linkUrl === '/system/messageCenter/index' ? '/messageCenter' : row.linkUrl
  const isProjectWorkflowTodo =
    (row.businessType === 'project' || row.sourceType === 'workflow_task')
    && queryParams.fromWorkflow === '1'
    && queryParams.taskId
    && queryParams.id

  if (isProjectWorkflowTodo && normalizedLinkUrl === '/projectManage/detail') {
    return { path: '/projectManage/approval', query: queryParams }
  }

  if (!normalizedLinkUrl) return null
  return { path: normalizedLinkUrl, query: queryParams }
}

async function goTodo(row: HomeMessageItem) {
  const target = getTodoRoute(row)
  if (target) {
    await router.push(target)
    return
  }
  await router.push('/user/messages')
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
  const rawProgress = row.progress ?? row.schedule ?? row.planProgress
  const normalizedProgress = Number(rawProgress)

  if (!Number.isFinite(normalizedProgress)) {
    return 0
  }

  return Math.min(100, Math.max(0, normalizedProgress))
}

function getProjectOwner(row: HomeProjectItem): string {
  return row.ownerName || row.pmName || row.leaderName || '未分配'
}

async function loadHomeData() {
  loading.value = true
  try {
    const [unreadRes, todoRes, ccRes, projectRes] = await Promise.allSettled([
      api.getHomeUnreadCount(),
      api.getHomeTodoList(),
      api.getHomeCcList(),
      api.getHomeProjectList(),
    ])

    unread.value = unreadRes.status === 'fulfilled' ? unreadRes.value : { total: 0, todo: 0, cc: 0 }
    todoList.value = todoRes.status === 'fulfilled' ? todoRes.value.list || [] : []
    ccList.value = ccRes.status === 'fulfilled' ? ccRes.value.list || [] : []
    projectList.value = projectRes.status === 'fulfilled' ? projectRes.value.list || [] : []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="page-shell user-home-page">
    <div class="Gcard page-header">
      <div class="page-header__main">
        <h1 class="page-header__title">工作台</h1>
        <p class="page-header__desc">优先处理待办、待阅和当前项目，快速进入今天的工作。</p>
      </div>
      <div class="page-header__actions">
        <el-button @click="goTo('/user/messages')">消息中心</el-button>
        <el-button type="primary" @click="goTo('/business/projectManage/index')">进入项目列表</el-button>
      </div>
    </div>

    <div class="page-subline">
      <button class="subline-link" type="button" @click="goTo('/user/profile')">
        个人中心：{{ userStore.name || '查看个人资料' }}
      </button>
      <div class="subline-meta">
        <span>围绕消息、项目和知识入口开始今天的工作。</span>
        <span>系统版本：{{ sysConfig.SYSTEM_VERSION }}</span>
        <span>更新时间：{{ sysConfig._packDateTime }}</span>
      </div>
    </div>

    <div class="Gcard work-summary" v-loading="loading">
      <div class="section-header">
        <div>
          <div class="GcardTitle">我的工作摘要</div>
          <div class="section-desc">用紧凑摘要先看清今天最需要处理的事项与项目分布。</div>
        </div>
      </div>
      <div class="summary-grid">
        <button
          v-for="item in workSummaryCards"
          :key="item.title"
          class="summary-card"
          type="button"
          @click="goTo(item.path)"
        >
          <span class="summary-card__icon" aria-hidden="true"></span>
          <div class="summary-card__body">
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}</div>
          </div>
        </button>
      </div>
    </div>

    <div class="main-workspace">
      <div class="workspace-primary">
        <div class="Gcard flexCol stickyPadding" v-loading="loading">
          <div class="section-header section-header--compact stickyTop !top-(--Padding)">
            <div>
              <div class="GcardTitle">我的待办</div>
              <div class="section-desc">优先处理需要立即推进的流程与任务。</div>
            </div>
          </div>
          <div v-if="todoList.length" class="list-panel">
            <button v-for="item in todoList" :key="item.id || item.title" class="list-item" type="button" @click="goTodo(item)">
              <span class="item-title">{{ getMessageTitle(item) }}</span>
              <span class="item-meta">{{ getMessageTime(item) }}</span>
            </button>
          </div>
          <el-empty v-else description="暂无待办，可前往项目列表查看最新进展" :image-size="80" />
        </div>

        <div class="Gcard flexCol stickyPadding" v-loading="loading">
          <div class="section-header section-header--compact stickyTop !top-(--Padding)">
            <div>
              <div class="GcardTitle">我的待阅</div>
              <div class="section-desc">集中查看抄送和同步信息，避免遗漏关键通知。</div>
            </div>
          </div>
          <div v-if="ccList.length" class="list-panel">
            <button v-for="item in ccList" :key="item.id || item.title" class="list-item" type="button" @click="goTo('/user/messages')">
              <span class="item-title">{{ getMessageTitle(item) }}</span>
              <span class="item-meta">{{ getMessageTime(item) }}</span>
            </button>
          </div>
          <el-empty v-else description="暂无待阅，可前往消息中心查看历史通知" :image-size="80" />
        </div>
      </div>

      <div class="workspace-secondary">
        <div class="Gcard flexCol stickyPadding" v-loading="loading">
          <div class="section-header section-header--compact stickyTop !top-(--Padding)">
            <div>
              <div class="GcardTitle">我参与的项目</div>
              <div class="section-desc">快速浏览当前参与项目的负责人、状态和推进进度。</div>
            </div>
          </div>
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
          <el-empty v-else description="暂无参与项目，可进入项目列表认领或查看最新项目" :image-size="80" />
        </div>

        <div class="Gcard flexCol stickyPadding quick-entry-card">
          <div class="section-header section-header--compact stickyTop !top-(--Padding)">
            <div>
              <div class="GcardTitle">快捷入口</div>
              <div class="section-desc">保留常用入口，减少往返菜单的操作成本。</div>
            </div>
          </div>
          <div class="quick-grid">
            <button v-for="item in quickLinks" :key="item.title" class="quick-card" type="button" @click="goTo(item.path)">
              <span class="quick-card__icon" aria-hidden="true"></span>
              <span class="quick-title">{{ item.title }}</span>
              <span class="quick-desc">{{ item.desc }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-home-page {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--Margin);
}

.page-shell {
  display: flex;
  flex-direction: column;
  gap: var(--Margin);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-header__main {
  min-width: 0;
  flex: 1;
}

.page-header__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: var(--FontBlack1);
}

.page-header__desc {
  margin: 10px 0 0;
  color: var(--FontBlack2);
}

.section-desc,
.summary-title,
.quick-desc,
.item-meta,
.project-meta {
  color: var(--FontBlack5);
}

.page-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.page-subline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  padding: 0 4px;
}

.subline-link,
.subline-meta {
  font-size: 13px;
  color: var(--FontBlack5);
}

.subline-link {
  text-align: left;
}

.subline-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-header--compact {
  margin-bottom: 2px;
}

.work-summary,
.main-workspace,
.workspace-primary,
.workspace-secondary,
.summary-grid,
.quick-grid,
.list-panel,
.project-panel {
  display: grid;
  gap: var(--Margin);
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px;
  text-align: left;
}

.summary-card__icon,
.quick-card__icon {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #10b981, #3b82f6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}

.summary-card__body {
  min-width: 0;
}

.summary-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: var(--Color);
}

.main-workspace {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr);
}

.workspace-primary,
.workspace-secondary {
  align-items: start;
}

.list-panel,
.project-panel {
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

.quick-entry-card {
  align-self: start;
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
  .main-workspace,
  .summary-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .page-header__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .page-subline {
    flex-direction: column;
    align-items: flex-start;
  }

  .subline-meta {
    justify-content: flex-start;
  }

  .list-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
