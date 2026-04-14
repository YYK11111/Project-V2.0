<script setup lang="ts">
// @ts-nocheck
import { getList, save, del } from './api'
import { yesOrNO, KEY_YES } from '@/utils/dictionary'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const rules = { title: [$sdk.ruleRequiredBlur], permissionKey: [$sdk.ruleRequiredBlur] }

const rctRef = ref<any>(null)
const dialogRef = ref<any>(null)
const canNoticeAdd = computed(() => checkPermi(['system/notices/add']))
const canNoticeUpdate = computed(() => checkPermi(['system/notices/update']))
const canNoticeDelete = computed(() => checkPermi(['system/notices/delete']))

const getButtons = (row: any) => [
  { key: 'edit', label: '修改', disabled: !canNoticeUpdate.value, onClick: () => dialogRef.value.action(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canNoticeDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.title" label="公告标题" prop="title"></BaInput>
        <BaSelect v-model="query.isActive" filterable label="是否激活" prop="isActive">
          <el-option v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

        <template #operation="{ selectedIds }">
          <div class="flexBetween">
          <el-button v-if="canNoticeAdd" type="primary" @click="dialogRef?.action({ isActive: KEY_YES })">新增</el-button>
          <el-button v-if="canNoticeDelete" :disabled="!selectedIds.length" @click="rctRef?.del(del)" type="danger">批量删除</el-button>
          </div>
        </template>

      <template #table>
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
        dynamicTitle="角色"
        :rules="rules"
        width="500"
        @confirm="(data) => { const isEdit = !!data.form.value?.id; if ((isEdit && !canNoticeUpdate) || (!isEdit && !canNoticeAdd)) return $sdk.msgWarning('当前操作没有权限'); dialogRef?.confirm(save, () => rctRef?.getList(1)) }">
      <template #form="{ form }">
        <BaInput v-model="form.title" prop="title" label="公告标题" maxlength="30"></BaInput>
        <BaInput v-model="form.content" type="textarea" prop="content" label="公告内容" maxlength="200"></BaInput>
        <!-- <BaInput v-model="form.order" prop="order" type="number" label="角色顺序" maxlength="11"></BaInput> -->
        <el-form-item prop="isActive" label="是否激活">
          <el-radio-group v-model="form.isActive">
            <el-radio v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-radio>
          </el-radio-group>
        </el-form-item>

        <BaInput v-model="form.remark" type="textarea" prop="remark" label="备注" maxlength="200"></BaInput>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.title-name {
  font-size: 14px;

  font-weight: 600;
  color: var(--FontBlack);
  display: flex;
  align-items: center;
}
.bottom {
  justify-content: flex-end;
  padding: 20px;
}
</style>
