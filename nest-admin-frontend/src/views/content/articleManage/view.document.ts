import type { IsleContentDocument } from '@/features/isle-editor/adapters/isleContent'

import { getKnowledgeDocumentBlockMessage, resolveKnowledgeDocumentState } from './aev.document'

export type KnowledgeViewMode =
  | {
      kind: 'ready'
      document: IsleContentDocument
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
  contentJson?: IsleContentDocument | null
  contentVersion?: number | null
  contentStatus?: string | null
}

export function resolveKnowledgeViewMode(article: KnowledgeArticleLike): KnowledgeViewMode {
  const documentState = resolveKnowledgeDocumentState(article)

  if (documentState.kind === 'ready') {
    return {
      kind: 'ready',
      document: documentState.contentJson,
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
