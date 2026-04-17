<script setup lang="ts">
// @ts-nocheck
import { onMounted, reactive, ref } from 'vue'
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
  <div class="Gcard ai-debug-page" v-loading="loading">
    <div class="page-title">AI 检索调试</div>
    <div class="query-bar">
      <el-input v-model="query.keyword" placeholder="输入关键词，查看命中的知识切片" clearable @keyup.enter="runSearch" />
      <el-select v-model="query.knowledgeType" clearable placeholder="知识类型">
        <el-option v-for="(label, key) in knowledgeTypes" :key="key" :label="label" :value="key" />
      </el-select>
      <el-select v-model="query.catalogId" clearable placeholder="分类">
        <el-option v-for="item in catalogs" :key="item.id" :label="item.name" :value="String(item.id)" />
      </el-select>
      <el-input-number v-model="query.limit" :min="1" :max="20" />
      <el-button type="primary" @click="runSearch">检索</el-button>
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
            <el-tag size="small">score: {{ item.score }}</el-tag>
            <el-tag size="small" type="warning">weight: {{ item.retrievalWeight }}</el-tag>
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
.ai-debug-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
}

.query-bar {
  display: grid;
  grid-template-columns: 2fr repeat(2, minmax(0, 1fr)) 120px auto;
  gap: 12px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.result-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.result-card__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.result-card__scores {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.result-card__summary {
  color: var(--el-text-color-secondary);
  line-height: 1.7;
  margin-bottom: 10px;
}

.result-card__text {
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  white-space: pre-wrap;
  line-height: 1.7;
  margin-bottom: 10px;
}

.result-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 1200px) {
  .query-bar {
    grid-template-columns: 1fr;
  }
}
</style>
