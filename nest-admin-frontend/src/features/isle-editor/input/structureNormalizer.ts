import { marked } from 'marked'

import type { PasteSourceKind, StandardBlock } from './types'

export function normalizeStructure(source: PasteSourceKind, content: string): StandardBlock[] {
  if (source === 'markdown') {
    return normalizeMarkdown(content)
  }

  if (source === 'html' || source === 'office_html') {
    return normalizeHtml(content)
  }

  return normalizePlainText(content)
}

function normalizeMarkdown(content: string): StandardBlock[] {
  const tokens = marked.lexer(content)

  return tokens.flatMap<StandardBlock>((token): StandardBlock[] => {
    if (token.type === 'heading') {
      return [{ type: 'heading', level: token.depth, text: token.text.trim() }]
    }

    if (token.type === 'list' && !token.ordered) {
      return [
        {
          type: 'bulletList',
          items: token.items.map((item) => item.text.trim()),
        },
      ]
    }

    if (token.type === 'list' && token.ordered) {
      return [
        {
          type: 'orderedList',
          items: token.items.map((item) => item.text.trim()),
        },
      ]
    }

    if (token.type === 'blockquote') {
      const text = token.tokens
        .map((childToken) => ('text' in childToken ? childToken.text : ''))
        .join(' ')
        .trim()

      return text
        ? [{ type: 'blockquote', text }]
        : []
    }

    if (token.type === 'code') {
      return [
        {
          type: 'codeBlock',
          language: token.lang?.trim() || null,
          code: token.text.replace(/\n$/, ''),
        },
      ]
    }

    if (token.type === 'table') {
      return [
        {
          type: 'table',
          rows: [
            token.header.map((cell) => cell.text.trim()),
            ...token.rows.map((row) => row.map((cell) => cell.text.trim())),
          ],
        },
      ]
    }

    if (token.type === 'paragraph') {
      const imageToken = token.tokens?.length === 1 && token.tokens[0]?.type === 'image'
        ? token.tokens[0]
        : null

      if (imageToken) {
        return [
          {
            type: 'image',
            src: imageToken.href,
            ...(imageToken.text.trim() ? { alt: imageToken.text.trim() } : {}),
            ...(imageToken.title?.trim() ? { title: imageToken.title.trim() } : {}),
          },
        ]
      }

      const text = token.text.trim()

      return text
        ? [{ type: 'paragraph', text }]
        : []
    }

    return []
  })
}

function normalizeHtml(content: string): StandardBlock[] {
  const parser = new DOMParser()
  const document = parser.parseFromString(content, 'text/html')
  const blocks: StandardBlock[] = []

  const elements = Array.from(document.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, img, pre, table'))

  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'pre') {
      if (element.closest('table')) {
        return
      }

      const codeElement = element.querySelector('code')
      const className = codeElement?.getAttribute('class') ?? ''
      const languageMatch = className.match(/language-([\w-]+)/)
      const code = (codeElement?.textContent ?? element.textContent ?? '').replace(/(?:\r?\n)+$/, '')

      if (code) {
        blocks.push({
          type: 'codeBlock',
          language: languageMatch?.[1] ?? null,
          code,
        })
      }

      return
    }

    if (element.closest('pre')) {
      return
    }

    if (/^h[1-6]$/.test(tagName)) {
      const text = element.textContent?.trim() ?? ''

      if (text) {
        blocks.push({
          type: 'heading',
          level: Number(tagName[1]),
          text,
        })
      }

      return
    }

    if (tagName === 'p') {
      if (element.closest('table') || element.closest('blockquote')) {
        return
      }

      const text = element.textContent?.trim() ?? ''

      if (text) {
        blocks.push({ type: 'paragraph', text })
      }

      return
    }

    if (tagName === 'ul' || tagName === 'ol') {
      if (element.closest('table')) {
        return
      }

      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((item) => item.textContent?.trim() ?? '')
        .filter(Boolean)

      if (items.length > 0) {
        blocks.push({
          type: tagName === 'ul' ? 'bulletList' : 'orderedList',
          items,
        })
      }

      return
    }

    if (tagName === 'blockquote') {
      if (element.closest('table')) {
        return
      }

      const text = element.textContent?.trim() ?? ''

      if (text) {
        blocks.push({ type: 'blockquote', text })
      }

      return
    }

    if (tagName === 'img') {
      const src = element.getAttribute('src')?.trim() ?? ''

      if (src) {
        const alt = element.getAttribute('alt')?.trim()
        const title = element.getAttribute('title')?.trim()

        blocks.push({
          type: 'image',
          src,
          ...(alt ? { alt } : {}),
          ...(title ? { title } : {}),
        })
      }

      return
    }

    if (tagName === 'table') {
      const rows = Array.from(element.querySelectorAll('tr'))
        .map((row) => Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() ?? ''))
        .filter((row) => row.length > 0)

      if (rows.length > 0) {
        blocks.push({ type: 'table', rows })
      }
    }
  })

  return blocks
}

function normalizePlainText(content: string): StandardBlock[] {
  const lines = content.split(/\r?\n/)
  const blocks: StandardBlock[] = []
  const bulletItems: string[] = []
  const paragraphLines: string[] = []

  const flushBulletList = () => {
    if (bulletItems.length === 0) {
      return
    }

    blocks.push({ type: 'bulletList', items: [...bulletItems] })
    bulletItems.length = 0
  }

  const flushParagraph = () => {
    const text = paragraphLines.join(' ').trim()

    if (!text) {
      paragraphLines.length = 0
      return
    }

    blocks.push({ type: 'paragraph', text })
    paragraphLines.length = 0
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    const bulletMatch = trimmedLine.match(/^[-*+]\s+(.+)$/)

    if (!trimmedLine) {
      flushBulletList()
      flushParagraph()
      return
    }

    if (bulletMatch) {
      flushParagraph()
      bulletItems.push(bulletMatch[1].trim())
      return
    }

    flushBulletList()
    paragraphLines.push(trimmedLine)
  })

  flushBulletList()
  flushParagraph()

  return blocks
}
