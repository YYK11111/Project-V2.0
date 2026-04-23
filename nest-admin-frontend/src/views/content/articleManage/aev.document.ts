import type { JSONContent } from '@tiptap/core'

import { createEmptyDocument } from '@/features/document-editor/core/documentContent'

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
      contentJson: JSONContent
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
  contentJson?: JSONContent | null
  contentVersion?: number | null
  contentStatus?: string | null
}

function isDocumentNode(value: JSONContent | null | undefined): value is JSONContent {
  return value?.type === 'doc' && Array.isArray(value.content)
}

function createTextNode(text: string): JSONContent {
  return {
    type: 'text',
    text,
  }
}

function createParagraphNode(text: string): JSONContent {
  return {
    type: 'paragraph',
    content: text ? [createTextNode(text)] : undefined,
  }
}

function createListNode(type: 'bulletList' | 'orderedList', items: string[]): JSONContent {
  return {
    type,
    content: items.map((item) => ({
      type: 'listItem',
      content: [createParagraphNode(item)],
    })),
  }
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

  if (isDocumentNode(input.contentJson) && Number(input.contentVersion) >= DOCUMENT_CONTENT_VERSION) {
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
    contentJson: createEmptyDocument(),
    contentVersion: DOCUMENT_CONTENT_VERSION,
  }
}

export function createStructuredTemplateDocument(markdown: string): JSONContent {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const content: JSONContent[] = []

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
      content.push({
        type: 'heading',
        attrs: {
          level: headingMatch[1].length,
        },
        content: headingMatch[2] ? [createTextNode(headingMatch[2])] : undefined,
      })
      index += 1
      continue
    }

    const bulletItems: string[] = []
    while (index < lines.length) {
      const bulletMatch = lines[index].trim().match(/^[-*+]\s+(.*)$/)
      if (!bulletMatch) break
      bulletItems.push(bulletMatch[1])
      index += 1
    }
    if (bulletItems.length) {
      content.push(createListNode('bulletList', bulletItems))
      continue
    }

    const orderedItems: string[] = []
    while (index < lines.length) {
      const orderedMatch = lines[index].trim().match(/^\d+\.\s+(.*)$/)
      if (!orderedMatch) break
      orderedItems.push(orderedMatch[1])
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

  return {
    type: 'doc',
    content: content.length ? content : createEmptyDocument().content,
  }
}

export function getDocumentPlainText(contentJson: JSONContent | null | undefined): string {
  if (!contentJson) {
    return ''
  }

  if (typeof contentJson.text === 'string') {
    return contentJson.text
  }

  const children = Array.isArray(contentJson.content) ? contentJson.content : []
  return children.map((item) => getDocumentPlainText(item)).filter(Boolean).join(' ').trim()
}
