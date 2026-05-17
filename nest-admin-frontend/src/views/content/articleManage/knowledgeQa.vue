<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { askKnowledgeQa } from './api'

const router = useRouter()
const loading = ref(false)
const question = ref('')
const answer = ref('')
const references = ref<any[]>([])
const matchedChunks = ref<any[]>([])
const errorMessage = ref('')

async function submitQuestion() {
  const normalizedQuestion = String(question.value || '').trim()
  if (!normalizedQuestion) {
    errorMessage.value = '请输入问题后再开始提问'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await askKnowledgeQa({ question: normalizedQuestion })
    const payload = res?.data || {}
    answer.value = payload.answer || ''
    references.value = payload.references || []
    matchedChunks.value = payload.matchedChunks || []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || '知识问答调用失败'
    answer.value = ''
    references.value = []
    matchedChunks.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(item: any) {
  if (!item?.articleId) return
  router.push({ path: '/content/articleManage/detail', query: { id: item.articleId } })
}
</script>

<template>
  <div class="knowledge-qa-page km-page" v-loading="loading">
    <div class="knowledge-qa-hero Gcard km-hero">
      <div class="knowledge-qa-hero__eyebrow km-hero__eyebrow">知识问答</div>
      <div class="knowledge-qa-hero__title km-hero__title">围绕当前知识中心内容发起正式问答</div>
      <div class="knowledge-qa-hero__desc km-hero__desc">回答只基于当前用户有权限访问的知识内容生成，并保留引用来源，便于继续追溯与阅读。</div>
    </div>

    <div class="knowledge-qa-query Gcard km-panel">
      <div class="knowledge-qa-query__header">
        <div>
          <div class="knowledge-qa-query__title">输入问题</div>
          <div class="knowledge-qa-query__desc">例如：上线失败后如何回滚？项目复盘中的高频风险怎么归类？</div>
        </div>
        <el-button @click="$router.push('/content/articleManage/manage')">返回后台</el-button>
      </div>
      <el-input
        v-model="question"
        type="textarea"
        :rows="5"
        resize="none"
        placeholder="请输入问题"
        @keyup.ctrl.enter="submitQuestion" />
      <div class="knowledge-qa-query__actions">
        <el-button type="primary" @click="submitQuestion">开始提问</el-button>
      </div>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
    </div>

    <div class="knowledge-qa-layout">
      <div class="knowledge-qa-answer Gcard km-panel">
        <div class="knowledge-qa-answer__title">回答结果</div>
        <div class="knowledge-qa-answer__content">{{ answer || '暂无回答，输入问题后可在这里查看结果。' }}</div>
      </div>

      <div class="knowledge-qa-side">
        <div class="knowledge-qa-references Gcard km-panel">
          <div class="knowledge-qa-references__title">引用来源</div>
          <div v-if="references.length" class="knowledge-qa-reference-list">
            <button
              v-for="item in references"
              :key="item.chunkId || `${item.articleId}-${item.chunkOrder}`"
              type="button"
              class="knowledge-qa-reference-item"
              @click="goDetail(item)">
              <div class="knowledge-qa-reference-item__title">{{ item.articleTitle || '-' }}</div>
              <div class="knowledge-qa-reference-item__meta">
                <span>{{ item.catalog?.name || '-' }}</span>
                <span>片段 #{{ item.chunkOrder || '-' }}</span>
                <span>score {{ item.score ?? '-' }}</span>
              </div>
              <div class="knowledge-qa-reference-item__summary">{{ item.chunkSummary || '暂无摘要' }}</div>
            </button>
          </div>
          <el-empty v-else description="暂无引用来源" />
        </div>

        <div class="knowledge-qa-matched Gcard km-panel">
          <div class="knowledge-qa-matched__title">命中片段</div>
          <div v-if="matchedChunks.length" class="knowledge-qa-matched__list">
            <div
              v-for="item in matchedChunks"
              :key="item.chunkId || item.score"
              class="knowledge-qa-matched__item">
              <div class="knowledge-qa-matched__score">score {{ item.score ?? '-' }}</div>
              <pre class="knowledge-qa-matched__text">{{ item.chunkText || '-' }}</pre>
            </div>
          </div>
          <el-empty v-else description="暂无命中片段" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.knowledge-qa-query,
.knowledge-qa-answer,
.knowledge-qa-references,
.knowledge-qa-matched {
  border: 1px solid color-mix(in srgb, var(--ColorLight8) 38%, var(--cardBg));
}

.knowledge-qa-query {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.knowledge-qa-query__header,
.knowledge-qa-query__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.knowledge-qa-query__title,
.knowledge-qa-answer__title,
.knowledge-qa-references__title,
.knowledge-qa-matched__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.knowledge-qa-query__desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.knowledge-qa-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: 16px;
}

.knowledge-qa-answer__content {
  white-space: pre-wrap;
  line-height: 1.75;
  color: var(--el-text-color-primary);
}

.knowledge-qa-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-qa-reference-list,
.knowledge-qa-matched__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-qa-reference-item {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--ColorLight8) 30%, var(--cardBg));
  border-radius: 14px;
  background: color-mix(in srgb, var(--cardBg) 92%, var(--ColorLight11));
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.knowledge-qa-reference-item__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.knowledge-qa-reference-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-qa-reference-item__summary {
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.knowledge-qa-matched__item {
  border-radius: 14px;
  padding: 14px;
  background: color-mix(in srgb, var(--el-fill-color-extra-light) 82%, var(--cardBg));
}

.knowledge-qa-matched__score {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-qa-matched__text {
  margin: 0;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .knowledge-qa-layout {
    grid-template-columns: 1fr;
  }

  .knowledge-qa-query__header,
  .knowledge-qa-query__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
