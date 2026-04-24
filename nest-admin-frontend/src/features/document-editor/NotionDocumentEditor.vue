<template>
  <div class="notion-document-editor" :class="editorClass">
    <div v-if="isReady && readyEditor" class="notion-document-editor__surface" @click="focusEditor">
      <EditorContent :editor="readyEditor as VueTiptapEditor" class="notion-document-editor__content" />

      <div v-if="slashMenu.visible" class="notion-document-editor__slash-menu">
        <template v-for="group in slashMenu.groups" :key="group.name">
          <div class="notion-document-editor__slash-group">{{ group.label }}</div>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="notion-document-editor__slash-item"
            :class="{ 'is-active': slashMenu.items[slashMenu.activeIndex]?.id === item.id }"
            @mousedown.prevent="applySlashItem(item)">
            <div class="notion-document-editor__slash-copy">
              <span class="notion-document-editor__slash-title">{{ item.title }}</span>
              <span class="notion-document-editor__slash-subtext">{{ item.subtext }}</span>
            </div>
          </button>
        </template>
      </div>
    </div>

    <el-alert
      v-else-if="contentStatus === 'legacy_html'"
      type="warning"
      :closable="false"
      title="旧数据暂不支持编辑"
      description="当前知识正文仍为旧版 HTML 数据，暂不支持在 Notion-like 编辑器中编辑。" />

    <el-alert
      v-else-if="contentStatus === 'invalid'"
      type="error"
      :closable="false"
      title="文档数据异常，暂不支持编辑"
      description="当前知识正文结构异常，请先修复文档数据后再编辑。" />
  </div>
</template>

<script setup lang="ts">
import type { Editor as CoreEditor, JSONContent } from '@tiptap/core'
import { Editor as VueTiptapEditor, EditorContent } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'

import { bridgeTiptapMarkdownPaste } from '@/components/Editor/tiptapPasteBridge'
import { htmlToMarkdown, looksLikeMarkdown, markdownToHtml } from '@/components/Editor/markdownInterop'
import {
  clearFormatting,
  insertHorizontalRule,
  insertTable,
  toggleBlockquote,
  toggleBulletList,
  toggleCodeBlock,
  toggleHeading,
  toggleOrderedList,
  type DocumentCommandPayload,
} from './core/documentCommands'
import { createDocumentExtensions } from './core/documentExtensions'
import { documentSlashItems, type DocumentSlashItem } from './core/documentSlashItems'

type DocumentStatus = 'ready' | 'legacy_html' | 'invalid'

const props = withDefaults(
  defineProps<{
    contentJson: JSONContent | null
    contentStatus: DocumentStatus
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '输入 / 使用命令菜单',
  },
)

const emit = defineEmits<{
  (event: 'update:contentJson', value: JSONContent): void
}>()

const editor = shallowRef<VueTiptapEditor | null>(null)
const isSyncingEditor = ref(false)

const slashMenu = reactive({
  visible: false,
  query: '',
  activeIndex: 0,
  items: [] as DocumentSlashItem[],
  groups: [] as Array<{ name: DocumentSlashItem['group']; label: string; items: DocumentSlashItem[] }>,
})

const isReady = computed(() => props.contentStatus === 'ready')
const readyEditor = computed(() => (isReady.value ? editor.value : null as VueTiptapEditor | null))
const editorClass = computed(() => ({
  'is-disabled': props.disabled,
}))

function getSlashItems(query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return documentSlashItems
  }

  return documentSlashItems.filter((item) => {
    if (item.title.toLowerCase().includes(normalizedQuery)) {
      return true
    }

    return item.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))
  })
}

function getSlashGroupLabel(group: DocumentSlashItem['group']) {
  switch (group) {
    case 'basic':
      return '基础'
    case 'lists':
      return '列表'
    case 'blocks':
      return '块'
    case 'media':
      return '插入'
    default:
      return '其他'
  }
}

function buildSlashGroups(items: DocumentSlashItem[]) {
  const groups = new Map<DocumentSlashItem['group'], DocumentSlashItem[]>()

  items.forEach((item) => {
    const currentItems = groups.get(item.group) || []
    currentItems.push(item)
    groups.set(item.group, currentItems)
  })

  return Array.from(groups.entries()).map(([name, groupItems]) => ({
    name,
    label: getSlashGroupLabel(name),
    items: groupItems,
  }))
}

function updateSlashMenu(query: string) {
  slashMenu.query = query
  slashMenu.items = getSlashItems(query)
  slashMenu.groups = buildSlashGroups(slashMenu.items)
  slashMenu.activeIndex = 0
  slashMenu.visible = slashMenu.items.length > 0
}

function closeSlashMenu() {
  slashMenu.visible = false
  slashMenu.query = ''
  slashMenu.activeIndex = 0
  slashMenu.items = []
  slashMenu.groups = []
}

function tryOpenSlashMenu(currentEditor: CoreEditor) {
  const paragraph = currentEditor.state.selection.$from.parent

  if (paragraph.type.name !== 'paragraph') {
    closeSlashMenu()
    return
  }

  const textBefore = paragraph.textBetween(0, currentEditor.state.selection.$from.parentOffset, '\n', '\n')
  const slashMatch = textBefore.match(/^\/(.*)$/)

  if (!slashMatch) {
    closeSlashMenu()
    return
  }

  updateSlashMenu(slashMatch[1] || '')
}

function removeSlashTrigger(currentEditor: CoreEditor) {
  const { $from } = currentEditor.state.selection
  const start = $from.start()
  const end = start + $from.parentOffset
  currentEditor.chain().focus().deleteRange({ from: start, to: end }).run()
}

function applyCommand(item: DocumentSlashItem, payload?: DocumentCommandPayload) {
  const currentEditor = editor.value

  if (!currentEditor) {
    return
  }

  removeSlashTrigger(currentEditor)

  switch (item.command) {
    case 'toggleHeading':
      toggleHeading(currentEditor, payload?.level || 2)
      break
    case 'toggleBulletList':
      toggleBulletList(currentEditor)
      break
    case 'toggleOrderedList':
      toggleOrderedList(currentEditor)
      break
    case 'toggleBlockquote':
      toggleBlockquote(currentEditor)
      break
    case 'toggleCodeBlock':
      toggleCodeBlock(currentEditor)
      break
    case 'insertHorizontalRule':
      insertHorizontalRule(currentEditor)
      break
    case 'insertTable':
      insertTable(currentEditor, payload)
      break
    case 'insertImage':
      currentEditor.chain().focus().setImage({ src: 'https://placehold.co/640x360?text=Image' }).run()
      break
    default:
      clearFormatting(currentEditor)
      break
  }

  closeSlashMenu()
}

function applySlashItem(item: DocumentSlashItem) {
  applyCommand(item, item.payload)
}

function focusEditor() {
  editor.value?.commands.focus()
}

function createEditor() {
  return new VueTiptapEditor({
    content: props.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: !props.disabled,
    extensions: createDocumentExtensions(props.placeholder),
    onSelectionUpdate: ({ editor: currentEditor }) => {
      tryOpenSlashMenu(currentEditor)
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (isSyncingEditor.value) {
        return
      }

      emit('update:contentJson', currentEditor.getJSON())
      tryOpenSlashMenu(currentEditor)
    },
    editorProps: {
      attributes: {
        class: 'notion-document-editor__prose',
      },
      handleKeyDown: (_view, event) => {
        if (!slashMenu.visible) {
          return false
        }

        if (event.key === 'ArrowDown') {
          slashMenu.activeIndex = (slashMenu.activeIndex + 1) % slashMenu.items.length
          event.preventDefault()
          return true
        }

        if (event.key === 'ArrowUp') {
          slashMenu.activeIndex = (slashMenu.activeIndex - 1 + slashMenu.items.length) % slashMenu.items.length
          event.preventDefault()
          return true
        }

        if (event.key === 'Enter') {
          const item = slashMenu.items[slashMenu.activeIndex]
          if (item) {
            applySlashItem(item)
            event.preventDefault()
            return true
          }
        }

        if (event.key === 'Escape') {
          closeSlashMenu()
          event.preventDefault()
          return true
        }

        return false
      },
      handlePaste: (_view, event) => {
        const currentEditor = editor.value

        if (!currentEditor) {
          return false
        }

        const result = bridgeTiptapMarkdownPaste({
          disabled: props.disabled || !isReady.value,
          clipboardData: event.clipboardData,
          looksLikeMarkdown,
          markdownToHtml,
          insertHtml: (html) => {
            currentEditor.chain().focus().insertContent(html).run()
          },
        })

        if (result.handled) {
          event.preventDefault()
        }

        return result.handled
      },
    },
  })
}

watch(
  isReady,
  (value) => {
    if (!value) {
      editor.value?.destroy()
      editor.value = null
      closeSlashMenu()
      return
    }

    if (!editor.value) {
      editor.value = createEditor()
    }
  },
  { immediate: true },
)

watch(
  () => props.contentJson,
  (value) => {
    if (!editor.value || !value) {
      return
    }

    isSyncingEditor.value = true
    editor.value.commands.setContent(value, { emitUpdate: false })
    isSyncingEditor.value = false
  },
)

watch(
  () => props.disabled,
  (value) => {
    editor.value?.setEditable(!value)
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped lang="scss">
.notion-document-editor {
  position: relative;
}

.notion-document-editor__surface {
  position: relative;
  min-height: 520px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-extra-light) 40%, white), white 18%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.notion-document-editor__content :deep(.notion-document-editor__prose) {
  min-height: 520px;
  padding: 28px 32px;
  line-height: 1.8;
  outline: none;
}

.notion-document-editor__content :deep(.notion-document-editor__prose p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.notion-document-editor__content :deep(.notion-document-editor__prose p),
.notion-document-editor__content :deep(.notion-document-editor__prose h1),
.notion-document-editor__content :deep(.notion-document-editor__prose h2),
.notion-document-editor__content :deep(.notion-document-editor__prose h3),
.notion-document-editor__content :deep(.notion-document-editor__prose ul),
.notion-document-editor__content :deep(.notion-document-editor__prose ol),
.notion-document-editor__content :deep(.notion-document-editor__prose blockquote),
.notion-document-editor__content :deep(.notion-document-editor__prose pre),
.notion-document-editor__content :deep(.notion-document-editor__prose table) {
  margin: 0.9em 0;
}

.notion-document-editor__slash-menu {
  position: absolute;
  left: 24px;
  top: 24px;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  z-index: 10;
}

.notion-document-editor__slash-group {
  padding: 6px 10px 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.notion-document-editor__slash-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-primary);
  text-align: left;
}

.notion-document-editor__slash-item.is-active,
.notion-document-editor__slash-item:hover {
  background: var(--el-fill-color-light);
}

.notion-document-editor__slash-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.notion-document-editor__slash-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notion-document-editor__slash-subtext {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.notion-document-editor.is-disabled {
  opacity: 0.7;
}
</style>
