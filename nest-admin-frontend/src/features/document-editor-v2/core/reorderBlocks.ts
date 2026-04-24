import type { JSONContent } from '@tiptap/core'

export function reorderBlocksByBlockId(
  document: JSONContent,
  movingBlockId: string,
  targetBlockId: string,
): JSONContent {
  if (!Array.isArray(document.content) || movingBlockId === targetBlockId) {
    return document
  }

  const movingIndex = document.content.findIndex((block) => block.attrs?.blockId === movingBlockId)
  const targetIndex = document.content.findIndex((block) => block.attrs?.blockId === targetBlockId)

  if (movingIndex < 0 || targetIndex < 0) {
    return document
  }

  const reorderedBlocks = [...document.content]
  const [movingBlock] = reorderedBlocks.splice(movingIndex, 1)
  const nextTargetIndex = movingIndex < targetIndex ? targetIndex - 1 : targetIndex

  reorderedBlocks.splice(nextTargetIndex, 0, movingBlock)

  return {
    ...document,
    content: reorderedBlocks,
  }
}
