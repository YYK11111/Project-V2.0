<template>
  <div class="Editor flexCol" v-loading="uploadLoading">
    <div class="quillEditor flexAuto" ref="editorRef" @click="quill?.focus()"></div>
    <Upload ref="uploadRef" v-show="false" v-model:fileUrl="imgUrl" @loadingChange="handleLoadingChange" />
    <SelectEmoji ref="emojiRef" @select="insertContent" />
    <input ref="wordInputRef" type="file" accept=".docx" class="wordImportInput" @change="handleWordImportChange" />
    <el-dialog v-model="markdownDialogVisible" title="导入 Markdown" width="680px" destroy-on-close>
      <el-input
        v-model="markdownDraft"
        type="textarea"
        :rows="16"
        resize="vertical"
        placeholder="请粘贴 Markdown 内容，点击导入后会覆盖当前编辑器内容"
      />
      <template #footer>
        <el-button @click="handleMarkdownDialogCancel">取消</el-button>
        <el-button type="primary" @click="handleMarkdownImportConfirm">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Quill from 'quill'
import QuillBetterTable from 'quill-better-table'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill-better-table/dist/quill-better-table.css'
import { importWord } from '@/api/common'
import { ElMessageBox } from 'element-plus'
import Upload from '../Upload.vue'
import SelectEmoji from '../SelectEmoji.vue'
import { markdownToHtml } from './markdownInterop'

Quill.register({
  'modules/better-table': QuillBetterTable,
}, true)

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    modelValue: '',
    disabled: false,
    placeholder: '请输入内容',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'selection-change', range: any, oldRange: any, source: string): void
  (event: 'editor-change', eventName: string, ...args: any[]): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)
const uploadRef = ref<InstanceType<typeof Upload> | null>(null)
const emojiRef = ref<InstanceType<typeof SelectEmoji> | null>(null)
const wordInputRef = ref<HTMLInputElement | null>(null)
const uploadLoading = ref(false)
const imgUrl = ref('')
const markdownDialogVisible = ref(false)
const markdownDraft = ref('')

let quill: Quill | null = null

const toolbarTitleMap: Record<string, string> = {
  bold: '加粗',
  italic: '斜体',
  underline: '下划线',
  strike: '删除线',
  blockquote: '引用',
  'code-block': '代码块',
  list: '列表',
  indent: '缩进',
  direction: '文字方向',
  color: '字体颜色',
  background: '背景颜色',
  align: '对齐方式',
  clean: '清除格式',
  link: '插入链接',
  image: '插入图片',
  video: '插入视频',
  word: '导入 Word',
  markdown: '导入 Markdown',
  emoji: '插入表情',
  table: '插入表格',
  size: '字号',
  header: '标题级别',
  font: '字体',
}

const options = {
  placeholder: props.placeholder,
  theme: 'snow',
  debug: 'warn' as const,
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['clean'],
        ['link', 'image', 'video', 'emoji'],
        ['table'],
      ],
      handlers: {
        image(this: { quill: Quill }, value: boolean) {
          if (value) {
            const input = document.querySelector('.Editor .el-upload__input') as HTMLInputElement | null
            input?.click()
          } else {
            this.quill.format('image', false)
          }
        },
        table(this: { quill: Quill }) {
          const betterTable = this.quill.getModule('better-table') as any
          betterTable?.insertTable?.(3, 3)
        },
      },
    },
    keyboard: {
      bindings: QuillBetterTable.keyboardBindings,
    },
    table: false,
    'better-table': {
      operationMenu: {
        items: {
          unmergeCells: {
            text: '取消合并',
          },
          insertColumnRight: {
            text: '右侧插列',
          },
          insertColumnLeft: {
            text: '左侧插列',
          },
          insertRowUp: {
            text: '上方插行',
          },
          insertRowDown: {
            text: '下方插行',
          },
          mergeCells: {
            text: '合并单元格',
          },
          deleteColumn: {
            text: '删除列',
          },
          deleteRow: {
            text: '删除行',
          },
          deleteTable: {
            text: '删除表格',
          },
        },
      },
    },
  },
}

function setEditorHtml(value: string) {
  if (!quill || !editorRef.value) return
  const html = value || ''
  if (quill.root.innerHTML === html) return
  quill.root.innerHTML = html || '<p><br></p>'
}

function handleLoadingChange(value: boolean) {
  uploadLoading.value = value
}

function isEditorEffectivelyEmpty() {
  if (!quill) return true
  const text = quill.getText().trim()
  const hasEmbeds = Array.isArray(quill.getContents().ops)
    ? quill.getContents().ops.some((op: any) => typeof op.insert === 'object')
    : false
  return !text && !hasEmbeds
}

function overwriteEditorHtml(html: string) {
  if (quill) {
    quill.setContents([])
    quill.clipboard.dangerouslyPasteHTML(0, html, 'api')
  } else {
    setEditorHtml(html)
  }
  emit('update:modelValue', html)
}

function insertHtmlAtCursor(html: string) {
  if (quill) {
    const range = quill.getSelection(true)
    const index = range?.index ?? quill.getLength()
    quill.clipboard.dangerouslyPasteHTML(index, html, 'user')
    emit('update:modelValue', editorRef.value?.children[0]?.innerHTML || html)
    return
  }
  setEditorHtml((props.modelValue || '') + html)
  emit('update:modelValue', (props.modelValue || '') + html)
}

async function importHtmlWithConfirm(html: string) {
  if (isEditorEffectivelyEmpty()) {
    overwriteEditorHtml(html)
    return
  }

  try {
    await ElMessageBox.confirm(
      '检测到编辑器中已有内容。你可以选择清空当前内容后导入，或保留原内容并把导入结果插入到当前光标位置。',
      '导入确认',
      {
        confirmButtonText: '覆盖当前内容（清空后导入）',
        cancelButtonText: '插入到光标位置（保留原内容）',
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        type: 'warning',
      },
    )
    overwriteEditorHtml(html)
  } catch (error) {
    if (error === 'cancel') {
      insertHtmlAtCursor(html)
      return
    }
    throw error
  }
}

function sanitizePastedHtml(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const allowedTags = new Set([
    'P',
    'BR',
    'STRONG',
    'B',
    'EM',
    'I',
    'U',
    'S',
    'A',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'PRE',
    'CODE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'TABLE',
    'THEAD',
    'TBODY',
    'TR',
    'TH',
    'TD',
    'IMG',
    'HR',
  ])

  const unwrapNode = (node: Element) => {
    const parent = node.parentNode
    if (!parent) return
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node)
    }
    parent.removeChild(node)
  }

  const normalizeNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const element = node as Element
    ;['style', 'class', 'id', 'width', 'height', 'data-*'].forEach((attr) => {
      if (attr === 'data-*') {
        Array.from(element.attributes)
          .filter((attribute) => attribute.name.startsWith('data-'))
          .forEach((attribute) => element.removeAttribute(attribute.name))
        return
      }
      element.removeAttribute(attr)
    })

    if (!allowedTags.has(element.tagName)) {
      unwrapNode(element)
      return
    }

    if (element.tagName === 'A') {
      const href = element.getAttribute('href') || ''
      if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) {
        element.removeAttribute('href')
      }
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noopener noreferrer')
    }

    if (element.tagName === 'IMG') {
      const src = element.getAttribute('src') || ''
      if (!src) {
        element.remove()
        return
      }
      element.removeAttribute('width')
      element.removeAttribute('height')
    }

    Array.from(element.childNodes).forEach(normalizeNode)
  }

  Array.from(doc.body.childNodes).forEach(normalizeNode)
  return doc.body.innerHTML
}

function convertMarkdownHtmlForQuill(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc.querySelectorAll('pre > code').forEach((codeElement) => {
    const preElement = codeElement.parentElement
    if (!preElement) return

    const lines = (codeElement.textContent || '').replace(/\n$/, '').split('\n')
    const container = doc.createElement('div')

    lines.forEach((line) => {
      const block = doc.createElement('div')
      block.setAttribute('class', 'ql-code-block')
      block.textContent = line || '\u200b'
      container.appendChild(block)
    })

    preElement.replaceWith(container)
  })

  return doc.body.innerHTML
}

function installPasteSanitizer() {
  const editorRoot = quill?.root
  if (!editorRoot || !quill) return
  editorRoot.addEventListener('paste', (event: ClipboardEvent) => {
    const html = event.clipboardData?.getData('text/html') || ''
    if (!html) return
    event.preventDefault()
    const sanitizedHtml = sanitizePastedHtml(html)
    const range = quill?.getSelection(true)
    const index = range?.index ?? quill?.getLength() ?? 0
    quill?.clipboard.dangerouslyPasteHTML(index, sanitizedHtml, 'user')
  })
}

function applyToolbarTitles() {
  const toolbar = editorRef.value?.previousElementSibling
  if (!toolbar) return

  Object.entries(toolbarTitleMap).forEach(([key, title]) => {
    toolbar
      .querySelectorAll(`.ql-${key}`)
      .forEach((node) => node.setAttribute('title', title))
  })
}

function ensureWordToolbarButton() {
  const toolbar = editorRef.value?.previousElementSibling as HTMLElement | null
  if (!toolbar || toolbar.querySelector('.ql-word-import')) return

  const formats = toolbar.querySelectorAll('.ql-formats')
  const targetGroup = formats[formats.length - 2] as HTMLElement | undefined
  if (!targetGroup) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'ql-word-import'
  button.title = '导入 Word'
  button.setAttribute('aria-label', '导入 Word')
  button.innerHTML = '<span>W</span>'
  button.addEventListener('click', () => {
    wordInputRef.value?.click()
  })
  targetGroup.appendChild(button)
}

function ensureMarkdownToolbarButton() {
  const toolbar = editorRef.value?.previousElementSibling as HTMLElement | null
  if (!toolbar || toolbar.querySelector('.ql-markdown-import')) return

  const formats = toolbar.querySelectorAll('.ql-formats')
  const targetGroup = formats[formats.length - 2] as HTMLElement | undefined
  if (!targetGroup) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'ql-markdown-import'
  button.title = '导入 Markdown'
  button.setAttribute('aria-label', '导入 Markdown')
  button.innerHTML = '<span>M↓</span>'
  button.addEventListener('click', () => {
    markdownDialogVisible.value = true
  })
  targetGroup.appendChild(button)
}

function insertContent(emoji: string) {
  if (!quill) return
  quill.focus()
  const range = quill.getSelection(true)
  const index = range?.index ?? quill.getLength()
  quill.insertText(index, emoji)
  quill.setSelection(index + 2)
}

async function handleWordImportChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  uploadLoading.value = true
  try {
    const res = await importWord(formData)
    const html = res?.data?.html || res?.html || ''
    await importHtmlWithConfirm(html)
  } finally {
    uploadLoading.value = false
    if (input) {
      input.value = ''
    }
  }
}

function handleMarkdownDialogCancel() {
  markdownDialogVisible.value = false
  markdownDraft.value = ''
}

function handleMarkdownImportConfirm() {
  const markdown = String(markdownDraft.value || '').trim()
  if (!markdown) {
    ElMessage.warning('请先粘贴 Markdown 内容')
    return
  }
  const html = sanitizePastedHtml(convertMarkdownHtmlForQuill(markdownToHtml(markdown)))
  importHtmlWithConfirm(html)
    .then(() => {
      markdownDialogVisible.value = false
      markdownDraft.value = ''
    })
    .catch((error) => {
      if (error === 'close') {
        return
      }
      throw error
    })
}

onMounted(() => {
  if (!editorRef.value) return
  quill = new Quill(editorRef.value, {
    ...options,
    placeholder: props.placeholder,
    readOnly: props.disabled,
  })
  setEditorHtml(props.modelValue)
  installPasteSanitizer()
  quill.on('text-change', () => {
    const html = editorRef.value?.children[0]?.innerHTML || ''
    emit('update:modelValue', html)
  })
  quill.on('selection-change', (range, oldRange, source) => {
    emit('selection-change', range, oldRange, source)
  })
  quill.on('editor-change', (eventName, ...args) => {
    emit('editor-change', eventName, ...args)
  })
  nextTick(() => {
    const emojiButton = editorRef.value?.previousElementSibling?.querySelector('.ql-emoji')
    if (emojiButton && emojiRef.value?.$el) {
      emojiButton.appendChild(emojiRef.value.$el)
    }
    ensureWordToolbarButton()
    ensureMarkdownToolbarButton()
    applyToolbarTitles()
  })
})

watch(
  () => props.modelValue,
  (value) => {
    setEditorHtml(value)
  },
  { immediate: true },
)

watch(
  () => props.disabled,
  (value) => {
    quill?.enable(!value)
  },
)

watch(imgUrl, (value) => {
  if (!value || !quill) return
  const range = quill.getSelection(true)
  const index = range?.index ?? quill.getLength()
  quill.insertEmbed(index, 'image', value)
  quill.setSelection(index + 1)
  imgUrl.value = ''
})

onBeforeUnmount(() => {
  quill = null
})
</script>

<style>
.quillEditor {
  white-space: pre-wrap !important;
  line-height: normal !important;
}

.quillEditor :deep(.ql-toolbar.ql-snow) {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: color-mix(in srgb, var(--el-bg-color) 92%, #f5f7fa 8%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.quillEditor :deep(.ql-container.ql-snow) {
  border: 1px solid var(--el-border-color);
  border-radius: 0 0 8px 8px;
  background: var(--el-bg-color);
}

.quillEditor :deep(.ql-editor) {
  min-height: 240px;
  padding: 14px 16px;
}

.quillEditor :deep(.ql-toolbar button),
.quillEditor :deep(.ql-toolbar .ql-picker-label) {
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.quillEditor :deep(.ql-toolbar button:hover),
.quillEditor :deep(.ql-toolbar .ql-picker-label:hover) {
  background: rgba(59, 130, 246, 0.08);
}

.quillEditor :deep(.ql-toolbar button.ql-active),
.quillEditor :deep(.ql-toolbar .ql-picker-label.ql-active) {
  background: rgba(59, 130, 246, 0.12);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.18);
}

.quillEditor :deep(.ql-word-import) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.quillEditor :deep(.ql-word-import:hover) {
  background: rgba(59, 130, 246, 0.08);
}

.quillEditor :deep(.ql-markdown-import) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.quillEditor :deep(.ql-markdown-import:hover) {
  background: rgba(59, 130, 246, 0.08);
}

.quillEditor :deep(.ql-word-import span) {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.quillEditor :deep(.ql-markdown-import span) {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.wordImportInput {
  display: none;
}

.ql-snow .ql-tooltip {
  left: 20px !important;
  border-radius: 8px;
  border-color: var(--el-border-color);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.quill-img {
  display: none;
}

.ql-snow .ql-tooltip[data-mode='link']::before {
  content: '请输入链接地址:';
}

.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0;
  content: '保存';
  padding-right: 0;
}

.ql-snow .ql-tooltip[data-mode='video']::before {
  content: '请输入视频地址:';
}

.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '14px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
  content: '10px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
  content: '18px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
  content: '32px';
}

.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: '文本';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
  content: '标题1';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
  content: '标题2';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
  content: '标题3';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
  content: '标题4';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
  content: '标题5';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
  content: '标题6';
}

.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '标准字体';
}

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
  content: '衬线字体';
}

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
  content: '等宽字体';
}

.quillEditor :deep(.ql-editor.ql-blank::before) {
  color: var(--el-text-color-placeholder);
  font-style: normal;
}

.quillEditor :deep(.ql-editor .ql-code-block-container) {
  margin: 14px 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(15, 23, 42, 0.04);
}

.quillEditor :deep(.ql-editor .ql-code-block) {
  margin: 0;
  padding: 0 16px;
  background: transparent;
  color: #0f172a;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.quillEditor :deep(.ql-editor .ql-code-block:first-child) {
  padding-top: 14px;
}

.quillEditor :deep(.ql-editor .ql-code-block:last-child) {
  padding-bottom: 14px;
}

.quillEditor :deep(.ql-editor .ql-code-block + .ql-code-block) {
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
}

html.dark .quillEditor :deep(.ql-editor .ql-code-block-container),
body.dark .quillEditor :deep(.ql-editor .ql-code-block-container) {
  border-color: rgba(71, 85, 105, 0.8);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.96));
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.05), 0 1px 2px rgba(2, 6, 23, 0.35);
}

html.dark .quillEditor :deep(.ql-editor .ql-code-block),
body.dark .quillEditor :deep(.ql-editor .ql-code-block) {
  color: #e2e8f0;
}

html.dark .quillEditor :deep(.ql-editor .ql-code-block + .ql-code-block),
body.dark .quillEditor :deep(.ql-editor .ql-code-block + .ql-code-block) {
  border-top-color: rgba(100, 116, 139, 0.35);
}

.ql-editor table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  overflow: hidden;
}

.ql-editor table td,
.ql-editor table th,
.ql-better-table td,
.ql-better-table th {
  border: 1px solid var(--el-border-color);
  padding: 8px;
}

.ql-editor table th,
.ql-better-table th {
  background: rgba(148, 163, 184, 0.12);
  font-weight: 600;
}

.quillEditor :deep(.qlbt-operation-menu) {
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.quillEditor :deep(.qlbt-operation-menu .qlbt-operation-menu-item) {
  padding: 8px 12px;
  font-size: 13px;
}

.quillEditor :deep(.qlbt-operation-menu .qlbt-operation-menu-item:hover) {
  background: rgba(59, 130, 246, 0.08);
}
</style>
