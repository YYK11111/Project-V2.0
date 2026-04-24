<template>
  <div class="document-bubble-menu" role="toolbar" aria-label="文本快捷工具">
    <slot>
      <span class="document-bubble-menu__label">文本菜单占位</span>
    </slot>
  </div>
</template>

<style scoped>
.document-bubble-menu {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
}

.document-bubble-menu__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
