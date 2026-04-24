<template>
  <nav class="document-toc" aria-label="文档目录">
    <button
      v-for="item in items"
      :key="item.blockId"
      type="button"
      class="document-toc__item"
      :class="[
        `is-level-${item.level}`,
        { 'is-active': item.blockId === activeBlockId },
      ]"
      @click="handleSelect(item.blockId)"
    >
      {{ item.text }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from '../core/toc'

defineProps<{
  items: readonly TocItem[]
  activeBlockId: string
}>()

const emit = defineEmits<{
  (event: 'select', blockId: string): void
}>()

function handleSelect(blockId: string) {
  emit('select', blockId)
}
</script>

<style scoped>
.document-toc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.document-toc__item {
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
}

.document-toc__item.is-level-2 {
  padding-left: 20px;
}

.document-toc__item.is-level-3 {
  padding-left: 32px;
}

.document-toc__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
