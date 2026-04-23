// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import * as markdownInterop from './markdownInterop'
import { bridgeTiptapMarkdownPaste } from './tiptapPasteBridge'

function createClipboardData(options: { html?: string; text?: string; types: string[] }) {
  return {
    types: options.types,
    getData(type: string) {
      if (type === 'text/html') {
        return options.html ?? ''
      }

      if (type === 'text/plain') {
        return options.text ?? ''
      }

      return ''
    },
  }
}

function createLongMarkdownFromUserSample() {
  const chunk = [
    '```bash',
    'du –sh dirname',
    '```',
    '',
    '### 15. 解压小全',
    '',
    '| 压缩格式 | 解压命令 | 压缩命令 | 备注 |',
    '| --- | --- | --- | --- |',
    '| .tar.bz2 | `tar xvfj lichuanhua.tar.bz2` | `tar jcvf FileName.tar.bz2 DirName` | - |',
    '| .tar.gz | `tar xvfz lichuanhua.tar.gz` | `tar zcvf FileName.tar.gz DirName` | - |',
    '| .zip | `unzip lichuanhua.zip` | `zip FileName.zip DirName` | - |',
    '| .rar | `rar e FileName.rar` | `rar a FileName.rar` | rar请到[http://www.rarsoft.com/download.htm](http://www.rarsoft.com/download.htm)下载 |',
    '',
    '### 16. 显示内存使用情况',
    '',
    '```bash',
    'free –m',
    '```',
    '',
    '### 17. 忘记了root密码',
    '',
    '#### （1）lilo',
    '',
    '1. 在出现lilo菜单的时候按“ctrl+x”或者“Tab”，然后输入：`linux single`。',
    '2. 回车可直接进入linux命令行。',
    '3. ```bash',
    '   # vi /etc/shadow',
    '   ```',
    '',
    '### 18. 显示系统运行了多长时间',
    '',
    '```bash',
    'uptime',
    '```',
    '',
  ].join('\n')

  return Array.from({ length: 20 }, () => chunk).join('\n')
}

describe('markdownInterop', () => {
  it('普通文本不会误判为 Markdown', () => {
    expect(markdownInterop.looksLikeMarkdown('这是一段普通句子，没有任何特殊语法')).toBe(false)
  })

  it('单条有序列表在合理条件下会识别为 Markdown', () => {
    expect(markdownInterop.looksLikeMarkdown('1. 第一步')).toBe(true)
    expect(markdownInterop.looksLikeMarkdown('2. 第二步')).toBe(true)
    expect(markdownInterop.looksLikeMarkdown('3. 第三步')).toBe(true)
  })

  it('普通编号文本不会被过宽误判为 Markdown', () => {
    expect(markdownInterop.looksLikeMarkdown('2024. 完成发布')).toBe(false)
    expect(markdownInterop.looksLikeMarkdown('1.23 版本说明')).toBe(false)
  })

  it('标题和列表会识别为 Markdown', () => {
    const text = ['### 处理步骤', '1. 打开系统', '- 检查日志'].join('\n')

    expect(markdownInterop.looksLikeMarkdown(text)).toBe(true)
  })

  it('三反引号代码块会识别为 Markdown', () => {
    const text = ['```ts', "console.log('hello')", '```'].join('\n')

    expect(markdownInterop.looksLikeMarkdown(text)).toBe(true)
  })

  it('GFM 表格会识别为 Markdown 并转成表格 HTML', () => {
    const text = [
      '| 压缩格式 | 解压命令 | 压缩命令 | 备注 |',
      '| --- | --- | --- | --- |',
      '| .tar.gz | `tar xvfz lichuanhua.tar.gz` | `tar zcvf FileName.tar.gz DirName` | - |',
      '| .zip | `unzip lichuanhua.zip` | `zip FileName.zip DirName` | - |',
    ].join('\n')

    expect(markdownInterop.looksLikeMarkdown(text)).toBe(true)

    const html = markdownInterop.markdownToHtml(text)

    expect(html).toContain('<table>')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
  })

  it('带空行和对齐符号的 GFM 表格会识别为 Markdown', () => {
    const text = [
      '',
      '| 列1 | 列2 | 列3 |',
      '| :--- | :---: | ---: |',
      '| A | B | C |',
      '',
      '后续段落',
    ].join('\n')

    expect(markdownInterop.looksLikeMarkdown(text)).toBe(true)
  })

  it('单元格包含代码和链接的 GFM 表格会识别为 Markdown', () => {
    const text = [
      '| 命令 | 说明 |',
      '| --- | --- |',
      '| `tar xvfz file.tar.gz` | [查看文档](https://example.com) |',
    ].join('\n')

    expect(markdownInterop.looksLikeMarkdown(text)).toBe(true)

    const html = markdownInterop.markdownToHtml(text)

    expect(html).toContain('<table>')
    expect(html).toContain('<code>tar xvfz file.tar.gz</code>')
    expect(html).toContain('<a href="https://example.com">查看文档</a>')
  })

  it('用户长 Markdown 样本在长输入场景下仍能生成表格 HTML', () => {
    const markdown = createLongMarkdownFromUserSample()

    expect(markdown.length).toBeGreaterThan(5000)
    expect(markdownInterop.looksLikeMarkdown(markdown)).toBe(true)

    const html = markdownInterop.markdownToHtml(markdown)

    expect(html).toContain('<table>')
    expect(html).toContain('<h3>15. 解压小全</h3>')
    expect(html).toContain('压缩格式')
    expect(html).toContain('解压命令')
  })

  it('markdownToHtml 能生成标题、列表和代码块 HTML', () => {
    const html = markdownInterop.markdownToHtml(['### 标题', '', '1. 第一项', '2. 第二项', '', '```js', 'const a = 1', '```'].join('\n'))

    expect(html).toContain('<h3')
    expect(html).toMatch(/<(ol|ul)>/)
    expect(html).toContain('<pre><code')
  })

  it('markdownToHtml 不透传原生 HTML', () => {
    const html = markdownInterop.markdownToHtml('<img src="x" onerror="alert(1)">')

    expect(html).not.toContain('<img')
    expect(html).not.toContain('onerror')
  })

  it('markdownToHtml 不输出危险协议链接和图片', () => {
    const html = markdownInterop.markdownToHtml([
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
    const markdown = markdownInterop.htmlToMarkdown([
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
    const markdown = markdownInterop.htmlToMarkdown([
      '<table>',
      '<thead><tr><th>字段</th><th>说明</th></tr></thead>',
      '<tbody><tr><td>title</td><td>标题</td></tr></tbody>',
      '</table>',
    ].join(''))

    expect(markdown).toMatch(/\|\s*字段\s*\|\s*说明\s*\|/)
    expect(markdown).toMatch(/\|\s*[-:]+\s*\|\s*[-:]+\s*\|/)
    expect(markdown).toMatch(/\|\s*title\s*\|\s*标题\s*\|/)
  })

  it('含 text/html 的剪贴板保留默认粘贴行为', () => {
    const looksLikeMarkdownSpy = vi.spyOn(markdownInterop, 'looksLikeMarkdown')
    const markdownToHtmlSpy = vi.spyOn(markdownInterop, 'markdownToHtml')
    const insertHtml = vi.fn()
    const result = bridgeTiptapMarkdownPaste({
      clipboardData: createClipboardData({
        html: '<p>保留原始 HTML</p>',
        text: '# 标题',
        types: ['text/plain', 'text/html'],
      }),
      insertHtml,
      disabled: false,
      looksLikeMarkdown: markdownInterop.looksLikeMarkdown,
      markdownToHtml: markdownInterop.markdownToHtml,
    })

    expect(result).toEqual({
      handled: false,
      inserted: false,
    })
    expect(looksLikeMarkdownSpy).not.toHaveBeenCalled()
    expect(markdownToHtmlSpy).not.toHaveBeenCalled()
    expect(insertHtml).not.toHaveBeenCalled()
  })

  it('纯文本 Markdown 会触发转换并通过编辑器插入 HTML', () => {
    const markdownText = ['# 标题', '', '- 列表项'].join('\n')
    const looksLikeMarkdownSpy = vi.spyOn(markdownInterop, 'looksLikeMarkdown')
    const markdownToHtmlSpy = vi.spyOn(markdownInterop, 'markdownToHtml')
    const insertHtml = vi.fn()
    const result = bridgeTiptapMarkdownPaste({
      clipboardData: createClipboardData({
        text: markdownText,
        types: ['text/plain'],
      }),
      insertHtml,
      disabled: false,
      looksLikeMarkdown: markdownInterop.looksLikeMarkdown,
      markdownToHtml: markdownInterop.markdownToHtml,
    })

    expect(result).toEqual({
      handled: true,
      inserted: true,
    })
    expect(looksLikeMarkdownSpy).toHaveBeenCalledWith(markdownText)
    expect(markdownToHtmlSpy).toHaveBeenCalledWith(markdownText)
    expect(insertHtml).toHaveBeenCalledTimes(1)
    expect(insertHtml.mock.calls[0]?.[0]).toContain('<h1>标题</h1>')
  })
})
