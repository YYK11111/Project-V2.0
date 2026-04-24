import type { JSONContent } from '@tiptap/core'

function createBlockId(): string {
  return `block-${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: {
          blockId: createBlockId(),
        },
      },
    ],
  }
}

export { createBlockId }
