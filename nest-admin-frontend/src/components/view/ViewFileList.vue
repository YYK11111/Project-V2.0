<script setup>
const props = defineProps({
  files: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

function resolveUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  const normalized = String(url).replace(/^\/(upload|static)\//, '')
  return window.sysConfig.BASE_API + '/static/' + normalized
}

function getFileName(file, index) {
  if (typeof file === 'string') return `附件 ${index + 1}`
  return file?.name || file?.originalName || `附件 ${index + 1}`
}

function getFileUrl(file) {
  if (typeof file === 'string') return resolveUrl(file)
  return resolveUrl(file?.url)
}
</script>

<template>
  <div v-if="files.length" class="view-file-list">
    <div v-for="(file, index) in files" :key="index" class="view-file-list__item">
      <el-icon><Document /></el-icon>
      <a :href="getFileUrl(file)" target="_blank">{{ getFileName(file, index) }}</a>
    </div>
  </div>
  <div v-else class="view-file-list view-file-list--empty">{{ emptyText }}</div>
</template>

<style scoped>
.view-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.view-file-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.view-file-list__item a {
  color: var(--el-color-primary);
}

.view-file-list--empty {
  min-height: 36px;
  display: flex;
  align-items: center;
  color: var(--el-text-color-regular);
  padding: 6px 0;
}
</style>
