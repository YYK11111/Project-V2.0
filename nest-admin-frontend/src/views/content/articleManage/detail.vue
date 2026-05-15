<script setup lang="ts">
import type { IsleContentDocument } from '@/features/isle-editor/adapters/isleContent'
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/styles/richContent.scss'
import IsleArticleViewer from '@/features/isle-editor/components/IsleArticleViewer.vue'
import { applyArticleBorrow, getKnowledgeTypes, getOne, getStatus, getVisibilityTypes } from './api'
import { resolveKnowledgeViewMode } from './view.document'
import { extractTocItems } from './viewToc'
import { checkPermi } from '@/utils/permission'
import { sourceTypeMap, templateTypeMap } from '@/views/business/projectManage/fieldMaps'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

interface KnowledgeArticle {
  id?: string | number
  title?: string
  summary?: string
  desc?: string
  content?: string
  contentJson?: IsleContentDocument | null
  contentVersion?: number | null
  contentStatus?: string | null
  status?: string
  knowledgeType?: string
  visibilityType?: string
  sourceType?: string
  sourceId?: string
  sourceProjectId?: string
  templateType?: string
  updateTime?: string
  canEdit?: boolean
  embeddingStatus?: string
  embeddingVersion?: number
  retrievalWeight?: number
  contentChunks?: Array<{ order?: string | number; title?: string; summary?: string; text?: string }>
  tags?: Array<{ id?: string | number; name?: string }>
  catalog?: { name?: string }
  author?: { nickname?: string; name?: string }
  maintainer?: { nickname?: string; name?: string }
}

type ArticleStatusMap = Record<string, string>

function getSingleQueryValue(value: string | string[] | null | undefined): string {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const article = ref<KnowledgeArticle | null>(null)
const knowledgeTypes = ref<Record<string, string>>({})
const visibilityTypes = ref<Record<string, string>>({})
const statusMap = ref<ArticleStatusMap>({})
const accessDeniedInfo = ref<{ message?: string; canBorrow?: boolean } | null>(null)
const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const tocDrawerVisible = ref(false)
const borrowForm = ref({
  articleId: '',
  requestedDays: 1,
  requestedStartTime: '',
  applyReason: '',
})
const contentRef = ref<HTMLElement | null>(null)
const tocItems = ref<Array<{ id: string; text: string; level: number }>>([])
const activeHeadingId = ref('')
const headingOffset = 24
const canEditArticle = computed(() => checkPermi(['business/articles/update']) && article.value?.canEdit !== false)
const canViewAiPreview = computed(() => checkPermi(['content/articles/aiDebug']) || checkPermi(['content/articles/viewAll']))
const documentState = computed(() => resolveKnowledgeViewMode(article.value || {}))
const isKnowledgeDetailRoute = useCurrentRouteGuard(route, '/content/articleManage/detail')

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

function resetDetailState() {
  tocItems.value = []
  activeHeadingId.value = ''
  tocDrawerVisible.value = false
}

function extractTocFromContent() {
  if (!contentRef.value) {
    tocItems.value = []
    activeHeadingId.value = ''
    return
  }

  tocItems.value = extractTocItems(contentRef.value)
  activeHeadingId.value = tocItems.value[0]?.id || ''
}

function getHeadingElement(id: string) {
  if (!contentRef.value) return null
  return contentRef.value.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
}

function updateActiveHeading() {
  const container = contentRef.value
  if (!container || !tocItems.value.length) {
    activeHeadingId.value = ''
    return
  }

  const containerTop = container.getBoundingClientRect().top
  const threshold = containerTop + headingOffset
  let currentId = tocItems.value[0].id

  for (const item of tocItems.value) {
    const heading = getHeadingElement(item.id)
    if (!heading) continue
    if (heading.getBoundingClientRect().top <= threshold) {
      currentId = item.id
      continue
    }
    break
  }

  activeHeadingId.value = currentId
}

function handleScroll() {
  updateActiveHeading()
}

function bindScrollListeners() {
  const container = contentRef.value
  if (!container) return
  container.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  container.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
}

function unbindScrollListeners() {
  contentRef.value?.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
}

function scrollToHeading(id: string) {
  const heading = getHeadingElement(id)
  const container = contentRef.value
  if (!heading || !container) return

  activeHeadingId.value = id
  const containerTop = container.getBoundingClientRect().top
  const headingTop = heading.getBoundingClientRect().top
  const top = container.scrollTop + headingTop - containerTop - headingOffset
  container.scrollTo({ top, behavior: 'smooth' })
}

function handleTocClick(id: string) {
  tocDrawerVisible.value = false
  scrollToHeading(id)
}

async function syncTocAfterRender() {
  await nextTick()
  extractTocFromContent()
  updateActiveHeading()
}

function loadArticle() {
  if (!isKnowledgeDetailRoute()) return
  if (!route.query.id) return
  loading.value = true
  getOne(getSingleQueryValue(route.query.id))
    .then(({ data }) => {
      article.value = data
      accessDeniedInfo.value = null
    })
    .catch((error) => {
      const payload = error?.response?.data || {}
      if ((payload?.errorCode || payload?.code) === 'KNOWLEDGE_FORBIDDEN') {
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
      $sdk.msgSuccess('借阅申请已提交，请等待工作流审批')
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
    if (!isKnowledgeDetailRoute()) return
    article.value = null
    resetDetailState()
    loadArticle()
  },
  { immediate: true },
)

watch(
  documentState,
  async (state) => {
    if (!article.value) {
      resetDetailState()
      return
    }
    if (state.kind !== 'ready') {
      await nextTick()
      resetDetailState()
      return
    }
    await syncTocAfterRender()
  },
  { immediate: true },
)

watch(
  () => article.value?.id,
  (id) => {
    unbindScrollListeners()
    if (!id) return
    nextTick(() => {
      bindScrollListeners()
      updateActiveHeading()
    })
  },
)

onActivated(() => {
  if (!isKnowledgeDetailRoute()) return
  bindScrollListeners()
  updateActiveHeading()
})

onDeactivated(() => {
  unbindScrollListeners()
})

onBeforeUnmount(() => {
  unbindScrollListeners()
})
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
        <div class="knowledge-detail-hero__header">
          <div class="knowledge-detail-hero__main">
            <div class="knowledge-detail-hero__eyebrow">{{ article.catalog?.name || '知识详情' }}</div>
            <h1 class="knowledge-detail-hero__title">{{ article.title }}</h1>
            <p class="knowledge-detail-hero__summary">{{ article.summary || article.desc || '暂无摘要' }}</p>

            <div class="knowledge-detail-hero__chips">
              <div v-for="item in articlePrimaryMetaList" :key="item.label" class="knowledge-detail-chip">
                <span class="knowledge-detail-chip__label">{{ item.label }}</span>
                <span class="knowledge-detail-chip__value">{{ item.value }}</span>
              </div>
            </div>

            <div v-if="readingTags.length" class="knowledge-detail-hero__tags">
              <el-tag v-for="item in readingTags" :key="item.id" size="small">{{ item.name }}</el-tag>
            </div>
            <div class="knowledge-detail-hero__meta-grid">
              <div v-for="item in articleSecondaryMetaList" :key="item.label" class="knowledge-detail-hero__meta-item">
                <span class="knowledge-detail-hero__meta-label">{{ item.label }}</span>
                <span class="knowledge-detail-hero__meta-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="knowledge-detail-hero__actions">
              <el-button v-if="article.sourceType && (article.sourceId || article.sourceProjectId)" @click="goToSource">查看来源</el-button>
              <el-button v-if="canEditArticle" type="primary" @click="goEdit">编辑</el-button>
            </div>
          </div>
        </div>
      </section>

      <div class="knowledge-detail-layout">
        <aside class="knowledge-detail-sidebar Gcard">
          <div class="knowledge-detail-sidebar__header">文章目录</div>
          <div v-if="tocItems.length" class="knowledge-detail-toc__list">
            <button
              v-for="item in tocItems"
              :key="item.id"
              type="button"
              class="knowledge-detail-toc__item"
              :class="{ 'is-active': activeHeadingId === item.id }"
              :style="{ paddingLeft: `${item.level * 14}px` }"
              @click="scrollToHeading(item.id)"
            >
              <span class="knowledge-detail-toc__item-text">{{ item.text }}</span>
            </button>
          </div>
          <div v-else class="knowledge-detail-toc__empty">暂无目录</div>
        </aside>

        <section class="knowledge-detail-content-shell">
          <div class="knowledge-detail-content-shell__header">正文</div>
          <div ref="contentRef" class="knowledge-detail-reading__body rich-content rich-content--detail">
            <IsleArticleViewer
              v-if="documentState.kind === 'ready'"
              :content="documentState.document"
              class="knowledge-document-viewer" />
            <div v-else-if="documentState.kind === 'legacy_html'" class="knowledge-document-blocked">
              <div class="knowledge-document-blocked__title">{{ documentState.title }}</div>
              <div class="knowledge-document-blocked__desc">{{ documentState.description }}</div>
            </div>
            <div v-else-if="documentState.kind === 'invalid'" class="knowledge-document-blocked">
              <div class="knowledge-document-blocked__title">{{ documentState.title }}</div>
              <div class="knowledge-document-blocked__desc">{{ documentState.description }}</div>
            </div>
          </div>
        </section>

      </div>

      <section v-if="canViewAiPreview" class="knowledge-detail-ai Gcard">
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

      <el-drawer v-model="tocDrawerVisible" title="文章目录" size="82%" append-to-body>
        <div v-if="tocItems.length" class="knowledge-detail-drawer-list">
          <button
            v-for="item in tocItems"
            :key="item.id"
            type="button"
            class="knowledge-detail-toc__item"
            :class="{ 'is-active': activeHeadingId === item.id }"
            :style="{ paddingLeft: `${item.level * 14}px` }"
            @click="handleTocClick(item.id)"
          >
            <span class="knowledge-detail-toc__item-text">{{ item.text }}</span>
          </button>
        </div>
        <div v-else class="knowledge-detail-toc__empty">暂无目录</div>
      </el-drawer>
    </template>

    <BaDialog v-model="borrowDialogVisible" title="申请借阅" width="520" @confirm="submitBorrow">
      <template #form>
        <el-form :model="borrowForm" label-width="100px" v-loading="borrowLoading">
          <el-form-item label="借阅时长">
            <el-input-number v-model="borrowForm.requestedDays" :min="1" :max="30" style="width: 100%" />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker v-model="borrowForm.requestedStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="不填则审批通过后立即开始" style="width: 100%" />
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
.knowledge-detail-content-shell,
.knowledge-detail-ai,
.knowledge-detail-meta-panel,
.knowledge-ai-stats__item,
.knowledge-chunk-item__text {
  border: 1px solid var(--detail-line);
  box-shadow: var(--detail-shadow);
}

.knowledge-detail-hero {
  padding: 28px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--detail-paper) 36%, var(--cardBg)), color-mix(in srgb, var(--cardBg) 98%, transparent));
}

.knowledge-detail-hero__header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.knowledge-detail-hero__eyebrow {
  display: inline-flex;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: var(--detail-text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: none;
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
  margin-top: 18px;
}

.knowledge-detail-hero__tags :deep(.el-tag) {
  border-color: var(--detail-line);
  background: color-mix(in srgb, var(--detail-paper) 55%, var(--cardBg));
  color: color-mix(in srgb, var(--detail-primary-deep) 70%, var(--detail-text-main));
}

.knowledge-detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--detail-line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--detail-paper) 42%, var(--cardBg));
  font-size: 12px;
  line-height: 1.4;
}

.knowledge-detail-chip__label {
  color: var(--detail-text-faint);
}

.knowledge-detail-chip__value {
  color: var(--detail-text-main);
  font-weight: 600;
}

.knowledge-detail-hero__tags {
  margin-top: 10px;
}

.knowledge-detail-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.knowledge-detail-ai__title {
  color: var(--detail-text-main);
  font-size: 18px;
  font-weight: 700;
}

.knowledge-detail-hero__meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
  margin-top: 16px;
}

.knowledge-detail-hero__meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--detail-line);
  border-radius: 14px;
  background: color-mix(in srgb, var(--detail-paper) 28%, var(--cardBg));
}

.knowledge-detail-hero__meta-label,
.knowledge-ai-stats__label {
  color: var(--detail-text-faint);
  font-size: 12px;
}

.knowledge-detail-hero__meta-value,
.knowledge-ai-stats__value {
  color: var(--detail-text-main);
  font-weight: 700;
  line-height: 1.6;
}

.knowledge-detail-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.knowledge-detail-sidebar,
.knowledge-detail-content-shell,
.knowledge-detail-ai {
  border-radius: 22px;
}

.knowledge-detail-sidebar {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  min-height: 560px;
  padding: 24px;
  overflow: hidden;
  background: color-mix(in srgb, var(--cardBg) 96%, transparent);
}

.knowledge-detail-toc__list,
.knowledge-detail-drawer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 0 12px;
  overflow-y: auto;
}

.knowledge-detail-toc__item {
  width: 100%;
  padding-top: 10px;
  padding-right: 12px;
  padding-bottom: 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  text-align: left;
  font-size: 13px;
  line-height: 1.6;
  color: var(--detail-text-subtle);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.knowledge-detail-toc__item:hover,
.knowledge-detail-toc__item.is-active {
  background: var(--detail-paper);
  color: var(--detail-primary-deep);
}

.knowledge-detail-toc__item-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-detail-toc__empty {
  padding: 28px 20px 8px;
  font-size: 13px;
  color: var(--detail-text-faint);
}

.knowledge-detail-content-shell,
.knowledge-detail-ai {
  padding: 24px;
  background: color-mix(in srgb, var(--cardBg) 98%, transparent);
}

.knowledge-detail-content-shell__header,
.knowledge-detail-sidebar__header {
  padding-bottom: 14px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--detail-line);
  font-size: 16px;
  font-weight: 700;
  color: var(--detail-text-main);
}

.knowledge-detail-ai__header {
  margin-bottom: 18px;
}

.knowledge-detail-ai__desc,
.knowledge-chunk-item__summary {
  margin-top: 8px;
  color: var(--detail-text-subtle);
  line-height: 1.74;
}

.knowledge-detail-content-shell {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  min-height: 560px;
  overflow: hidden;
}

.knowledge-detail-reading__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  color: var(--detail-text-main);
  font-size: 16px;
  line-height: 1.88;
}

.knowledge-document-viewer {
  min-height: 100%;
}

.knowledge-document-viewer :deep(.ProseMirror) {
  min-height: 100%;
  outline: none;
}

.knowledge-document-blocked {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  border: 1px dashed var(--detail-line-strong);
  border-radius: 18px;
  background: var(--detail-paper);
  padding: 28px;
  color: var(--detail-text-subtle);
}

.knowledge-document-blocked__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--detail-text-strong);
}

.knowledge-document-blocked__desc {
  line-height: 1.8;
}

.knowledge-detail-reading__body :deep(img) {
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.knowledge-detail-reading__body :deep(h1),
.knowledge-detail-reading__body :deep(h2),
.knowledge-detail-reading__body :deep(h3),
.knowledge-detail-reading__body :deep(h4) {
  scroll-margin-top: 32px;
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
  .knowledge-detail-layout {
    grid-template-columns: 1fr;
  }

  .knowledge-detail-sidebar {
    display: none;
  }

  .knowledge-detail-hero__meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .knowledge-detail-hero,
  .knowledge-detail-content-shell,
  .knowledge-detail-ai {
    padding: 18px;
  }

  .knowledge-detail-hero__title {
    font-size: 30px;
  }

  .knowledge-detail-content-shell {
    height: calc(100vh - 240px);
    min-height: 420px;
  }

  .knowledge-detail-hero__meta-grid,
  .knowledge-ai-stats {
    grid-template-columns: 1fr;
  }

}

:global(html.dark) .knowledge-detail-page {
  --detail-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  --detail-shadow-hover: 0 18px 36px rgba(0, 0, 0, 0.32);
}
</style>
