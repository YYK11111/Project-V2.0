import { looksLikeMarkdown, markdownToHtml } from './markdownInterop'

type HtmlExporter = {
  getHTML: () => string
}

export function createInitialEditorHtml(value?: string | null): string {
  const normalizedValue = value ?? ''

  if (!normalizedValue) {
    return ''
  }

  return looksLikeMarkdown(normalizedValue) ? markdownToHtml(normalizedValue) : normalizedValue
}

export function getEditorHtml(editor?: HtmlExporter | null): string {
  return editor?.getHTML() ?? ''
}
