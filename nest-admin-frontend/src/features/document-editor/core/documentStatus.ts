export type DocumentStatus = 'draft' | 'published' | 'archived' | 'deleted'

const editableStatuses: ReadonlySet<DocumentStatus> = new Set(['draft'])
const viewableStatuses: ReadonlySet<DocumentStatus> = new Set(['draft', 'published', 'archived'])

export function isEditableDocumentStatus(status: DocumentStatus): boolean {
  return editableStatuses.has(status)
}

export function isViewableDocumentStatus(status: DocumentStatus): boolean {
  return viewableStatuses.has(status)
}
