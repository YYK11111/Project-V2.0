<template>
  <div class="document-slash-menu" role="menu">
    <button
      v-for="(item, index) in items"
      :key="item.type"
      type="button"
      class="document-slash-menu__item"
      :class="{ 'is-active': index === activeIndex }"
      role="menuitem"
      @click="handleSelect(item)"
    >
      <span class="document-slash-menu__title">{{ item.title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DocumentBlockDefinition } from '../core/blockTypes'

defineProps<{
  items: readonly DocumentBlockDefinition[]
  activeIndex: number
}>()

const emit = defineEmits<{
  (event: 'select', item: DocumentBlockDefinition): void
}>()

function handleSelect(item: DocumentBlockDefinition) {
  emit('select', item)
}
</script>

<style scoped>
.document-slash-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
}

.document-slash-menu__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
}

.document-slash-menu__item:hover,
.document-slash-menu__item.is-active {
  background: var(--el-fill-color-light);
}

.document-slash-menu__title {
  font-size: 14px;
  line-height: 20px;
}
</style>
