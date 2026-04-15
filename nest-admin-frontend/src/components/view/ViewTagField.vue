<script setup>
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'info',
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

const displayText = computed(() => props.text || props.emptyText)
const hasValue = computed(() => !!props.text)
</script>

<template>
  <div class="view-tag-field">
    <el-tag v-if="hasValue" :type="type">{{ displayText }}</el-tag>
    <span v-else class="view-tag-field__empty">{{ displayText }}</span>
  </div>
</template>

<style scoped>
.view-tag-field {
  min-height: 36px;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 0;
}

.view-tag-field__empty {
  color: var(--el-text-color-regular);
}
</style>
