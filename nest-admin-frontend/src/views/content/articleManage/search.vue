<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleTagApi, getKnowledgeTypes, getList, getVisibilityTypes } from './api'
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

function search() {
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
  router.push({ path: '/content/articleManage/detail', query: { id: item.id } })
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
    <div class="knowledge-search-hero Gcard km-hero">
      <div class="knowledge-search-hero__eyebrow km-hero__eyebrow">知识搜索</div>
      <div class="knowledge-search-hero__title km-hero__title">按目录、标签和排序方式快速锁定可复用知识</div>
      <div class="knowledge-search-hero__desc km-hero__desc">先用关键词缩小范围，再结合分类、知识类型和标签逐步过滤，让高价值知识更快浮出水面。</div>

      <div class="knowledge-search-panel">
        <div class="knowledge-search-panel__header">
          <div>
            <div class="knowledge-search-panel__title">筛选条件</div>
            <div class="knowledge-search-panel__desc">推荐先输入关键词，再按分类和标签继续收敛。</div>
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
      </div>
    </div>

    <div v-if="topResult" class="knowledge-search-highlight Gcard km-panel">
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

    <div class="knowledge-search-result Gcard km-panel">
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
.knowledge-search-highlight__eyebrow {
  color: color-mix(in srgb, var(--Color) 80%, #22304a);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.knowledge-search-hero__title {
  max-width: 16ch;
}

.knowledge-search-hero__desc {
  max-width: 66ch;
  margin-bottom: 24px;
}

.knowledge-search-panel {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
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
  color: var(--el-text-color-secondary);
}

.knowledge-search-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-search-summary__placeholder {
  font-size: 13px;
}

.knowledge-search-summary__count {
  white-space: nowrap;
}

.knowledge-search-summary__count strong {
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.knowledge-search-highlight {
  background: color-mix(in srgb, var(--Color) 3%, #ffffff);
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
}

.knowledge-search-highlight__meta,
.result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-search-highlight__summary {
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-card {
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 18px;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.result-card:hover {
  border-color: color-mix(in srgb, var(--Color) 36%, var(--el-border-color));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.result-card__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 8px;
}

.result-card__summary {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin: 10px 0 12px;
}

.result-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
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
  .knowledge-search-panel,
  .knowledge-search-highlight {
    padding: 18px;
  }

  .knowledge-search-hero__title {
    max-width: none;
  }

  .knowledge-search-panel__actions {
    width: 100%;
  }
}
</style>
