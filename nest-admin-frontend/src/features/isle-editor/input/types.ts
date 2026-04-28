export type PasteSourceKind = 'markdown' | 'office_html' | 'html' | 'plain_text'

export type HtmlPasteSourceKind = Extract<PasteSourceKind, 'office_html' | 'html'>

export interface StandardHeadingBlock {
  type: 'heading'
  level: number
  text: string
}

export interface StandardParagraphBlock {
  type: 'paragraph'
  text: string
}

export interface StandardBulletListBlock {
  type: 'bulletList'
  items: string[]
}

export interface StandardOrderedListBlock {
  type: 'orderedList'
  items: string[]
}

export interface StandardBlockquoteBlock {
  type: 'blockquote'
  text: string
}

export interface StandardImageBlock {
  type: 'image'
  src: string
  alt?: string
  title?: string
}

export interface StandardCodeBlock {
  type: 'codeBlock'
  language: string | null
  code: string
}

export interface StandardTableBlock {
  type: 'table'
  rows: string[][]
}

export type StandardBlock =
  | StandardHeadingBlock
  | StandardParagraphBlock
  | StandardBulletListBlock
  | StandardOrderedListBlock
  | StandardBlockquoteBlock
  | StandardImageBlock
  | StandardCodeBlock
  | StandardTableBlock

export interface PastePayload {
  html: string
  text: string
}
