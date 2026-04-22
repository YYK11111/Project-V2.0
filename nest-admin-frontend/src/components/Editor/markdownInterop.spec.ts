import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, looksLikeMarkdown, markdownToHtml } from './markdownInterop'

function readEditorComponent() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('markdownInterop', () => {
  it('普通文本不会误判为 Markdown', () => {
    expect(looksLikeMarkdown('这是一段普通句子，没有任何特殊语法')).toBe(false)
  })

  it('单条有序列表在合理条件下会识别为 Markdown', () => {
    expect(looksLikeMarkdown('1. 第一步')).toBe(true)
    expect(looksLikeMarkdown('2. 第二步')).toBe(true)
    expect(looksLikeMarkdown('3. 第三步')).toBe(true)
  })

  it('普通编号文本不会被过宽误判为 Markdown', () => {
    expect(looksLikeMarkdown('2024. 完成发布')).toBe(false)
    expect(looksLikeMarkdown('1.23 版本说明')).toBe(false)
  })

  it('标题和列表会识别为 Markdown', () => {
    const text = ['### 处理步骤', '1. 打开系统', '- 检查日志'].join('\n')

    expect(looksLikeMarkdown(text)).toBe(true)
  })

  it('三反引号代码块会识别为 Markdown', () => {
    const text = ['```ts', "console.log('hello')", '```'].join('\n')

    expect(looksLikeMarkdown(text)).toBe(true)
  })

  it('markdownToHtml 能生成标题、列表和代码块 HTML', () => {
    const html = markdownToHtml(['### 标题', '', '1. 第一项', '2. 第二项', '', '```js', 'const a = 1', '```'].join('\n'))

    expect(html).toContain('<h3')
    expect(html).toMatch(/<(ol|ul)>/)
    expect(html).toContain('<pre><code')
  })

  it('markdownToHtml 不透传原生 HTML', () => {
    const html = markdownToHtml('<img src="x" onerror="alert(1)">')

    expect(html).not.toContain('<img')
    expect(html).not.toContain('onerror')
  })

  it('markdownToHtml 不输出危险协议链接和图片', () => {
    const html = markdownToHtml([
      '[危险链接](javascript:alert(1))',
      '',
      '![危险图片](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    ].join('\n'))

    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('data:text/html')
    expect(html).not.toContain('<a href=')
    expect(html).not.toContain('<img')
  })

  it('htmlToMarkdown 能导出标题、列表、代码块和链接', () => {
    const markdown = htmlToMarkdown([
      '<h2>知识标题</h2>',
      '<ol><li>第一步</li><li>第二步</li></ol>',
      '<pre><code>const a = 1;</code></pre>',
      '<p><a href="https://example.com">参考链接</a></p>',
    ].join(''))

    expect(markdown).toContain('## 知识标题')
    expect(markdown).toMatch(/(^|\n)1\.\s+第一步(\n|$)/)
    expect(markdown).toMatch(/(^|\n)2\.\s+第二步(\n|$)/)
    expect(markdown).toContain('```')
    expect(markdown).toContain('[参考链接](https://example.com)')
  })

  it('htmlToMarkdown 尽量按 GFM 导出表格', () => {
    const markdown = htmlToMarkdown([
      '<table>',
      '<thead><tr><th>字段</th><th>说明</th></tr></thead>',
      '<tbody><tr><td>title</td><td>标题</td></tr></tbody>',
      '</table>',
    ].join(''))

    expect(markdown).toMatch(/\|\s*字段\s*\|\s*说明\s*\|/)
    expect(markdown).toMatch(/\|\s*[-:]+\s*\|\s*[-:]+\s*\|/)
    expect(markdown).toMatch(/\|\s*title\s*\|\s*标题\s*\|/)
  })

  it('Editor 组件接入 Markdown 纯文本粘贴识别', () => {
    const source = readEditorComponent()

    expect(source).toContain("import { looksLikeMarkdown, markdownToHtml } from './markdownInterop'")
    expect(source).toContain("editorRoot.addEventListener('paste', this.handlePaste)")
    expect(source).toContain("editorRoot.removeEventListener('paste', this.handlePaste)")
    expect(source).toContain("const clipboardTypes = Array.from(clipboardData.types)")
    expect(source).toContain("if (clipboardTypes.includes('text/html'))")
    expect(source).toContain("const hasPlainText = clipboardTypes.includes('text/plain')")
    expect(source).toContain('if (!hasPlainText)')
    expect(source).toContain('if (!looksLikeMarkdown(text))')
    expect(source).toContain("this.quill.clipboard.dangerouslyPasteHTML(range.index, markdownToHtml(text), 'user')")
    expect(source).toContain("const nextSelection = this.quill.getSelection(true)")
    expect(source).not.toContain("this.quill.setSelection(range.index + 1, 0, 'silent')")
  })
})
