<script setup lang="ts">
import { CountTo } from 'vue3-count-to'
import RequestChartTable from '@/components/RequestChartTable.vue'
import ChartChinaMap from './components/ChartChinaMap.vue'
import * as api from './api'
import type { AdminChartPoint, AdminIndexCountPayload, HomeUnreadStats } from './api'

const router = useRouter()
const sysConfig = window.sysConfig

const loading = ref(false)
const indexCounts = ref<AdminIndexCountPayload>({})
const unread = ref<HomeUnreadStats>({ total: 0, todo: 0, cc: 0 })
const provinceDistribution = ref<AdminChartPoint[]>([])

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
  { title: '用户管理', desc: '维护账号与基础信息', path: '/system/users/index' },
  { title: '角色管理', desc: '配置角色权限范围', path: '/system/roles/index' },
  { title: '菜单管理', desc: '维护导航与权限节点', path: '/system/menus/index' },
  { title: '系统配置', desc: '查看系统运行配置', path: '/system/configs/index' },
  { title: '在线用户', desc: '查看当前在线情况', path: '/systemMonitor/onlineUser/index' },
  { title: '登录日志', desc: '跟踪登录行为变化', path: '/systemMonitor/loginLog/index' },
  { title: '系统日志', desc: '审计系统操作记录', path: '/systemMonitor/systemLog/index' },
]

const overviewCards = computed<SummaryCardItem[]>(() => [
  { title: '当前在线人数', value: getCountValue(['onlineUserNum', 'onlineUsers', 'onlineCount']), path: '/systemMonitor/onlineUser/index' },
  { title: '今日访问量', value: getCountValue(['visitedNum', 'todayVisitedNum', 'visitCount']), path: '/systemMonitor/loginLog/index' },
  { title: '登录日志总量', value: getCountValue(['loginLogNum', 'loginNum', 'loginCount']), path: '/systemMonitor/loginLog/index' },
  { title: '用户总数', value: getCountValue(['userNum', 'userCount']), path: '/system/users/index' },
])

const manageSummaryCards = computed<SummaryCardItem[]>(() => [
  { title: '未读系统消息', value: unread.value.total || 0, path: '/user/messages' },
  { title: '当前待办', value: unread.value.todo || 0, path: '/user/messages' },
  { title: '当前待阅', value: unread.value.cc || 0, path: '/user/messages' },
  {
    title: '菜单权限节点',
    value: getCountValue(['menuNum', 'menuCount', 'permissionNum', 'permissionCount']),
    path: '/system/menus/index',
  },
])

function getCountValue(keys: string[]): number {
  for (const key of keys) {
    const value = indexCounts.value[key]
    if (value !== undefined && value !== null && value !== '') {
      return Number(value) || 0
    }
  }
  return 0
}

function goTo(path: string) {
  router.push(path)
}

async function loadHomeData() {
  loading.value = true
  try {
    const [countRes, unreadRes, provinceRes] = await Promise.all([
      api.getAdminIndexSummary(),
      api.getHomeUnreadCount(),
      api.getAdminUserLoginProvinceList(),
    ])
    indexCounts.value = countRes
    unread.value = unreadRes
    provinceDistribution.value = provinceRes
  } finally {
    loading.value = false
  }
}

function dealVisitedTrend(data: AdminChartPoint[], seriesData: number[][], xData: string[]) {
  const dates: string[] = []
  const values: number[] = []

  data.forEach((item, index) => {
    dates.push(String(item.date || item.days || item.name || item.label || `第${index + 1}项`))
    values.push(Number(item.value ?? item.num ?? item.count ?? 0) || 0)
  })

  xData.splice(0, xData.length, ...dates)
  seriesData.splice(0, seriesData.length, values)
}

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="admin-home-page">
    <div class="grid grid-cols-[3fr_1fr] --Gap hero-grid">
      <div class="flexBetween --Gap hero-card Gcard">
        <div class="system-console">管理驾驶舱</div>
        <div class="hero-copy">
          <div class="wel --Color">系统首页</div>
          <div class="hero-desc">集中查看系统状态、访问趋势和后台管理入口。</div>
        </div>
      </div>

      <div class="Gcard hero-meta">
        <div>
          <span class="--FontBlack5">更新时间：</span>
          <span class="--FontBlack2 blod">{{ sysConfig._packDateTime }}</span>
        </div>
        <div>
          <span class="--FontBlack5">系统版本：</span>
          <span class="--FontBlack2 blod">{{ sysConfig.SYSTEM_VERSION }}</span>
        </div>
      </div>
    </div>

    <div class="Gcard --MarginT" v-loading="loading">
      <div class="GcardTitle">系统概览</div>
      <div class="summary-grid">
        <button v-for="item in overviewCards" :key="item.title" type="button" class="summary-card" @click="goTo(item.path)">
          <div class="summary-title">{{ item.title }}</div>
          <CountTo class="summary-value" :start-val="0" :end-val="item.value" />
        </button>
      </div>
    </div>

    <div class="Gcard --MarginT" v-loading="loading">
      <div class="GcardTitle">管理工作摘要</div>
      <div class="summary-grid summary-grid--compact">
        <button v-for="item in manageSummaryCards" :key="item.title" type="button" class="summary-card" @click="goTo(item.path)">
          <div class="summary-title">{{ item.title }}</div>
          <CountTo class="summary-value" :start-val="0" :end-val="item.value" />
        </button>
      </div>
    </div>

    <div class="Gcard --MarginT">
      <div class="GcardTitle">系统管理快捷入口</div>
      <div class="quick-grid">
        <button v-for="item in quickLinks" :key="item.title" type="button" class="quick-card" @click="goTo(item.path)">
          <span class="quick-title">{{ item.title }}</span>
          <span class="quick-desc">{{ item.desc }}</span>
        </button>
      </div>
    </div>

    <div class="gridCard --MarginT chart-grid">
      <RequestChartTable
        title="访问趋势"
        type="lineChart"
        :is-page-query="false"
        :request="api.getAdminVisitedNumChart"
        legend="访问量"
        :deal-data-fun="dealVisitedTrend"
      />
      <div class="chart-map-loading" v-loading="loading">
        <ChartChinaMap title="最近成功登录用户省份分布" :data="provinceDistribution" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-home-page {
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

.hero-card {
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.12), #fff 58%);
}

.system-console {
  position: absolute;
  right: 24px;
  top: 20px;
  padding: 5px 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.08);
  color: var(--Color);
  font-size: 12px;
}

.hero-meta {
  display: grid;
  align-content: center;
  gap: 12px;
}

.hero-copy {
  max-width: 440px;
}

.wel {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 14px;
}

.hero-desc {
  color: var(--FontBlack5);
  line-height: 1.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.summary-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.summary-card {
  width: 100%;
  border: 1px solid var(--BorderBlack10);
  border-radius: var(--Radius);
  background: linear-gradient(180deg, #fff, rgba(64, 158, 255, 0.04));
  padding: 18px 20px;
  text-align: left;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--Color);
    transform: translateY(-2px);
  }
}

.summary-title {
  color: var(--FontBlack5);
  font-size: 14px;
}

.summary-value {
  display: block;
  margin-top: 16px;
  font-size: 30px;
  font-weight: bold;
  color: var(--FontBlack2);
  line-height: 1;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 116px;
  padding: 18px 20px;
  border: 1px solid var(--BorderBlack10);
  border-radius: var(--Radius);
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.06), rgba(64, 158, 255, 0.01));
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--Color);
    box-shadow: 0 12px 24px rgba(64, 158, 255, 0.12);
    transform: translateY(-2px);
  }
}

.quick-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--FontBlack2);
}

.quick-desc {
  color: var(--FontBlack5);
  line-height: 1.6;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

@media (max-width: 1200px) {
  .hero-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
