import type { JSONContent } from '@tiptap/core'

import { getKnowledgeDocumentBlockMessage, resolveKnowledgeDocumentState } from './aev.document'

export type KnowledgeViewMode =
  | {
      kind: 'ready'
      contentJson: JSONContent
    }
  | {
      kind: 'legacy_html'
      title: string
      description: string
    }
  | {
      kind: 'invalid'
      title: string
      description: string
    }

type KnowledgeArticleLike = {
  content?: string | null
  contentJson?: JSONContent | null
  contentVersion?: number | null
  contentStatus?: string | null
}

export function resolveKnowledgeViewMode(article: KnowledgeArticleLike): KnowledgeViewMode {
  const documentState = resolveKnowledgeDocumentState(article)

  if (documentState.kind === 'ready') {
    return {
      kind: 'ready',
      contentJson: documentState.contentJson,
    }
  }

  if (documentState.kind === 'legacy_html') {
    return {
      kind: 'legacy_html',
      ...getKnowledgeDocumentBlockMessage('view', 'legacy_html'),
    }
  }

  return {
    kind: 'invalid',
    ...getKnowledgeDocumentBlockMessage('view', 'invalid'),
  }
}
