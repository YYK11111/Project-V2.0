<script setup>
const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

const displayName = computed(() => props.user?.nickname || props.user?.name || '')
const avatarText = computed(() => displayName.value?.charAt(0) || '?')
</script>

<template>
  <div v-if="user && displayName" class="view-user">
    <el-avatar :size="28" :src="user.avatar || undefined">{{ avatarText }}</el-avatar>
    <span class="view-user__name">{{ displayName }}</span>
  </div>
  <div v-else class="view-user view-user--empty">{{ emptyText }}</div>
</template>

<style scoped>
.view-user {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 0;
}

.view-user__name {
  color: var(--el-text-color-primary);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.view-user--empty {
  color: var(--el-text-color-regular);
}
</style>
