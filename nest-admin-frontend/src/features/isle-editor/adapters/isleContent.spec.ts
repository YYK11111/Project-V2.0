import { describe, expect, it } from 'vitest'

import { createEmptyIsleContent, extractIslePlainText } from './isleContent'

describe('isleContent adapter', () => {
  it('创建带默认版本与状态的空文档', () => {
    expect(createEmptyIsleContent()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    })
  })

  it('从富文本节点中提取纯文本并清理空白', () => {
    const value = extractIslePlainText({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '  第一段  ' },
            { type: 'text', text: '内容' },
          ],
        },
        {
          type: 'image',
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '第二段' }],
        },
      ],
    })

    expect(value).toBe('第一段 内容\n第二段')
  })

  it('同一段多个 text leaf 不插入额外空格', () => {
    const value = extractIslePlainText({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '你好' },
            { type: 'text', text: '，' },
            { type: 'text', text: '世界' },
            { type: 'text', text: '！' },
          ],
        },
      ],
    })

    expect(value).toBe('你好，世界！')
  })
})
