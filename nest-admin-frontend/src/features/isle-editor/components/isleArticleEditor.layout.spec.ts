import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readEditorSource() {
  return readFileSync(resolve(__dirname, 'IsleArticleEditor.vue'), 'utf-8')
}

function normalizeWhitespace(source: string) {
  return source.replace(/\s+/g, ' ').trim()
}

function getOpeningTag(source: string, tagName: string) {
  const match = source.match(new RegExp(`<${tagName}\\b[^>]*>`))

  return match?.[0] ?? ''
}

function getDivTagByClass(source: string, className: string) {
  const match = source.match(new RegExp(`<div\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`))

  return match?.[0] ?? ''
}

describe('IsleArticleEditor layout contract', () => {
  it('保持 toc、toolbar、scroll 三层职责边界', () => {
    const source = normalizeWhitespace(readEditorSource())
    const tocTag = getOpeningTag(source, 'IsleEditorToc')
    const scrollTag = getDivTagByClass(source, 'isle-article-editor__scroll')

    expect(source).toMatch(/<aside\b[^>]*\bv-if="showToc && editorRef\?\.editor"[^>]*\bclass="[^"]*\bisle-article-editor__toc\b[^"]*"[^>]*>/)
    expect(source).toMatch(/<div\b[^>]*\bclass="[^"]*\bisle-article-editor__toolbar\b[^"]*"[^>]*>/)
    expect(scrollTag).toContain('ref="scrollViewRef"')
    expect(scrollTag).toMatch(/class="[^"]*\bisle-article-editor__scroll\b[^"]*"/)
    expect(tocTag).toContain(':editor="editorRef.editor"')
    expect(tocTag).toContain(':scroll-view="scrollViewRef"')
  })

  it('为 workbench 提供 bounded height 合同', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__layout\s*\{[\s\S]*height:\s*clamp\(640px,\s*72vh,\s*980px\);/)
    expect(source).toMatch(/\.isle-article-editor__main\s*\{[\s\S]*min-height:\s*0;/)
    expect(source).toMatch(/\.isle-article-editor__scroll\s*\{[\s\S]*min-height:\s*0;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*\{[\s\S]*box-sizing:\s*border-box;/)
  })

  it('保持 scroll 容器可独立滚动', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__scroll\s*\{[\s\S]*overflow:\s*auto;/)
  })

  it('工具栏固定在正文滚动区顶部', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*position:\s*sticky;/)
    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*top:\s*0;/)
    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*z-index:\s*3;/)
    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*background:\s*var\(--el-bg-color\);/)
  })

  it('空文档编辑态不展示额外写作引导', () => {
    const source = readEditorSource()

    expect(source).not.toContain('isIsleContentEmpty')
    expect(source).not.toContain('isEmptyDocument')
    expect(source).not.toContain('isle-article-editor__empty-guide')
    expect(source).not.toContain('开始编写知识内容')
    expect(source).not.toContain('输入内容，或使用工具栏插入标题、列表、图片和附件')
  })

  it('disabled 时呈现明确查看模式并隐藏格式工具栏', () => {
    const source = readEditorSource()

    expect(source).toMatch(/:class="\{ 'isle-article-editor--readonly': disabled \}"/)
    expect(source).toContain(':aria-readonly="disabled ? \'true\' : undefined"')
    expect(source).toMatch(/v-if="disabled"[^>]*class="isle-article-editor__readonly-notice"/)
    expect(source).toContain('查看模式')
    expect(source).toContain('当前知识不可编辑，仅支持阅读')
    expect(source).toMatch(/<IsleEditorToolbar v-if="editorRef\?\.editor"/)
    expect(source).toMatch(/<IsleEditorBubble v-if="!disabled && editorRef\?\.editor"/)
  })

  it('目录区提供明确语义标题和说明', () => {
    const source = readEditorSource()

    expect(source).toContain('class="isle-article-editor__toc-header"')
    expect(source).toContain('class="isle-article-editor__toc-title"')
    expect(source).toContain('目录')
    expect(source).toContain('class="isle-article-editor__toc-desc"')
    expect(source).toContain('添加标题后自动生成')
    expect(source).toMatch(/<div class="isle-article-editor__toc-body">[\s\S]*<IsleEditorToc/)
  })

  it('正文区具备文档纸张感和基础富文本节奏', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__content\s*\{[\s\S]*max-width:\s*820px;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*\{[\s\S]*padding:\s*32px 32px 56px;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap\)\s*\{[\s\S]*line-height:\s*1\.75;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap h1,/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap blockquote\)/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap pre\)/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap img\)/)
  })

  it('工具栏、目录、只读和空文档提示具备独立视觉层级', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*box-shadow:\s*0 1px 0 rgba\(15, 23, 42, 0\.04\);/)
    expect(source).toMatch(/\.isle-article-editor__toc-header\s*\{[\s\S]*padding:\s*14px 16px 10px;/)
    expect(source).toMatch(/\.isle-article-editor__readonly-notice\s*\{[\s\S]*display:\s*flex;/)
    expect(source).toMatch(/\.isle-article-editor--readonly\s+\.isle-article-editor__layout/)
  })

  it('在 1024px 以下明确收敛 layout 与 toc 响应式行为', () => {
    const source = readEditorSource()

    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__layout\s*\{[\s\S]*height:\s*min\(70vh,\s*760px\);/)
    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__toc\s*\{[\s\S]*display:\s*none;/)
    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__toc-toggle\s*\{[\s\S]*display:\s*none;/)
  })
})
