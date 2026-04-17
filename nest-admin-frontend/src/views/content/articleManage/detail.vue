<script setup lang="ts">
// @ts-nocheck
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applyArticleBorrow, getKnowledgeTypes, getOne, getStatus, getVisibilityTypes } from './api'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const article = ref<any>(null)
const knowledgeTypes = ref({})
const visibilityTypes = ref({})
const statusMap = ref({})
const accessDeniedInfo = ref<{ message?: string; canBorrow?: boolean } | null>(null)
const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const borrowForm = ref({
  articleId: '',
  requestedDays: 1,
  applyReason: '',
})
const canEditArticle = computed(() => checkPermi(['business/articles/update']))
const canViewAiPreview = computed(() => checkPermi(['content/articles/aiDebug']) || checkPermi(['content/articles/viewAll']))
const articleMetaList = computed(() => {
  if (!article.value) return []
  return [
    { label: '分类', value: article.value.catalog?.name || '-' },
    { label: '知识类型', value: knowledgeTypes.value[article.value.knowledgeType] || '-' },
    { label: '作者', value: article.value.author?.nickname || article.value.author?.name || '-' },
    { label: '维护人', value: article.value.maintainer?.nickname || article.value.maintainer?.name || '-' },
    { label: '可见范围', value: visibilityTypes.value[article.value.visibilityType] || '-' },
    { label: '状态', value: statusMap.value[article.value.status] || '-' },
    { label: '更新时间', value: article.value.updateTime || '-' },
  ]
})

const aiStats = computed(() => {
  if (!article.value) return []
  return [
    { label: '切片数量', value: article.value.contentChunks?.length || 0 },
    { label: '向量状态', value: article.value.embeddingStatus || 'pending' },
    { label: '向量版本', value: article.value.embeddingVersion || 1 },
    { label: '检索权重', value: article.value.retrievalWeight || 1 },
  ]
})

getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data || {}))
getVisibilityTypes().then(({ data }) => (visibilityTypes.value = data || {}))
getStatus().then(({ data }) => (statusMap.value = data || {}))

function loadArticle() {
  if (!route.query.id) return
  loading.value = true
  getOne(route.query.id)
    .then(({ data }) => {
      article.value = data
      accessDeniedInfo.value = null
    })
    .catch((error) => {
      const payload = error?.response?.data || {}
      if (payload?.code === 'KNOWLEDGE_FORBIDDEN') {
        accessDeniedInfo.value = {
          message: payload.message,
          canBorrow: payload.canBorrow,
        }
        borrowForm.value.articleId = payload.articleId
        return
      }
      throw error
    })
    .finally(() => {
      loading.value = false
    })
}

function submitBorrow() {
  borrowLoading.value = true
  applyArticleBorrow(borrowForm.value)
    .then(() => {
      borrowDialogVisible.value = false
      $sdk.msgSuccess('借阅申请已提交，请等待分类管理员审批')
      router.push('/content/articleManage/myBorrows')
    })
    .finally(() => {
      borrowLoading.value = false
    })
}

function goEdit() {
  if (!article.value?.id) return
  router.push({ path: '/content/aev', query: { id: article.value.id } })
}

watch(
  () => route.query.id,
  () => {
    article.value = null
    loadArticle()
  },
  { immediate: true },
)
</script>

<template>
  <div class="knowledge-detail-page km-page" v-loading="loading">
    <el-empty v-if="accessDeniedInfo" description="当前知识无访问权限" class="Gcard knowledge-empty-state km-empty-state">
      <template #description>
        <div class="knowledge-empty-state__desc km-empty-state__desc">
          <div class="knowledge-empty-state__title km-empty-state__title">当前知识无访问权限</div>
          <div>{{ accessDeniedInfo.message || '当前知识无访问权限' }}</div>
          <div v-if="accessDeniedInfo.canBorrow">可申请借阅，提交后由分类管理员审批。</div>
          <div v-else>当前分类未开启借阅，请联系分类管理员。</div>
        </div>
      </template>
      <el-button v-if="accessDeniedInfo.canBorrow" type="primary" @click="borrowDialogVisible = true">申请借阅</el-button>
    </el-empty>

    <template v-else-if="article">
      <div class="knowledge-detail-header Gcard km-hero">
        <div class="knowledge-detail-header__main">
          <div class="knowledge-detail-header__eyebrow km-hero__eyebrow">知识详情</div>
          <div class="knowledge-detail-header__title km-hero__title">{{ article.title }}</div>
          <div class="knowledge-detail-header__summary km-hero__desc">{{ article.summary || article.desc || '暂无摘要' }}</div>
          <div class="knowledge-detail-header__meta-grid">
            <div v-for="item in articleMetaList" :key="item.label" class="knowledge-detail-header__meta-item">
              <div class="knowledge-detail-header__meta-label">{{ item.label }}</div>
              <div class="knowledge-detail-header__meta-value">{{ item.value }}</div>
            </div>
          </div>
          <div class="knowledge-detail-header__tags">
            <el-tag v-for="item in article.tags || []" :key="item.id" size="small">{{ item.name }}</el-tag>
          </div>
        </div>
        <div class="knowledge-detail-header__actions">
          <el-button @click="router.back()">返回</el-button>
          <el-button v-if="canEditArticle" type="primary" @click="goEdit">编辑</el-button>
        </div>
      </div>

      <div class="knowledge-detail-content Gcard km-panel">
        <div class="knowledge-detail-content__header km-panel__header">
          <div>
            <div class="knowledge-detail-content__title km-panel__title">正文内容</div>
            <div class="knowledge-detail-content__desc km-panel__desc">面向团队沉淀的完整内容，建议优先检查结构清晰度与段落可读性。</div>
          </div>
        </div>
        <div class="knowledge-detail-content__body" v-html="article.content || '<p>暂无内容</p>'"></div>
      </div>

      <div v-if="canViewAiPreview" class="knowledge-detail-content Gcard km-panel">
        <div class="knowledge-detail-content__header km-panel__header">
          <div>
            <div class="knowledge-detail-content__title km-panel__title">AI 检索预览</div>
            <div class="knowledge-detail-content__desc km-panel__desc">检查切片拆分、摘要质量和向量元信息是否适合检索与问答。</div>
          </div>
        </div>
        <div class="knowledge-ai-stats">
          <div v-for="item in aiStats" :key="item.label" class="knowledge-ai-stats__item">
            <div class="knowledge-ai-stats__label">{{ item.label }}</div>
            <div class="knowledge-ai-stats__value">{{ item.value }}</div>
          </div>
        </div>

        <el-collapse class="knowledge-chunk-list">
          <el-collapse-item v-for="chunk in article.contentChunks || []" :key="chunk.order" :name="String(chunk.order)" :title="`${chunk.title}（片段 ${chunk.order}）`">
            <div class="knowledge-chunk-item">
              <div class="knowledge-chunk-item__summary">{{ chunk.summary || '暂无摘要' }}</div>
              <pre class="knowledge-chunk-item__text">{{ chunk.text }}</pre>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </template>

    <BaDialog v-model="borrowDialogVisible" title="申请借阅" width="520" @confirm="submitBorrow">
      <template #form>
        <el-form :model="borrowForm" label-width="100px" v-loading="borrowLoading">
          <el-form-item label="借阅时长">
            <el-input-number v-model="borrowForm.requestedDays" :min="1" :max="30" style="width: 100%" />
          </el-form-item>
          <el-form-item label="申请理由">
            <el-input v-model="borrowForm.applyReason" type="textarea" :rows="4" placeholder="请输入借阅理由" />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.knowledge-detail-header__main {
  flex: 1;
}

.knowledge-detail-header__title {
  max-width: 18ch;
  margin-bottom: 16px;
}

.knowledge-detail-header__summary {
  max-width: 70ch;
  margin-bottom: 18px;
}

.knowledge-detail-header__meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.knowledge-detail-header__meta-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

.knowledge-detail-header__meta-label,
.knowledge-ai-stats__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.knowledge-detail-header__meta-value,
.knowledge-ai-stats__value {
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.knowledge-detail-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-detail-header__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-detail-content {
  padding: 24px;
}

.knowledge-detail-content__body {
  max-width: 72ch;
  line-height: 1.85;
  color: var(--el-text-color-primary);
}

.knowledge-detail-content__body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
}

.knowledge-detail-content__body :deep(h1),
.knowledge-detail-content__body :deep(h2),
.knowledge-detail-content__body :deep(h3),
.knowledge-detail-content__body :deep(h4) {
  line-height: 1.3;
  margin: 1.4em 0 0.7em;
}

.knowledge-detail-content__body :deep(p),
.knowledge-detail-content__body :deep(li) {
  line-height: 1.85;
}

.knowledge-detail-content__body :deep(pre) {
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-lighter);
  overflow: auto;
}

.knowledge-ai-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.knowledge-ai-stats__item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-lighter);
}

.knowledge-chunk-list {
  margin-top: 12px;
}

.knowledge-chunk-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-chunk-item__summary {
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.knowledge-chunk-item__text {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: #f8fafc;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

@media (max-width: 1200px) {
  .knowledge-detail-header__meta-grid,
  .knowledge-ai-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .knowledge-detail-header {
    flex-direction: column;
  }

  .knowledge-detail-header__actions {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .knowledge-detail-content {
    padding: 18px;
  }

  .knowledge-detail-header__title {
    max-width: none;
  }

  .knowledge-detail-header__meta-grid,
  .knowledge-ai-stats {
    grid-template-columns: 1fr;
  }
}
</style>
