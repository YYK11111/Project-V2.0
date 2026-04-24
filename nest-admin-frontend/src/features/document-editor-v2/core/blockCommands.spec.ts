import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import {
  deleteBlockByBlockId,
  duplicateBlockByBlockId,
  insertParagraphAfterBlock,
  reorderTopLevelBlocks,
} from './blockCommands'

function createDocument(blocks: JSONContent[]): JSONContent {
  return {
    type: 'doc',
    content: blocks,
  }
}

describe('blockCommands', () => {
  it('在指定块后插入 paragraph', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-1',
        },
      },
      {
        type: 'heading',
        attrs: {
          blockId: 'block-2',
          level: 2,
        },
      },
    ])

    const nextDocument = insertParagraphAfterBlock(document, 'block-1')

    expect(nextDocument.content).toHaveLength(3)
    expect(nextDocument.content?.[1]).toMatchObject({
      type: 'paragraph',
      attrs: {
        blockId: expect.any(String),
      },
    })
    expect(nextDocument.content?.[2]?.attrs?.blockId).toBe('block-2')
  })

  it('删除最后一个块时仍保留 paragraph', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-1',
        },
      },
    ])

    const nextDocument = deleteBlockByBlockId(document, 'block-1')

    expect(nextDocument).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: {
            blockId: expect.any(String),
          },
        },
      ],
    })
  })

  it('找不到目标块时删除命令保持 no-op', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-1',
        },
      },
    ])

    const nextDocument = deleteBlockByBlockId(document, 'missing-block')

    expect(nextDocument).toEqual(document)
  })

  it('重复 blockId 时只删除首个命中块', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'duplicate-block',
        },
      },
      {
        type: 'heading',
        attrs: {
          blockId: 'duplicate-block',
          level: 2,
        },
      },
    ])

    const nextDocument = deleteBlockByBlockId(document, 'duplicate-block')

    expect(nextDocument.content).toHaveLength(1)
    expect(nextDocument.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: {
        blockId: 'duplicate-block',
        level: 2,
      },
    })
  })

  it('复制块后生成新的 blockId', () => {
    const document = createDocument([
      {
        type: 'blockquote',
        attrs: {
          blockId: 'block-1',
        },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'quote' }],
          },
        ],
      },
    ])

    const nextDocument = duplicateBlockByBlockId(document, 'block-1')

    expect(nextDocument.content).toHaveLength(2)
    expect(nextDocument.content?.[0]?.attrs?.blockId).toBe('block-1')
    expect(nextDocument.content?.[1]).toMatchObject({
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'quote' }],
        },
      ],
    })
    expect(nextDocument.content?.[1]?.attrs?.blockId).toEqual(expect.any(String))
    expect(nextDocument.content?.[1]?.attrs?.blockId).not.toBe('block-1')
  })

  it('按 blockId 正确重排顶层块', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-1',
        },
      },
      {
        type: 'heading',
        attrs: {
          blockId: 'block-2',
          level: 2,
        },
      },
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-3',
        },
      },
    ])

    const nextDocument = reorderTopLevelBlocks(document, 'block-3', 'block-1')

    expect(nextDocument.content?.map((block) => block.attrs?.blockId)).toEqual([
      'block-3',
      'block-1',
      'block-2',
    ])
  })

  it('找不到目标块时排序命令保持 no-op', () => {
    const document = createDocument([
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-1',
        },
      },
      {
        type: 'paragraph',
        attrs: {
          blockId: 'block-2',
        },
      },
    ])

    expect(reorderTopLevelBlocks(document, 'missing', 'block-1')).toStrictEqual(document)
    expect(reorderTopLevelBlocks(document, 'block-1', 'missing')).toStrictEqual(document)
  })
})
