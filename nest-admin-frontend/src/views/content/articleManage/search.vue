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
  <div class="knowledge-search-page" v-loading="loading">
    <div class="knowledge-search-header Gcard">
      <div class="knowledge-search-header__title">知识搜索</div>
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
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <div class="knowledge-search-summary">
        <span>共找到 <strong>{{ total }}</strong> 条知识</span>
        <span v-if="activeCatalogName">分类：{{ activeCatalogName }}</span>
      </div>
    </div>

    <div class="knowledge-search-result Gcard">
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-search-header__title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.knowledge-search-form {
  display: grid;
  grid-template-columns: 2fr repeat(4, minmax(0, 1fr)) auto auto;
  gap: 12px;
  margin-bottom: 12px;
}

.knowledge-search-summary {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
}

.result-card:hover {
  border-color: var(--Color);
}

.result-card__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.result-card__summary {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}

.result-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .knowledge-search-form {
    grid-template-columns: 1fr;
  }
}
</style>
