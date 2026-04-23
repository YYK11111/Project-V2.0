export type ClipboardDataLike = {
  types: readonly string[]
  getData: (type: 'text/html' | 'text/plain') => string
}

export type TiptapPasteBridgeOptions = {
  disabled: boolean
  clipboardData: ClipboardDataLike | null | undefined
  looksLikeMarkdown: (text: string) => boolean
  markdownToHtml: (text: string) => string
  insertHtml: (html: string) => void
}

export type TiptapPasteBridgeResult = {
  handled: boolean
  inserted: boolean
}

export function bridgeTiptapMarkdownPaste(options: TiptapPasteBridgeOptions): TiptapPasteBridgeResult {
  if (options.disabled || !options.clipboardData) {
    return { handled: false, inserted: false }
  }

  const clipboardTypes = Array.from(options.clipboardData.types)
  const html = options.clipboardData.getData('text/html')
  const text = options.clipboardData.getData('text/plain')
  const hasHtml = clipboardTypes.includes('text/html') && html.length > 0
  const hasPlainText = clipboardTypes.includes('text/plain')

  if (hasHtml || !hasPlainText || !text || !options.looksLikeMarkdown(text)) {
    return { handled: false, inserted: false }
  }

  options.insertHtml(options.markdownToHtml(text))

  return { handled: true, inserted: true }
}
