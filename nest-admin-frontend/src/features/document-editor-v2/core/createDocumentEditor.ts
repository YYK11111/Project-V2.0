import type { JSONContent } from '@tiptap/core'
import { Editor } from '@tiptap/vue-3'

import { normalizeDocument } from '../content/normalizeDocument'
import { createDocumentExtensions } from '../extensions/documentExtensions'

export interface CreateDocumentEditorOptions {
  content?: JSONContent | null
  placeholder: string
  editable?: boolean
  onUpdate?: (content: JSONContent) => void
}

export function createDocumentEditor(options: CreateDocumentEditorOptions): Editor {
  const normalizedContent = normalizeDocument(options.content)

  return new Editor({
    content: normalizedContent,
    editable: options.editable ?? true,
    extensions: createDocumentExtensions(options.placeholder),
    onUpdate: ({ editor: currentEditor }) => {
      options.onUpdate?.(normalizeDocument(currentEditor.getJSON() as JSONContent))
    },
  })
}
