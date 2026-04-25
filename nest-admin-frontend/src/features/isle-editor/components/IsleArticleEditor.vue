<script setup lang="ts">
import { computed, ref } from 'vue'

import { createEmptyIsleContent, type IsleContentDocument } from '../adapters/isleContent'
import { useIsleUpload } from '../adapters/useIsleUpload'
import { IsleEditor } from '../vue'

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

const editorRef = ref<IsleEditorPublicInstance | null>(null)
const uploadAdapter = useIsleUpload()

const currentDocument = computed<IsleContentDocument>(() => props.modelValue ?? createEmptyIsleContent())
const mergedExtensions = computed<IsleEditorExtension[]>(() => {
  return [
    ...props.extensions,
    {
      name: 'project-isle-upload-adapter',
      mediaHandlers: {
        image: uploadAdapter.uploadImage,
        attachment: uploadAdapter.uploadAttachment,
        video: uploadAdapter.uploadVideo,
      },
    },
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
    <IsleEditor
      ref="editorRef"
      :model-value="currentDocument"
      :editable="!disabled"
      :locale="locale"
      :theme="theme"
      :extensions="mergedExtensions"
      @update:model-value="handleUpdate"
      @create="emit('create', $event)"
      @destroy="emit('destroy', $event)"
    />
  </div>
</template>

<style scoped>
.isle-article-editor {
  width: 100%;
}
</style>
