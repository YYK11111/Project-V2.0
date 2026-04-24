<template>
  <div class="document-block-menu" role="menu" aria-label="块级菜单">
    <button
      v-for="item in items"
      :key="item.type"
      type="button"
      class="document-block-menu__item"
      role="menuitem"
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
.document-block-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.document-block-menu__item {
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
}

.document-block-menu__item:hover {
  background: var(--el-fill-color-light);
}
</style>
