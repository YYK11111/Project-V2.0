<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/styles/richContent.scss'
import { applyArticleBorrow, getKnowledgeTypes, getOne } from './api'
import { extractTocItems, type TocItem } from './viewToc'

interface BorrowForm {
  articleId: string
  requestedDays: number
  applyReason: string
}

interface AccessDeniedInfo {
  message?: string
  canBorrow?: boolean
}

interface KnowledgeTag {
  id?: string | number
  name?: string
}

interface KnowledgeUser {
  nickname?: string
  name?: string
}

interface KnowledgeCatalog {
  name?: string
}

interface KnowledgeArticle {
  id?: string | number
  title?: string
  summary?: string
  desc?: string
  content?: string
  updateTime?: string
  knowledgeType?: string
  catalog?: KnowledgeCatalog
  author?: KnowledgeUser
  tags?: KnowledgeTag[]
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const article = ref<KnowledgeArticle | null>(null)
const knowledgeTypes = ref<Record<string, string>>({})
const accessDeniedInfo = ref<AccessDeniedInfo | null>(null)
const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const borrowForm = ref<BorrowForm>({
  articleId: '',
  requestedDays: 1,
  applyReason: '',
})
const contentRef = ref<HTMLElement | null>(null)
const tocItems = ref<TocItem[]>([])
const activeHeadingId = ref('')
const tocDrawerVisible = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

const headingOffset = 24

const articleId = computed(() => {
  const rawId = route.query.id
  return Array.isArray(rawId) ? rawId[0] || '' : rawId || ''
})

const readingTags = computed(() => article.value?.tags || [])
const articleMetaList = computed(() => {
  if (!article.value) return []
  return [
    { label: '分类', value: article.value.catalog?.name || '-' },
    { label: '知识类型', value: knowledgeTypes.value[article.value.knowledgeType || ''] || '-' },
    { label: '作者', value: article.value.author?.nickname || article.value.author?.name || '-' },
    { label: '更新时间', value: article.value.updateTime || '-' },
  ]
})

function resetViewState() {
  tocItems.value = []
  activeHeadingId.value = ''
  tocDrawerVisible.value = false
}

function getScrollContainer() {
  return contentRef.value
}

function syncScrollContainer() {
  scrollContainer.value = getScrollContainer()
}

function bindScrollListeners() {
  const container = scrollContainer.value
  if (!container) return
  container.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  container.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
}

function unbindScrollListeners() {
  scrollContainer.value?.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
}

function loadKnowledgeTypes() {
  getKnowledgeTypes().then(({ data }) => {
    knowledgeTypes.value = data || {}
  })
}

function loadArticle() {
  if (!articleId.value) return
  loading.value = true
  getOne(articleId.value)
    .then(({ data }) => {
      article.value = data || null
      accessDeniedInfo.value = null
      borrowForm.value.articleId = String(data?.id || '')
    })
    .catch((error) => {
      const payload = error?.response?.data || {}
      if (payload?.code === 'KNOWLEDGE_FORBIDDEN') {
        accessDeniedInfo.value = {
          message: payload.message,
          canBorrow: payload.canBorrow,
        }
        borrowForm.value.articleId = String(payload.articleId || '')
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

function extractTocFromContent() {
  if (!contentRef.value) {
    tocItems.value = []
    activeHeadingId.value = ''
    return
  }

  tocItems.value = extractTocItems(contentRef.value)
  activeHeadingId.value = tocItems.value[0]?.id || ''
}

function updateActiveHeading() {
  const container = scrollContainer.value
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

function getHeadingElement(id: string) {
  if (!contentRef.value) return null
  return contentRef.value.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
}

function scrollToHeading(id: string) {
  const heading = getHeadingElement(id)
  const container = scrollContainer.value
  if (!heading || !container) return

  activeHeadingId.value = id
  const containerTop = container.getBoundingClientRect().top
  const headingTop = heading.getBoundingClientRect().top
  const top = container.scrollTop + headingTop - containerTop - headingOffset
  container.scrollTo({
    top,
    behavior: 'smooth',
  })
}

function handleTocClick(id: string) {
  tocDrawerVisible.value = false
  scrollToHeading(id)
}

async function syncTocAfterRender() {
  await nextTick()
  syncScrollContainer()
  extractTocFromContent()
  updateActiveHeading()
}

loadKnowledgeTypes()

watch(
  () => route.query.id,
  () => {
    article.value = null
    accessDeniedInfo.value = null
    resetViewState()
    loadArticle()
  },
  { immediate: true },
)

watch(
  () => article.value?.content,
  async (content) => {
    if (!content) {
      resetViewState()
      return
    }
    await syncTocAfterRender()
  },
)

watch(
  () => article.value?.id,
  (id) => {
    unbindScrollListeners()
    if (!id) return
    nextTick(() => {
      syncScrollContainer()
      bindScrollListeners()
      updateActiveHeading()
    })
  },
)

onActivated(() => {
  syncScrollContainer()
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
  <div class="knowledge-view-page" v-loading="loading">
    <el-empty v-if="accessDeniedInfo" description="当前知识无访问权限" class="Gcard knowledge-view-empty-state">
      <template #description>
        <div class="knowledge-view-empty-state__desc">
          <div class="knowledge-view-empty-state__title">当前知识无访问权限</div>
          <div>{{ accessDeniedInfo.message || '当前知识无访问权限' }}</div>
          <div v-if="accessDeniedInfo.canBorrow">可申请借阅，提交后由分类管理员审批。</div>
          <div v-else>当前分类未开启借阅，请联系分类管理员。</div>
        </div>
      </template>
      <el-button v-if="accessDeniedInfo.canBorrow" type="primary" @click="borrowDialogVisible = true">申请借阅</el-button>
    </el-empty>

    <template v-else-if="article">
      <section class="knowledge-view-hero Gcard">
        <div class="knowledge-view-hero__top">
          <el-button text @click="router.back()">返回</el-button>
          <el-button class="knowledge-view-hero__toc-btn" @click="tocDrawerVisible = true">目录</el-button>
        </div>

        <div class="knowledge-view-hero__eyebrow">知识查看</div>
        <h1 class="knowledge-view-hero__title">{{ article.title }}</h1>
        <p class="knowledge-view-hero__summary">{{ article.summary || article.desc || '暂无摘要' }}</p>

        <div class="knowledge-view-hero__chips">
          <el-tag v-for="item in articleMetaList" :key="item.label" effect="plain" size="small">{{ item.label }}: {{ item.value }}</el-tag>
        </div>

        <div v-if="readingTags.length" class="knowledge-view-hero__tags">
          <el-tag v-for="item in readingTags" :key="item.id || item.name" size="small">{{ item.name }}</el-tag>
        </div>
      </section>

      <div class="knowledge-view-layout">
        <aside class="knowledge-view-sidebar Gcard">
          <div class="knowledge-view-sidebar__header">文章目录</div>

          <div v-if="tocItems.length" class="knowledge-view-toc__list">
            <button
              v-for="item in tocItems"
              :key="item.id"
              type="button"
              class="knowledge-view-toc__item"
              :class="{ 'is-active': activeHeadingId === item.id }"
              :style="{ paddingLeft: `${item.level * 14}px` }"
              @click="scrollToHeading(item.id)"
            >
              <span class="knowledge-view-toc__item-text">{{ item.text }}</span>
            </button>
          </div>
          <div v-else class="knowledge-view-toc__empty">暂无目录</div>
        </aside>

        <main class="knowledge-view-main">
          <section class="knowledge-view-content-shell Gcard">
            <div ref="contentRef" class="knowledge-view-reading__body rich-content rich-content--view" v-html="article.content || '<p>暂无内容</p>'"></div>
          </section>
        </main>
      </div>
    </template>

    <el-drawer v-model="tocDrawerVisible" title="文章目录" size="82%" append-to-body>
      <div v-if="tocItems.length" class="knowledge-view-drawer-list">
        <button
          v-for="item in tocItems"
          :key="item.id"
          type="button"
          class="knowledge-view-toc__item"
          :class="{ 'is-active': activeHeadingId === item.id }"
          :style="{ paddingLeft: `${item.level * 14}px` }"
          @click="handleTocClick(item.id)"
        >
          <span class="knowledge-view-toc__item-text">{{ item.text }}</span>
        </button>
      </div>
      <div v-else class="knowledge-view-toc__empty">暂无目录</div>
    </el-drawer>

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
.knowledge-view-page {
  --view-paper: color-mix(in srgb, var(--ColorLight11) 52%, var(--cardBg));
  --view-line: color-mix(in srgb, var(--ColorLight8) 42%, var(--cardBg));
  --view-line-strong: color-mix(in srgb, var(--ColorLight6) 50%, var(--cardBg));
  --view-shadow: 0 18px 36px rgba(27, 39, 61, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.knowledge-view-empty-state {
  padding: 40px 20px;
}

.knowledge-view-empty-state__desc {
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.7;
}

.knowledge-view-empty-state__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--FontBlack);
}

.knowledge-view-hero {
  padding: 28px 30px;
  border: 1px solid var(--view-line);
  box-shadow: var(--view-shadow);
}

.knowledge-view-hero__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.knowledge-view-hero__toc-btn {
  display: none;
}

.knowledge-view-hero__eyebrow {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--Color);
}

.knowledge-view-hero__title {
  margin: 0;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.2;
  color: var(--FontBlack);
}

.knowledge-view-hero__summary {
  margin: 16px 0 0;
  max-width: 860px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--FontBlack5);
}

.knowledge-view-hero__chips,
.knowledge-view-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.knowledge-view-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.knowledge-view-main,
.knowledge-view-sidebar {
  min-width: 0;
}

.knowledge-view-sidebar,
.knowledge-view-content-shell {
  border: 1px solid var(--view-line);
  box-shadow: var(--view-shadow);
}

.knowledge-view-sidebar,
.knowledge-view-content-shell {
  height: calc(100vh - 240px);
  min-height: 560px;
}

.knowledge-view-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-view-sidebar__header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--view-line);
  font-size: 16px;
  font-weight: 700;
  color: var(--FontBlack);
}

.knowledge-view-content-shell {
  overflow: hidden;
  padding: 28px 30px;
}

.knowledge-view-reading__body {
  height: 100%;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.9;
  color: var(--FontBlack2);
  padding-right: 10px;
}

.knowledge-view-reading__body :deep(h1),
.knowledge-view-reading__body :deep(h2),
.knowledge-view-reading__body :deep(h3),
.knowledge-view-reading__body :deep(h4),
.knowledge-view-reading__body :deep(h5),
.knowledge-view-reading__body :deep(h6) {
  scroll-margin-top: 32px;
}

.knowledge-view-reading__body :deep(img) {
  box-shadow: 0 12px 28px rgba(27, 39, 61, 0.08);
}

.knowledge-view-toc__list,
.knowledge-view-drawer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 10px;
  overflow-y: auto;
}

.knowledge-view-toc__item {
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
  color: var(--FontBlack5);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.knowledge-view-toc__item:hover,
.knowledge-view-toc__item.is-active {
  background: var(--view-paper);
  color: var(--ColorDark);
}

.knowledge-view-toc__item-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-view-toc__empty {
  padding: 28px 20px 8px;
  font-size: 13px;
  color: var(--FontBlack6);
}

@media (max-width: 992px) {
  .knowledge-view-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-view-sidebar {
    display: none;
  }

  .knowledge-view-hero__toc-btn {
    display: inline-flex;
  }
}

@media (max-width: 768px) {
  .knowledge-view-page {
    gap: 16px;
  }

  .knowledge-view-hero,
  .knowledge-view-content-shell {
    padding: 22px 18px;
  }

  .knowledge-view-hero__title {
    font-size: 26px;
  }

  .knowledge-view-content-shell {
    height: calc(100vh - 220px);
    min-height: 420px;
  }

  .knowledge-view-reading__body {
    font-size: 14px;
  }
}
</style>
