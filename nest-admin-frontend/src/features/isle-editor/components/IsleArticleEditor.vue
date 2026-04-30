<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  createEmptyIsleContent,
  type IsleContentDocument,
} from '../adapters/isleContent'
import { useIsleUpload } from '../adapters/useIsleUpload'
import { IButton, IIcon, ITooltip } from '../components/ui'
import { IsleEditor, IsleEditorBubble, IsleEditorToc, IsleEditorToolbar } from '../vue'
import { NotionKit } from '../kit'

type IsleEditorExtension = Record<string, unknown>

interface IsleArticleEditorProps {
  modelValue?: IsleContentDocument | null
  locale?: string
  theme?: string
  disabled?: boolean
  extensions?: IsleEditorExtension[]
}

interface IsleEditorPublicInstance {
  editor?: unknown
}

const props = withDefaults(defineProps<IsleArticleEditorProps>(), {
  modelValue: null,
  locale: 'zh',
  theme: 'light',
  disabled: false,
  extensions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: IsleContentDocument]
  create: [payload: unknown]
  destroy: [payload?: unknown]
}>()

const showToc = ref(true)
const editorRef = ref<IsleEditorPublicInstance | null>(null)
const scrollViewRef = ref<HTMLElement | null>(null)
const uploadAdapter = useIsleUpload()

const currentDocument = computed<IsleContentDocument>(() => props.modelValue ?? createEmptyIsleContent())
const mergedExtensions = computed<IsleEditorExtension[]>(() => {
  return [
    NotionKit.configure({
      image: {},
      video: {},
      attachment: {},
    }),
    ...props.extensions,
  ]
})

function parseEditorValue(value: unknown): IsleContentDocument {
  if (!value || typeof value !== 'object') {
    return createEmptyIsleContent()
  }

  const parsed = value as Partial<IsleContentDocument>
  if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
    return {
      type: 'doc',
      content: parsed.content,
    }
  }

  return createEmptyIsleContent()
}

function handleUpdate(value: unknown) {
  emit('update:modelValue', parseEditorValue(value))
}

defineExpose({
  get editor() {
    return editorRef.value?.editor
  },
  uploadImage: uploadAdapter.uploadImage,
  uploadAttachment: uploadAdapter.uploadAttachment,
  uploadVideo: uploadAdapter.uploadVideo,
})
</script>

<template>
  <div
    class="isle-article-editor"
    :class="{ 'isle-article-editor--readonly': disabled }"
    data-testid="isle-article-editor"
    :aria-readonly="disabled ? 'true' : undefined"
  >
    <div class="isle-article-editor__layout">
      <aside v-if="showToc && editorRef?.editor" class="isle-article-editor__toc">
        <div class="isle-article-editor__toc-header">
          <div class="isle-article-editor__toc-title">目录</div>
          <div class="isle-article-editor__toc-desc">添加标题后自动生成</div>
        </div>
        <div class="isle-article-editor__toc-body">
          <IsleEditorToc :editor="editorRef.editor" :scroll-view="scrollViewRef" />
        </div>
      </aside>

      <div class="isle-article-editor__main">
        <div class="isle-article-editor__toolbar">
          <div v-if="disabled" class="isle-article-editor__readonly-notice">
            <span class="isle-article-editor__readonly-title">查看模式</span>
            <span class="isle-article-editor__readonly-desc">当前知识不可编辑，仅支持阅读</span>
          </div>
          <template v-else>
            <ITooltip :text="showToc ? '隐藏目录' : '显示目录'">
              <template #default>
                <IButton class="isle-article-editor__toc-toggle" @click="showToc = !showToc">
                  <template #icon>
                    <IIcon :name="showToc ? 'outdent' : 'indent'" :size="16" />
                  </template>
                </IButton>
              </template>
            </ITooltip>
            <IsleEditorToolbar v-if="editorRef?.editor" :editor="editorRef.editor" />
          </template>
        </div>

        <div ref="scrollViewRef" class="isle-article-editor__scroll">
          <div class="isle-article-editor__content">
            <IsleEditorBubble v-if="!disabled && editorRef?.editor" :editor="editorRef.editor" />
            <IsleEditor
              ref="editorRef"
              :model-value="currentDocument"
              :editable="!disabled"
              :locale="locale"
              :theme="theme"
              output="json"
              :media-handlers="{
                image: uploadAdapter.uploadImage,
                attachment: uploadAdapter.uploadAttachment,
                video: uploadAdapter.uploadVideo,
              }"
              :extensions="mergedExtensions"
              @update:model-value="handleUpdate"
              @create="emit('create', $event)"
              @destroy="emit('destroy', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.isle-article-editor {
  width: 100%;
}

.isle-article-editor__layout {
  display: flex;
  height: clamp(640px, 72vh, 980px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.isle-article-editor__toc {
  width: 248px;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: auto;
  background: color-mix(in srgb, var(--el-fill-color-extra-light) 86%, var(--el-bg-color));
}

.isle-article-editor__toc-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.isle-article-editor__toc-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.isle-article-editor__toc-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.isle-article-editor__toc-body {
  padding: 8px 10px 12px;
}

.isle-article-editor__main {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.isle-article-editor__toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.isle-article-editor__toc-toggle {
  flex: none;
}

.isle-article-editor__readonly-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.isle-article-editor__readonly-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.isle-article-editor__readonly-desc {
  color: var(--el-text-color-secondary);
}

.isle-article-editor__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.isle-article-editor__content {
  position: relative;
  box-sizing: border-box;
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 32px 56px;
}

.isle-article-editor__content :deep(.tiptap) {
  min-height: 520px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.75;
  outline: none;
}

.isle-article-editor__content :deep(.tiptap h1,
.tiptap h2,
.tiptap h3,
.tiptap h4,
.tiptap h5,
.tiptap h6) {
  margin: 1.35em 0 0.55em;
  color: var(--el-text-color-primary);
  font-weight: 650;
  line-height: 1.28;
}

.isle-article-editor__content :deep(.tiptap p) {
  margin: 0.65em 0;
}

.isle-article-editor__content :deep(.tiptap ul),
.isle-article-editor__content :deep(.tiptap ol) {
  margin: 0.7em 0;
  padding-left: 1.5em;
}

.isle-article-editor__content :deep(.tiptap blockquote) {
  margin: 1em 0;
  padding: 8px 14px;
  border-left: 3px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
}

.isle-article-editor__content :deep(.tiptap pre) {
  margin: 1em 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #0f172a;
  color: #e5e7eb;
  overflow: auto;
}

.isle-article-editor__content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: 12px;
}

.isle-article-editor--readonly .isle-article-editor__layout {
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-extra-light));
}

@media (max-width: 1024px) {
  .isle-article-editor__layout {
    height: min(70vh, 760px);
  }

  .isle-article-editor__toc {
    display: none;
  }

  .isle-article-editor__toc-toggle {
    display: none;
  }

  .isle-article-editor__content {
    padding: 24px 18px 44px;
  }
}
</style>
