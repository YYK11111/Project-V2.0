<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { yesOrNO, KEY_NO, KEY_YES } from '@/utils/dictionary'
import { listRole } from '@/api/system/role'
import { htmlToMarkdown } from '@/components/Editor/markdownInterop'
import DocumentEditorV2 from '@/features/document-editor-v2/DocumentEditorV2.vue'

import { applyArticleBorrow, articleTagApi, getKnowledgeTypes, getOne, getStatus, getVisibilityTypes, save } from './api'
import {
  createStructuredTemplateDocument,
  DOCUMENT_CONTENT_VERSION,
  getDocumentPlainText,
  getKnowledgeDocumentBlockMessage,
  isKnowledgeDocumentBlocked,
  mapKnowledgeDocumentErrorCode,
  resolveKnowledgeDocumentState,
} from './aev.document'

const router = useRouter()
const route = useRoute()
const formRef = ref<{ $refs: { formRef: { validate: () => Promise<void> } } } | null>(null)
const isEdited = ref(false)
const status = ref<Array<Record<string, unknown>>>([])
getStatus().then(({ data }) => (status.value = data))
const knowledgeTypes = ref<Record<string, string>>({})
getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data))
const visibilityTypes = ref<Record<string, string>>({})
getVisibilityTypes().then(({ data }) => (visibilityTypes.value = data))
const roles = ref<RoleOption[]>([])
listRole({ pageNum: 1, pageSize: 1000 }).then((res: { data?: RoleOption[] }) => (roles.value = res.data || []))
const tags = ref<TagOption[]>([])
articleTagApi.getList({ pageNum: 1, pageSize: 1000 }).then(({ list = [] }: { list?: TagOption[] }) => (tags.value = list))

import { getTrees } from './api.catalog'
import UserSelect from '@/components/UserSelect.vue'
import { useUserStore } from '@/stores/user'
import { getArticleTemplate, getArticleTemplateOptions } from './templates'

type RoleOption = {
  id: string | number
  name: string
}

type TagOption = {
  id: string | number
  name: string
}

type TreeNode = {
  id: string | number
  name: string
  defaultVisibilityType?: string
  defaultVisibleRoleIds?: string[]
  defaultVisibleUserIds?: string[]
  children?: TreeNode[]
}

type AccessDeniedInfo = {
  message?: string
  canBorrow?: boolean
} | null

type ArticleForm = {
  title?: string
  summary?: string
  content?: string
  contentJson: JSONContent
  contentVersion: number
  contentStatus: string
  contentText?: string
  tagIds: string[]
  visibilityType: string
  visibleRoleIds: string[]
  visibleUserIds: string[]
  knowledgeType: string
  versionNo: number
  retrievalWeight: number
  aiPreferred: string
  authorityLevel: string
  isTop: string
  topSort: number
  topStartTime: string
  topEndTime: string
  authorId: string
  maintainerId: string
  sourceType: string
  sourceId: string
  sourceProjectId: string
  templateType: string
  publishTime?: string
  order?: number
  thumb?: string
  keywords?: string
  status?: string
  catalogId?: string | number
  canEdit?: boolean
}

const trees = ref<TreeNode[]>([])
getTrees({}).then(({ data }) => (trees.value = data as TreeNode[]))
const userStore = useUserStore()
const templateOptions = ref(getArticleTemplateOptions())
const inheritedVisibility = ref(false)
const accessDeniedInfo = ref<AccessDeniedInfo>(null)
const isHydratingForm = ref(false)
const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const canEditCurrentArticle = computed(() => !route.query.id || form.value?.canEdit !== false)
const isSyncingEditor = ref(false)
const borrowForm = ref({
  articleId: '',
  requestedDays: 1,
  applyReason: '',
})

const documentState = computed(() => resolveKnowledgeDocumentState(form.value))
const editBlockedMessage = computed(() => {
  if (!isKnowledgeDocumentBlocked(documentState.value.kind)) return null
  return getKnowledgeDocumentBlockMessage('edit', documentState.value.kind)
})

function getSingleQueryValue(value: string | string[] | null | undefined): string {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function createDefaultForm(): ArticleForm {
  return {
    title: '',
    summary: '',
    content: '',
    contentJson: createStructuredTemplateDocument(''),
    contentVersion: DOCUMENT_CONTENT_VERSION,
    contentStatus: 'ready',
    contentText: '',
    tagIds: [],
    visibilityType: 'public',
    visibleRoleIds: [],
    visibleUserIds: [],
    knowledgeType: 'guide',
    versionNo: 1,
    retrievalWeight: 1,
    aiPreferred: '0',
    authorityLevel: '0',
    isTop: '0',
    topSort: 0,
    topStartTime: '',
    topEndTime: '',
    authorId: String(userStore.id || ''),
    maintainerId: String(userStore.id || ''),
    sourceType: '',
    sourceId: '',
    sourceProjectId: getSingleQueryValue(route.query.projectId),
    templateType: getSingleQueryValue(route.query.template),
    publishTime: '',
    order: 0,
    thumb: '',
    keywords: '',
    catalogId: '',
  }
}

const form = ref<ArticleForm>(createDefaultForm())

function handleDocumentEditorV2Update(contentJson: JSONContent) {
  form.value.contentJson = contentJson
  form.value.contentVersion = DOCUMENT_CONTENT_VERSION
  form.value.contentStatus = 'ready'
  form.value.contentText = getDocumentPlainText(contentJson)
}

function showEditBlockedMessage() {
  if (!editBlockedMessage.value) return
  $sdk.msgError(editBlockedMessage.value.title)
}

function getDocumentErrorMessage(error: unknown): string {
  const payload = (error as { response?: { data?: { code?: string | number; errorCode?: string } } })?.response?.data
  return mapKnowledgeDocumentErrorCode(payload?.errorCode || String(payload?.code || ''))
}

async function loadArticle() {
  isHydratingForm.value = true
  accessDeniedInfo.value = null
  inheritedVisibility.value = false
  if (!route.query.id) {
    form.value = createDefaultForm()
    applyTemplateFromRoute()
    isEdited.value = false
    isHydratingForm.value = false
    return
  }

  try {
    const { data } = await getOne(getSingleQueryValue(route.query.id))
    const nextForm = {
      ...createDefaultForm(),
      ...(data as Partial<ArticleForm>),
    }
    const nextState = resolveKnowledgeDocumentState(nextForm)
    form.value = {
      ...nextForm,
      contentJson: nextState.kind === 'ready' ? nextState.contentJson : nextForm.contentJson,
      contentVersion: nextState.kind === 'ready' ? nextState.contentVersion : nextForm.contentVersion,
      contentStatus: nextState.kind,
      contentText:
        nextState.kind === 'ready'
          ? getDocumentPlainText(nextState.contentJson)
          : nextForm.contentText || '',
    }
    isEdited.value = false
  } catch (error) {
    const payload = (error as { response?: { data?: { code?: string | number; errorCode?: string; message?: string; canBorrow?: boolean; articleId?: string } } })
      .response?.data || {}
    if ((payload?.errorCode || payload?.code) === 'KNOWLEDGE_FORBIDDEN') {
      accessDeniedInfo.value = {
        message: payload.message,
        canBorrow: payload.canBorrow,
      }
      borrowForm.value.articleId = payload.articleId
      return
    }
    throw error
  } finally {
    isHydratingForm.value = false
  }
}

function applyTemplateFromRoute() {
  const templateKey = getSingleQueryValue(route.query.template)
  const template = getArticleTemplate(templateKey)
  if (!template) return
  const contentJson = createStructuredTemplateDocument(template.content)
  form.value = {
    ...form.value,
    title: form.value.title || template.title,
    summary: form.value.summary || template.summary,
    knowledgeType: template.knowledgeType || form.value.knowledgeType,
    contentJson: form.value.contentText ? form.value.contentJson : contentJson,
    contentVersion: DOCUMENT_CONTENT_VERSION,
    contentStatus: 'ready',
    contentText: form.value.contentText || getDocumentPlainText(contentJson),
    templateType: form.value.templateType || templateKey,
  }
}

function handleApplyTemplate(templateKey: string | number | boolean | undefined) {
  if (documentState.value.kind !== 'ready') {
    showEditBlockedMessage()
    return
  }

  const normalizedTemplateKey = typeof templateKey === 'string' ? templateKey : String(templateKey || '')
  const template = getArticleTemplate(normalizedTemplateKey)
  if (!template) return
  const contentJson = createStructuredTemplateDocument(template.content)
  form.value = {
    ...form.value,
    title: template.title,
    summary: template.summary,
    knowledgeType: template.knowledgeType || form.value.knowledgeType,
    contentJson,
    contentVersion: DOCUMENT_CONTENT_VERSION,
    contentStatus: 'ready',
    contentText: getDocumentPlainText(contentJson),
    templateType: normalizedTemplateKey,
  }
  isEdited.value = true
}

watch(
  form,
  () => {
    if (isHydratingForm.value) return
    isEdited.value = true
  },
  { deep: true },
)

watch(
  () => form.value.contentJson,
  (value) => {
    if (!value || isHydratingForm.value) {
      return
    }

    form.value.contentText = getDocumentPlainText(value)
  },
  { deep: true },
)

watch(
  () => route.query.id,
  () => {
    loadArticle()
  },
  { immediate: true },
)

watch(
  () => form.value.catalogId,
  (catalogId) => {
    if (!catalogId || route.query.id || inheritedVisibility.value) return
    const stack = [...(trees.value || [])]
    while (stack.length) {
      const current = stack.shift()
      if (String(current.id) === String(catalogId)) {
        form.value.visibilityType = current.defaultVisibilityType || 'public'
        form.value.visibleRoleIds = current.defaultVisibleRoleIds || []
        form.value.visibleUserIds = current.defaultVisibleUserIds || []
        inheritedVisibility.value = true
        break
      }
      current.children?.length && stack.push(...current.children)
    }
  },
)

function submit(type?: string) {
  if (!canEditCurrentArticle.value) {
    $sdk.msgError('当前无编辑该知识的权限')
    return
  }
  if (isKnowledgeDocumentBlocked(documentState.value.kind)) {
    showEditBlockedMessage()
    return
  }
  formRef.value?.$refs.formRef.validate().then(() => {
    const payload = JSON.parse(JSON.stringify(form.value)) as ArticleForm
    type == 'draft' && (payload.status = '0')

    if (payload.publishTime && +new Date(payload.publishTime) <= +new Date()) {
      $sdk.msgError('定时发布时间不得早于当前时间')
      return
    }

    payload.contentVersion = DOCUMENT_CONTENT_VERSION
    payload.contentStatus = 'ready'
    payload.contentText = form.value.contentText || ''
    delete payload.content

    save(payload)
      .then(() => {
        $sdk.msgSuccess()
        router.back()
      })
      .catch((error) => {
        $sdk.msgError(getDocumentErrorMessage(error))
      })
  })
}

function cancel() {
  isEdited.value
    ? $sdk.confirm('当前已编辑的内容未保存，取消将丢弃，确定取消吗？').then(() => {
        router.back()
      })
    : router.back()
}

async function handleCopyMarkdown() {
  if (!navigator.clipboard?.writeText) {
    $sdk.msgError('当前环境不支持复制 Markdown')
    return
  }

  if (isKnowledgeDocumentBlocked(documentState.value.kind)) {
    showEditBlockedMessage()
    return
  }

  const markdown = htmlToMarkdown(form.value.contentText || '')
  try {
    await navigator.clipboard.writeText(markdown)
    $sdk.msgSuccess('已复制 Markdown')
  } catch {
    $sdk.msgError('复制 Markdown 失败，请重试')
  }
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
</script>

<template>
  <div class="knowledge-editor-page km-page">
    <el-empty v-if="accessDeniedInfo" description="当前知识无访问权限" class="Gcard knowledge-empty-state km-empty-state">
      <template #description>
        <div class="knowledge-empty-state__desc km-empty-state__desc">
          <div class="knowledge-empty-state__title km-empty-state__title">当前知识无访问权限</div>
          <div>{{ accessDeniedInfo.message || '当前知识无访问权限' }}</div>
          <div v-if="accessDeniedInfo.canBorrow">可申请借阅，后续版本将支持借阅申请。</div>
          <div v-else>当前分类未开启借阅，请联系分类管理员。</div>
        </div>
      </template>
      <el-button v-if="accessDeniedInfo.canBorrow" type="primary" @click="borrowDialogVisible = true">申请借阅</el-button>
    </el-empty>

    <BaForm ref="formRef" class="Gcard knowledge-editor-form km-panel" :model="form">
      <template v-if="!accessDeniedInfo">
        <div class="knowledge-form-grid">
        <section class="knowledge-form-section knowledge-form-section--summary">
          <div class="section-header">
            <div>
              <div class="section-title">基础信息</div>
              <div class="section-desc">定义知识标题、摘要、分类和标签，让内容更容易被定位与理解。</div>
            </div>
          </div>
          <div class="knowledge-form-fields">
            <BaFormItem label="知识模板">
              <el-select placeholder="选择模板快速创建" clearable style="width: 100%" :disabled="!canEditCurrentArticle" @change="handleApplyTemplate">
                <el-option v-for="item in templateOptions" :key="item.key" :label="item.label" :value="item.key" />
              </el-select>
            </BaFormItem>
            <BaInput v-model="form.title" maxlength="100" prop="title" label="标题" required :disabled="!canEditCurrentArticle"></BaInput>
            <BaInput v-model="form.summary" maxlength="200" prop="summary" label="摘要" :disabled="!canEditCurrentArticle"></BaInput>
            <BaFormItem prop="catalogId" label="分类" required>
              <el-tree-select
                v-model="form.catalogId"
                :data="trees"
                show-checkbox
                ref="menuRef"
                node-key="id"
                :disabled="!canEditCurrentArticle"
                :check-strictly="true"
                empty-text="加载中，请稍后"
                :props="{ label: 'name' }"
                placeholder="选择分类"></el-tree-select>
            </BaFormItem>
            <BaSelect v-model="form.knowledgeType" prop="knowledgeType" label="知识类型" :disabled="!canEditCurrentArticle">
              <el-option v-for="(value, key) of knowledgeTypes" :key="key" :label="value" :value="key"></el-option>
            </BaSelect>
            <BaFormItem prop="tagIds" label="标签">
              <el-select v-model="form.tagIds" multiple filterable clearable collapse-tags collapse-tags-tooltip placeholder="选择标签" style="width: 100%" :disabled="!canEditCurrentArticle">
                <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id"></el-option>
              </el-select>
            </BaFormItem>
            <BaFormItem prop="thumb" label="封面">
              <Upload v-model:fileUrl="form.thumb" :params="{ module: 'article' }" :disabled="!canEditCurrentArticle"></Upload>
            </BaFormItem>
          </div>
        </section>

        <section class="knowledge-form-section knowledge-form-section--summary">
          <div class="section-header">
            <div>
              <div class="section-title">治理信息</div>
              <div class="section-desc">控制可见范围、责任人和发布时间，保证后续治理可追溯。</div>
            </div>
          </div>
          <div class="knowledge-form-fields">
            <BaSelect v-model="form.visibilityType" prop="visibilityType" label="可见范围" :disabled="!canEditCurrentArticle">
              <el-option v-for="(value, key) of visibilityTypes" :key="key" :label="value" :value="key"></el-option>
            </BaSelect>
            <BaFormItem label="作者">
              <UserSelect v-model="form.authorId" placeholder="请选择作者" clearable :disabled="!canEditCurrentArticle" />
            </BaFormItem>
            <BaFormItem label="维护人">
              <UserSelect v-model="form.maintainerId" placeholder="请选择维护人" clearable :disabled="!canEditCurrentArticle" />
            </BaFormItem>
            <BaInput v-model="form.keywords" maxlength="200" prop="keywords" label="关键词" :disabled="!canEditCurrentArticle"></BaInput>
            <BaDatePicker
              v-model="form.publishTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              :disabled="!canEditCurrentArticle"
              :disabledDate="(time) => time <= new Date(new Date().setDate(new Date().getDate() - 1))"
              prop="publishTime"
              label="定时发布" />
            <BaInputNumber v-model="form.order" :precision="2" :step="1" :min="0" prop="order" label="排序" required :disabled="!canEditCurrentArticle" />
            <BaFormItem v-if="form.visibilityType === 'role'" label="可见角色">
              <el-select v-model="form.visibleRoleIds" multiple filterable clearable collapse-tags collapse-tags-tooltip placeholder="选择角色" style="width: 100%" :disabled="!canEditCurrentArticle">
                <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </BaFormItem>
            <BaFormItem v-if="form.visibilityType === 'specified'" label="指定可见人员">
              <UserSelect v-model="form.visibleUserIds" placeholder="请选择用户" clearable multiple :disabled="!canEditCurrentArticle" />
            </BaFormItem>
            <BaFormItem label="来源类型">
              <el-input :model-value="form.sourceType || '-'" disabled />
            </BaFormItem>
            <BaFormItem label="来源项目ID">
              <el-input :model-value="form.sourceProjectId || '-'" disabled />
            </BaFormItem>
            <BaFormItem label="来源对象ID">
              <el-input :model-value="form.sourceId || '-'" disabled />
            </BaFormItem>
            <BaFormItem label="模板类型">
              <el-input :model-value="form.templateType || '-'" disabled />
            </BaFormItem>
          </div>
        </section>
        </div>

        <section class="knowledge-form-section knowledge-form-section--full knowledge-form-section--content-main">
          <div class="section-header">
            <div>
              <div class="section-title">知识内容</div>
              <div class="section-desc">正文是知识复用的核心，建议按清晰的小节结构编写，减少大段堆叠。</div>
            </div>
          </div>
          <el-form-item prop="contentJson" label="正文" style="max-width: none !important">
            <DocumentEditorV2
              v-model:content-json="form.contentJson"
              :disabled="!canEditCurrentArticle"
              :placeholder="'请输入结构化知识正文'"
              @update:content-json="handleDocumentEditorV2Update" />
          </el-form-item>
        </section>

        <section class="knowledge-form-section knowledge-form-section--full">
          <div class="section-header">
            <div>
              <div class="section-title">首页推荐配置</div>
              <div class="section-desc">控制知识是否进入首页置顶区，以及置顶排序和有效时间，避免把首页推荐配置混在 AI 参数里。</div>
            </div>
          </div>
          <div class="knowledge-top-grid">
            <el-form-item label="置顶知识">
              <el-switch v-model="form.isTop" active-value="1" inactive-value="0" :disabled="!canEditCurrentArticle" />
            </el-form-item>
            <BaInputNumber v-model="form.topSort" :precision="0" :step="1" :min="0" prop="topSort" label="置顶排序" :disabled="!canEditCurrentArticle" />
            <BaDatePicker v-model="form.topStartTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" prop="topStartTime" label="置顶开始" :disabled="!canEditCurrentArticle" />
            <BaDatePicker v-model="form.topEndTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" prop="topEndTime" label="置顶结束" :disabled="!canEditCurrentArticle" />
          </div>
        </section>

        <section class="knowledge-form-section knowledge-form-section--full">
          <div class="section-header">
            <div>
              <div class="section-title">AI 预留信息</div>
              <div class="section-desc">用于调优检索排序和后续问答质量，避免把 AI 配置和正文信息混在一起。</div>
            </div>
          </div>
          <div class="knowledge-ai-grid">
            <BaInputNumber v-model="form.retrievalWeight" :precision="0" :step="1" :min="1" prop="retrievalWeight" label="检索权重" :disabled="!canEditCurrentArticle" />
            <el-form-item label="AI优先">
              <el-switch v-model="form.aiPreferred" active-value="1" inactive-value="0" :disabled="!canEditCurrentArticle" />
            </el-form-item>
            <el-form-item label="权威知识">
              <el-switch v-model="form.authorityLevel" active-value="1" inactive-value="0" :disabled="!canEditCurrentArticle" />
            </el-form-item>
            <BaFormItem label="版本号">
              <el-input v-model="form.versionNo" disabled />
            </BaFormItem>
          </div>
          <BaFormItem label="纯文本预览">
            <pre class="content-text-preview">{{ form.contentText || '保存后自动生成纯文本索引' }}</pre>
          </BaFormItem>
        </section>
      </template>
    </BaForm>
      <OperateBar v-if="!accessDeniedInfo && canEditCurrentArticle" class="knowledge-editor-operate-bar">
        <ElButton type="primary" @click="cancel">取消</ElButton>
        <ElButton @click="handleCopyMarkdown">复制 Markdown</ElButton>
        <ElButton type="primary" @click="submit('draft')">保存草稿</ElButton>
        <ElButton type="primary" @click="submit()">发布</ElButton>
      </OperateBar>

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
:deep(.BaForm) {
  max-width: none !important;
  .el-form-item {
    max-width: 800px;
  }
}

.knowledge-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.knowledge-form-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.knowledge-form-fields :deep(.el-form-item) {
  margin-bottom: 0;
}

.knowledge-form-section {
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
  border-radius: 14px;
  background: var(--el-bg-color);
}

.knowledge-form-section--full {
  margin-top: 20px;
}

.knowledge-form-section--full + .knowledge-form-section--full {
  margin-top: 24px;
}

.knowledge-form-section--summary {
  margin-top: 0;
}

.knowledge-form-section--content-main {
  margin-top: 24px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.knowledge-form-section--full .section-desc {
  white-space: nowrap;
}

.knowledge-ai-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.knowledge-top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.knowledge-form-section :deep(.tox-tinymce),
.knowledge-form-section :deep(.w-e-text-container),
.knowledge-form-section :deep(.w-e-bar) {
  border-radius: 12px;
}

.knowledge-editor-operate-bar :deep(.el-button) {
  min-width: 112px;
}

.knowledge-editor-operate-bar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.knowledge-editor-operate-bar :deep(.el-button-group),
.knowledge-editor-operate-bar :deep(.el-space),
.knowledge-editor-operate-bar {
  gap: 12px;
}

.content-text-preview {
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

@media (max-width: 1024px) {
  .knowledge-form-grid,
  .knowledge-top-grid,
  .knowledge-ai-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-form-section,
  .knowledge-empty-state {
    padding: 18px;
  }

  .knowledge-form-section,
  .knowledge-form-section,
  .knowledge-form-section--full {
    margin-top: 16px;
  }

  .knowledge-form-section--full + .knowledge-form-section--full {
    margin-top: 18px;
  }

  .knowledge-form-fields {
    gap: 16px;
  }

  .knowledge-form-section--full .section-desc {
    white-space: normal;
  }

  .knowledge-editor-operate-bar :deep(.el-button) {
    min-width: 0;
  }

  .knowledge-editor-operate-bar :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
