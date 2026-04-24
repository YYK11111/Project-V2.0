import type { JSONContent } from '@tiptap/core'

export type DocumentValidationResult = 'valid' | 'invalid_empty' | 'invalid_root' | 'invalid_block'

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

function isJsonContentBlock(value: unknown): value is JSONContent {
  return typeof value === 'object'
    && value !== null
    && typeof (value as JSONContent).type === 'string'
    && allowedTopLevelBlockTypes.has((value as JSONContent).type)
}

function hasBlockId(block: JSONContent): boolean {
  return typeof block.attrs?.blockId === 'string' && block.attrs.blockId.length > 0
}

export function validateDocument(document: JSONContent | null | undefined): DocumentValidationResult {
  if (!document || Object.keys(document).length === 0) {
    return 'invalid_empty'
  }

  if (document.type !== 'doc') {
    return 'invalid_root'
  }

  if (!Array.isArray(document.content) || document.content.length === 0) {
    return 'invalid_empty'
  }

  if (!document.content.every((block) => isJsonContentBlock(block) && hasBlockId(block))) {
    return 'invalid_block'
  }

  return 'valid'
}
