import type { HtmlPasteSourceKind, PasteSourceKind } from './types'

const unwrapTagNames = new Set(['span', 'font'])

export function sanitizePastedHtml(source: HtmlPasteSourceKind, html: string): string {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const container = document.body

  sanitizeNode(container)
  removeComments(container)
  removeEmptyParagraphs(container)

  return container.innerHTML.trim()
}

export function sanitizePastedContent(source: PasteSourceKind, payload: { html: string, text: string }): string {
  if (source === 'html' || source === 'office_html') {
    return sanitizePastedHtml(source, payload.html)
  }

  return payload.text.trim()
}

function sanitizeNode(node: ParentNode): void {
  const elements = Array.from(node.children)

  elements.forEach((element) => {
    element.removeAttribute('class')
    element.removeAttribute('style')

    sanitizeNode(element)

    if (unwrapTagNames.has(element.tagName.toLowerCase())) {
      element.replaceWith(...Array.from(element.childNodes))
    }
  })
}

function removeComments(node: ParentNode): void {
  const childNodes = Array.from(node.childNodes)

  childNodes.forEach((childNode) => {
    if (childNode.nodeType === Node.COMMENT_NODE) {
      childNode.remove()
      return
    }

    if (childNode instanceof Element) {
      removeComments(childNode)
    }
  })
}

function removeEmptyParagraphs(node: ParentNode): void {
  const paragraphs = Array.from(node.querySelectorAll('p'))

  paragraphs.forEach((paragraph) => {
    const textContent = paragraph.textContent?.trim() ?? ''
    const childElements = Array.from(paragraph.children)
    const hasOnlyBreaks = childElements.length > 0 && childElements.every((child) => child.tagName.toLowerCase() === 'br')

    if (!textContent && (childElements.length === 0 || hasOnlyBreaks)) {
      paragraph.remove()
    }
  })
}
