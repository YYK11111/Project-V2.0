import { describe, expect, it } from 'vitest'

import type { StandardBlock } from './types'
import { importBlocksToDocument } from './editorImporter'

describe('importBlocksToDocument', () => {
  it('将 heading、paragraph、bulletList 和 image 转成 editor document', () => {
    const blocks: StandardBlock[] = [
      {
        type: 'heading',
        level: 2,
        text: '章节标题',
      },
      {
        type: 'paragraph',
        text: '正文内容',
      },
      {
        type: 'bulletList',
        items: ['第一项', '第二项'],
      },
      {
        type: 'image',
        src: '/upload/demo.png',
        alt: '示例图片',
        title: '封面图',
      },
    ]

    expect(importBlocksToDocument(blocks)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '章节标题' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '正文内容' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一项' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '第二项' }] }],
            },
          ],
        },
        {
          type: 'image',
          attrs: {
            src: '/upload/demo.png',
            alt: '示例图片',
            title: '封面图',
          },
        },
      ],
    })
  })

  it('按最小 schema 支持 orderedList、blockquote、codeBlock 和 table', () => {
    const blocks: StandardBlock[] = [
      {
        type: 'orderedList',
        items: ['第一步', '第二步'],
      },
      {
        type: 'blockquote',
        text: '引用内容',
      },
      {
        type: 'codeBlock',
        language: 'ts',
        code: 'const value = 1',
      },
      {
        type: 'table',
        rows: [
          ['表头一', '表头二'],
          ['单元格一', '单元格二'],
        ],
      },
    ]

    expect(importBlocksToDocument(blocks)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一步' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '第二步' }] }],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '引用内容' }] }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [{ type: 'text', text: 'const value = 1' }],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '表头一' }] }],
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '表头二' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '单元格一' }] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '单元格二' }] }],
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
