<script setup>
const props = defineProps({
  html: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

const displayHtml = computed(() => props.html || props.emptyText)
</script>

<template>
  <div v-html="displayHtml" class="view-content" />
</template>

<style scoped>
.view-content {
  min-height: 120px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  line-height: 1.7;
  color: var(--el-text-color-regular);
  overflow-wrap: anywhere;
  box-sizing: border-box;
}

.view-content :deep(p) {
  margin: 0 0 10px;
}

.view-content :deep(p:last-child) {
  margin-bottom: 0;
}

.view-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.view-content :deep(pre) {
  overflow-x: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
}
</style>
