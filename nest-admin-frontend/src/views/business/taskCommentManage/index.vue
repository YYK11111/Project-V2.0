<script setup lang="ts">
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, addComment, updateComment, deleteComment, getTaskComments } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref<Record<string, any>>({})

const rctRef = ref()
const canTaskCommentAdd = computed(() => checkPermi(['business/taskComments/add']))
const canTaskCommentUpdate = computed(() => checkPermi(['business/taskComments/update']))
const canTaskCommentDelete = computed(() => checkPermi(['business/taskComments/delete']))

// 添加评论
function handleAddComment(row?: any) {
  if (!canTaskCommentAdd.value) return $sdk.msgError('当前操作没有权限')
  const taskId = row?.taskId || params.value.taskId
  if (!taskId) {
    $sdk.msgError('请先选择任务')
    return
  }
  
  // 打开添加评论对话框
  $sdk.confirm('确定要添加评论吗？').then(() => {
    console.log('打开添加评论对话框')
  })
}

// 编辑评论
function handleEditComment(row: any) {
  if (!canTaskCommentUpdate.value) return $sdk.msgError('当前操作没有权限')
  // 打开编辑评论对话框
  console.log('打开编辑评论对话框', row)
}

// 删除评论
function handleDeleteComment(row: any) {
  if (!canTaskCommentDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要删除该评论吗？').then(() => {
    deleteComment(row.id).then(() => {
      $sdk.msgSuccess('评论删除成功')
      rctRef.value.getList()
    })
  })
}
// 批量删除评论
function handleBatchDelete() {
  if (!canTaskCommentDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要批量删除选中的评论吗？').then(() => {
    $sdk.msgSuccess('批量删除成功')
    rctRef.value.getList()
  })
}

const getButtons = (row: any) => [
  { key: 'edit', label: '编辑', type: 'primary', disabled: !canTaskCommentUpdate.value, onClick: () => handleEditComment(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canTaskCommentDelete.value, onClick: () => handleDeleteComment(row) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.taskId" label="任务ID" prop="taskId"></BaInput>
        <BaInput v-model="query.userId" label="用户ID" prop="userId"></BaInput>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canTaskCommentAdd" type="primary" @click="handleAddComment">添加评论</el-button>
          <el-button v-if="canTaskCommentDelete" :disabled="!selectedIds.length" @click="handleBatchDelete" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="评论内容" prop="content" :show-overflow-tooltip="true" min-width="300" />
        <el-table-column label="评论人" prop="user.nickname" width="120" />
        <el-table-column label="所属任务" prop="task.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="评论时间" prop="createdAt" width="180" />
        <el-table-column label="是否编辑" prop="isEdited" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEdited === '1' ? 'warning' : 'info'" size="small">
              {{ row.isEdited === '1' ? '已编辑' : '未编辑' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="附件" prop="attachments" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.attachments && row.attachments.length > 0" type="success" size="small">
              {{ row.attachments.length }}个
            </el-tag>
            <el-tag v-else type="info" size="small">无</el-tag>
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.tableOperation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  
  :deep(.el-button) {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 13px;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
