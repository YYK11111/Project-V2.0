<script setup lang="ts">
// @ts-nocheck
import { getList, save, del } from './api'
import { yesOrNO, KEY_YES } from '@/utils/dictionary'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const rules = { title: [$sdk.ruleRequiredBlur], permissionKey: [$sdk.ruleRequiredBlur] }

const rctRef = ref<any>(null)
const dialogRef = ref<any>(null)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const isViewMode = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => {
  return {
    add: '新增系统公告',
    edit: '编辑系统公告',
    view: '查看系统公告',
  }[dialogMode.value]
})
const canNoticeAdd = computed(() => checkPermi(['system/notices/add']))
const canNoticeUpdate = computed(() => checkPermi(['system/notices/update']))
const canNoticeDelete = computed(() => checkPermi(['system/notices/delete']))

const getButtons = (row: any) => [
  { key: 'view', label: '查看', onClick: () => handleView(row) },
  canNoticeUpdate.value ? { key: 'edit', label: '编辑', onClick: () => handleEdit(row) } : null,
  canNoticeDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)

function handleAdd() {
  if (!canNoticeAdd.value) return $sdk.msgWarning('当前操作没有权限')
  dialogMode.value = 'add'
  dialogRef.value?.action({ isActive: KEY_YES })
}

async function handleEdit(row: any) {
  if (!canNoticeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  dialogMode.value = 'edit'
  dialogRef.value?.action(JSON.parse(JSON.stringify(row)))
}

async function handleView(row: any) {
  dialogMode.value = 'view'
  dialogRef.value?.action(JSON.parse(JSON.stringify(row)))
}

function submitNotice(data: any) {
  if (isViewMode.value) {
    data.loading.value = false
    return
  }
  const isEdit = !!data.form.value?.id
  if ((isEdit && !canNoticeUpdate.value) || (!isEdit && !canNoticeAdd.value)) {
    data.loading.value = false
    return $sdk.msgWarning('当前操作没有权限')
  }
  dialogRef.value?.confirm(save, () => rctRef.value?.getList(1))
}
</script>

<template>
  <div class="notice-index-page">
    <RequestChartTable ref="rctRef" class="notice-index-panel" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.title" label="公告标题" prop="title"></BaInput>
              <BaSelect v-model="query.isActive" filterable label="是否激活" prop="isActive">
                <el-option v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

        <template #operation="{ selectedIds }">
          <div class="notice-index-operation">
            <div class="notice-index-operation__left">
           <el-button v-if="canNoticeAdd" type="primary" @click="handleAdd">新增公告</el-button>
            </div>
           <el-button v-if="canNoticeDelete" :disabled="!selectedIds.length" @click="rctRef?.del(del)" type="danger">批量删除</el-button>
          </div>
        </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="公告标题" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="公告内容" prop="content" :show-overflow-tooltip="true" />
        <el-table-column label="是否激活" prop="isActive">
          <template #default="{ row }">
            {{ yesOrNO[row.isActive] }}
          </template>
        </el-table-column>
      </template>
      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <!--  dialog -->
      <BaDialog
        ref="dialogRef"
        :title="dialogTitle"
        :rules="rules"
        width="500"
        :show-footer="!isViewMode"
        @confirm="submitNotice">
      <template #form="{ form }">
        <BaInput v-model="form.title" prop="title" label="公告标题" maxlength="30" :disabled="isViewMode"></BaInput>
        <BaInput v-model="form.content" type="textarea" prop="content" label="公告内容" maxlength="200" :disabled="isViewMode"></BaInput>
        <!-- <BaInput v-model="form.order" prop="order" type="number" label="角色顺序" maxlength="11"></BaInput> -->
        <el-form-item prop="isActive" label="是否激活">
          <el-radio-group v-model="form.isActive" :disabled="isViewMode">
            <el-radio v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-radio>
          </el-radio-group>
        </el-form-item>

        <BaInput v-model="form.remark" type="textarea" prop="remark" label="备注" maxlength="200" :disabled="isViewMode"></BaInput>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.notice-index-page {
  min-height: 100%;
}

.notice-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.notice-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.notice-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notice-index-panel :deep(.el-table__header-wrapper),
.notice-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .notice-index-panel {
    padding-top: 18px;
  }

  .notice-index-operation,
  .notice-index-operation__left {
    align-items: stretch;
  }
}
</style>
