// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readEditorComponent() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readQuillComponent() {
  return readFileSync(resolve(__dirname, 'quillindex.vue'), 'utf-8')
}

describe('Editor Quill migration guard', () => {
  it('Editor 组件应转发到 quillindex.vue', () => {
    const source = readEditorComponent()

    expect(source).toContain("import quillindex from './quillindex.vue'")
    expect(source).toContain('<quillindex')
    expect(source).toContain('modelValue')
    expect(source).toContain('update:modelValue')
  })

  it('quillindex 组件应基于 Quill 初始化编辑器', () => {
    const source = readQuillComponent()

    expect(source).toContain("import Quill from 'quill'")
    expect(source).toContain("import QuillBetterTable from 'quill-better-table'")
    expect(source).toContain("import 'quill/dist/quill.snow.css'")
    expect(source).toContain("import 'quill-better-table/dist/quill-better-table.css'")
    expect(source).toContain('new Quill(')
    expect(source).not.toMatch(/@tiptap\//)
  })

  it('quillindex 应保留图片、emoji、插入表格工具栏入口', () => {
    const source = readQuillComponent()

    expect(source).toContain("['link', 'image', 'video', 'emoji']")
    expect(source).toContain("['table']")
    expect(source).toContain("document.querySelector('.Editor .el-upload__input')")
    expect(source).toContain("emojiButton.appendChild(emojiRef.value.$el)")
    expect(source).toContain("betterTable?.insertTable?.(3, 3)")
  })

  it('quillindex 应提供粘贴 HTML 清洗和工具栏中文提示', () => {
    const source = readQuillComponent()

    expect(source).toContain('sanitizePastedHtml')
    expect(source).toContain("editorRoot.addEventListener('paste'")
    expect(source).toContain('toolbarTitleMap')
    expect(source).toContain("bold: '加粗'")
    expect(source).toContain('applyToolbarTitles()')
  })

  it('quillindex 应提供 Word 导入入口并调用公共导入接口', () => {
    const source = readQuillComponent()

    expect(source).toContain("import { importWord } from '@/api/common'")
    expect(source).toContain("word: '导入 Word'")
    expect(source).toContain('ensureWordToolbarButton')
    expect(source).toContain("button.className = 'ql-word-import'")
    expect(source).toContain("button.title = '导入 Word'")
    expect(source).toContain("wordInputRef.value?.click()")
    expect(source).toContain('handleWordImportChange')
    expect(source).toContain('const formData = new FormData()')
    expect(source).toContain('const res = await importWord(formData)')
    expect(source).toContain('importHtmlWithConfirm(html)')
  })

  it('quillindex 应提供 Markdown 导入弹窗并转换为 HTML', () => {
    const source = readQuillComponent()

    expect(source).toContain('markdownDialogVisible')
    expect(source).toContain('导入 Markdown')
    expect(source).toContain("import { markdownToHtml } from './markdownInterop'")
    expect(source).toContain('handleMarkdownImportConfirm')
    expect(source).toContain('convertMarkdownHtmlForQuill(markdownToHtml(markdown))')
    expect(source).toContain('sanitizePastedHtml(')
    expect(source).toContain("button.className = 'ql-markdown-import'")
    expect(source).toContain('importHtmlWithConfirm(html)')
  })

  it('Markdown 导入应保留代码块和图片语法的转换链路', () => {
    const source = readQuillComponent()

    expect(source).toContain('markdownToHtml(markdown)')
    expect(source).toContain('convertMarkdownHtmlForQuill')
    expect(source).toContain("doc.querySelectorAll('pre > code')")
    expect(source).toContain("block.setAttribute('class', 'ql-code-block')")
    expect(source).toContain('sanitizePastedHtml(')
    expect(source).toContain("quill.clipboard.dangerouslyPasteHTML(0, html, 'api')")
    expect(source).toContain("'PRE'")
    expect(source).toContain("'CODE'")
    expect(source).toContain("'IMG'")
  })

  it('Word 和 Markdown 导入应共用覆盖或插入确认逻辑', () => {
    const source = readQuillComponent()

    expect(source).toContain('async function importHtmlWithConfirm(html: string)')
    expect(source).toContain('覆盖当前内容')
    expect(source).toContain('插入到光标位置')
    expect(source).toContain('overwriteEditorHtml(html)')
    expect(source).toContain('insertHtmlAtCursor(html)')
  })
})
