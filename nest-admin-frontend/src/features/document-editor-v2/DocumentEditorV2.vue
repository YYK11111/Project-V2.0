<template>
  <div
    class="document-editor-v2"
    :class="{ 'is-disabled': disabled }"
    :data-selected-block-type="selectedBlockType || undefined"
  >
    <div class="document-editor-v2__chrome">
      <DocumentToolbar :items="toolbarBlocks" class="document-editor-v2__toolbar" @select="handleBlockSelect" />
      <DocumentBubbleMenu class="document-editor-v2__bubble-menu" />
    </div>

    <div class="document-editor-v2__layout">
      <div class="document-editor-v2__main">
        <aside class="document-editor-v2__gutter">
          <DocumentBlockMenu :items="blockMenuBlocks" class="document-editor-v2__block-menu" @select="handleBlockSelect" />
        </aside>

        <div class="document-editor-v2__surface" @click="focusEditor">
          <div class="document-editor-v2__hero">
            <div class="document-editor-v2__eyebrow">Knowledge Draft</div>
            <div class="document-editor-v2__hint">输入 <code>/</code> 插入块，优先用 slash 命令组织正文结构。</div>
          </div>

          <DocumentSlashMenu
            v-if="slashMenu.visible"
            :items="slashMenu.items"
            :active-index="slashMenu.activeIndex"
            class="document-editor-v2__slash-menu"
            @select="handleSlashSelect" />

          <EditorContent v-if="editor" :editor="editor" class="document-editor-v2__content" />
        </div>

        <aside class="document-editor-v2__toc-wrap">
          <DocumentToc :items="tocItems" :active-block-id="activeBlockId" @select="handleTocSelect" />
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType, ShallowRef } from 'vue'
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { JSONContent } from '@tiptap/core'
import type { Editor as VueTiptapEditor } from '@tiptap/vue-3'
import { EditorContent } from '@tiptap/vue-3'

import type { DocumentBlockDefinition } from './core/blockTypes'
import DocumentBlockMenu from './components/DocumentBlockMenu.vue'
import DocumentBubbleMenu from './components/DocumentBubbleMenu.vue'
import DocumentSlashMenu from './components/DocumentSlashMenu.vue'
import DocumentToc from './components/DocumentToc.vue'
import DocumentToolbar from './components/DocumentToolbar.vue'
import { normalizeDocument } from './content/normalizeDocument'
import { documentBlockRegistry, getSlashBlocks, getToolbarBlocks } from './core/blockRegistry'
import { convertBlockToType, insertParagraphAfterBlock } from './core/blockCommands'
import { createDocumentEditor } from './core/createDocumentEditor'
import { buildEditorState } from './core/editorState'

export default defineComponent({
  name: 'DocumentEditorV2',
  components: {
    DocumentBlockMenu,
    DocumentBubbleMenu,
    DocumentSlashMenu,
    DocumentToc,
    DocumentToolbar,
    EditorContent,
  },
  props: {
    contentJson: {
      type: Object as PropType<JSONContent | null>,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '请输入内容',
    },
  },
  emits: ['update:contentJson'],
  setup(props, { emit, expose }) {
    const editor: ShallowRef<VueTiptapEditor | null> = shallowRef(null)
    const activeBlockId = ref('')
    const selectedBlockType = ref<DocumentBlockDefinition['type'] | ''>('')
    const slashMenu = ref({
      visible: false,
      query: '',
      activeIndex: 0,
      items: [] as DocumentBlockDefinition[],
    })
    const toolbarBlocks = computed(() => getToolbarBlocks())
    const blockMenuBlocks = computed(() => documentBlockRegistry.filter((block) => block.showInBlockMenu))
    const editorState = computed(() => buildEditorState(props.contentJson))
    const tocItems = computed(() => editorState.value.tocItems)

    function createEditor() {
      editor.value = createDocumentEditor({
        content: props.contentJson,
        editable: !props.disabled,
        placeholder: props.placeholder,
        onUpdate: (content) => {
          emit('update:contentJson', content)
        },
      })
    }

    function focusEditor() {
      editor.value?.chain().focus().run()
    }

    function closeSlashMenu() {
      slashMenu.value = {
        visible: false,
        query: '',
        activeIndex: 0,
        items: [],
      }
    }

    function getCurrentBlockInfo() {
      const currentEditor = editor.value
      if (!currentEditor) {
        return null
      }

      const { selection } = currentEditor.state
      const topLevelIndex = selection.$from.index(0)
      const document = normalizeDocument(currentEditor.getJSON() as JSONContent)
      const block = document.content?.[topLevelIndex]

      if (!block) {
        return null
      }

      return {
        index: topLevelIndex,
        block,
        blockId: typeof block.attrs?.blockId === 'string' ? block.attrs.blockId : '',
      }
    }

    function updateSlashMenuFromEditor() {
      const currentEditor = editor.value

      if (!currentEditor) {
        closeSlashMenu()
        return
      }

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

      const query = (slashMatch[1] || '').trim().toLowerCase()
      const items = getSlashBlocks().filter((item) => {
        if (!query) {
          return true
        }

        return item.title.toLowerCase().includes(query)
          || item.aliases.some((alias) => alias.toLowerCase().includes(query))
      })

      slashMenu.value = {
        visible: items.length > 0,
        query,
        activeIndex: 0,
        items,
      }
    }

    function applyDocument(nextDocument: JSONContent) {
      const currentEditor = editor.value
      if (!currentEditor) {
        return
      }

      currentEditor.commands.setContent(normalizeDocument(nextDocument), {
        emitUpdate: true,
      })
    }

    function applySlashAction(block: DocumentBlockDefinition) {
      const currentBlock = getCurrentBlockInfo()
      if (!currentBlock?.blockId) {
        closeSlashMenu()
        return
      }

      const currentDocument = normalizeDocument(editor.value?.getJSON() as JSONContent)
      const nextDocument = ['horizontalRule', 'table', 'image'].includes(block.type)
        ? insertParagraphAfterBlock(currentDocument, currentBlock.blockId)
        : convertBlockToType(currentDocument, currentBlock.blockId, block.type)

      applyDocument(nextDocument)
      closeSlashMenu()
      focusEditor()
    }

    function handleBlockSelect(block: DocumentBlockDefinition) {
      selectedBlockType.value = block.type
      applySlashAction(block)
      focusEditor()
    }

    function handleSlashSelect(block: DocumentBlockDefinition) {
      applySlashAction(block)
    }

    function handleTocSelect(blockId: string) {
      activeBlockId.value = blockId
      focusEditor()
    }

    function handleSlashKeydown(event: KeyboardEvent) {
      if (!slashMenu.value.visible || slashMenu.value.items.length === 0) {
        return false
      }

      if (event.key === 'ArrowDown') {
        slashMenu.value.activeIndex = (slashMenu.value.activeIndex + 1) % slashMenu.value.items.length
        event.preventDefault()
        return true
      }

      if (event.key === 'ArrowUp') {
        slashMenu.value.activeIndex = (slashMenu.value.activeIndex - 1 + slashMenu.value.items.length) % slashMenu.value.items.length
        event.preventDefault()
        return true
      }

      if (event.key === 'Enter') {
        const selectedItem = slashMenu.value.items[slashMenu.value.activeIndex]
        if (selectedItem) {
          handleSlashSelect(selectedItem)
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
    }

    watch(
      () => props.contentJson,
      (value) => {
        const currentEditor = editor.value

        if (!currentEditor) {
          return
        }

        const nextContent = normalizeDocument(value)
        const currentContent = currentEditor.getJSON()

        if (JSON.stringify(currentContent) === JSON.stringify(nextContent)) {
          return
        }

        currentEditor.commands.setContent(nextContent, {
          emitUpdate: false,
        })
        updateSlashMenuFromEditor()
      },
    )

    watch(
      () => props.disabled,
      (value) => {
        editor.value?.setEditable(!value)
      },
    )

    onMounted(() => {
      createEditor()
      editor.value?.setOptions({
        editorProps: {
          handleKeyDown: (_view, event) => handleSlashKeydown(event),
        },
      })
      updateSlashMenuFromEditor()
    })

    watch(
      editor,
      (value) => {
        value?.on('update', updateSlashMenuFromEditor)
        value?.on('selectionUpdate', updateSlashMenuFromEditor)
      },
      { immediate: true },
    )

    onBeforeUnmount(() => {
      editor.value?.destroy()
      editor.value = null
    })

    expose({
      editor,
    })

    return {
      activeBlockId,
      blockMenuBlocks,
      editor,
      focusEditor,
      handleBlockSelect,
      handleSlashSelect,
      handleTocSelect,
      slashMenu,
      selectedBlockType,
      tocItems,
      toolbarBlocks,
    }
  },
})
</script>

<style scoped>
.document-editor-v2 {
  width: 100%;
  color: var(--el-text-color-primary);
}

.document-editor-v2__chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.document-editor-v2__layout {
  position: relative;
}

.document-editor-v2__main {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: start;
}

.document-editor-v2__gutter {
  padding-top: 96px;
}

.document-editor-v2__bubble-menu {
  margin-left: auto;
}

.document-editor-v2__surface {
  position: relative;
  min-height: 620px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, white);
  border-radius: 20px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-extra-light) 48%, white), white 18%);
  padding: 28px 32px 36px;
  box-shadow: 0 28px 54px rgba(15, 23, 42, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.document-editor-v2__surface:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 32px 60px rgba(15, 23, 42, 0.12);
}

.document-editor-v2.is-disabled .document-editor-v2__surface {
  background: var(--el-fill-color-light);
}

.document-editor-v2__hero {
  margin-bottom: 22px;
}

.document-editor-v2__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.document-editor-v2__hint {
  margin-top: 8px;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.document-editor-v2__hint code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.document-editor-v2__slash-menu {
  position: absolute;
  left: 32px;
  top: 92px;
  z-index: 3;
}

.document-editor-v2__content {
  min-height: 420px;
}

.document-editor-v2__content :deep(.tiptap) {
  min-height: 420px;
  outline: none;
  font-size: 16px;
  line-height: 1.85;
}

.document-editor-v2__content :deep(.tiptap p),
.document-editor-v2__content :deep(.tiptap h1),
.document-editor-v2__content :deep(.tiptap h2),
.document-editor-v2__content :deep(.tiptap h3),
.document-editor-v2__content :deep(.tiptap ul),
.document-editor-v2__content :deep(.tiptap ol),
.document-editor-v2__content :deep(.tiptap blockquote),
.document-editor-v2__content :deep(.tiptap pre),
.document-editor-v2__content :deep(.tiptap table) {
  margin: 0.9em 0;
}

.document-editor-v2__content :deep(.tiptap h1) {
  font-size: 2rem;
  line-height: 1.25;
}

.document-editor-v2__content :deep(.tiptap h2) {
  font-size: 1.5rem;
  line-height: 1.35;
}

.document-editor-v2__content :deep(.tiptap h3) {
  font-size: 1.2rem;
  line-height: 1.45;
}

.document-editor-v2__toc-wrap {
  padding-top: 96px;
}

@media (max-width: 960px) {
  .document-editor-v2__chrome,
  .document-editor-v2__main {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .document-editor-v2__gutter,
  .document-editor-v2__toc-wrap {
    padding-top: 0;
  }

  .document-editor-v2__bubble-menu {
    margin-left: 0;
  }

  .document-editor-v2__slash-menu {
    left: 20px;
    top: 108px;
  }

  .document-editor-v2__surface {
    padding: 22px 20px 26px;
  }

  .document-editor-v2__aside,
  .document-editor-v2__toc-wrap {
    position: static;
  }
}
</style>
