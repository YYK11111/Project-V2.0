import {
  createEmptyIsleContent,
  extractIslePlainText,
  type IsleContentDocument,
  type IsleContentNode,
} from '@/features/isle-editor/adapters/isleContent'

export const DOCUMENT_CONTENT_VERSION = 1

export type KnowledgeDocumentBlockedKind = 'legacy_html' | 'invalid'

type KnowledgeDocumentSurface = 'edit' | 'view'

type KnowledgeDocumentBlockMessage = {
  title: string
  description: string
}

export type KnowledgeDocumentState =
  | {
      kind: 'ready'
      contentJson: IsleContentDocument
      contentVersion: number
    }
  | {
      kind: KnowledgeDocumentBlockedKind
      reason: 'legacy_html'
    }
  | {
      kind: KnowledgeDocumentBlockedKind
      reason: 'invalid_document'
    }

const knowledgeDocumentBlockMessages: Record<KnowledgeDocumentSurface, Record<KnowledgeDocumentBlockedKind, KnowledgeDocumentBlockMessage>> = {
  edit: {
    legacy_html: {
      title: '旧数据暂不支持编辑',
      description: '当前知识正文仍为旧版 HTML 数据，暂不支持编辑。',
    },
    invalid: {
      title: '文档数据异常，暂不支持编辑',
      description: '当前知识正文结构异常，请先修复文档数据后再编辑。',
    },
  },
  view: {
    legacy_html: {
      title: '旧数据暂不支持查看',
      description: '当前知识正文仍为旧版 HTML 数据，暂不支持查看。',
    },
    invalid: {
      title: '文档内容异常，暂时无法展示',
      description: '当前知识正文结构异常，暂时无法展示。',
    },
  },
}

const knowledgeDocumentErrorCodeMap: Record<string, string> = {
  DOCUMENT_CONTENT_REQUIRED: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_INVALID_ROOT: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_LEGACY_READONLY: knowledgeDocumentBlockMessages.edit.legacy_html.title,
  DOCUMENT_INVALID_CONTENT: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_INVALID_SCHEMA: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_SCHEMA_UNSUPPORTED: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_UNSUPPORTED_NODE: knowledgeDocumentBlockMessages.edit.invalid.title,
  DOCUMENT_UNSUPPORTED_MARK: knowledgeDocumentBlockMessages.edit.invalid.title,
}

export function isKnowledgeDocumentBlocked(kind: KnowledgeDocumentState['kind']): kind is KnowledgeDocumentBlockedKind {
  return kind === 'legacy_html' || kind === 'invalid'
}

export function getKnowledgeDocumentBlockMessage(
  surface: KnowledgeDocumentSurface,
  kind: KnowledgeDocumentBlockedKind,
): KnowledgeDocumentBlockMessage {
  return knowledgeDocumentBlockMessages[surface][kind]
}

export function mapKnowledgeDocumentErrorCode(code: string | null | undefined): string {
  return knowledgeDocumentErrorCodeMap[code || ''] || '操作失败，请稍后重试'
}

type KnowledgeDocumentInput = {
  content?: string | null
  contentJson?: IsleContentDocument | null
  contentVersion?: number | null
  contentStatus?: string | null
}

function isIsleNode(value: unknown): value is IsleContentNode {
  if (!value || typeof value !== 'object') {
    return false
  }

  const node = value as { type?: unknown; text?: unknown; attrs?: unknown; marks?: unknown; content?: unknown }
  const typeValid = typeof node.type === 'string'
  const textValid = node.text == null || typeof node.text === 'string'
  const attrsValid = node.attrs == null || typeof node.attrs === 'object'
  const marksValid = node.marks == null || Array.isArray(node.marks)
  const contentValid = node.content == null || (Array.isArray(node.content) && node.content.every((item) => isIsleNode(item)))

  return typeValid && textValid && attrsValid && marksValid && contentValid
}

function isIsleDocument(value: IsleContentDocument | null | undefined): value is IsleContentDocument {
  return !!value
    && value.type === 'doc'
    && Array.isArray(value.content)
    && value.content.every((item) => isIsleNode(item))
}

function createTextNode(text: string) {
  return {
    type: 'text',
    text,
  }
}

function createParagraphNode(text: string): IsleContentNode {
  return {
    type: 'paragraph',
    content: text ? [createTextNode(text)] : [],
  }
}

function createListNode(type: 'bulletList' | 'orderedList', items: string[]): IsleContentNode {
  return {
    type,
    content: items.map((item) => ({
      type: 'listItem',
      content: [createParagraphNode(item)],
    })),
  }
}

function createHeadingNode(level: number, text: string): IsleContentNode {
  return {
    type: 'heading',
    attrs: {
      level,
    },
    content: text ? [createTextNode(text)] : [],
  }
}

function getBulletItemText(line: string): string | null {
  const matched = line.match(/^\s*[-*+]\s(.*)$/)
  return matched ? matched[1] : null
}

function getOrderedItemText(line: string): string | null {
  const matched = line.match(/^\s*\d+\.\s(.*)$/)
  return matched ? matched[1] : null
}

export function resolveKnowledgeDocumentState(input: KnowledgeDocumentInput): KnowledgeDocumentState {
  if (input.contentStatus === 'legacy_html') {
    return {
      kind: 'legacy_html',
      reason: 'legacy_html',
    }
  }

  if (input.contentStatus === 'invalid') {
    return {
      kind: 'invalid',
      reason: 'invalid_document',
    }
  }

  if (isIsleDocument(input.contentJson) && Number(input.contentVersion) >= DOCUMENT_CONTENT_VERSION) {
    return {
      kind: 'ready',
      contentJson: input.contentJson,
      contentVersion: Number(input.contentVersion),
    }
  }

  if (typeof input.content === 'string' && input.content.trim()) {
    return {
      kind: 'legacy_html',
      reason: 'legacy_html',
    }
  }

  if (input.contentJson || input.contentVersion != null) {
    return {
      kind: 'invalid',
      reason: 'invalid_document',
    }
  }

  return {
    kind: 'ready',
    contentJson: createEmptyIsleContent(),
    contentVersion: DOCUMENT_CONTENT_VERSION,
  }
}

export function createStructuredTemplateDocument(markdown: string): IsleContentDocument {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const content: IsleContentNode[] = []

  let index = 0
  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) {
      index += 1
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      content.push(createHeadingNode(headingMatch[1].length, headingMatch[2]))
      index += 1
      continue
    }

    const bulletItems: string[] = []
    while (index < lines.length) {
      const bulletItemText = getBulletItemText(lines[index])
      if (bulletItemText == null) break
      bulletItems.push(bulletItemText)
      index += 1
    }
    if (bulletItems.length) {
      content.push(createListNode('bulletList', bulletItems))
      continue
    }

    const orderedItems: string[] = []
    while (index < lines.length) {
      const orderedItemText = getOrderedItemText(lines[index])
      if (orderedItemText == null) break
      orderedItems.push(orderedItemText)
      index += 1
    }
    if (orderedItems.length) {
      content.push(createListNode('orderedList', orderedItems))
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    content.push(createParagraphNode(paragraphLines.join(' ')))
  }

  return content.length
    ? {
        type: 'doc',
        content,
      }
    : createEmptyIsleContent()
}

export function getDocumentPlainText(contentJson: IsleContentDocument | null | undefined): string {
  return extractIslePlainText(contentJson)
}
