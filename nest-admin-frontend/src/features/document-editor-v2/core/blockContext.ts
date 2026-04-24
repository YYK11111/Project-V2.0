import type { JSONContent } from '@tiptap/core'

import type { DocumentBlockType } from './blockTypes'
import type { TocItem } from './toc'

export interface BlockContext {
  blockId: string
  blockType: DocumentBlockType | 'heading'
  index: number
  depth: number
  isActive: boolean
}

export interface DocumentEditorState {
  document: JSONContent
  blockContexts: BlockContext[]
  tocItems: TocItem[]
}
