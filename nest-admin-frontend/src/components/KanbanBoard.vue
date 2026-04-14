<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  todoList: {
    type: Array,
    default: () => [],
  },
  inProgressList: {
    type: Array,
    default: () => [],
  },
  doneList: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['item-click', 'status-change'])

const columns = computed(() => [
  { key: 'todo', title: '待处理', list: props.todoList, color: '#909399' },
  { key: 'inProgress', title: '进行中', list: props.inProgressList, color: '#409EFF' },
  { key: 'done', title: '已完成', list: props.doneList, color: '#67C23A' },
])

function handleItemClick(item) {
  emit('item-click', item)
}
</script>

<template>
  <div class="kanban-board">
    <div v-for="column in columns" :key="column.key" class="kanban-column">
      <div class="column-header">
        <span class="column-title">{{ column.title }}</span>
        <el-badge :value="column.list.length" :max="99" />
      </div>
      <div class="column-content">
        <div
          v-for="item in column.list"
          :key="item.id"
          class="kanban-item"
          @click="handleItemClick(item)"
        >
          <div class="item-header">
            <el-tag v-if="item.storyPoints" size="small" type="info">
              {{ item.storyPoints }} 点
            </el-tag>
            <span v-if="item.priority !== undefined" class="item-priority">
              P{{ item.priority }}
            </span>
          </div>
          <div class="item-title">{{ item.title || item.name }}</div>
          <div v-if="item.assignee" class="item-assignee">
            <el-avatar :size="20" :src="item.assignee?.avatar">
              {{ item.assignee?.name?.charAt(0) }}
            </el-avatar>
            <span>{{ item.assignee?.nickname || item.assignee?.name }}</span>
          </div>
        </div>
        <div v-if="column.list.length === 0" class="empty-column">
          暂无数据
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px;
}

.kanban-column {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.column-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  max-height: 500px;
}

.kanban-item {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;
}

.kanban-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-priority {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 600;
}

.item-title {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  margin-bottom: 8px;
}

.item-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.empty-column {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
}
</style>