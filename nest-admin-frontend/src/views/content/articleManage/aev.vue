<script setup lang="ts">
// @ts-nocheck
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
import { yesOrNO, KEY_NO, KEY_YES } from '@/utils/dictionary'
import { listRole } from '@/api/system/role'

import { applyArticleBorrow, articleTagApi, getKnowledgeTypes, getOne, getStatus, getVisibilityTypes, save } from './api'
const formRef = ref()
const isEdited = ref(false)
const status = ref([])
getStatus().then(({ data }) => (status.value = data))
const knowledgeTypes = ref([])
getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data))
const visibilityTypes = ref([])
getVisibilityTypes().then(({ data }) => (visibilityTypes.value = data))
const roles = ref([])
listRole({ pageNum: 1, pageSize: 1000 }).then((res: any) => (roles.value = res.data || []))
const tags = ref([])
articleTagApi.getList({ pageNum: 1, pageSize: 1000 }).then(({ list = [] }: any) => (tags.value = list))

import { getTrees } from './api.catalog'
import { watch } from 'vue'
import UserSelect from '@/components/UserSelect.vue'
import { useUserStore } from '@/stores/user'
const trees = ref([])
getTrees().then(({ data }) => (trees.value = data))
const userStore = useUserStore()
const inheritedVisibility = ref(false)
const accessDeniedInfo = ref<{ message?: string; canBorrow?: boolean } | null>(null)
const isHydratingForm = ref(false)
const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const borrowForm = ref({
  articleId: '',
  requestedDays: 1,
  applyReason: '',
})

function createDefaultForm() {
  return {
    content: '',
    tagIds: [],
    visibilityType: 'public',
    visibleRoleIds: [],
    visibleUserIds: [],
    knowledgeType: 'guide',
    versionNo: 1,
    retrievalWeight: 1,
    aiPreferred: '0',
    authorityLevel: '0',
    authorId: userStore.id,
    maintainerId: userStore.id,
  }
}

const form = ref(createDefaultForm())

async function loadArticle() {
  isHydratingForm.value = true
  accessDeniedInfo.value = null
  inheritedVisibility.value = false
  if (!route.query.id) {
    form.value = createDefaultForm()
    isEdited.value = false
    isHydratingForm.value = false
    return
  }

  try {
    const { data } = await getOne(route.query.id)
    form.value = data
    isEdited.value = false
  } catch (error) {
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
  } finally {
    isHydratingForm.value = false
  }
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

function submit(type) {
  formRef.value.$refs.formRef.validate().then(() => {
    let _form = JSON.parse(JSON.stringify(form.value))
    type == 'draft' && (_form.status = '0')

    if (_form.publishTime && +new Date(_form.publishTime) <= +new Date()) {
      $sdk.msgError('定时发布时间不得早于当前时间')
      return
    }

    save(_form).then(() => {
      $sdk.msgSuccess()
      router.back()
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

    <div v-if="!accessDeniedInfo" class="knowledge-editor-hero Gcard km-hero">
      <div class="knowledge-editor-hero__eyebrow km-hero__eyebrow">知识编辑</div>
      <div class="knowledge-editor-hero__title km-hero__title">统一维护知识内容、可见范围与 AI 检索元信息</div>
      <div class="knowledge-editor-hero__desc km-hero__desc">先补齐标题、摘要、分类和可见范围，再完善正文内容与 AI 检索相关配置，保证知识既可阅读，也能被检索系统稳定消费。</div>
      <div class="knowledge-editor-hero__status">
        <div class="knowledge-editor-hero__status-item">
          <span class="knowledge-editor-hero__status-label">当前模式</span>
          <span class="knowledge-editor-hero__status-value">{{ route.query.id ? '编辑已有知识' : '新增知识' }}</span>
        </div>
        <div class="knowledge-editor-hero__status-item">
          <span class="knowledge-editor-hero__status-label">编辑状态</span>
          <span class="knowledge-editor-hero__status-value">{{ isEdited ? '有未保存变更' : '内容已同步' }}</span>
        </div>
      </div>
    </div>

    <BaForm ref="formRef" class="Gcard knowledge-editor-form km-panel" :model="form">
      <template v-if="!accessDeniedInfo">
        <div class="knowledge-form-grid">
        <section class="knowledge-form-section">
          <div class="section-header">
            <div>
              <div class="section-title">基础信息</div>
              <div class="section-desc">定义知识标题、摘要、分类和标签，让内容更容易被定位与理解。</div>
            </div>
          </div>
          <div class="knowledge-form-fields">
            <BaInput v-model="form.title" maxlength="100" prop="title" label="标题" required></BaInput>
            <BaInput v-model="form.summary" maxlength="200" prop="summary" label="摘要"></BaInput>
            <BaFormItem prop="catalogId" label="分类" required>
              <el-tree-select
                v-model="form.catalogId"
                :data="trees"
                show-checkbox
                ref="menuRef"
                node-key="id"
                :check-strictly="true"
                empty-text="加载中，请稍后"
                :props="{ label: 'name' }"
                placeholder="选择分类"></el-tree-select>
            </BaFormItem>
            <BaSelect v-model="form.knowledgeType" prop="knowledgeType" label="知识类型">
              <el-option v-for="(value, key) of knowledgeTypes" :key="key" :label="value" :value="key"></el-option>
            </BaSelect>
            <BaFormItem prop="tagIds" label="标签">
              <el-select v-model="form.tagIds" multiple filterable clearable collapse-tags collapse-tags-tooltip placeholder="选择标签" style="width: 100%">
                <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id"></el-option>
              </el-select>
            </BaFormItem>
            <BaFormItem prop="thumb" label="封面">
              <Upload v-model:fileUrl="form.thumb" :params="{ module: 'article' }"></Upload>
            </BaFormItem>
          </div>
        </section>

        <section class="knowledge-form-section">
          <div class="section-header">
            <div>
              <div class="section-title">治理信息</div>
              <div class="section-desc">控制可见范围、责任人和发布时间，保证后续治理可追溯。</div>
            </div>
          </div>
          <div class="knowledge-form-fields">
            <BaSelect v-model="form.visibilityType" prop="visibilityType" label="可见范围">
              <el-option v-for="(value, key) of visibilityTypes" :key="key" :label="value" :value="key"></el-option>
            </BaSelect>
            <BaFormItem label="作者">
              <UserSelect v-model="form.authorId" placeholder="请选择作者" clearable />
            </BaFormItem>
            <BaFormItem label="维护人">
              <UserSelect v-model="form.maintainerId" placeholder="请选择维护人" clearable />
            </BaFormItem>
            <BaInput v-model="form.keywords" maxlength="200" prop="keywords" label="关键词"></BaInput>
            <BaDatePicker
              v-model="form.publishTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              :disabledDate="(time) => time <= new Date(new Date().setDate(new Date().getDate() - 1))"
              prop="publishTime"
              label="定时发布" />
            <BaInputNumber v-model="form.order" :precision="2" :step="1" :min="0" prop="order" label="排序" required />
            <BaFormItem v-if="form.visibilityType === 'role'" label="可见角色">
              <el-select v-model="form.visibleRoleIds" multiple filterable clearable collapse-tags collapse-tags-tooltip placeholder="选择角色" style="width: 100%">
                <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </BaFormItem>
            <BaFormItem v-if="form.visibilityType === 'specified'" label="指定可见人员">
              <UserSelect v-model="form.visibleUserIds" placeholder="请选择用户" clearable multiple />
            </BaFormItem>
          </div>
        </section>
        </div>

        <section class="knowledge-form-section knowledge-form-section--full">
          <div class="section-header">
            <div>
              <div class="section-title">知识内容</div>
              <div class="section-desc">正文是知识复用的核心，建议按清晰的小节结构编写，减少大段堆叠。</div>
            </div>
          </div>
          <el-form-item prop="content" label="正文" style="max-width: none !important">
            <Editor v-model="form.content" style="min-height: 500px; height: auto"></Editor>
          </el-form-item>
        </section>

        <section class="knowledge-form-section knowledge-form-section--full">
          <div class="section-header">
            <div>
              <div class="section-title">AI 预留信息</div>
              <div class="section-desc">用于调优检索排序和后续问答质量，避免把 AI 配置和正文信息混在一起。</div>
            </div>
          </div>
          <div class="knowledge-ai-grid">
            <BaInputNumber v-model="form.retrievalWeight" :precision="0" :step="1" :min="1" prop="retrievalWeight" label="检索权重" />
            <el-form-item label="AI优先">
              <el-switch v-model="form.aiPreferred" active-value="1" inactive-value="0" />
            </el-form-item>
            <el-form-item label="权威知识">
              <el-switch v-model="form.authorityLevel" active-value="1" inactive-value="0" />
            </el-form-item>
            <BaFormItem label="版本号">
              <el-input v-model="form.versionNo" disabled />
            </BaFormItem>
          </div>
          <BaFormItem label="纯文本预览">
            <pre class="content-text-preview">{{ form.contentText || form.content?.replace(/<[^>]+>/g, ' ') || '保存后自动生成纯文本索引' }}</pre>
          </BaFormItem>
        </section>
      </template>
    </BaForm>
    <OperateBar v-if="!accessDeniedInfo" class="knowledge-editor-operate-bar">
      <ElButton type="primary" @click="cancel">取消</ElButton>
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

.knowledge-editor-hero__status {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 720px;
}

.knowledge-editor-hero__status-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

.knowledge-editor-hero__status-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.knowledge-editor-hero__status-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.knowledge-editor-hero__title {
  max-width: none;
  white-space: nowrap;
  margin-bottom: 12px;
}

.knowledge-editor-hero__desc {
  margin-bottom: 24px;
  max-width: none;
  white-space: nowrap;
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
  background: #fff;
}

.knowledge-form-section--full {
  margin-top: 20px;
}

.knowledge-form-section--full + .knowledge-form-section--full {
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

.knowledge-form-section :deep(.tox-tinymce),
.knowledge-form-section :deep(.w-e-text-container),
.knowledge-form-section :deep(.w-e-bar) {
  border-radius: 12px;
}

.knowledge-form-section :deep(.tox-tinymce) {
  border: 1px solid var(--el-border-color-lighter) !important;
  overflow: hidden;
}

.knowledge-editor-operate-bar :deep(.el-button) {
  min-width: 108px;
}

.knowledge-editor-operate-bar :deep(.el-button + .el-button) {
  margin-left: 14px;
}

.content-text-preview {
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: #f8fafc;
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

@media (max-width: 1024px) {
  .knowledge-form-grid,
  .knowledge-ai-grid,
  .knowledge-editor-hero__status {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-form-section,
  .knowledge-empty-state {
    padding: 18px;
  }

  .knowledge-editor-hero__status {
    max-width: none;
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

  .knowledge-editor-hero__title {
    white-space: normal;
  }

  .knowledge-editor-hero__desc {
    white-space: normal;
  }

  .knowledge-form-section--full .section-desc {
    white-space: normal;
  }

  .knowledge-editor-operate-bar :deep(.el-button) {
    min-width: 0;
  }

  .knowledge-editor-operate-bar :deep(.el-button + .el-button) {
    margin-left: 10px;
  }
}
</style>
