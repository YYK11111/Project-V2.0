import type { JSONContent } from '@tiptap/core'

export type DocumentNode = JSONContent

export function createEmptyDocument(): DocumentNode {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  }
}
