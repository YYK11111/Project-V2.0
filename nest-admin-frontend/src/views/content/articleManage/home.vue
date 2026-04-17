<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { articleTagApi, getKnowledgeTypes, getList } from './api'
import { getTrees } from './api.catalog'

const router = useRouter()
const loading = ref(false)
const knowledgeTypes = ref({})
const tags = ref<any[]>([])
const catalogs = ref<any[]>([])
const searchForm = reactive({
  keyword: '',
  catalogId: '',
  knowledgeType: '',
  tagIds: [],
})
const latestList = ref<any[]>([])
const publicList = ref<any[]>([])

getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data || {}))
articleTagApi.getList({ pageNum: 1, pageSize: 100 }).then(({ list = [] }: any) => (tags.value = list))
getTrees().then(({ data }) => (catalogs.value = data || []))

const featuredArticles = computed(() => publicList.value.slice(0, 6))
const latestArticles = computed(() => latestList.value.slice(0, 8))
const popularTags = computed(() => tags.value.slice(0, 12))
const heroStats = computed(() => [
  { label: '最近更新', value: latestArticles.value.length },
  { label: '推荐知识', value: featuredArticles.value.length },
  { label: '分类目录', value: flatCatalogs.value.length },
])
const flatCatalogs = computed(() => {
  const result: any[] = []
  const walk = (items: any[], parents: string[] = []) => {
    ;(items || []).forEach((item) => {
      result.push({
        ...item,
        displayName: [...parents, item.name].join(' / '),
      })
      item.children?.length && walk(item.children, [...parents, item.name])
    })
  }
  walk(catalogs.value || [])
  return result
})

async function loadHomeData() {
  loading.value = true
  try {
    const [latestRes, publicRes] = await Promise.all([
      getList({ pageNum: 1, pageSize: 8, status: '2', sortBy: 'latest' }),
      getList({ pageNum: 1, pageSize: 12, status: '2', visibilityType: 'public', sortBy: 'authority' }),
    ])
    latestList.value = latestRes.list || latestRes.data || []
    publicList.value = publicRes.list || publicRes.data || []
  } finally {
    loading.value = false
  }
}

function goDetail(item: any) {
  if (!item?.id) return
  router.push({ path: '/content/articleManage/detail', query: { id: item.id } })
}

function goSearch(extraParams: Record<string, any> = {}) {
  router.push({
    path: '/content/articleManage/search',
    query: {
      ...searchForm,
      ...extraParams,
    },
  })
}

function useTag(tagId: string) {
  goSearch({ tagIds: [tagId] })
}

function useCatalog(catalogId: string) {
  goSearch({ catalogId })
}

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="knowledge-home-page km-page" v-loading="loading">
    <div class="knowledge-home-hero Gcard km-hero">
      <div class="knowledge-home-hero__content">
        <div class="knowledge-home-hero__eyebrow km-hero__eyebrow">知识中心</div>
        <div class="knowledge-home-hero__title km-hero__title">面向团队沉淀、借阅与复用的知识入口</div>
        <div class="knowledge-home-hero__desc km-hero__desc">按分类、标签和知识类型快速检索，借阅受限知识，持续沉淀可被 AI 消费的高质量内容。</div>
        <div class="knowledge-home-hero__search">
          <el-input v-model="searchForm.keyword" placeholder="搜索知识标题、摘要、关键词" clearable @keyup.enter="goSearch()">
            <template #append>
              <el-button @click="goSearch()">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="knowledge-home-hero__actions">
          <el-button type="primary" @click="goSearch({ status: '2' })">进入知识搜索</el-button>
          <el-button @click="$router.push('/content/articleManage/myBorrows')">查看我的借阅</el-button>
        </div>
        <div class="knowledge-home-hero__stats">
          <div v-for="item in heroStats" :key="item.label" class="knowledge-home-hero__stat">
            <div class="knowledge-home-hero__stat-value">{{ item.value }}</div>
            <div class="knowledge-home-hero__stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="knowledge-home-grid">
      <div class="knowledge-home-main">
        <div class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__header km-panel__header">
            <div>
              <div class="knowledge-section__title km-panel__title">最近更新</div>
              <div class="knowledge-section__subtitle km-panel__desc">优先浏览团队刚刚补充或维护过的知识内容。</div>
            </div>
            <el-button link type="primary" @click="goSearch({ status: '2' })">查看全部</el-button>
          </div>
          <div class="knowledge-list">
            <button v-for="item in latestArticles" :key="item.id" type="button" class="knowledge-item" @click="goDetail(item)">
              <div class="knowledge-item__title">{{ item.title }}</div>
              <div class="knowledge-item__meta">
                <span>{{ item.catalog?.name || '-' }}</span>
                <span>{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
                <span>{{ item.updateTime || item.createTime || '-' }}</span>
              </div>
              <div class="knowledge-item__summary">{{ item.summary || item.desc || '暂无摘要' }}</div>
            </button>
          </div>
        </div>

        <div class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__header km-panel__header">
            <div>
              <div class="knowledge-section__title km-panel__title">推荐知识</div>
              <div class="knowledge-section__subtitle km-panel__desc">公开且更值得优先沉淀复用的知识条目。</div>
            </div>
          </div>
          <div class="featured-grid">
            <button v-for="item in featuredArticles" :key="item.id" type="button" class="featured-card" @click="goDetail(item)">
              <div class="featured-card__title">{{ item.title }}</div>
              <div class="featured-card__summary">{{ item.summary || item.desc || '暂无摘要' }}</div>
              <div class="featured-card__footer">
                <span>{{ item.catalog?.name || '-' }}</span>
                <span>{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="knowledge-home-side">
        <div class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__title km-panel__title">知识分类</div>
          <div class="knowledge-section__subtitle km-panel__desc">按目录快速缩小搜索范围。</div>
          <div class="catalog-list">
            <button v-for="item in flatCatalogs" :key="item.id" type="button" class="catalog-list__item" @click="useCatalog(item.id)">
              <span>{{ item.displayName }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </div>

        <div class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__title km-panel__title">热门标签</div>
          <div class="knowledge-section__subtitle km-panel__desc">从高频主题切入，减少重复检索。</div>
          <div class="tag-list">
            <el-tag v-for="item in popularTags" :key="item.id" size="small" class="tag-list__item" @click="useTag(item.id)">{{ item.name }}</el-tag>
          </div>
        </div>

        <div class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__title km-panel__title">快捷入口</div>
          <div class="knowledge-section__subtitle km-panel__desc">进入常用流程，减少来回跳转。</div>
          <div class="quick-links">
            <button type="button" class="quick-link-card" @click="$router.push('/content/articleManage/myBorrows')">
              <span class="quick-link-card__title">我的借阅</span>
              <span class="quick-link-card__desc">查看借阅记录、到期时间和处理进度</span>
            </button>
            <button type="button" class="quick-link-card" @click="$router.push('/content/articleManage/search')">
              <span class="quick-link-card__title">知识搜索</span>
              <span class="quick-link-card__desc">按关键词、标签和目录筛选知识内容</span>
            </button>
            <button type="button" class="quick-link-card" @click="$router.push('/content/articleManage/manage')">
              <span class="quick-link-card__title">后台管理</span>
              <span class="quick-link-card__desc">维护知识条目、分类、标签和可见范围</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-home-hero__content {
  max-width: 860px;
}

.knowledge-home-hero__title {
  max-width: 14ch;
}

.knowledge-home-hero__desc {
  max-width: 65ch;
  margin-bottom: 24px;
 }

.knowledge-home-hero__search {
  max-width: 720px;
  margin-bottom: 20px;
}

.knowledge-home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
}

.knowledge-home-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-width: 720px;
}

.knowledge-home-hero__stat {
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--Color) 10%, var(--el-border-color-lighter));
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.knowledge-home-hero__stat-value {
  font-size: 26px;
  line-height: 1.1;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.knowledge-home-hero__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.knowledge-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
}

.knowledge-home-main,
.knowledge-home-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-item,
.featured-card,
.catalog-list__item,
.quick-link-card {
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 16px 18px;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.knowledge-item:hover,
.featured-card:hover,
.catalog-list__item:hover,
.quick-link-card:hover {
  border-color: color-mix(in srgb, var(--Color) 42%, var(--el-border-color));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.knowledge-item__title,
.featured-card__title {
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 8px;
}

.knowledge-item__meta,
.featured-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 10px;
}

.knowledge-item__summary,
.featured-card__summary {
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.catalog-list,
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.catalog-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list__item {
  cursor: pointer;
}

.quick-link-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-link-card__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-link-card__desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .knowledge-home-grid {
    grid-template-columns: 1fr;
  }

  .knowledge-home-hero__stats {
    grid-template-columns: 1fr;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-home-main,
  .knowledge-home-side,
  .knowledge-home-grid {
    gap: 16px;
  }

  .knowledge-home-hero__title {
    max-width: none;
  }
}
</style>
