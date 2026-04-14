<!-- 使用示例
  <BaImage src="https://example.com/image.jpg" :isPreview="false" />
-->

<script setup lang="ts">
const attrs = useAttrs()
const props = defineProps({
  isPreview: { type: Boolean, default: true },
})

const resolvedSrc = computed(() => {
  const src = attrs.src
  if (typeof src !== 'string' || !src) return ''
  if (/^https?:\/\//.test(src)) return src
  const normalized = src.replace(/^\/(upload|static)\//, '')
  return window.sysConfig.BASE_API + '/static/' + normalized
})

const previewList = computed(() => {
  return props.isPreview && resolvedSrc.value ? [resolvedSrc.value] : []
})
</script>

<template>
  <el-image class="BaImage relative" :src="resolvedSrc" :preview-src-list="previewList">
    <template #placeholder>
      <div class="size-[100%]" v-loading="true"></div>
    </template>
  </el-image>
</template>

<style lang="scss" scoped></style>
