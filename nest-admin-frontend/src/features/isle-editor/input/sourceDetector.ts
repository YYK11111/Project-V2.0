import type { PastePayload, PasteSourceKind } from './types'

const officeHtmlPattern = /<!--StartFragment-->|class=("|')?Mso|urn:schemas-microsoft-com/i
const markdownTablePattern = /(^|\n)\s*\|?.+\|.+\|?\s*\n\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*($|\n)/m
const markdownPattern = /(^|\n)\s*(#{1,6}\s+.+|[-*+]\s+.+|\d+\.\s+.+|>\s+.+|```[\s\S]*?```|!\[[^\]]*\]\([^\)]+\))/m

export function detectPasteSource(payload: PastePayload): PasteSourceKind {
  if (officeHtmlPattern.test(payload.html)) {
    return 'office_html'
  }

  if (!payload.html.trim() && (markdownPattern.test(payload.text) || markdownTablePattern.test(payload.text))) {
    return 'markdown'
  }

  if (payload.html.trim()) {
    return 'html'
  }

  return 'plain_text'
}

export function isHtmlPasteSource(source: PasteSourceKind): source is 'office_html' | 'html' {
  return source === 'office_html' || source === 'html'
}
