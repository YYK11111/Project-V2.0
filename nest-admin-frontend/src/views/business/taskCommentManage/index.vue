<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getList, addComment, updateComment, deleteComment } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { useUserStore } from '@/stores/user'
import { checkPermi } from '@/utils/permission'

const params = ref<Record<string, any>>({})
const userStore = useUserStore()

const rctRef = ref()
const formRef = ref()
const dialogVisible = ref(false)
const dialogTitle = ref('添加评论')
const submitLoading = ref(false)
const currentUserId = computed(() => String(userStore.id || ''))
const canTaskCommentAdd = computed(() => checkPermi(['business/taskComments/add']))
const canTaskCommentUpdate = computed(() => checkPermi(['business/taskComments/update']))
const canTaskCommentDelete = computed(() => checkPermi(['business/taskComments/delete']))
const commentForm = reactive({
  id: '',
  taskId: '',
  content: '',
})
const commentRules = {
  taskId: [{ required: true, message: '请输入任务ID', trigger: 'blur' }],
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }],
}

function resetCommentForm() {
  commentForm.id = ''
  commentForm.taskId = ''
  commentForm.content = ''
}

function handleAddComment(row?: any) {
  if (!canTaskCommentAdd.value) return $sdk.msgError('当前操作没有权限')
  resetCommentForm()
  commentForm.taskId = String(row?.taskId || params.value.taskId || '')
  dialogTitle.value = '添加评论'
  dialogVisible.value = true
}

function handleEditComment(row: any) {
  if (!canTaskCommentUpdate.value) return $sdk.msgError('当前操作没有权限')
  resetCommentForm()
  commentForm.id = String(row.id || '')
  commentForm.taskId = String(row.taskId || '')
  commentForm.content = row.content || ''
  dialogTitle.value = '编辑评论'
  dialogVisible.value = true
}

function handleDeleteComment(row: any) {
  if (!canTaskCommentDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要删除该评论吗？').then(() => {
    deleteComment(row.id).then(() => {
      $sdk.msgSuccess('评论删除成功')
      rctRef.value.getList()
    })
  })
}

function submitComment() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
      submitLoading.value = true
      try {
        if (commentForm.id) {
          await updateComment(commentForm.id, { content: commentForm.content.trim() })
          $sdk.msgSuccess('评论修改成功')
        } else {
          await addComment({ taskId: commentForm.taskId, content: commentForm.content.trim() })
          $sdk.msgSuccess('评论添加成功')
        }
      dialogVisible.value = false
      rctRef.value.getList()
    } catch (error: any) {
      $sdk.msgError(error?.message || error?.response?.data?.message || '评论提交失败')
    } finally {
      submitLoading.value = false
    }
  })
}

function isCurrentUserComment(row: any) {
  return String(row?.userId || '') === currentUserId.value
}

const getButtons = (row: any) => [
  ...(canTaskCommentUpdate.value && isCurrentUserComment(row)
    ? [{ key: 'edit', label: '修改', type: 'primary', onClick: () => handleEditComment(row) }]
    : []),
  ...(canTaskCommentDelete.value && isCurrentUserComment(row)
    ? [{ key: 'delete', label: '删除', danger: true, onClick: () => handleDeleteComment(row) }]
    : []),
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.taskId" label="任务ID" prop="taskId"></BaInput>
        <BaInput v-model="query.userId" label="用户ID" prop="userId"></BaInput>
      </template>

      <template #operation>
        <div class="flexBetween">
          <el-button v-if="canTaskCommentAdd" type="primary" @click="handleAddComment">新增评论</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="评论内容" prop="content" :show-overflow-tooltip="true" min-width="300" />
        <el-table-column label="评论人" width="120">
          <template #default="{ row }">{{ row.user?.nickname || row.user?.name || row.userId || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属任务" width="150" :show-overflow-tooltip="true">
          <template #default="{ row }">{{ row.task?.name || row.taskId || '-' }}</template>
        </el-table-column>
        <el-table-column label="评论时间" prop="createTime" width="180" />
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

    <BaDialog v-model="dialogVisible" :title="dialogTitle" width="560" @confirm="submitComment">
      <template #form>
        <el-form ref="formRef" :model="commentForm" :rules="commentRules" label-width="90px" v-loading="submitLoading" require-asterisk-position="right">
          <el-form-item label="任务ID" prop="taskId" required>
            <el-input v-model="commentForm.taskId" placeholder="请输入任务ID" :disabled="!!commentForm.id" />
          </el-form-item>
          <el-form-item label="评论内容" prop="content" required>
            <el-input v-model="commentForm.content" type="textarea" :rows="5" placeholder="请填写评论内容" maxlength="1000" show-word-limit />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
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
