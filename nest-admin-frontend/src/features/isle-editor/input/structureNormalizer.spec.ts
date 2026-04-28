import { describe, expect, it } from 'vitest'

import { normalizeStructure } from './structureNormalizer'

describe('normalizeStructure', () => {
  it('将 markdown 归一化为 heading、bulletList 和 codeBlock', () => {
    const result = normalizeStructure('markdown', '# 标题\n\n- 列表项\n\n```ts\nconst value = 1\n```')

    expect(result).toEqual([
      {
        type: 'heading',
        level: 1,
        text: '标题',
      },
      {
        type: 'bulletList',
        items: ['列表项'],
      },
      {
        type: 'codeBlock',
        language: 'ts',
        code: 'const value = 1',
      },
    ])
  })

  it('将 markdown 归一化为 orderedList 和 blockquote', () => {
    const result = normalizeStructure('markdown', '1. 第一项\n2. 第二项\n\n> 引用内容')

    expect(result).toEqual([
      {
        type: 'orderedList',
        items: ['第一项', '第二项'],
      },
      {
        type: 'blockquote',
        text: '引用内容',
      },
    ])
  })

  it('将 markdown 归一化为 table 和 image', () => {
    const result = normalizeStructure(
      'markdown',
      '| 列一 | 列二 |\n| --- | --- |\n| 值一 | 值二 |\n\n![示意图](https://example.com/image.png "图片标题")',
    )

    expect(result).toEqual([
      {
        type: 'table',
        rows: [
          ['列一', '列二'],
          ['值一', '值二'],
        ],
      },
      {
        type: 'image',
        src: 'https://example.com/image.png',
        alt: '示意图',
        title: '图片标题',
      },
    ])
  })

  it('将 sanitized html 归一化为 paragraph 和 table', () => {
    const result = normalizeStructure('html', '<p>第一段</p><table><tr><th>表头</th><th>列二</th></tr><tr><td>单元格</td><td>值</td></tr></table>')

    expect(result).toEqual([
      {
        type: 'paragraph',
        text: '第一段',
      },
      {
        type: 'table',
        rows: [
          ['表头', '列二'],
          ['单元格', '值'],
        ],
      },
    ])
  })

  it('html 被常见容器包裹时，仍能提取 paragraph 和 table', () => {
    const result = normalizeStructure('office_html', '<section><div><p>第一段</p><table><tr><th>表头</th></tr><tr><td>单元格</td></tr></table></div></section>')

    expect(result).toEqual([
      {
        type: 'paragraph',
        text: '第一段',
      },
      {
        type: 'table',
        rows: [['表头'], ['单元格']],
      },
    ])
  })

  it('将 html 归一化为 heading、列表、引用、图片和代码块', () => {
    const result = normalizeStructure(
      'html',
      '<h2>二级标题</h2><ul><li>第一项</li><li>第二项</li></ul><ol><li>步骤一</li><li>步骤二</li></ol><blockquote>引用内容</blockquote><img src="https://example.com/image.png" alt="示意图" title="图片标题"><pre><code class="language-ts">const value = 1\n</code></pre>'
    )

    expect(result).toEqual([
      {
        type: 'heading',
        level: 2,
        text: '二级标题',
      },
      {
        type: 'bulletList',
        items: ['第一项', '第二项'],
      },
      {
        type: 'orderedList',
        items: ['步骤一', '步骤二'],
      },
      {
        type: 'blockquote',
        text: '引用内容',
      },
      {
        type: 'image',
        src: 'https://example.com/image.png',
        alt: '示意图',
        title: '图片标题',
      },
      {
        type: 'codeBlock',
        language: 'ts',
        code: 'const value = 1',
      },
    ])
  })

  it('blockquote 内部段落不重复产出 paragraph', () => {
    const result = normalizeStructure('html', '<blockquote><p>引用内容</p></blockquote>')

    expect(result).toEqual([
      {
        type: 'blockquote',
        text: '引用内容',
      },
    ])
  })

  it('office html 中 pre 无 code 子节点时，仍归一化为代码块', () => {
    const result = normalizeStructure('office_html', '<div><pre>SELECT * FROM demo;\n</pre></div>')

    expect(result).toEqual([
      {
        type: 'codeBlock',
        language: null,
        code: 'SELECT * FROM demo;',
      },
    ])
  })

  it('pre code 保留前导缩进，仅去掉末尾空换行', () => {
    const result = normalizeStructure('html', '<pre><code>  const value = 1;\n    return value;\n\n</code></pre>')

    expect(result).toEqual([
      {
        type: 'codeBlock',
        language: null,
        code: '  const value = 1;\n    return value;',
      },
    ])
  })

  it('将 plain text 中的 bullet marker 识别为列表，并保留链接文本', () => {
    const result = normalizeStructure('plain_text', '- 第一项\n- 第二项\n\n访问 https://example.com/docs 获取详情')

    expect(result).toEqual([
      {
        type: 'bulletList',
        items: ['第一项', '第二项'],
      },
      {
        type: 'paragraph',
        text: '访问 https://example.com/docs 获取详情',
      },
    ])
  })
})
