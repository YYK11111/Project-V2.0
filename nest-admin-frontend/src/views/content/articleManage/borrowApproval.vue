<script setup lang="ts">
// @ts-nocheck
import { approveArticleBorrow, getPendingArticleBorrows, rejectArticleBorrow } from './api'
import { useRouter } from 'vue-router'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const rctRef = ref()
const params = ref({})
const dialogVisible = ref(false)
const dialogType = ref<'approve' | 'reject'>('approve')
const currentRow = ref<any>(null)
const dialogForm = reactive({
  approvedDays: 1,
  remark: '',
  reason: '',
})

function goArticle(row: any) {
  if (!row?.articleId) return
  router.push({ path: '/content/articleManage/detail', query: { id: row.articleId } })
}

function openApprove(row: any) {
  currentRow.value = row
  dialogType.value = 'approve'
  dialogForm.approvedDays = Number(row.requestedDays || 1)
  dialogForm.remark = ''
  dialogVisible.value = true
}

function openReject(row: any) {
  currentRow.value = row
  dialogType.value = 'reject'
  dialogForm.reason = ''
  dialogVisible.value = true
}

function submitDialog() {
  if (!currentRow.value?.id) return
  const request =
    dialogType.value === 'approve'
      ? approveArticleBorrow(currentRow.value.id, { approvedDays: dialogForm.approvedDays, remark: dialogForm.remark })
      : rejectArticleBorrow(currentRow.value.id, { reason: dialogForm.reason })

  request.then(() => {
    dialogVisible.value = false
    $sdk.msgSuccess(dialogType.value === 'approve' ? '借阅申请已通过' : '借阅申请已拒绝')
    rctRef.value?.getList?.()
  })
}
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getPendingArticleBorrows">
      <template #query="{ query }">
        <BaInput v-model="query.keyword" label="关键词" prop="keyword" />
        <BaSelect v-model="query.status" label="状态" prop="status">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </BaSelect>
      </template>
      <template #table>
        <el-table-column label="知识标题" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="goArticle(row)">{{ row.article?.title || '-' }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="140">
          <template #default="{ row }">{{ row.article?.catalog?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="申请人" width="140">
          <template #default="{ row }">{{ row.applicant?.nickname || row.applicant?.name || row.userId }}</template>
        </el-table-column>
        <el-table-column label="申请理由" prop="applyReason" min-width="220" :show-overflow-tooltip="true" />
        <el-table-column label="申请时长(天)" prop="requestedDays" width="120" />
        <el-table-column label="申请时间" prop="createTime" width="180" />
      </template>
      <template #tableOperation="{ row }">
        <TbOpBtn v-if="checkPermi(['business/articleBorrows/approve'])" icon="select" @click="openApprove(row)">通过</TbOpBtn>
        <TbOpBtn v-if="checkPermi(['business/articleBorrows/reject'])" icon="close" @click="openReject(row)">拒绝</TbOpBtn>
      </template>
    </RequestChartTable>

    <BaDialog v-model="dialogVisible" :title="dialogType === 'approve' ? '通过借阅申请' : '拒绝借阅申请'" width="520" @confirm="submitDialog">
      <template #form>
        <el-form :model="dialogForm" label-width="100px">
          <el-form-item v-if="dialogType === 'approve'" label="借阅天数">
            <el-input-number v-model="dialogForm.approvedDays" :min="1" :max="365" style="width: 100%" />
          </el-form-item>
          <el-form-item v-if="dialogType === 'approve'" label="审批备注">
            <el-input v-model="dialogForm.remark" type="textarea" :rows="4" placeholder="请输入审批备注" />
          </el-form-item>
          <el-form-item v-else label="拒绝原因">
            <el-input v-model="dialogForm.reason" type="textarea" :rows="4" placeholder="请输入拒绝原因" />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
  </div>
</template>
