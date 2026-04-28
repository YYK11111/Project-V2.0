import { describe, expect, it } from 'vitest'

import { buildDocumentFromPaste } from './index'

describe('buildDocumentFromPaste', () => {
  it('markdown 输入走统一管道并输出 document root', () => {
    expect(
      buildDocumentFromPaste({
        html: '',
        text: '# 标题\n\n- 列表项',
      }),
    ).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '标题' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项' }] }],
            },
          ],
        },
      ],
    })
  })
})
