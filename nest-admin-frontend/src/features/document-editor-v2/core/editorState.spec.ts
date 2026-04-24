import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import type { BlockContext, DocumentEditorState } from './blockContext'
import { buildEditorState } from './editorState'
import { reorderBlocksByBlockId } from './reorderBlocks'
import { buildTocItems } from './toc'

function createHeadingBlock(blockId: string, level: 1 | 2 | 3 | 4, text: string): JSONContent {
  return {
    type: 'heading',
    attrs: {
      blockId,
      level,
    },
    content: [{ type: 'text', text }],
  }
}

function createParagraphBlock(blockId: string, text: string): JSONContent {
  return {
    type: 'paragraph',
    attrs: {
      blockId,
    },
    content: [{ type: 'text', text }],
  }
}

describe('document-editor-v2 editorState', () => {
  it('TOC 只收集 heading1-3', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        createHeadingBlock('heading-1', 1, '总览'),
        createParagraphBlock('paragraph-1', '正文'),
        createHeadingBlock('heading-2', 2, '细节'),
        createHeadingBlock('heading-3', 3, '补充'),
        createHeadingBlock('heading-4', 4, '不应进入 TOC'),
      ],
    }

    expect(buildTocItems(document)).toEqual([
      {
        blockId: 'heading-1',
        level: 1,
        text: '总览',
      },
      {
        blockId: 'heading-2',
        level: 2,
        text: '细节',
      },
      {
        blockId: 'heading-3',
        level: 3,
        text: '补充',
      },
    ])
  })

  it('TOC 会过滤空标题，并为多行标题保留分隔', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: {
            blockId: 'heading-multiline',
            level: 2,
          },
          content: [
            { type: 'text', text: '第一行' },
            { type: 'hardBreak' },
            { type: 'text', text: '第二行' },
          ],
        },
        {
          type: 'heading',
          attrs: {
            blockId: 'heading-empty',
            level: 2,
          },
          content: [{ type: 'text', text: '   ' }],
        },
      ],
    }

    expect(buildTocItems(document)).toEqual([
      {
        blockId: 'heading-multiline',
        level: 2,
        text: '第一行 第二行',
      },
    ])
  })

  it('顶层块排序正确', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        createParagraphBlock('block-a', 'A'),
        createParagraphBlock('block-b', 'B'),
        createParagraphBlock('block-c', 'C'),
      ],
    }

    const reordered = reorderBlocksByBlockId(document, 'block-c', 'block-a')

    expect(reordered.content?.map((block) => block.attrs?.blockId)).toEqual(['block-c', 'block-a', 'block-b'])
  })

  it('顶层块向下移动时顺序正确', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        createParagraphBlock('block-a', 'A'),
        createParagraphBlock('block-b', 'B'),
        createParagraphBlock('block-c', 'C'),
      ],
    }

    const reordered = reorderBlocksByBlockId(document, 'block-a', 'block-c')

    expect(reordered.content?.map((block) => block.attrs?.blockId)).toEqual(['block-b', 'block-a', 'block-c'])
  })

  it('无效 blockId 时原样返回', () => {
    const document: JSONContent = {
      type: 'doc',
      content: [
        createParagraphBlock('block-a', 'A'),
        createParagraphBlock('block-b', 'B'),
      ],
    }

    expect(reorderBlocksByBlockId(document, 'missing', 'block-a')).toBe(document)
    expect(reorderBlocksByBlockId(document, 'block-a', 'missing')).toBe(document)
    expect(reorderBlocksByBlockId(document, 'block-a', 'block-a')).toBe(document)
  })

  it('空文档仍能兜底为最小 paragraph', () => {
    const state = buildEditorState(null)

    expect(state.document).toMatchObject({
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
    expect(state.tocItems).toEqual([])
    expect(state.blockContexts).toHaveLength(1)
    expect(state.blockContexts[0]).toMatchObject({
      blockId: expect.any(String),
      blockType: 'paragraph',
      index: 0,
      depth: 0,
      isActive: false,
    })
  })

  it('提供稳定的最小块上下文与编辑器状态类型形状', () => {
    const context: BlockContext = {
      blockId: 'block-heading',
      blockType: 'heading',
      index: 0,
      depth: 0,
      isActive: true,
    }
    const state: DocumentEditorState = {
      document: {
        type: 'doc',
        content: [createHeadingBlock('block-heading', 1, '标题')],
      },
      blockContexts: [context],
      tocItems: [
        {
          blockId: 'block-heading',
          level: 1,
          text: '标题',
        },
      ],
    }

    expect(state.blockContexts[0]?.blockId).toBe('block-heading')
    expect(state.tocItems[0]?.level).toBe(1)
  })

  it('buildEditorState 在正常文档上同步生成 blockContexts 与 tocItems', () => {
    const state = buildEditorState({
      type: 'doc',
      content: [
        createHeadingBlock('heading-1', 1, '标题'),
        createParagraphBlock('paragraph-1', '正文'),
      ],
    })

    expect(state.blockContexts).toEqual([
      {
        blockId: 'heading-1',
        blockType: 'heading',
        index: 0,
        depth: 0,
        isActive: false,
      },
      {
        blockId: 'paragraph-1',
        blockType: 'paragraph',
        index: 1,
        depth: 0,
        isActive: false,
      },
    ])
    expect(state.tocItems).toEqual([
      {
        blockId: 'heading-1',
        level: 1,
        text: '标题',
      },
    ])
  })
})
