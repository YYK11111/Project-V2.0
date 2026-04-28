import type { IsleContentDocument, IsleContentDocumentNode } from '../adapters/isleContent'
import type { StandardBlock } from './types'

function createTextNode(text: string): IsleContentDocumentNode {
  return {
    type: 'text',
    text,
  }
}

function createParagraphNode(text: string): IsleContentDocumentNode {
  return {
    type: 'paragraph',
    content: [createTextNode(text)],
  }
}

function createListNode(type: 'bulletList' | 'orderedList', items: string[]): IsleContentDocumentNode {
  return {
    type,
    content: items.map((item) => ({
      type: 'listItem',
      content: [createParagraphNode(item)],
    })),
  }
}

function createTableCellNode(type: 'tableHeader' | 'tableCell', text: string): IsleContentDocumentNode {
  return {
    type,
    content: [createParagraphNode(text)],
  }
}

function importBlock(block: StandardBlock): IsleContentDocumentNode {
  switch (block.type) {
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.level },
        content: [createTextNode(block.text)],
      }
    case 'paragraph':
      return createParagraphNode(block.text)
    case 'bulletList':
      return createListNode('bulletList', block.items)
    case 'orderedList':
      return createListNode('orderedList', block.items)
    case 'blockquote':
      return {
        type: 'blockquote',
        content: [createParagraphNode(block.text)],
      }
    case 'image':
      return {
        type: 'image',
        attrs: {
          src: block.src,
          alt: block.alt ?? '',
          title: block.title ?? '',
        },
      }
    case 'codeBlock':
      return {
        type: 'codeBlock',
        attrs: { language: block.language },
        content: [createTextNode(block.code)],
      }
    case 'table':
      return {
        type: 'table',
        content: block.rows.map((row, rowIndex) => ({
          type: 'tableRow',
          content: row.map((cell) => createTableCellNode(rowIndex === 0 ? 'tableHeader' : 'tableCell', cell)),
        })),
      }
  }
}

export function importBlocksToDocument(blocks: StandardBlock[]): IsleContentDocument {
  return {
    type: 'doc',
    content: blocks.map((block) => importBlock(block)),
  }
}

export function hasImportableBlocks(blocks: StandardBlock[]): boolean {
  return blocks.length > 0
}
