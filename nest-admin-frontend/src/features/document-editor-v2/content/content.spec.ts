import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { createEmptyDocument } from './createEmptyDocument'
import { normalizeDocument } from './normalizeDocument'
import { validateDocument } from './validateDocument'

describe('document-editor-v2 content', () => {
  it('createEmptyDocument 返回带 blockId 的最小文档', () => {
    const document = createEmptyDocument()

    expect(document.type).toBe('doc')
    expect(document.content).toHaveLength(1)
    expect(document.content?.[0]).toMatchObject({
      type: 'paragraph',
      attrs: {
        blockId: expect.any(String),
      },
    })
  })

  it('normalizeDocument 为顶层块补齐 blockId', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
        {
          type: 'heading',
          attrs: {
            level: 2,
          },
        },
      ],
    }

    const normalized = normalizeDocument(document)

    expect(normalized.type).toBe('doc')
    expect(normalized.content).toHaveLength(2)
    expect(normalized.content?.[0]).toMatchObject({
      type: 'paragraph',
      attrs: {
        blockId: expect.any(String),
      },
    })
    expect(normalized.content?.[1]).toMatchObject({
      type: 'heading',
      attrs: {
        level: 2,
        blockId: expect.any(String),
      },
    })
  })

  it('normalizeDocument 对空结构兜底', () => {
    for (const document of [null, {}, { type: 'doc', content: [] }]) {
      expect(normalizeDocument(document)).toMatchObject({
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
    }
  })

  it('normalizeDocument 过滤非法顶层块并在全部非法时兜底', () => {
    expect(
      normalizeDocument({
        type: 'doc',
        content: [null, 1] as unknown as JSONContent[],
      }),
    ).toMatchObject({
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

    expect(
      normalizeDocument({
        type: 'doc',
        content: [{ type: 'text', text: 'hello' }],
      }),
    ).toMatchObject({
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

  it('normalizeDocument 只保留顶层块的 blockId，清理嵌套节点上的 blockId', () => {
    const normalized = normalizeDocument({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    blockId: 'nested-paragraph',
                  },
                  content: [{ type: 'text', text: 'item' }],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(normalized.content?.[0]?.attrs?.blockId).toEqual(expect.any(String))
    expect(normalized.content?.[0]?.content?.[0]?.content?.[0]?.attrs?.blockId).toBeUndefined()
  })

  it('validateDocument 返回 valid', () => {
    expect(validateDocument(createEmptyDocument())).toBe('valid')
  })

  it('validateDocument 返回 invalid_empty', () => {
    expect(validateDocument(null)).toBe('invalid_empty')
    expect(validateDocument({})).toBe('invalid_empty')
  })

  it('validateDocument 返回 invalid_root', () => {
    expect(
      validateDocument({
        type: 'paragraph',
      }),
    ).toBe('invalid_root')
  })

  it('validateDocument 返回 invalid_block', () => {
    expect(
      validateDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      }),
    ).toBe('invalid_block')

    expect(
      validateDocument({
        type: 'doc',
        content: [null] as unknown as JSONContent[],
      }),
    ).toBe('invalid_block')

    expect(
      validateDocument({
        type: 'doc',
        content: [{ type: 'text', attrs: { blockId: 'block-text' } }],
      }),
    ).toBe('invalid_block')
  })
})
