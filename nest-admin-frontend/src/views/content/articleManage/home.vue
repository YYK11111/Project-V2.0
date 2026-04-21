<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Collection, Document, Management, Search, StarFilled, TrendCharts } from '@element-plus/icons-vue'
import { articleTagApi, createSearchRecord, getHomeData, getKnowledgeTypes } from './api'

const router = useRouter()
const loading = ref(false)
const knowledgeTypes = ref({})
const tags = ref<any[]>([])
const searchForm = reactive({
  keyword: '',
  catalogId: '',
  knowledgeType: '',
  tagIds: [],
})
const topArticles = ref<any[]>([])
const hotArticles = ref<any[]>([])
const latestArticles = ref<any[]>([])
const hotCatalogs = ref<any[]>([])
const hotKeywords = ref<string[]>([])

getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data || {}))
articleTagApi.getList({ pageNum: 1, pageSize: 100 }).then(({ list = [] }: any) => (tags.value = list))

const highlightedTopArticle = computed(() => topArticles.value[0] || null)
const secondaryTopArticles = computed(() => topArticles.value.slice(1, 4))
const sideTags = computed(() => tags.value.slice(0, 12))
const channelLinks = computed(() => [
  {
    title: '我的借阅',
    desc: '查看借阅记录、到期时间和处理进度。',
    badge: '个人中心',
    icon: Collection,
    action: () => router.push('/content/articleManage/myBorrows'),
  },
  {
    title: '知识搜索',
    desc: '按关键词、标签和目录筛选，快速发现同类知识。',
    badge: '内容发现',
    icon: Search,
    action: () => router.push('/content/articleManage/search'),
  },
  {
    title: '治理后台',
    desc: '维护知识条目、分类、标签和可见范围。',
    badge: '后台管理',
    icon: Management,
    action: () => router.push('/content/articleManage/manage'),
  },
])
const topicCards = computed(() => [
  {
    label: '置顶知识',
    value: topArticles.value.length,
    icon: StarFilled,
  },
  {
    label: '热点知识',
    value: hotArticles.value.length,
    icon: TrendCharts,
  },
  {
    label: '最新更新',
    value: latestArticles.value.length,
    icon: Document,
  },
])

async function loadPageData() {
  loading.value = true
  try {
    // 首页改为消费后端聚合数据，避免前端自己拼热点/置顶规则。
    const { data } = await getHomeData()
    topArticles.value = data?.topArticles || []
    hotArticles.value = data?.hotArticles || []
    latestArticles.value = data?.latestArticles || []
    hotCatalogs.value = data?.hotCatalogs || []
    hotKeywords.value = data?.hotKeywords || []
  } finally {
    loading.value = false
  }
}

function goDetail(item: any) {
  if (!item?.id) return
  router.push({ path: '/content/articleManage/view', query: { id: item.id } })
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

async function submitSearch(keyword?: string) {
  const finalKeyword = String(keyword || searchForm.keyword || '').trim()
  if (finalKeyword) {
    searchForm.keyword = finalKeyword
    await createSearchRecord({ keyword: finalKeyword }).catch(() => {})
  }
  goSearch()
}

function quickSearch(keyword: string) {
  submitSearch(keyword)
}

function useTag(tagId: string) {
  goSearch({ tagIds: [tagId] })
}

function useCatalog(catalogId: string) {
  goSearch({ catalogId })
}

function getDisplaySummary(item: any) {
  return item.summary || item.desc || '暂无摘要'
}

function getDisplayTime(item: any) {
  return item.updateTime || item.createTime || '-'
}

onMounted(() => {
  loadPageData()
})
</script>

<template>
  <div class="knowledge-home-page km-page" v-loading="loading">
    <section class="knowledge-toolbar Gcard km-panel">
      <div class="knowledge-toolbar__main">
        <div>
          <div class="knowledge-toolbar__eyebrow">知识中心</div>
          <div class="knowledge-toolbar__title">聚焦热点知识、最新知识与置顶知识</div>
          <div class="knowledge-toolbar__desc">先从搜索开始，再按热点、最新与分类继续浏览高价值内容。</div>
        </div>
        <div class="knowledge-toolbar__actions">
          <el-button type="primary" plain @click="goSearch({ status: '2' })">浏览全部</el-button>
          <el-button @click="router.push('/content/articleManage/myBorrows')">我的借阅</el-button>
          <el-button @click="router.push('/content/articleManage/manage')">治理后台</el-button>
        </div>
      </div>

      <div class="knowledge-toolbar__search">
        <div class="knowledge-toolbar__search-field">
          <div class="knowledge-toolbar__search-icon">
            <el-icon><Search /></el-icon>
          </div>
          <el-input v-model="searchForm.keyword" placeholder="搜索知识标题、摘要、关键词" clearable @keyup.enter="submitSearch()" />
        </div>
        <el-button type="primary" class="knowledge-toolbar__search-button" @click="submitSearch()">查看结果</el-button>
      </div>

      <div class="knowledge-toolbar__footer">
        <div class="knowledge-toolbar__keywords">
          <span class="knowledge-toolbar__keywords-label">热门搜索</span>
          <button v-for="item in hotKeywords" :key="item" type="button" class="knowledge-toolbar__chip" @click="quickSearch(item)">{{ item }}</button>
        </div>
        <div class="knowledge-toolbar__stats">
          <div v-for="item in topicCards" :key="item.label" class="knowledge-toolbar__stat-card">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </section>

    <div class="knowledge-home-grid">
      <div class="knowledge-home-main">
        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__header km-panel__header">
            <div>
              <div class="knowledge-section__eyebrow">置顶知识</div>
              <div class="knowledge-section__title km-panel__title">优先浏览首页最重要的知识内容</div>
              <div class="knowledge-section__subtitle km-panel__desc">由置顶和排序规则共同决定前排内容，适合作为首页最优先入口。</div>
            </div>
          </div>

          <div class="knowledge-top-layout">
            <button v-if="highlightedTopArticle" type="button" class="knowledge-top-main" @click="goDetail(highlightedTopArticle)">
              <div class="knowledge-top-main__media">
                <img v-if="highlightedTopArticle.thumb" :src="highlightedTopArticle.thumb" :alt="highlightedTopArticle.title" />
                <div v-else class="knowledge-top-main__placeholder">
                  <el-icon><Collection /></el-icon>
                </div>
              </div>
              <div class="knowledge-top-main__content">
                <div class="knowledge-top-main__eyebrow">置顶推荐</div>
                <div class="knowledge-top-main__meta">
                  <span>{{ highlightedTopArticle.catalog?.name || '-' }}</span>
                  <span>{{ knowledgeTypes[highlightedTopArticle.knowledgeType] || '-' }}</span>
                  <span>{{ getDisplayTime(highlightedTopArticle) }}</span>
                </div>
                <div class="knowledge-top-main__title">{{ highlightedTopArticle.title }}</div>
                <div class="knowledge-top-main__summary">{{ getDisplaySummary(highlightedTopArticle) }}</div>
              </div>
            </button>

            <div class="knowledge-top-side">
              <button v-for="item in secondaryTopArticles" :key="item.id" type="button" class="knowledge-top-side__card" @click="goDetail(item)">
                <div class="knowledge-top-side__meta">
                  <span>{{ item.catalog?.name || '-' }}</span>
                  <span>{{ getDisplayTime(item) }}</span>
                </div>
                <div class="knowledge-top-side__title">{{ item.title }}</div>
                <div class="knowledge-top-side__summary">{{ getDisplaySummary(item) }}</div>
              </button>
            </div>
          </div>
        </section>

        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__header km-panel__header">
            <div>
              <div class="knowledge-section__eyebrow">热点知识</div>
              <div class="knowledge-section__title km-panel__title">当前最值得优先阅读与复用的知识</div>
              <div class="knowledge-section__subtitle km-panel__desc">按热点排序挑出最值得浏览的知识内容，适合作为首页核心内容区。</div>
            </div>
            <el-button link type="primary" @click="goSearch({ status: '2', sortBy: 'weight' })">查看全部</el-button>
          </div>

          <div class="knowledge-hot-grid">
            <button v-for="item in hotArticles" :key="item.id" type="button" class="knowledge-hot-card" @click="goDetail(item)">
              <div class="knowledge-hot-card__meta">
                <span>{{ item.catalog?.name || '-' }}</span>
                <span>{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
              </div>
              <div class="knowledge-hot-card__title">{{ item.title }}</div>
              <div class="knowledge-hot-card__summary">{{ getDisplaySummary(item) }}</div>
              <div class="knowledge-hot-card__footer">
                <span>{{ getDisplayTime(item) }}</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </button>
          </div>
        </section>

        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__header km-panel__header">
            <div>
              <div class="knowledge-section__eyebrow">最新知识</div>
              <div class="knowledge-section__title km-panel__title">持续跟进最近新增、维护和复盘的内容</div>
              <div class="knowledge-section__subtitle km-panel__desc">用更轻的时间流承接最新内容，帮助团队快速了解知识库的新变化。</div>
            </div>
            <el-button link type="primary" @click="goSearch({ status: '2', sortBy: 'latest' })">查看全部</el-button>
          </div>

          <div class="knowledge-latest-list">
            <button v-for="item in latestArticles" :key="item.id" type="button" class="knowledge-latest-item" @click="goDetail(item)">
              <div class="knowledge-latest-item__time">{{ getDisplayTime(item) }}</div>
              <div class="knowledge-latest-item__content">
                <div class="knowledge-latest-item__title">{{ item.title }}</div>
                <div class="knowledge-latest-item__summary">{{ getDisplaySummary(item) }}</div>
                <div class="knowledge-latest-item__meta">
                  <span>{{ item.catalog?.name || '-' }}</span>
                  <span>{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
                </div>
              </div>
              <el-icon class="knowledge-latest-item__icon"><ArrowRight /></el-icon>
            </button>
          </div>
        </section>
      </div>

      <aside class="knowledge-home-side">
        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__eyebrow">热点分类</div>
          <div class="knowledge-section__title km-panel__title">按热点分类继续深入</div>
          <div class="knowledge-section__subtitle km-panel__desc">从首页重点分类切入内容，帮助用户从主题层继续下钻。</div>
          <div class="knowledge-catalog-grid">
            <button v-for="item in hotCatalogs" :key="item.id" type="button" class="knowledge-catalog-card" @click="useCatalog(item.id)">
              <div class="knowledge-catalog-card__title">{{ item.displayName || item.name }}</div>
              <div class="knowledge-catalog-card__count">{{ item.articleCount }} 篇内容</div>
            </button>
          </div>
        </section>

        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__eyebrow">热门标签</div>
          <div class="knowledge-section__title km-panel__title">高频主题标签</div>
          <div class="tag-list knowledge-tag-list">
            <el-tag v-for="item in sideTags" :key="item.id" size="small" class="tag-list__item" @click="useTag(item.id)">{{ item.name }}</el-tag>
          </div>
        </section>

        <section class="knowledge-section Gcard km-panel">
          <div class="knowledge-section__eyebrow">常用入口</div>
          <div class="knowledge-section__title km-panel__title">保持核心工作流触达</div>
          <div class="quick-links">
            <button v-for="item in channelLinks" :key="item.title" type="button" class="quick-link-card" @click="item.action()">
              <div class="quick-link-card__head">
                <div class="quick-link-card__icon">
                  <component :is="item.icon" />
                </div>
                <span class="quick-link-card__badge">{{ item.badge }}</span>
              </div>
              <span class="quick-link-card__title">{{ item.title }}</span>
              <span class="quick-link-card__desc">{{ item.desc }}</span>
            </button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-home-page {
  --knowledge-primary: var(--Color);
  --knowledge-primary-deep: var(--ColorDark);
  --knowledge-primary-paper: color-mix(in srgb, var(--ColorLight11) 55%, var(--cardBg));
  --knowledge-line: color-mix(in srgb, var(--ColorLight8) 42%, var(--cardBg));
  --knowledge-line-strong: color-mix(in srgb, var(--ColorLight6) 55%, var(--cardBg));
  --knowledge-text-strong: var(--FontBlack);
  --knowledge-text-main: var(--FontBlack2);
  --knowledge-text-subtle: var(--FontBlack5);
  --knowledge-text-faint: var(--FontBlack6);
  --knowledge-shadow: 0 16px 34px rgba(27, 39, 61, 0.06);
  --knowledge-shadow-hover: 0 22px 42px rgba(27, 39, 61, 0.1);
}

.knowledge-toolbar,
.knowledge-section,
.knowledge-top-main,
.knowledge-top-side__card,
.knowledge-hot-card,
.knowledge-latest-item,
.knowledge-catalog-card,
.quick-link-card,
.knowledge-toolbar__chip {
  border: 1px solid var(--knowledge-line);
  box-shadow: var(--knowledge-shadow);
}

.knowledge-toolbar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--knowledge-primary-paper) 30%, var(--cardBg)), color-mix(in srgb, var(--cardBg) 98%, transparent));
}

.knowledge-toolbar__main,
.knowledge-toolbar__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.knowledge-toolbar__eyebrow,
.knowledge-section__eyebrow,
.knowledge-top-main__eyebrow,
.quick-link-card__badge {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--knowledge-primary-paper) 70%, var(--cardBg));
  color: color-mix(in srgb, var(--knowledge-primary-deep) 72%, var(--knowledge-text-main));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.knowledge-toolbar__title {
  margin-top: 12px;
  max-width: 24ch;
  font-size: 26px;
  line-height: 1.35;
  font-weight: 700;
  color: var(--knowledge-text-strong);
}

.knowledge-toolbar__desc {
  margin-top: 8px;
  color: var(--knowledge-text-subtle);
  line-height: 1.72;
}

.knowledge-toolbar__actions,
.knowledge-toolbar__keywords,
.quick-links,
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.knowledge-toolbar__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.knowledge-toolbar__search-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 58px;
  border-radius: 18px;
  padding: 0 10px 0 12px;
  background: color-mix(in srgb, var(--cardBg) 96%, transparent);
  border: 1px solid var(--knowledge-line);
}

.knowledge-toolbar__search-field:focus-within {
  border-color: var(--knowledge-line-strong);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--knowledge-primary) 10%, transparent);
}

.knowledge-toolbar__search-icon,
.quick-link-card__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--knowledge-primary-deep), var(--knowledge-primary));
  color: #fff;
  box-shadow: 0 10px 18px color-mix(in srgb, var(--knowledge-primary) 20%, transparent);
}

.knowledge-toolbar__search-field :deep(.el-input) {
  min-width: 0;
}

.knowledge-toolbar__search-field :deep(.el-input__wrapper) {
  min-height: 56px;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.knowledge-toolbar__search-button {
  min-width: 108px;
  min-height: 58px;
  border-radius: 18px;
  padding-inline: 20px;
}

.knowledge-toolbar__keywords-label,
.knowledge-toolbar__stat-card,
.featured-card__footer,
.knowledge-latest-item__time,
.knowledge-latest-item__icon {
  color: var(--knowledge-text-subtle);
  font-size: 13px;
}

.knowledge-toolbar__chip,
.knowledge-tag-list :deep(.el-tag) {
  border-radius: 999px;
  background: color-mix(in srgb, var(--knowledge-primary-paper) 54%, var(--cardBg));
  color: color-mix(in srgb, var(--knowledge-primary-deep) 74%, var(--knowledge-text-main));
  font-size: 12px;
}

.knowledge-toolbar__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.knowledge-toolbar__stat-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--knowledge-line);
}

.knowledge-toolbar__stat-card strong {
  color: var(--knowledge-text-main);
}

.knowledge-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 0.92fr);
  gap: 20px;
}

.knowledge-home-main,
.knowledge-home-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.knowledge-section {
  background: linear-gradient(180deg, color-mix(in srgb, var(--cardBg) 96%, transparent), color-mix(in srgb, var(--cardBg) 92%, transparent));
}

.knowledge-top-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.knowledge-top-main,
.knowledge-top-side__card,
.knowledge-hot-card,
.knowledge-latest-item,
.knowledge-catalog-card,
.quick-link-card {
  text-align: left;
  border-radius: 22px;
  background: color-mix(in srgb, var(--cardBg) 92%, transparent);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.knowledge-top-main:hover,
.knowledge-top-side__card:hover,
.knowledge-hot-card:hover,
.knowledge-latest-item:hover,
.knowledge-catalog-card:hover,
.quick-link-card:hover,
.knowledge-toolbar__chip:hover {
  transform: translateY(-2px);
  border-color: var(--knowledge-line-strong);
  box-shadow: var(--knowledge-shadow-hover);
}

.knowledge-top-main {
  overflow: hidden;
}

.knowledge-top-main__media {
  height: 260px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--knowledge-primary-paper) 76%, var(--cardBg)), color-mix(in srgb, var(--ColorLight8) 22%, var(--cardBg)));
}

.knowledge-top-main__media img,
.featured-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.knowledge-top-main__placeholder,
.featured-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: color-mix(in srgb, var(--knowledge-primary-deep) 70%, var(--knowledge-text-subtle));
}

.knowledge-top-main__content,
.knowledge-hot-card,
.knowledge-catalog-card,
.quick-link-card {
  padding: 18px;
}

.knowledge-top-main__meta,
.knowledge-top-side__meta,
.knowledge-hot-card__meta,
.knowledge-latest-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--knowledge-text-faint);
  font-size: 12px;
}

.knowledge-top-main__title,
.knowledge-hot-card__title,
.knowledge-latest-item__title,
.quick-link-card__title,
.knowledge-catalog-card__title {
  color: var(--knowledge-text-main);
  font-weight: 700;
}

.knowledge-top-main__title {
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.42;
}

.knowledge-top-main__summary,
.knowledge-top-side__summary,
.knowledge-hot-card__summary,
.knowledge-latest-item__summary,
.quick-link-card__desc {
  color: var(--knowledge-text-subtle);
  line-height: 1.76;
}

.knowledge-top-main__summary,
.knowledge-hot-card__summary,
.knowledge-latest-item__summary {
  margin-top: 10px;
}

.knowledge-top-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-top-side__card {
  padding: 16px;
}

.knowledge-top-side__title {
  margin-top: 10px;
  color: var(--knowledge-text-main);
  font-weight: 700;
  line-height: 1.58;
}

.knowledge-hot-grid,
.knowledge-catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.knowledge-hot-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.knowledge-latest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-latest-item {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 16px 18px;
}

.knowledge-latest-item__time {
  line-height: 1.7;
  font-weight: 700;
}

.knowledge-catalog-card__count {
  margin-top: 8px;
  color: var(--knowledge-text-faint);
  font-size: 13px;
}

.quick-link-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

@media (max-width: 1200px) {
  .knowledge-home-grid,
  .knowledge-top-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .knowledge-hot-grid,
  .knowledge-catalog-grid {
    grid-template-columns: 1fr;
  }

  .knowledge-latest-item {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-toolbar,
  .knowledge-home-main,
  .knowledge-home-side,
  .knowledge-home-grid {
    gap: 16px;
  }

  .knowledge-toolbar {
    padding: 18px;
  }

  .knowledge-toolbar__main,
  .knowledge-toolbar__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .knowledge-toolbar__search {
    grid-template-columns: 1fr;
  }

  .knowledge-toolbar__search-button {
    width: 100%;
  }

  .knowledge-top-main__media {
    height: 210px;
  }
}

:global(html.dark) .knowledge-home-page {
  --knowledge-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  --knowledge-shadow-hover: 0 18px 36px rgba(0, 0, 0, 0.32);
}
</style>
