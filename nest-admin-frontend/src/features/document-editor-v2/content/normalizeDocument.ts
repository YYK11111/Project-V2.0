import type { JSONContent } from '@tiptap/core'

import { createBlockId, createEmptyDocument } from './createEmptyDocument'

const allowedTopLevelBlockTypes = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'table',
  'image',
])

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isJsonContentBlock(value: unknown): value is JSONContent {
  return isObject(value) && typeof value.type === 'string' && allowedTopLevelBlockTypes.has(value.type)
}

function hasRootContent(content: JSONContent['content']): content is JSONContent[] {
  return Array.isArray(content) && content.length > 0
}

function normalizeNestedNode(node: JSONContent): JSONContent {
  const attrs = isObject(node.attrs) ? { ...node.attrs } : undefined

  if (attrs && 'blockId' in attrs) {
    delete attrs.blockId
  }

  return {
    ...node,
    ...(attrs && Object.keys(attrs).length > 0 ? { attrs } : attrs ? { attrs: undefined } : {}),
    ...(Array.isArray(node.content)
      ? {
          content: node.content
            .filter((child): child is JSONContent => isObject(child) && typeof child.type === 'string')
            .map((child) => normalizeNestedNode(child)),
        }
      : {}),
  }
}

function normalizeNestedChildren(node: JSONContent): JSONContent {
  return {
    ...node,
    ...(Array.isArray(node.content)
      ? {
          content: node.content
            .filter((child): child is JSONContent => isObject(child) && typeof child.type === 'string')
            .map((child) => normalizeNestedNode(child)),
        }
      : {}),
  }
}

function normalizeBlock(block: JSONContent): JSONContent {
  const normalizedBlock = normalizeNestedChildren(block)
  const attrs = isObject(normalizedBlock.attrs) ? normalizedBlock.attrs : {}

  if (typeof attrs.blockId === 'string' && attrs.blockId.length > 0) {
    return normalizedBlock
  }

  return {
    ...normalizedBlock,
    attrs: {
      ...attrs,
      blockId: createBlockId(),
    },
  }
}

export function normalizeDocument(document: JSONContent | null | undefined): JSONContent {
  if (!document || document.type !== 'doc' || !hasRootContent(document.content)) {
    return createEmptyDocument()
  }

  const blocks = document.content.filter(isJsonContentBlock)

  if (!blocks.length) {
    return createEmptyDocument()
  }

  return {
    ...document,
    content: blocks.map((block) => normalizeBlock(block)),
  }
}
