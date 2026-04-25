export interface IsleContentMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface IsleContentNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: IsleContentMark[]
  content?: IsleContentNode[]
}

export interface IsleContentDocument {
  type: 'doc'
  content: IsleContentNode[]
}

export function createEmptyIsleContent(): IsleContentDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  }
}

function extractNodeText(node: IsleContentNode | null | undefined): string {
  if (!node) {
    return ''
  }

  const currentText = typeof node.text === 'string' ? node.text : ''
  const childText = Array.isArray(node.content)
    ? node.content.map((child) => extractNodeText(child)).join('')
    : ''

  return `${currentText}${childText}`
}

export function extractIslePlainText(document: IsleContentDocument | null | undefined): string {
  if (!document || !Array.isArray(document.content) || document.content.length === 0) {
    return ''
  }

  return document.content
    .map((node) => extractNodeText(node).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}
