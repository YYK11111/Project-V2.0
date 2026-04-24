<template>
  <quillindex v-bind="$props" @update:modelValue="emit('update:modelValue', $event)" />
</template>

<script setup lang="ts">
import quillindex from './quillindex.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    modelValue: '',
    disabled: false,
    placeholder: '请输入内容',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()
</script>
