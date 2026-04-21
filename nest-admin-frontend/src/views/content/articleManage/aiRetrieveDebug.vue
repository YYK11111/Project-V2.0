<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getKnowledgeTypes, retrieveForAi } from './api'
import { getTrees } from './api.catalog'

const router = useRouter()
const loading = ref(false)
const knowledgeTypes = ref({})
const catalogs = ref<any[]>([])
const resultList = ref<any[]>([])
const query = reactive({
  keyword: '',
  knowledgeType: '',
  catalogId: '',
  limit: 10,
})

getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data || {}))
getTrees().then(({ data }) => (catalogs.value = data || []))

const topResult = computed(() => resultList.value[0])
const activeFilters = computed(() => {
  const filters: string[] = []
  if (query.keyword) filters.push(`关键词：${query.keyword}`)
  if (query.knowledgeType) filters.push(`知识类型：${knowledgeTypes.value[query.knowledgeType] || query.knowledgeType}`)
  if (query.catalogId) {
    const currentCatalog = catalogs.value.find((item: any) => String(item.id) === String(query.catalogId))
    filters.push(`分类：${currentCatalog?.name || query.catalogId}`)
  }
  filters.push(`返回数量：${query.limit}`)
  return filters
})

async function runSearch() {
  loading.value = true
  try {
    const res = await retrieveForAi({ ...query })
    resultList.value = res.data || []
  } finally {
    loading.value = false
  }
}

function goDetail(item: any) {
  router.push({ path: '/content/articleManage/detail', query: { id: item.articleId } })
}

onMounted(() => {
  runSearch()
})
</script>

<template>
  <div class="ai-debug-page km-page" v-loading="loading">
    <div class="ai-debug-hero Gcard km-hero">
      <div class="ai-debug-hero__eyebrow km-hero__eyebrow">AI 检索调试</div>
      <div class="ai-debug-hero__title km-hero__title">检查知识切片的命中结果、权重与摘要质量</div>
      <div class="ai-debug-hero__desc km-hero__desc">通过关键词、知识类型和分类快速观察 AI 检索结果，判断切片命中是否合理、权重是否偏差，以及摘要是否适合进一步喂给模型。</div>
      <div class="query-panel">
        <div class="query-panel__header">
          <div>
            <div class="query-panel__title">检索条件</div>
            <div class="query-panel__desc">先缩小范围，再观察命中顺序和切片内容。</div>
          </div>
          <el-button type="primary" @click="runSearch">开始检索</el-button>
        </div>
        <div class="query-bar">
          <el-input v-model="query.keyword" placeholder="输入关键词，查看命中的知识切片" clearable @keyup.enter="runSearch" />
          <el-select v-model="query.knowledgeType" clearable placeholder="知识类型">
            <el-option v-for="(label, key) in knowledgeTypes" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="query.catalogId" clearable placeholder="分类">
            <el-option v-for="item in catalogs" :key="item.id" :label="item.name" :value="String(item.id)" />
          </el-select>
          <el-input-number v-model="query.limit" :min="1" :max="20" />
        </div>
        <div class="query-panel__summary">
          <div class="query-panel__chips">
            <el-tag v-for="item in activeFilters" :key="item" effect="plain">{{ item }}</el-tag>
          </div>
          <div class="query-panel__count">当前命中 <strong>{{ resultList.length }}</strong> 条切片</div>
        </div>
      </div>
    </div>

    <div v-if="topResult" class="top-result Gcard km-panel">
      <div class="top-result__header">
        <div>
          <div class="top-result__eyebrow">首位结果</div>
          <div class="top-result__title">{{ topResult.articleTitle }}</div>
          <div class="top-result__meta">
            <span>分类：{{ topResult.catalog?.name || '-' }}</span>
            <span>类型：{{ knowledgeTypes[topResult.knowledgeType] || '-' }}</span>
            <span>切片：{{ topResult.chunkTitle }}（#{{ topResult.chunkOrder }}）</span>
          </div>
        </div>
        <div class="top-result__scores">
          <div class="score-pill">
            <span class="score-pill__label">score</span>
            <span class="score-pill__value">{{ topResult.score }}</span>
          </div>
          <div class="score-pill score-pill--warning">
            <span class="score-pill__label">weight</span>
            <span class="score-pill__value">{{ topResult.retrievalWeight }}</span>
          </div>
        </div>
      </div>
      <div class="top-result__summary">{{ topResult.chunkSummary || topResult.articleSummary || '暂无摘要' }}</div>
      <div class="top-result__footer">
        <span>向量状态：{{ topResult.embeddingStatus }}</span>
        <span>版本：{{ topResult.embeddingVersion }}</span>
        <span>更新时间：{{ topResult.updateTime || '-' }}</span>
        <el-button link type="primary" @click="goDetail(topResult)">知识详情</el-button>
      </div>
    </div>

    <div class="result-list">
      <div v-for="item in resultList" :key="`${item.articleId}-${item.chunkOrder}`" class="result-card">
        <div class="result-card__header">
          <div>
            <div class="result-card__title">{{ item.articleTitle }}</div>
            <div class="result-card__meta">
              <span>分类：{{ item.catalog?.name || '-' }}</span>
              <span>类型：{{ knowledgeTypes[item.knowledgeType] || '-' }}</span>
              <span>切片：{{ item.chunkTitle }}（#{{ item.chunkOrder }}）</span>
            </div>
          </div>
          <div class="result-card__scores">
            <div class="score-pill">
              <span class="score-pill__label">score</span>
              <span class="score-pill__value">{{ item.score }}</span>
            </div>
            <div class="score-pill score-pill--warning">
              <span class="score-pill__label">weight</span>
              <span class="score-pill__value">{{ item.retrievalWeight }}</span>
            </div>
          </div>
        </div>
        <div class="result-card__summary">{{ item.chunkSummary || item.articleSummary || '-' }}</div>
        <pre class="result-card__text">{{ item.chunkText || '-' }}</pre>
        <div class="result-card__footer">
          <span>向量状态：{{ item.embeddingStatus }}</span>
          <span>版本：{{ item.embeddingVersion }}</span>
          <span>更新时间：{{ item.updateTime || '-' }}</span>
          <el-button link type="primary" @click="goDetail(item)">知识详情</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top-result__eyebrow {
  color: color-mix(in srgb, var(--Color) 80%, #22304a);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.ai-debug-hero__title {
  max-width: 16ch;
}

.ai-debug-hero__desc {
  max-width: 68ch;
  margin-bottom: 24px;
}

.query-panel {
  padding: 20px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-fill-color-extra-light));
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

.query-bar {
  display: grid;
  grid-template-columns: 2fr repeat(2, minmax(0, 1fr)) 120px;
  gap: 14px;
  margin-bottom: 16px;
}

.query-panel__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.query-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.query-panel__count {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.query-panel__count strong {
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.top-result {
  background: color-mix(in srgb, var(--Color) 3%, var(--el-bg-color));
}

.top-result__header,
.result-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.top-result__title {
  font-size: 22px;
  line-height: 1.35;
  font-weight: 700;
  margin-bottom: 8px;
}

.top-result__meta,
.result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.top-result__scores,
.result-card__scores {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.top-result__summary {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin-bottom: 14px;
}

.top-result__footer,
.result-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.result-card {
  border-radius: 14px;
  padding: 18px;
  background: var(--el-bg-color);
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
  color: var(--el-text-color-regular);
  line-height: 1.7;
  margin-bottom: 12px;
}

.result-card__text {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: #334155;
  margin-bottom: 12px;
}

.score-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 88px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
}

.score-pill--warning {
  background: #fff8eb;
  border-color: #f3d19e;
}

.score-pill__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.score-pill__value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

@media (max-width: 1200px) {
  .query-bar {
    grid-template-columns: 1fr;
  }

  .query-panel__summary,
  .query-panel__header,
  .top-result__header,
  .result-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .top-result,
  .query-panel,
  .result-card {
    padding: 18px;
  }

  .ai-debug-hero__title {
    max-width: none;
  }
}
</style>
