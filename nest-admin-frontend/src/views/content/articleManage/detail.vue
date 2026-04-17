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
  <div class="knowledge-detail-page" v-loading="loading">
    <el-empty v-if="accessDeniedInfo" description="当前知识无访问权限" class="Gcard knowledge-empty-state">
      <template #description>
        <div class="knowledge-empty-state__desc">
          <div>{{ accessDeniedInfo.message || '当前知识无访问权限' }}</div>
          <div v-if="accessDeniedInfo.canBorrow">可申请借阅，提交后由分类管理员审批。</div>
          <div v-else>当前分类未开启借阅，请联系分类管理员。</div>
        </div>
      </template>
      <el-button v-if="accessDeniedInfo.canBorrow" type="primary" @click="borrowDialogVisible = true">申请借阅</el-button>
    </el-empty>

    <template v-else-if="article">
      <div class="knowledge-detail-header Gcard">
        <div class="knowledge-detail-header__main">
          <div class="knowledge-detail-header__title">{{ article.title }}</div>
          <div class="knowledge-detail-header__meta">
            <span>分类：{{ article.catalog?.name || '-' }}</span>
            <span>知识类型：{{ knowledgeTypes[article.knowledgeType] || '-' }}</span>
            <span>作者：{{ article.author?.nickname || article.author?.name || '-' }}</span>
            <span>维护人：{{ article.maintainer?.nickname || article.maintainer?.name || '-' }}</span>
            <span>可见范围：{{ visibilityTypes[article.visibilityType] || '-' }}</span>
            <span>状态：{{ statusMap[article.status] || '-' }}</span>
            <span>更新时间：{{ article.updateTime || '-' }}</span>
          </div>
          <div class="knowledge-detail-header__summary">{{ article.summary || article.desc || '暂无摘要' }}</div>
          <div class="knowledge-detail-header__tags">
            <el-tag v-for="item in article.tags || []" :key="item.id" size="small">{{ item.name }}</el-tag>
          </div>
        </div>
        <div class="knowledge-detail-header__actions">
          <el-button @click="router.back()">返回</el-button>
          <el-button v-if="canEditArticle" type="primary" @click="goEdit">编辑</el-button>
        </div>
      </div>

      <div class="knowledge-detail-content Gcard">
        <div class="knowledge-detail-content__title">正文内容</div>
        <div class="knowledge-detail-content__body" v-html="article.content || '<p>暂无内容</p>'"></div>
      </div>

      <div v-if="canViewAiPreview" class="knowledge-detail-content Gcard">
        <div class="knowledge-detail-content__title">AI 检索预览</div>
        <el-descriptions :column="3" border class="knowledge-ai-meta">
          <el-descriptions-item label="切片数量">{{ article.contentChunks?.length || 0 }}</el-descriptions-item>
          <el-descriptions-item label="向量状态">{{ article.embeddingStatus || 'pending' }}</el-descriptions-item>
          <el-descriptions-item label="向量版本">{{ article.embeddingVersion || 1 }}</el-descriptions-item>
          <el-descriptions-item label="检索权重">{{ article.retrievalWeight || 1 }}</el-descriptions-item>
        </el-descriptions>

        <el-collapse class="knowledge-chunk-list">
          <el-collapse-item v-for="chunk in article.contentChunks || []" :key="chunk.order" :name="String(chunk.order)" :title="`${chunk.title}（片段 ${chunk.order}）`">
            <div class="knowledge-chunk-item">
              <div class="knowledge-chunk-item__summary">{{ chunk.summary }}</div>
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
.knowledge-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.knowledge-detail-header__main {
  flex: 1;
}

.knowledge-detail-header__title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12px;
}

.knowledge-detail-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

.knowledge-detail-header__summary {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
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

.knowledge-detail-content__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.knowledge-detail-content__body {
  line-height: 1.8;
}

.knowledge-detail-content__body :deep(img) {
  max-width: 100%;
}

.knowledge-ai-meta {
  margin-bottom: 16px;
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
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.knowledge-empty-state {
  padding: 40px 20px;
}

.knowledge-empty-state__desc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.6;
}
</style>
