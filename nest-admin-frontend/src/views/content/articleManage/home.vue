<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { articleTagApi, getKnowledgeTypes, getList } from './api'
import { getTrees } from './api.catalog'
import KnowledgeNav from './components/KnowledgeNav.vue'

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
  <div class="knowledge-home-page" v-loading="loading">
    <KnowledgeNav />
    <div class="knowledge-home-hero Gcard">
      <div class="knowledge-home-hero__content">
        <div class="knowledge-home-hero__eyebrow">知识中心</div>
        <div class="knowledge-home-hero__title">面向团队沉淀、借阅与复用的知识入口</div>
        <div class="knowledge-home-hero__desc">按分类、标签和知识类型快速检索，借阅受限知识，持续沉淀可被 AI 消费的高质量内容。</div>
        <div class="knowledge-home-hero__search">
          <el-input v-model="searchForm.keyword" placeholder="搜索知识标题、摘要、关键词" clearable @keyup.enter="goSearch()">
            <template #append>
              <el-button @click="goSearch()">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <div class="knowledge-home-grid">
      <div class="knowledge-home-main">
        <div class="knowledge-section Gcard">
          <div class="knowledge-section__header">
            <div class="knowledge-section__title">最近更新</div>
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

        <div class="knowledge-section Gcard">
          <div class="knowledge-section__header">
            <div class="knowledge-section__title">推荐知识</div>
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
        <div class="knowledge-section Gcard">
          <div class="knowledge-section__title">知识分类</div>
          <div class="catalog-list">
            <button v-for="item in flatCatalogs" :key="item.id" type="button" class="catalog-list__item" @click="useCatalog(item.id)">
              <span>{{ item.displayName }}</span>
              <el-icon-arrow-right />
            </button>
          </div>
        </div>

        <div class="knowledge-section Gcard">
          <div class="knowledge-section__title">热门标签</div>
          <div class="tag-list">
            <el-tag v-for="item in popularTags" :key="item.id" size="small" class="tag-list__item" @click="useTag(item.id)">{{ item.name }}</el-tag>
          </div>
        </div>

        <div class="knowledge-section Gcard">
          <div class="knowledge-section__title">快捷入口</div>
        <div class="quick-links">
          <el-button @click="$router.push('/content/articleManage/myBorrows')">我的借阅</el-button>
          <el-button @click="$router.push('/content/articleManage/search')">知识搜索</el-button>
          <el-button @click="$router.push('/content/articleManage/manage')">后台管理</el-button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-home-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-home-hero {
  padding: 32px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--Color) 16%, white), #ffffff);
}

.knowledge-home-hero__content {
  max-width: 860px;
}

.knowledge-home-hero__eyebrow {
  color: var(--Color);
  font-weight: 600;
  margin-bottom: 12px;
}

.knowledge-home-hero__title {
  font-size: 34px;
  line-height: 1.35;
  font-weight: 700;
  margin-bottom: 12px;
}

.knowledge-home-hero__desc {
  color: var(--el-text-color-regular);
  line-height: 1.8;
  margin-bottom: 20px;
}

.knowledge-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 16px;
}

.knowledge-home-main,
.knowledge-home-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.knowledge-section__title {
  font-size: 18px;
  font-weight: 600;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-item,
.featured-card,
.catalog-list__item {
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 14px 16px;
  background: #fff;
  cursor: pointer;
}

.knowledge-item:hover,
.featured-card:hover,
.catalog-list__item:hover {
  border-color: var(--Color);
}

.knowledge-item__title,
.featured-card__title {
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 6px;
}

.knowledge-item__meta,
.featured-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.knowledge-item__summary,
.featured-card__summary {
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list__item {
  cursor: pointer;
}

@media (max-width: 1024px) {
  .knowledge-home-grid {
    grid-template-columns: 1fr;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }
}
</style>
