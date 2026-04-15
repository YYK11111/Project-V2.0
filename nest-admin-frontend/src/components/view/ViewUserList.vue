<script setup>
const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: '-',
  },
})

function getDisplayName(user) {
  return user?.nickname || user?.name || ''
}

function getAvatarText(user) {
  return getDisplayName(user)?.charAt(0) || '?'
}
</script>

<template>
  <div v-if="users.length" class="view-user-list">
    <div v-for="user in users" :key="user.id" class="view-user-list__item">
      <el-avatar :size="24" :src="user.avatar || undefined">{{ getAvatarText(user) }}</el-avatar>
      <span class="view-user-list__name">{{ getDisplayName(user) }}</span>
    </div>
  </div>
  <div v-else class="view-user-list view-user-list--empty">{{ emptyText }}</div>
</template>

<style scoped>
.view-user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 36px;
  width: 100%;
  padding: 6px 0;
}

.view-user-list__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-light);
}

.view-user-list__name {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.view-user-list--empty {
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
}
</style>
