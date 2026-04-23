import type { ChainedCommands } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type DocumentCommandKey =
  | 'toggleHeading'
  | 'toggleBulletList'
  | 'toggleOrderedList'
  | 'toggleBlockquote'
  | 'toggleCodeBlock'
  | 'insertHorizontalRule'
  | 'insertTable'
  | 'setLink'
  | 'clearFormatting'

export const documentCommandKeys: DocumentCommandKey[] = [
  'toggleHeading',
  'toggleBulletList',
  'toggleOrderedList',
  'toggleBlockquote',
  'toggleCodeBlock',
  'insertHorizontalRule',
  'insertTable',
  'setLink',
  'clearFormatting',
]

export type DocumentCommandPayload = {
  level?: HeadingLevel
  href?: string
  rows?: number
  cols?: number
  withHeaderRow?: boolean
}

type TableInsertOptions = {
  rows?: number
  cols?: number
  withHeaderRow?: boolean
}

function getCommandChain(editor: Editor | null | undefined): ChainedCommands | null {
  if (!editor) {
    return null
  }

  return editor.chain().focus()
}

export function toggleHeading(editor: Editor | null | undefined, level: HeadingLevel): boolean {
  return getCommandChain(editor)?.toggleHeading({ level }).run() ?? false
}

export function toggleBulletList(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.toggleBulletList().run() ?? false
}

export function toggleOrderedList(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.toggleOrderedList().run() ?? false
}

export function toggleBlockquote(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.toggleBlockquote().run() ?? false
}

export function toggleCodeBlock(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.toggleCodeBlock().run() ?? false
}

export function insertHorizontalRule(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.setHorizontalRule().run() ?? false
}

export function insertTable(editor: Editor | null | undefined, options?: TableInsertOptions): boolean {
  return getCommandChain(editor)
    ?.insertTable({
      rows: options?.rows ?? 3,
      cols: options?.cols ?? 3,
      withHeaderRow: options?.withHeaderRow ?? true,
    })
    .run() ?? false
}

export function setLink(editor: Editor | null | undefined, href: string): boolean {
  const chain = getCommandChain(editor)

  if (!chain) {
    return false
  }

  const normalizedHref = href.trim()

  if (!normalizedHref) {
    return chain.extendMarkRange('link').unsetLink().run()
  }

  return chain.extendMarkRange('link').setLink({ href: normalizedHref }).run()
}

export function clearFormatting(editor: Editor | null | undefined): boolean {
  return getCommandChain(editor)?.unsetAllMarks().clearNodes().run() ?? false
}
