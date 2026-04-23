import { describe, expect, it } from 'vitest'
import { createEditorExtensions } from './tiptapExtensions'
import { createInitialEditorHtml, getEditorHtml } from './tiptapHtml'
import { markdownToHtml } from './markdownInterop'

describe('tiptapExtensions', () => {
  it('createEditorExtensions 返回当前阶段需要的最小基础扩展集合', () => {
    const extensions = createEditorExtensions('请输入内容')
    const extensionNames = extensions.map((extension) => extension.name)

    expect(extensionNames).toEqual([
      'starterKit',
      'underline',
      'link',
      'image',
      'placeholder',
      'textAlign',
      'table',
      'tableRow',
      'tableHeader',
      'tableCell',
    ])
  })
})

describe('tiptapHtml', () => {
  it('初始化 HTML 工具会兜底空值', () => {
    expect(createInitialEditorHtml()).toBe('')
    expect(createInitialEditorHtml(null)).toBe('')
    expect(createInitialEditorHtml(' <p>内容</p> ')).toBe(' <p>内容</p> ')
  })

  it('初始化 HTML 工具会先把 Markdown 初始值转换成 HTML', () => {
    const markdown = ['## 背景说明', '', '- 步骤一', '- 步骤二'].join('\n')

    expect(createInitialEditorHtml(markdown)).toBe(markdownToHtml(markdown))
  })

  it('导出 HTML 工具会兼容缺失实例', () => {
    expect(getEditorHtml(null)).toBe('')
    expect(getEditorHtml({ getHTML: () => '<p>已导出</p>' })).toBe('<p>已导出</p>')
  })
})
