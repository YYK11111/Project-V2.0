<template>
  <div class="document-toolbar" role="toolbar" aria-label="文档工具栏">
    <button
      v-for="item in items"
      :key="item.type"
      type="button"
      class="document-toolbar__button"
      @click="handleSelect(item)"
    >
      {{ item.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DocumentBlockDefinition } from '../core/blockTypes'

defineProps<{
  items: readonly DocumentBlockDefinition[]
}>()

const emit = defineEmits<{
  (event: 'select', item: DocumentBlockDefinition): void
}>()

function handleSelect(item: DocumentBlockDefinition) {
  emit('select', item)
}
</script>

<style scoped>
.document-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.document-toolbar__button {
  padding: 6px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.document-toolbar__button:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}
</style>
