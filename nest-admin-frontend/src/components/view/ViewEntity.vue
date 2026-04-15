<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

const hasValue = computed(() => !!(props.title || props.subtitle))
</script>

<template>
  <div v-if="hasValue" class="view-entity">
    <div class="view-entity__title">{{ title }}</div>
    <div v-if="subtitle" class="view-entity__subtitle">{{ subtitle }}</div>
  </div>
  <div v-else class="view-entity view-entity--empty">{{ emptyText }}</div>
</template>

<style scoped>
.view-entity {
  min-height: 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 6px 0;
}

.view-entity__title {
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.view-entity__subtitle {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.view-entity--empty {
  color: var(--el-text-color-regular);
  justify-content: flex-start;
}
</style>
