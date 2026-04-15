<script setup>
const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return props.emptyText
  return props.value
})
</script>

<template>
  <div class="view-field">{{ displayValue }}</div>
</template>

<style scoped>
.view-field {
  min-height: 36px;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 6px 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  overflow-wrap: anywhere;
}
</style>
