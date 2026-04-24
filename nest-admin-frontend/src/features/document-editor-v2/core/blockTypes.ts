export type DocumentBlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'table'
  | 'image'

export type DocumentBlockGroup =
  | 'basic'
  | 'heading'
  | 'list'
  | 'structure'
  | 'media'

export type DocumentBlockDefinition = {
  type: DocumentBlockType
  title: string
  aliases: readonly string[]
  group: DocumentBlockGroup
  showInSlashMenu: boolean
  showInToolbar: boolean
  showInBlockMenu: boolean
  includeInToc: boolean
}
