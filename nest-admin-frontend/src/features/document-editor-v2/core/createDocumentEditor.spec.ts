// @vitest-environment jsdom
import type { JSONContent } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { normalizeDocument } from '../content/normalizeDocument'
import { createDocumentEditor } from './createDocumentEditor'
import { createDocumentExtensions } from '../extensions/documentExtensions'

describe('document-editor-v2 createDocumentEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('createDocumentExtensions 包含第一阶段基础扩展', () => {
    const extensions = createDocumentExtensions('请输入内容')
    const extensionNames = extensions.map((extension) => extension.name)

    expect(extensionNames).toEqual(expect.arrayContaining([
      'starterKit',
      'underline',
      'link',
      'image',
      'placeholder',
      'table',
      'tableRow',
      'tableHeader',
      'tableCell',
      'taskList',
      'taskItem',
    ]))
  })

  it('工厂创建出的 editor 初始 JSON 已带 blockId', () => {
    const editor = createDocumentEditor({
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      placeholder: '请输入内容',
    })

    expect(normalizeDocument(editor.getJSON() as JSONContent)).toMatchObject({
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

    editor.destroy()
  })

  it('onUpdate 输出标准化后的 JSONContent', () => {
    const onUpdate = vi.fn<(content: JSONContent) => void>()
    const editor = createDocumentEditor({
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      placeholder: '请输入内容',
      onUpdate,
    })

    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: {
            level: 2,
          },
        },
      ],
    })

    expect(onUpdate).toHaveBeenCalled()

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]
    const updatedContent = lastCall?.[0]

    expect(updatedContent?.type).toBe('doc')
    expect(updatedContent?.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: {
        level: 2,
        blockId: expect.any(String),
      },
    })
    expect(updatedContent?.content?.every((block) => typeof block.attrs?.blockId === 'string' && block.attrs.blockId.length > 0)).toBe(true)

    editor.destroy()
  })

  it('只为顶层块保留 blockId，不污染嵌套 paragraph', () => {
    const editor = createDocumentEditor({
      content: {
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
                    content: [{ type: 'text', text: 'item' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      placeholder: '请输入内容',
    })

    const document = normalizeDocument(editor.getJSON() as JSONContent)
    expect(document.content?.[0]?.attrs?.blockId).toEqual(expect.any(String))

    const listBlock = document.content?.[0]
    const listItem = listBlock && 'content' in listBlock && Array.isArray(listBlock.content) ? listBlock.content[0] : undefined
    const paragraph = listItem && 'content' in listItem && Array.isArray(listItem.content) ? listItem.content[0] : undefined

    if (!paragraph || !('type' in paragraph) || paragraph.type === 'text') {
      throw new Error('期望列表项内存在段落节点')
    }

    expect(paragraph.attrs?.blockId).toBeUndefined()

    editor.destroy()
  })
})
