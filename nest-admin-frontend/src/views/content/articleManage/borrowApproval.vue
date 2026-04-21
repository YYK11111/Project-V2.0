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
  <div class="borrow-approval-page km-page">
    <div class="borrow-approval-hero Gcard km-hero">
      <div class="borrow-approval-hero__eyebrow km-hero__eyebrow">借阅审批</div>
      <div class="borrow-approval-hero__title km-hero__title">集中处理知识借阅申请，控制有效期与审批质量</div>
      <div class="borrow-approval-hero__desc km-hero__desc">重点核对申请人、申请理由和借阅时长，确保受限知识在合理范围内开放，避免审批口径不一致。</div>
      <div class="borrow-approval-statuses">
        <div class="borrow-approval-statuses__item"><el-tag type="warning" size="small">待审批</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="success" size="small">已通过</el-tag></div>
        <div class="borrow-approval-statuses__item"><el-tag type="danger" size="small">已拒绝</el-tag></div>
      </div>
    </div>

    <div class="borrow-approval-panel Gcard km-panel">
      <div class="borrow-approval-panel__header km-panel__header">
        <div>
          <div class="borrow-approval-panel__title km-panel__title">审批列表</div>
          <div class="borrow-approval-panel__desc km-panel__desc">按关键词或状态筛选申请记录，优先处理待审批项目。</div>
        </div>
      </div>

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
    </div>

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

<style lang="scss" scoped>
.borrow-approval-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.borrow-approval-statuses__item {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 82%, var(--el-fill-color-extra-light));
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

</style>
