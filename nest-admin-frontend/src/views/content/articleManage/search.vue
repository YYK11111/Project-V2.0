<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleTagApi, createSearchRecord, getHotKeywords, getKnowledgeTypes, getList, getVisibilityTypes } from './api'
import { getTrees } from './api.catalog'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const knowledgeTypes = ref({})
const visibilityTypes = ref({})
const tags = ref<any[]>([])
const catalogs = ref<any[]>([])
const total = ref(0)
const resultList = ref<any[]>([])
const hotKeywords = ref<string[]>([])
const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  catalogId: '',
  knowledgeType: '',
  tagIds: [],
  sortBy: 'latest',
})

getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data || {}))
getVisibilityTypes().then(({ data }) => (visibilityTypes.value = data || {}))
articleTagApi.getList({ pageNum: 1, pageSize: 1000 }).then(({ list = [] }: any) => (tags.value = list))
getTrees().then(({ data }) => (catalogs.value = data || []))
getHotKeywords().then(({ data }) => (hotKeywords.value = data || []))

const activeCatalogName = computed(() => {
  const stack = [...flatCatalogs.value]
  while (stack.length) {
    const current = stack.shift()
    if (String(current.id) === String(query.catalogId)) return current.displayName
  }
  return ''
})

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

const activeFilterChips = computed(() => {
  const chips: string[] = []
  if (query.keyword) chips.push(`关键词：${query.keyword}`)
  if (activeCatalogName.value) chips.push(`分类：${activeCatalogName.value}`)
  if (query.knowledgeType) chips.push(`知识类型：${knowledgeTypes.value[query.knowledgeType] || query.knowledgeType}`)
  if (query.tagIds?.length) {
    const selectedTags = tags.value.filter((item: any) => query.tagIds.includes(String(item.id))).map((item: any) => item.name)
    if (selectedTags.length) chips.push(`标签：${selectedTags.join('、')}`)
  }
  if (query.sortBy) {
    const sortLabelMap = {
      latest: '最近更新',
      authority: '权威优先',
      aiPreferred: 'AI优先',
      weight: '检索权重',
    }
    chips.push(`排序：${sortLabelMap[query.sortBy] || query.sortBy}`)
  }
  return chips
})

const topResult = computed(() => resultList.value[0])

function syncQueryFromRoute() {
  query.keyword = String(route.query.keyword || '')
  query.catalogId = String(route.query.catalogId || '')
  query.knowledgeType = String(route.query.knowledgeType || '')
  query.sortBy = String(route.query.sortBy || 'latest')
  query.tagIds = Array.isArray(route.query.tagIds)
    ? route.query.tagIds
    : String(route.query.tagIds || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
  query.pageNum = Number(route.query.pageNum || 1)
}

async function loadList() {
  loading.value = true
  try {
    const res = await getList({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      status: '2',
      keyword: query.keyword,
      catalogId: query.catalogId,
      knowledgeType: query.knowledgeType,
      tagIds: query.tagIds,
      sortBy: query.sortBy,
    })
    total.value = res.total || res.data?.total || 0
    resultList.value = res.list || res.data || []
  } finally {
    loading.value = false
  }
}

function updateRoute() {
  router.replace({
    path: '/content/articleManage/search',
    query: {
      keyword: query.keyword || undefined,
      catalogId: query.catalogId || undefined,
      knowledgeType: query.knowledgeType || undefined,
      sortBy: query.sortBy || undefined,
      tagIds: query.tagIds?.length ? query.tagIds.join(',') : undefined,
      pageNum: String(query.pageNum || 1),
    },
  })
}

async function search(recordKeyword = true) {
  const keyword = String(query.keyword || '').trim()
  if (recordKeyword && keyword) {
    await createSearchRecord({ keyword }).catch(() => {})
  }
  query.pageNum = 1
  updateRoute()
}

function reset() {
  query.keyword = ''
  query.catalogId = ''
  query.knowledgeType = ''
  query.tagIds = []
  query.sortBy = 'latest'
  query.pageNum = 1
  updateRoute()
}

function handlePageChange(pageNum: number) {
  query.pageNum = pageNum
  updateRoute()
}

function goDetail(item: any) {
  router.push({ path: '/content/articleManage/view', query: { id: item.id } })
}

function useHotKeyword(keyword: string) {
  query.keyword = keyword
  search(true)
}

watch(
  () => route.query,
  () => {
    syncQueryFromRoute()
    loadList()
  },
  { immediate: true },
)

onMounted(() => {
  syncQueryFromRoute()
})
</script>

<template>
  <div class="knowledge-search-page km-page" v-loading="loading">
    <div class="knowledge-search-hero Gcard">
      <div class="knowledge-search-hero__main">
        <div class="knowledge-search-hero__eyebrow">知识搜索</div>
        <div class="knowledge-search-hero__title">按关键词、分类和标签快速收敛知识范围</div>
        <div class="knowledge-search-hero__desc">先用关键词缩小范围，再结合分类、知识类型和标签继续过滤，把高价值内容更快浮出水面。</div>

        <div class="knowledge-search-panel">
          <div class="knowledge-search-panel__header">
            <div>
              <div class="knowledge-search-panel__title">筛选条件</div>
              <div class="knowledge-search-panel__desc">推荐先输入关键词，再按分类和标签逐步收敛。</div>
            </div>
            <div class="knowledge-search-panel__actions">
              <el-button type="primary" @click="search">搜索</el-button>
              <el-button @click="reset">重置</el-button>
            </div>
          </div>

          <div class="knowledge-search-form">
            <el-input v-model="query.keyword" placeholder="搜索知识标题、摘要、关键词" clearable @keyup.enter="search" />
            <el-select v-model="query.catalogId" clearable placeholder="分类">
              <el-option v-for="item in flatCatalogs" :key="item.id" :label="item.displayName" :value="String(item.id)" />
            </el-select>
            <el-select v-model="query.knowledgeType" clearable placeholder="知识类型">
              <el-option v-for="(value, key) of knowledgeTypes" :key="key" :label="value" :value="key" />
            </el-select>
            <el-select v-model="query.tagIds" multiple filterable collapse-tags collapse-tags-tooltip clearable placeholder="标签">
              <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-select v-model="query.sortBy" clearable placeholder="排序方式">
              <el-option label="最近更新" value="latest" />
              <el-option label="权威优先" value="authority" />
              <el-option label="AI优先" value="aiPreferred" />
              <el-option label="检索权重" value="weight" />
            </el-select>
          </div>

          <div class="knowledge-search-summary">
            <div class="knowledge-search-summary__chips">
              <el-tag v-for="item in activeFilterChips" :key="item" effect="plain">{{ item }}</el-tag>
              <span v-if="!activeFilterChips.length" class="knowledge-search-summary__placeholder">当前未设置额外筛选条件</span>
            </div>
            <div class="knowledge-search-summary__count">
              共找到 <strong>{{ total }}</strong> 条知识
            </div>
          </div>

          <div v-if="hotKeywords.length" class="knowledge-search-hotwords">
            <span class="knowledge-search-hotwords__label">热门搜索</span>
            <button v-for="item in hotKeywords" :key="item" type="button" class="knowledge-search-hotwords__chip" @click="useHotKeyword(item)">{{ item }}</button>
          </div>
        </div>
      </div>

      <div class="knowledge-search-hero__aside">
        <div class="search-insight-card">
          <div class="search-insight-card__eyebrow">搜索导读</div>
          <div class="search-insight-card__title">先看优先结果，再顺着标签和筛选条件继续深入</div>
          <div class="search-insight-card__stats">
            <div class="search-insight-stat">
              <span class="search-insight-stat__label">结果总数</span>
              <span class="search-insight-stat__value">{{ total }}</span>
            </div>
            <div class="search-insight-stat">
              <span class="search-insight-stat__label">当前排序</span>
              <span class="search-insight-stat__value">{{ activeFilterChips.find((item) => item.startsWith('排序：'))?.replace('排序：', '') || '最近更新' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="topResult" class="knowledge-search-highlight Gcard km-panel search-panel-card">
      <div class="knowledge-search-highlight__header">
        <div>
          <div class="knowledge-search-highlight__eyebrow">优先结果</div>
          <div class="knowledge-search-highlight__title">{{ topResult.title }}</div>
          <div class="knowledge-search-highlight__meta">
            <span>{{ topResult.catalog?.name || '-' }}</span>
            <span>{{ knowledgeTypes[topResult.knowledgeType] || '-' }}</span>
            <span>{{ visibilityTypes[topResult.visibilityType] || '-' }}</span>
            <span>{{ topResult.updateTime || '-' }}</span>
          </div>
        </div>
        <el-button type="primary" plain @click="goDetail(topResult)">查看详情</el-button>
      </div>
      <div class="knowledge-search-highlight__summary">
        {{ topResult.hasAccess === false ? '当前知识受限，暂无查看权限' : topResult.summary || topResult.desc || '暂无摘要' }}
      </div>
    </div>

    <div class="knowledge-search-result Gcard km-panel search-panel-card">
      <div class="knowledge-search-result__header km-panel__header">
        <div>
          <div class="knowledge-search-result__title km-panel__title">搜索结果</div>
          <div class="knowledge-search-result__desc km-panel__desc">按当前筛选条件返回的知识列表，优先浏览标题、摘要和标签是否准确。</div>
        </div>
      </div>
      <div v-if="resultList.length" class="result-list">
        <button v-for="item in resultList" :key="item.id" type="button" class="result-card" @click="goDetail(item)">
          <div class="result-card__title">{{ item.title }}</div>
          <div class="result-card__meta">
            <span>{{ item.catalog?.name || '-' }}</span>
            <span>{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
            <span>{{ visibilityTypes[item.visibilityType] || '-' }}</span>
            <span>{{ item.updateTime || '-' }}</span>
          </div>
          <div class="result-card__summary">{{ item.hasAccess === false ? '当前知识受限，暂无查看权限' : item.summary || item.desc || '暂无摘要' }}</div>
          <div class="result-card__tags">
            <el-tag v-if="item.hasAccess === false" type="warning" size="small">受限</el-tag>
            <el-tag v-if="item.canBorrow" type="info" size="small">可借阅</el-tag>
            <el-tag v-for="tag in item.tags || []" :key="tag.id" size="small">{{ tag.name }}</el-tag>
          </div>
        </button>
      </div>
      <el-empty v-else description="暂无匹配知识" />

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="query.pageNum"
          :page-size="query.pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-search-page {
  --search-primary: var(--Color);
  --search-primary-deep: var(--ColorDark);
  --search-primary-soft: var(--ColorLight3);
  --search-primary-mist: var(--ColorLight8);
  --search-base-bg: var(--cardBg);
  --search-paper: color-mix(in srgb, var(--ColorLight11) 55%, var(--search-base-bg));
  --search-line: color-mix(in srgb, var(--ColorLight8) 42%, var(--search-base-bg));
  --search-line-strong: color-mix(in srgb, var(--ColorLight6) 55%, var(--search-base-bg));
  --search-text-strong: var(--FontBlack);
  --search-text-main: var(--FontBlack2);
  --search-text-subtle: var(--FontBlack5);
  --search-text-faint: var(--FontBlack6);
  --search-shadow: 0 16px 34px rgba(27, 39, 61, 0.06);
  --search-shadow-hover: 0 22px 42px rgba(27, 39, 61, 0.1);
  --search-hero-wash:
    radial-gradient(circle at top left, color-mix(in srgb, var(--search-primary-mist) 48%, var(--search-base-bg)) 0%, transparent 34%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--search-primary-soft) 22%, var(--search-base-bg)) 0%, transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--search-base-bg) 98%, transparent) 0%, color-mix(in srgb, var(--search-paper) 36%, var(--search-base-bg)) 100%);
}

.knowledge-search-hero,
.search-panel-card,
.result-card,
.search-insight-card {
  border: 1px solid var(--search-line);
  box-shadow: var(--search-shadow);
}

.knowledge-search-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.75fr);
  gap: 20px;
  padding: 28px;
  background: var(--search-hero-wash);
}

.knowledge-search-hero__eyebrow,
.knowledge-search-highlight__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--search-paper) 70%, var(--search-base-bg));
  color: color-mix(in srgb, var(--search-primary-deep) 72%, var(--search-text-main));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.knowledge-search-hero__title {
  max-width: 16ch;
  color: var(--search-text-strong);
  font-size: 36px;
  line-height: 1.14;
  font-weight: 800;
}

.knowledge-search-hero__desc {
  max-width: 66ch;
  margin: 14px 0 0;
  margin-bottom: 22px;
  color: var(--search-text-subtle);
  line-height: 1.82;
}

.knowledge-search-panel {
  padding: 18px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--search-base-bg) 88%, transparent);
  border: 1px solid var(--search-line);
}

.knowledge-search-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.knowledge-search-panel__actions {
  display: flex;
  gap: 10px;
}

.knowledge-search-panel__title {
  color: var(--search-text-main);
  font-size: 16px;
  font-weight: 700;
}

.knowledge-search-panel__desc {
  margin-top: 6px;
  color: var(--search-text-faint);
  font-size: 13px;
  line-height: 1.7;
}

.knowledge-search-form {
  display: grid;
  grid-template-columns: 2fr repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.knowledge-search-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: var(--search-text-subtle);
}

.knowledge-search-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-search-summary__chips :deep(.el-tag) {
  border-color: var(--search-line);
  background: color-mix(in srgb, var(--search-paper) 55%, var(--search-base-bg));
  color: color-mix(in srgb, var(--search-primary-deep) 70%, var(--search-text-main));
}

.knowledge-search-summary__placeholder {
  font-size: 13px;
}

.knowledge-search-summary__count {
  white-space: nowrap;
}

.knowledge-search-summary__count strong {
  color: var(--search-text-strong);
  font-size: 18px;
}

.knowledge-search-hotwords {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.knowledge-search-hotwords__label {
  color: var(--search-text-subtle);
  font-size: 13px;
}

.knowledge-search-hotwords__chip {
  padding: 6px 10px;
  border: 1px solid var(--search-line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--search-paper) 55%, var(--search-base-bg));
  color: color-mix(in srgb, var(--search-primary-deep) 70%, var(--search-text-main));
  font-size: 12px;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}

.knowledge-search-hotwords__chip:hover {
  transform: translateY(-1px);
  border-color: var(--search-line-strong);
  background: color-mix(in srgb, var(--search-paper) 72%, var(--search-base-bg));
}

.knowledge-search-highlight {
  background: linear-gradient(180deg, color-mix(in srgb, var(--search-paper) 40%, var(--search-base-bg)), color-mix(in srgb, var(--search-base-bg) 98%, transparent));
}

.knowledge-search-highlight__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.knowledge-search-highlight__title {
  font-size: 22px;
  line-height: 1.35;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--search-text-strong);
}

.knowledge-search-highlight__meta,
.result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--search-text-faint);
  font-size: 12px;
}

.knowledge-search-highlight__summary {
  line-height: 1.8;
  color: var(--search-text-subtle);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-card {
  text-align: left;
  border-radius: 18px;
  padding: 18px;
  background: color-mix(in srgb, var(--search-base-bg) 94%, transparent);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.result-card:hover {
  border-color: var(--search-line-strong);
  box-shadow: var(--search-shadow-hover);
  transform: translateY(-2px);
}

.result-card__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  margin-bottom: 8px;
  color: var(--search-text-main);
}

.result-card__summary {
  line-height: 1.8;
  color: var(--search-text-subtle);
  margin: 10px 0 12px;
}

.result-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-card__tags :deep(.el-tag) {
  border-color: var(--search-line);
}

.search-insight-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--search-paper) 46%, var(--search-base-bg)), color-mix(in srgb, var(--search-base-bg) 96%, transparent));
}

.search-insight-card__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--search-paper) 70%, var(--search-base-bg));
  color: color-mix(in srgb, var(--search-primary-deep) 72%, var(--search-text-main));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-insight-card__title {
  color: var(--search-text-strong);
  font-size: 22px;
  line-height: 1.42;
  font-weight: 700;
}

.search-insight-card__stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.search-insight-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--search-line);
  background: color-mix(in srgb, var(--search-base-bg) 84%, transparent);
}

.search-insight-stat__label {
  color: var(--search-text-faint);
  font-size: 12px;
}

.search-insight-stat__value {
  color: var(--search-text-main);
  font-size: 15px;
  font-weight: 700;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
  .knowledge-search-hero,
  .knowledge-search-form {
    grid-template-columns: 1fr;
  }

  .knowledge-search-panel__header,
  .knowledge-search-summary,
  .knowledge-search-highlight__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .knowledge-search-hero,
  .knowledge-search-panel,
  .knowledge-search-highlight {
    padding: 18px;
  }

  .knowledge-search-hero__title {
    max-width: none;
    font-size: 30px;
  }

  .knowledge-search-panel__actions {
    width: 100%;
  }
}

:global(html.dark) .knowledge-search-page {
  --search-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  --search-shadow-hover: 0 18px 36px rgba(0, 0, 0, 0.32);
}
</style>
