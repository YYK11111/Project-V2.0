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

  it('在 1024px 以下明确收敛 layout 与 toc 响应式行为', () => {
    const source = readEditorSource()

    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__layout\s*\{[\s\S]*height:\s*min\(70vh,\s*760px\);/)
    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__toc\s*\{[\s\S]*display:\s*none;/)
    expect(source).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.isle-article-editor__toc-toggle\s*\{[\s\S]*display:\s*none;/)
  })
})
