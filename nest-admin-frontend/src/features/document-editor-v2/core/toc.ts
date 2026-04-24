import type { JSONContent } from '@tiptap/core'

export interface TocItem {
  blockId: string
  level: 1 | 2 | 3
  text: string
}

function readHeadingLevel(block: JSONContent): 1 | 2 | 3 | null {
  const level = block.attrs?.level

  if (level === 1 || level === 2 || level === 3) {
    return level
  }

  return null
}

function readTextContent(node: JSONContent | null | undefined): string {
  if (!node) {
    return ''
  }

  if (node.type === 'hardBreak') {
    return ' '
  }

  const currentText = typeof node.text === 'string' ? node.text : ''
  const childText = Array.isArray(node.content)
    ? node.content.map((child) => readTextContent(child)).join('')
    : ''

  return `${currentText}${childText}`
}

export function buildTocItems(document: JSONContent): TocItem[] {
  if (!Array.isArray(document.content)) {
    return []
  }

  return document.content.flatMap((block) => {
    if (block.type !== 'heading') {
      return []
    }

    const level = readHeadingLevel(block)
    const blockId = typeof block.attrs?.blockId === 'string' ? block.attrs.blockId : ''

    if (!level || !blockId) {
      return []
    }

    const text = readTextContent(block).trim()

    if (!text) {
      return []
    }

    return [{
      blockId,
      level,
      text,
    }]
  })
}
