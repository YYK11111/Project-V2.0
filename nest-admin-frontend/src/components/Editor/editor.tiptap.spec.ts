// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readEditorComponent() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readUploadComponent() {
  return readFileSync(resolve(__dirname, '../Upload.vue'), 'utf-8')
}

describe('Editor Tiptap migration guard', () => {
  it('Editor 组件应切换到 Tiptap 基础依赖和实例创建', () => {
    const source = readEditorComponent()

    expect(source).toMatch(/@tiptap\//)
    expect(source).toMatch(/(EditorContent|useEditor)/)
    expect(source).not.toContain("import Quill from 'quill'")
    expect(source).not.toContain('new Quill(')
    expect(source).toContain('modelValue')
    expect(source).toContain('update:modelValue')
  })

  it('应在纯文本 Markdown 粘贴时通过桥接逻辑导入 HTML', () => {
    const source = readEditorComponent()

    expect(source).toContain('handlePaste')
    expect(source).toContain('bridgeTiptapMarkdownPaste')
    expect(source).toContain('clipboardData: event.clipboardData')
    expect(source).toContain('looksLikeMarkdown')
    expect(source).toContain('markdownToHtml')
    expect(source).toContain('insertHtml: (html) => insertHtmlContent(currentEditor, html)')
  })

  it('应提供图片、emoji、插入表格三个工具栏入口', () => {
    const source = readEditorComponent()

    expect(source).toContain('图片')
    expect(source).toContain('emoji')
    expect(source).toContain('插入表格')
  })

  it('应提供 3x3 且带表头行的表格插入行为', () => {
    const source = readEditorComponent()

    expect(source).toContain('insertTable')
    expect(source).toContain('rows: 3')
    expect(source).toContain('cols: 3')
    expect(source).toContain('withHeaderRow: true')
  })

  it('应通过 Upload 公开方法触发图片选择，而不是跨组件查询 DOM', () => {
    const editorSource = readEditorComponent()
    const uploadSource = readUploadComponent()

    expect(uploadSource).toMatch(/openPicker\s*\(/)
    expect(editorSource).toContain('uploadRef.value?.openPicker?.()')
    expect(editorSource).not.toContain("querySelector<HTMLInputElement>('input[type=\"file\"]')")
  })
})
