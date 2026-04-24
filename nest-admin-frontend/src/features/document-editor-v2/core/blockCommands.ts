import type { JSONContent } from '@tiptap/core'

import { createBlockId, createEmptyDocument } from '../content/createEmptyDocument'
import { normalizeDocument } from '../content/normalizeDocument'
import { reorderBlocksByBlockId } from './reorderBlocks'

export const blockCommandKeys = [
  'insertBlockBefore',
  'insertBlockAfter',
  'convertBlock',
  'deleteBlock',
  'duplicateBlock',
  'moveBlock',
  'focusBlock',
] as const

export type BlockCommandKey = (typeof blockCommandKeys)[number]

export function convertBlockToType(document: JSONContent, blockId: string, blockType: BlockCommandKey | string): JSONContent {
  const normalizedDocument = normalizeDocument(document)
  const blocks = getTopLevelBlocks(normalizedDocument)
  const targetIndex = blocks.findIndex((block) => block.attrs?.blockId === blockId)

  if (targetIndex < 0) {
    return normalizedDocument
  }

  const currentBlock = blocks[targetIndex]
  const nextBlocks = [...blocks]
  const sharedAttrs = {
    ...(currentBlock.attrs || {}),
    blockId,
  }

  switch (blockType) {
    case 'paragraph':
      nextBlocks[targetIndex] = {
        type: 'paragraph',
        attrs: sharedAttrs,
        content: currentBlock.content,
      }
      break
    case 'heading1':
    case 'heading2':
    case 'heading3': {
      const level = Number(blockType.slice(-1))
      nextBlocks[targetIndex] = {
        type: 'heading',
        attrs: {
          ...sharedAttrs,
          level,
        },
        content: currentBlock.content,
      }
      break
    }
    case 'bulletList':
      nextBlocks[targetIndex] = {
        type: 'bulletList',
        attrs: sharedAttrs,
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: currentBlock.content,
              },
            ],
          },
        ],
      }
      break
    case 'orderedList':
      nextBlocks[targetIndex] = {
        type: 'orderedList',
        attrs: sharedAttrs,
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: currentBlock.content,
              },
            ],
          },
        ],
      }
      break
    case 'taskList':
      nextBlocks[targetIndex] = {
        type: 'taskList',
        attrs: sharedAttrs,
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: currentBlock.content,
              },
            ],
          },
        ],
      }
      break
    case 'blockquote':
      nextBlocks[targetIndex] = {
        type: 'blockquote',
        attrs: sharedAttrs,
        content: [
          {
            type: 'paragraph',
            content: currentBlock.content,
          },
        ],
      }
      break
    case 'codeBlock':
      nextBlocks[targetIndex] = {
        type: 'codeBlock',
        attrs: sharedAttrs,
        content: currentBlock.content,
      }
      break
    default:
      return normalizedDocument
  }

  return {
    ...normalizedDocument,
    content: nextBlocks,
  }
}

function getTopLevelBlocks(document: JSONContent): JSONContent[] {
  return Array.isArray(document.content) ? document.content : []
}

function createParagraphBlock(): JSONContent {
  return {
    type: 'paragraph',
    attrs: {
      blockId: createBlockId(),
    },
  }
}

function cloneBlockWithNewBlockId(block: JSONContent): JSONContent {
  const attrs = block.attrs ? { ...block.attrs } : {}

  return {
    ...block,
    attrs: {
      ...attrs,
      blockId: createBlockId(),
    },
  }
}

export function insertParagraphAfterBlock(document: JSONContent, blockId: string): JSONContent {
  const normalizedDocument = normalizeDocument(document)
  const blocks = getTopLevelBlocks(normalizedDocument)
  const targetIndex = blocks.findIndex((block) => block.attrs?.blockId === blockId)

  if (targetIndex < 0) {
    return normalizedDocument
  }

  const nextBlocks = [...blocks]
  nextBlocks.splice(targetIndex + 1, 0, createParagraphBlock())

  return {
    ...normalizedDocument,
    content: nextBlocks,
  }
}

export function deleteBlockByBlockId(document: JSONContent, blockId: string): JSONContent {
  const normalizedDocument = normalizeDocument(document)
  const blocks = getTopLevelBlocks(normalizedDocument)
  const targetIndex = blocks.findIndex((block) => block.attrs?.blockId === blockId)

  if (targetIndex < 0) {
    return normalizedDocument
  }

  const nextBlocks = [...blocks]
  nextBlocks.splice(targetIndex, 1)

  if (nextBlocks.length === 0) {
    return createEmptyDocument()
  }

  return {
    ...normalizedDocument,
    content: nextBlocks,
  }
}

export function duplicateBlockByBlockId(document: JSONContent, blockId: string): JSONContent {
  const normalizedDocument = normalizeDocument(document)
  const blocks = getTopLevelBlocks(normalizedDocument)
  const targetIndex = blocks.findIndex((block) => block.attrs?.blockId === blockId)

  if (targetIndex < 0) {
    return normalizedDocument
  }

  const nextBlocks = [...blocks]
  nextBlocks.splice(targetIndex + 1, 0, cloneBlockWithNewBlockId(blocks[targetIndex]))

  return {
    ...normalizedDocument,
    content: nextBlocks,
  }
}

export function reorderTopLevelBlocks(
  document: JSONContent,
  movingBlockId: string,
  targetBlockId: string,
): JSONContent {
  return reorderBlocksByBlockId(normalizeDocument(document), movingBlockId, targetBlockId)
}
