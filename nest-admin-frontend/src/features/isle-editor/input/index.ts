import type { IsleContentDocument } from '../adapters/isleContent'
import type { PastePayload, StandardBlock } from './types'

import { sanitizePastedContent } from './contentSanitizer'
import { hasImportableBlocks, importBlocksToDocument } from './editorImporter'
import { detectPasteSource } from './sourceDetector'
import { normalizeStructure } from './structureNormalizer'

function hasStructuredBlocks(source: ReturnType<typeof detectPasteSource>, blocks: StandardBlock[]): boolean {
  if (blocks.length === 0) {
    return false
  }

  if (source !== 'plain_text') {
    return true
  }

  return blocks.some((block) => block.type !== 'paragraph')
}

export function buildDocumentFromPaste(payload: PastePayload): IsleContentDocument | null {
  const source = detectPasteSource(payload)
  const content = sanitizePastedContent(source, payload)
  const blocks = normalizeStructure(source, content)

  if (!hasImportableBlocks(blocks) || !hasStructuredBlocks(source, blocks)) {
    return null
  }

  return importBlocksToDocument(blocks)
}
