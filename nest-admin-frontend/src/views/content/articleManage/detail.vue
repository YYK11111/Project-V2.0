<script setup lang="ts">
// @ts-nocheck
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applyArticleBorrow, getKnowledgeTypes, getOne, getStatus, getVisibilityTypes } from './api'
import { checkPermi } from '@/utils/permission'
import { sourceTypeMap, templateTypeMap } from '@/views/business/projectManage/fieldMaps'

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
const canEditArticle = computed(() => checkPermi(['business/articles/update']) && article.value?.canEdit !== false)
const canViewAiPreview = computed(() => checkPermi(['content/articles/aiDebug']) || checkPermi(['content/articles/viewAll']))

const articlePrimaryMetaList = computed(() => {
  if (!article.value) return []
  return [
    { label: '分类', value: article.value.catalog?.name || '-' },
    { label: '知识类型', value: knowledgeTypes.value[article.value.knowledgeType] || '-' },
    { label: '状态', value: statusMap.value[article.value.status] || '-' },
    { label: '更新时间', value: article.value.updateTime || '-' },
  ]
})

const articleSecondaryMetaList = computed(() => {
  if (!article.value) return []
  return [
    { label: '作者', value: article.value.author?.nickname || article.value.author?.name || '-' },
    { label: '维护人', value: article.value.maintainer?.nickname || article.value.maintainer?.name || '-' },
    { label: '可见范围', value: visibilityTypes.value[article.value.visibilityType] || '-' },
    { label: '来源类型', value: sourceTypeMap[article.value.sourceType] || article.value.sourceType || '-' },
    { label: '来源项目ID', value: article.value.sourceProjectId || '-' },
    { label: '来源对象ID', value: article.value.sourceId || '-' },
    { label: '模板类型', value: templateTypeMap[article.value.templateType] || article.value.templateType || '-' },
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

const readingTags = computed(() => article.value?.tags || [])

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

function goToSource() {
  if (!article.value?.sourceType || !article.value?.sourceId) return
  const sourcePathMap = {
    risk: '/projectManage/riskManage/form',
    change: '/changeManage/form',
    ticket: '/ticketManage/form',
    project_close_review: '/projectManage/detail',
  }
  const path = sourcePathMap[article.value.sourceType]
  if (!path) return
  if (article.value.sourceType === 'project_close_review') {
    router.push({ path, query: { id: article.value.sourceProjectId } })
    return
  }
  router.push({ path, query: { id: article.value.sourceId, action: 'view' } })
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
      <section class="knowledge-detail-hero Gcard">
        <div class="knowledge-detail-hero__breadcrumbs">
          <el-button text @click="router.back()">返回列表</el-button>
          <span>/</span>
          <span>{{ article.catalog?.name || '知识详情' }}</span>
        </div>

        <div class="knowledge-detail-hero__header">
          <div class="knowledge-detail-hero__main">
            <div class="knowledge-detail-hero__eyebrow">知识详情</div>
            <h1 class="knowledge-detail-hero__title">{{ article.title }}</h1>
            <p class="knowledge-detail-hero__summary">{{ article.summary || article.desc || '暂无摘要' }}</p>

            <div class="knowledge-detail-hero__chips">
              <el-tag v-for="item in articlePrimaryMetaList" :key="item.label" effect="plain" size="small">{{ item.label }}: {{ item.value }}</el-tag>
            </div>

            <div v-if="readingTags.length" class="knowledge-detail-hero__tags">
              <el-tag v-for="item in readingTags" :key="item.id" size="small">{{ item.name }}</el-tag>
            </div>
          </div>

          <div class="knowledge-detail-hero__side">
            <div class="knowledge-detail-meta-card">
              <div class="knowledge-detail-meta-card__title">内容信息</div>
              <div class="knowledge-detail-meta-card__list">
                <div v-for="item in articleSecondaryMetaList" :key="item.label" class="knowledge-detail-meta-card__item">
                  <span class="knowledge-detail-meta-card__label">{{ item.label }}</span>
                  <span class="knowledge-detail-meta-card__value">{{ item.value }}</span>
                </div>
              </div>
              <div class="knowledge-detail-meta-card__actions">
                <el-button @click="router.back()">返回</el-button>
                <el-button v-if="article.sourceType && (article.sourceId || article.sourceProjectId)" @click="goToSource">查看来源</el-button>
                <el-button v-if="canEditArticle" type="primary" @click="goEdit">编辑</el-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="knowledge-detail-layout">
        <section class="knowledge-detail-reading Gcard">
          <div class="knowledge-detail-reading__header">
            <div>
              <div class="knowledge-detail-reading__title">正文内容</div>
              <div class="knowledge-detail-reading__desc">按阅读视角展示正文结构、重点说明和图文内容，让知识消费更自然。</div>
            </div>
          </div>
          <div class="knowledge-detail-reading__body" v-html="article.content || '<p>暂无内容</p>'"></div>
        </section>

        <aside v-if="canViewAiPreview" class="knowledge-detail-side">
          <section class="knowledge-detail-ai Gcard">
            <div class="knowledge-detail-ai__header">
              <div>
                <div class="knowledge-detail-ai__title">AI 检索诊断</div>
                <div class="knowledge-detail-ai__desc">辅助检查切片、向量和摘要质量，确认内容是否适合检索和问答。</div>
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
          </section>
        </aside>
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
.knowledge-detail-page {
  --detail-primary: var(--Color);
  --detail-primary-deep: var(--ColorDark);
  --detail-paper: color-mix(in srgb, var(--ColorLight11) 55%, var(--cardBg));
  --detail-line: color-mix(in srgb, var(--ColorLight8) 42%, var(--cardBg));
  --detail-line-strong: color-mix(in srgb, var(--ColorLight6) 55%, var(--cardBg));
  --detail-text-strong: var(--FontBlack);
  --detail-text-main: var(--FontBlack2);
  --detail-text-subtle: var(--FontBlack5);
  --detail-text-faint: var(--FontBlack6);
  --detail-shadow: 0 16px 34px rgba(27, 39, 61, 0.06);
  --detail-shadow-hover: 0 22px 42px rgba(27, 39, 61, 0.1);
}

.knowledge-detail-hero,
.knowledge-detail-reading,
.knowledge-detail-ai,
.knowledge-detail-meta-card,
.knowledge-ai-stats__item,
.knowledge-chunk-item__text {
  border: 1px solid var(--detail-line);
  box-shadow: var(--detail-shadow);
}

.knowledge-detail-hero {
  padding: 28px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--detail-paper) 36%, var(--cardBg)), color-mix(in srgb, var(--cardBg) 98%, transparent));
}

.knowledge-detail-hero__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--detail-text-faint);
  font-size: 13px;
}

.knowledge-detail-hero__header {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.72fr);
  gap: 24px;
  margin-top: 18px;
}

.knowledge-detail-hero__eyebrow {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--detail-paper) 70%, var(--cardBg));
  color: color-mix(in srgb, var(--detail-primary-deep) 72%, var(--detail-text-main));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.knowledge-detail-hero__title {
  margin: 16px 0 0;
  font-size: 40px;
  line-height: 1.14;
  font-weight: 800;
  color: var(--detail-text-strong);
}

.knowledge-detail-hero__summary {
  max-width: 72ch;
  margin: 18px 0 0;
  color: var(--detail-text-subtle);
  font-size: 16px;
  line-height: 1.86;
}

.knowledge-detail-hero__chips,
.knowledge-detail-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-detail-hero__chips {
  margin-top: 20px;
}

.knowledge-detail-hero__chips :deep(.el-tag),
.knowledge-detail-hero__tags :deep(.el-tag) {
  border-color: var(--detail-line);
  background: color-mix(in srgb, var(--detail-paper) 55%, var(--cardBg));
  color: color-mix(in srgb, var(--detail-primary-deep) 70%, var(--detail-text-main));
}

.knowledge-detail-hero__tags {
  margin-top: 14px;
}

.knowledge-detail-meta-card {
  padding: 18px;
  border-radius: 22px;
  background: color-mix(in srgb, var(--cardBg) 94%, transparent);
}

.knowledge-detail-meta-card__title,
.knowledge-detail-reading__title,
.knowledge-detail-ai__title {
  color: var(--detail-text-main);
  font-size: 18px;
  font-weight: 700;
}

.knowledge-detail-meta-card__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.knowledge-detail-meta-card__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.knowledge-detail-meta-card__label,
.knowledge-ai-stats__label {
  color: var(--detail-text-faint);
  font-size: 12px;
}

.knowledge-detail-meta-card__value,
.knowledge-ai-stats__value {
  color: var(--detail-text-main);
  font-weight: 700;
  line-height: 1.6;
}

.knowledge-detail-meta-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.knowledge-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.75fr);
  gap: 20px;
}

.knowledge-detail-reading,
.knowledge-detail-ai {
  padding: 24px;
  background: color-mix(in srgb, var(--cardBg) 98%, transparent);
}

.knowledge-detail-reading__header,
.knowledge-detail-ai__header {
  margin-bottom: 18px;
}

.knowledge-detail-reading__desc,
.knowledge-detail-ai__desc,
.knowledge-chunk-item__summary {
  margin-top: 8px;
  color: var(--detail-text-subtle);
  line-height: 1.74;
}

.knowledge-detail-reading__body {
  max-width: 72ch;
  margin: 0 auto;
  color: var(--detail-text-main);
  font-size: 16px;
  line-height: 1.88;
}

.knowledge-detail-reading__body :deep(img) {
  max-width: 100%;
  display: block;
  margin: 28px auto;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.knowledge-detail-reading__body :deep(h1),
.knowledge-detail-reading__body :deep(h2),
.knowledge-detail-reading__body :deep(h3),
.knowledge-detail-reading__body :deep(h4) {
  margin: 1.8em 0 0.75em;
  line-height: 1.3;
  color: var(--detail-text-strong);
}

.knowledge-detail-reading__body :deep(blockquote) {
  margin: 24px 0;
  padding: 14px 18px;
  border-left: 4px solid var(--detail-primary);
  border-radius: 0 14px 14px 0;
  background: color-mix(in srgb, var(--detail-primary) 6%, var(--cardBg));
  color: var(--detail-text-subtle);
}

.knowledge-detail-reading__body :deep(pre) {
  padding: 18px 20px;
  border-radius: 16px;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #1e293b;
  overflow: auto;
}

.knowledge-detail-reading__body :deep(code) {
  padding: 2px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--detail-primary) 10%, var(--cardBg));
  color: color-mix(in srgb, var(--detail-primary-deep) 88%, #1f2937);
}

.knowledge-ai-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.knowledge-ai-stats__item {
  padding: 14px 16px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--cardBg) 94%, transparent);
}

.knowledge-chunk-list {
  margin-top: 12px;
}

.knowledge-chunk-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-chunk-item__text {
  padding: 14px 16px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--detail-paper) 30%, var(--cardBg));
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.74;
  color: var(--detail-text-main);
}

@media (max-width: 1200px) {
  .knowledge-detail-hero__header,
  .knowledge-detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-detail-hero,
  .knowledge-detail-reading,
  .knowledge-detail-ai {
    padding: 18px;
  }

  .knowledge-detail-hero__title {
    font-size: 30px;
  }

  .knowledge-ai-stats {
    grid-template-columns: 1fr;
  }
}

:global(html.dark) .knowledge-detail-page {
  --detail-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  --detail-shadow-hover: 0 18px 36px rgba(0, 0, 0, 0.32);
}
</style>
