<script setup lang="ts">
import { computed, ref } from 'vue'

import { createEmptyIsleContent, type IsleContentDocument } from '../adapters/isleContent'
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
  <div class="isle-article-editor" data-testid="isle-article-editor">
    <div class="isle-article-editor__layout">
      <aside v-if="showToc && editorRef?.editor" class="isle-article-editor__toc">
        <IsleEditorToc :editor="editorRef.editor" :scroll-view="scrollViewRef" />
      </aside>

      <div class="isle-article-editor__main">
        <div class="isle-article-editor__toolbar">
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
        </div>

        <div ref="scrollViewRef" class="isle-article-editor__scroll">
          <div class="isle-article-editor__content">
            <IsleEditorBubble v-if="editorRef?.editor" :editor="editorRef.editor" />
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
  min-height: 640px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.isle-article-editor__toc {
  width: 240px;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: auto;
  background: var(--el-fill-color-extra-light);
}

.isle-article-editor__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.isle-article-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.isle-article-editor__toc-toggle {
  flex: none;
}

.isle-article-editor__scroll {
  flex: 1;
  overflow: auto;
}

.isle-article-editor__content {
  max-width: 860px;
  margin: 0 auto;
  padding: 20px 28px 40px;
}
</style>
