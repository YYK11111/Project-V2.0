<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  desktopPaddingBottom?: number
  mobilePaddingBottom?: number
  footerBottom?: number
  mobileBreakpoint?: number
}>(), {
  desktopPaddingBottom: 136,
  mobilePaddingBottom: 216,
  footerBottom: 16,
  mobileBreakpoint: 768,
})

const shellRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const footerStyle = ref<CSSProperties>({})
let resizeObserver: ResizeObserver | null = null

const isMobileScreen = computed(() => viewportWidth.value < props.mobileBreakpoint)
const contentStyle = computed<CSSProperties>(() => ({
  '--form-page-shell-padding-bottom': `${isMobileScreen.value ? props.mobilePaddingBottom : props.desktopPaddingBottom}px`,
}))

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

function updateFooterStyle() {
  const element = shellRef.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const left = Math.max(rect.left, 12)
  const availableWidth = Math.max(window.innerWidth - left - 12, 0)
  footerStyle.value = {
    left: `${left}px`,
    width: `${Math.min(Math.max(rect.width, 0), availableWidth)}px`,
    bottom: `${props.footerBottom}px`,
  }
}

onMounted(() => {
  updateViewportWidth()
  updateFooterStyle()
  window.addEventListener('resize', updateViewportWidth)
  window.addEventListener('resize', updateFooterStyle)
  if (typeof ResizeObserver !== 'undefined' && shellRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateViewportWidth()
      updateFooterStyle()
    })
    resizeObserver.observe(shellRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
  window.removeEventListener('resize', updateFooterStyle)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="form-page-shell">
    <div ref="shellRef" class="form-page-shell__content" :style="contentStyle">
      <slot />
    </div>

    <div class="form-page-shell__footer" :class="{ 'form-page-shell__footer--mobile': isMobileScreen }" :style="footerStyle">
      <div v-if="$slots.footerMeta && !isMobileScreen" class="form-page-shell__footer-meta">
        <slot name="footerMeta" />
      </div>
      <div class="form-page-shell__footer-actions">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page-shell {
  width: 100%;
  min-width: 0;
}

.form-page-shell__content {
  width: 100%;
  min-width: 0;
  padding-bottom: var(--form-page-shell-padding-bottom, 136px);
}

.form-page-shell__footer {
  position: fixed;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
}

.form-page-shell__footer-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.form-page-shell__footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
  gap: 8px;
  flex-wrap: wrap;
}

.form-page-shell__footer--mobile {
  flex-direction: column;
  align-items: stretch;
}

.form-page-shell__footer--mobile .form-page-shell__footer-actions {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
}

.form-page-shell__footer--mobile .form-page-shell__footer-actions :deep(.el-button) {
  width: 100%;
  min-width: 0;
}
</style>
