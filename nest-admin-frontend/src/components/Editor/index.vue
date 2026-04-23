<template>
  <div class="Editor flexCol" v-loading="uploadLoading">
    <div v-if="!disabled" class="editorToolbar">
      <button type="button" class="toolbarButton" @click="triggerImageUpload">图片</button>
      <SelectEmoji ref="emojiRef" @select="insertContent">
        <button type="button" class="toolbarButton">emoji</button>
      </SelectEmoji>
      <button type="button" class="toolbarButton" @click="insertTable">插入表格</button>
    </div>
    <div class="editorShell flexAuto" :class="editorClass" @click="focusEditor">
      <EditorContent v-if="editor" :editor="editor" class="editorContent" />
    </div>
    <div class="editorUploadHost">
      <Upload ref="uploadRef" v-model:fileUrl="imgUrl" @loadingChange="handleLoadingChange"></Upload>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/core'
import Upload from '../Upload.vue'
import SelectEmoji from '../SelectEmoji.vue'
import { looksLikeMarkdown, markdownToHtml } from './markdownInterop'
import { bridgeTiptapMarkdownPaste } from './tiptapPasteBridge'
import { createEditorExtensions } from './tiptapExtensions'
import { createInitialEditorHtml, getEditorHtml } from './tiptapHtml'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const uploadLoading = ref(false)
const imgUrl = ref('')

type UploadPublicInstance = InstanceType<typeof Upload> & {
  openPicker?: () => void
}

const uploadRef = ref<UploadPublicInstance | null>(null)
const emojiRef = ref<InstanceType<typeof SelectEmoji> | null>(null)

const editorClass = computed(() => ({
  'is-disabled': props.disabled,
}))

function emitEditorHtml(currentEditor: Editor) {
  emit('update:modelValue', getEditorHtml(currentEditor))
}

function insertHtmlContent(currentEditor: Editor, html: string) {
  currentEditor.chain().focus().insertContent(html).run()
}

function handlePaste(event: ClipboardEvent, currentEditor: Editor) {
  const result = bridgeTiptapMarkdownPaste({
    disabled: props.disabled,
    clipboardData: event.clipboardData,
    looksLikeMarkdown,
    markdownToHtml,
    insertHtml: (html) => insertHtmlContent(currentEditor, html),
  })

  if (result.handled) {
    event.preventDefault()
  }
}

const editor = useEditor({
  content: createInitialEditorHtml(props.modelValue),
  editable: !props.disabled,
  extensions: createEditorExtensions('请输入内容'),
  onUpdate: ({ editor: currentEditor }) => {
    emitEditorHtml(currentEditor)
  },
  editorProps: {
    attributes: {
      class: 'editorProse',
    },
    handlePaste: (_view, event) => {
      const currentEditor = editor.value

      if (!currentEditor) {
        return false
      }

      handlePaste(event, currentEditor)
      return event.defaultPrevented
    },
  },
})

watch(
  () => props.modelValue,
  (value) => {
    const currentEditor = editor.value

    if (!currentEditor) {
      return
    }

    const nextHtml = createInitialEditorHtml(value)

    if (nextHtml === getEditorHtml(currentEditor)) {
      return
    }

    currentEditor.commands.setContent(nextHtml, {
      emitUpdate: false,
    })
  },
)

watch(
  () => props.disabled,
  (value) => {
    editor.value?.setEditable(!value)
  },
  { immediate: true },
)

watch(imgUrl, (value) => {
  if (!value) {
    return
  }

  editor.value?.chain().focus().setImage({ src: value }).run()
  imgUrl.value = ''
})

function focusEditor() {
  editor.value?.chain().focus().run()
}

function handleLoadingChange(value: boolean) {
  uploadLoading.value = value
}

function triggerImageUpload() {
  uploadRef.value?.openPicker?.()
}

function insertContent(emoji: string) {
  editor.value?.chain().focus().insertContent(emoji).run()
}

function insertTable() {
  editor.value
    ?.chain()
    .focus()
    .insertTable({
      rows: 3,
      cols: 3,
      withHeaderRow: true,
    })
    .run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.editorToolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbarButton {
  padding: 6px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.editorUploadHost {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.editorShell {
  min-height: 240px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
}

.editorShell.is-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.editorContent {
  height: 100%;
}

.editorContent .tiptap {
  min-height: 240px;
  padding: 12px;
  white-space: pre-wrap;
  line-height: normal;
  outline: none;
}

.editorContent .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  pointer-events: none;
  float: left;
  height: 0;
}

.editorContent .tiptap table {
  width: 100%;
  border-collapse: collapse;
}

.editorContent .tiptap th,
.editorContent .tiptap td {
  border: 1px solid var(--el-border-color);
  padding: 8px;
}

.editorContent .tiptap img {
  max-width: 100%;
}
</style>
