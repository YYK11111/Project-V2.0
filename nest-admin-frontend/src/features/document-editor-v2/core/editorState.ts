import type { JSONContent } from '@tiptap/core'

import { normalizeDocument } from '../content/normalizeDocument'
import type { DocumentBlockType } from './blockTypes'
import type { BlockContext, DocumentEditorState } from './blockContext'
import { buildTocItems } from './toc'

function isDocumentBlockType(value: string): value is DocumentBlockType | 'heading' {
  return [
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
  ].includes(value)
}

function buildBlockContexts(document: JSONContent): BlockContext[] {
  if (!Array.isArray(document.content)) {
    return []
  }

  return document.content.map((block, index) => ({
    blockId: typeof block.attrs?.blockId === 'string' ? block.attrs.blockId : '',
    blockType: isDocumentBlockType(block.type) ? block.type : 'paragraph',
    index,
    depth: 0,
    isActive: false,
  }))
}

export function buildEditorState(document: JSONContent | null | undefined): DocumentEditorState {
  const normalizedDocument = normalizeDocument(document)

  return {
    document: normalizedDocument,
    blockContexts: buildBlockContexts(normalizedDocument),
    tocItems: buildTocItems(normalizedDocument),
  }
}
