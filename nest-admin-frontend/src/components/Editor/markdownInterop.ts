import { marked, Renderer } from 'marked'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const markdownSignals = [
  /^```[\s\S]*?^```$/m,
  /^#{1,6}\s+.+$/m,
  /^(?:\d+\.\s+.+\n)+\d+\.\s+.+$/m,
  /^[-*+]\s+.+$/m,
  /^>\s+.+$/m,
  /!?\[[^\]]+\]\([^\)]+\)/,
]

const singleOrderedListPattern = /^[1-9]\d{0,2}\.\s+\S.*$/

const markedRenderer = new Renderer()
const renderMarkedLink = markedRenderer.link.bind(markedRenderer)
const renderMarkedImage = markedRenderer.image.bind(markedRenderer)

const turndownService = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
})

turndownService.use(gfm)

function getSafeUrl(url: string): string | null {
  const normalizedUrl = url.trim().replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '')

  if (!normalizedUrl) {
    return null
  }

  if (normalizedUrl.startsWith('#') || normalizedUrl.startsWith('/')) {
    return url
  }

  const protocolMatch = normalizedUrl.match(/^([a-zA-Z][a-zA-Z\d+.-]*):/)

  if (!protocolMatch) {
    return url
  }

  const protocol = protocolMatch[1].toLowerCase()

  if (protocol === 'http' || protocol === 'https' || protocol === 'mailto') {
    return url
  }

  return null
}

markedRenderer.html = () => ''
markedRenderer.link = ({ href, title, tokens }) => {
  if (!href) {
    return ''
  }

  const safeHref = getSafeUrl(href)

  if (!safeHref) {
    return markedRenderer.parser.parseInline(tokens)
  }

  return renderMarkedLink({ href: safeHref, title, tokens })
}
markedRenderer.image = ({ href, title, text, tokens }) => {
  if (!href) {
    return ''
  }

  const safeHref = getSafeUrl(href)

  if (!safeHref) {
    return ''
  }

  return renderMarkedImage({ href: safeHref, title, text, tokens })
}

export function looksLikeMarkdown(text: string): boolean {
  if (markdownSignals.some((pattern) => pattern.test(text))) {
    return true
  }

  return singleOrderedListPattern.test(text.trim())
}

export function markdownToHtml(text: string): string {
  return marked.parse(text, { async: false, renderer: markedRenderer })
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html)
}
