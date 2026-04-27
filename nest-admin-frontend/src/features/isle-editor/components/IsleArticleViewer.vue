<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { createEmptyIsleContent, type IsleContentDocument } from '../adapters/isleContent'
import { IsleEditor } from '../vue'
import { NotionKit } from '../kit'

interface IsleArticleViewerProps {
  content?: IsleContentDocument | null
}

const props = withDefaults(defineProps<IsleArticleViewerProps>(), {
  content: null,
})

const rootRef = ref<HTMLElement | null>(null)
const documentValue = computed<IsleContentDocument>(() => props.content ?? createEmptyIsleContent())
const viewerExtensions = computed(() => [NotionKit])

const headingSelector = 'h1, h2, h3, h4, h5, h6'
const viewerNodeTypeRules = [
  { selector: 'ul[data-type="taskList"]', nodeType: 'taskList' },
  { selector: 'li[data-checked]', nodeType: 'taskItem' },
  { selector: 'figure[data-type="image"]', nodeType: 'image' },
  { selector: 'div[data-type="attachment"]', nodeType: 'attachment' },
  { selector: 'figure[data-type="video"]', nodeType: 'video' },
  { selector: 'hr', nodeType: 'divider' },
] as const

function getUniqueHeadingId(usedIds: Set<string>, generatedIndex: number) {
  let nextIndex = generatedIndex
  let candidate = ''

  do {
    nextIndex += 1
    candidate = `heading-${nextIndex}`
  } while (usedIds.has(candidate))

  return {
    id: candidate,
    nextIndex,
  }
}

function annotateHeadingIds(container: HTMLElement) {
  const headings = Array.from(container.querySelectorAll<HTMLElement>(headingSelector))
  const usedIds = new Set<string>()
  const duplicateIds = new Set<string>()

  Array.from(container.querySelectorAll<HTMLElement>('[id]')).forEach((element) => {
    const id = element.id.trim()
    if (!id) return
    if (usedIds.has(id)) {
      duplicateIds.add(id)
      return
    }
    usedIds.add(id)
  })

  let generatedIndex = 0

  headings.forEach((heading) => {
    const text = (heading.textContent || '').trim()
    if (!text) return

    const currentId = heading.id.trim()

    if (!currentId) {
      const uniqueHeading = getUniqueHeadingId(usedIds, generatedIndex)
      generatedIndex = uniqueHeading.nextIndex
      heading.id = uniqueHeading.id
      usedIds.add(uniqueHeading.id)
      return
    }

    if (duplicateIds.has(currentId)) {
      duplicateIds.delete(currentId)
      return
    }

    if (headings.some((item) => item !== heading && item.id === currentId)) {
      const uniqueHeading = getUniqueHeadingId(usedIds, generatedIndex)
      generatedIndex = uniqueHeading.nextIndex
      heading.id = uniqueHeading.id
      usedIds.add(uniqueHeading.id)
    }
  })
}

function markNodeType(container: HTMLElement, selector: string, nodeType: string) {
  container.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.dataset.nodeType = nodeType
  })
}

function annotateViewerDom() {
  const container = rootRef.value
  if (!container) return

  annotateHeadingIds(container)
  viewerNodeTypeRules.forEach(({ selector, nodeType }) => {
    markNodeType(container, selector, nodeType)
  })
}

onMounted(async () => {
  await nextTick()
  annotateViewerDom()
})

watch(documentValue, async () => {
  await nextTick()
  annotateViewerDom()
}, { deep: true })
</script>

<template>
  <div
    ref="rootRef"
    class="isle-article-viewer"
    data-testid="isle-article-viewer"
    aria-readonly="true"
    role="article"
  >
    <IsleEditor
      :model-value="documentValue"
      :editable="false"
      output="json"
      :extensions="viewerExtensions" />
  </div>
</template>

<style scoped>
.isle-article-viewer {
  width: 100%;
  min-height: 24px;
}

.isle-article-viewer :deep([data-type='attachment']) {
  display: block;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color-page);
  padding: 12px 14px;
}

.isle-article-viewer :deep([data-type='attachment'] > a) {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
}
</style>
