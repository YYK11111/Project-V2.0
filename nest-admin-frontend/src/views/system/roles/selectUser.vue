<template>
  <BaDialog ref="dialogRef" dynamicTitle="选择用户" width="900" @confirm="handleSelectUser">
    <template #form>
      <RequestChartTable ref="rctRef" :request="getList" :is-create-request="false">
        <template #query="{ query }">
          <BaInput v-model="query.userName" label="用户账号" prop="userName"></BaInput>
        </template>

        <template #table>
          <el-table-column type="selection" width="50"></el-table-column>
          <el-table-column label="用户账号" prop="name" min-width="140" />
          <el-table-column label="用户昵称" prop="nickname" min-width="140" />
          <el-table-column label="邮箱" prop="email" min-width="180" />
          <el-table-column label="手机" prop="phone" min-width="140" />
          <el-table-column label="状态" prop="isActive" width="100">
            <template #default="{ row }">
              {{ row.isActive === '1' ? '激活' : '停用' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" min-width="180" />
        </template>
      </RequestChartTable>
    </template>
  </BaDialog>
</template>

<script setup lang="ts" name="SelectUser">
// @ts-nocheck
import { getUnallocatedUserList, authUserSelectAll } from './api'
import { checkPermi } from '@/utils/permission'

const props = defineProps({
  roleId: {
    type: [Number, String],
  },
})

const emit = defineEmits(['ok'])
const dialogRef = ref<any>(null)
const rctRef = ref<any>(null)
const canAuthUserSelect = computed(() => checkPermi(['system/roles/authUser/select']))

function getList(query: any) {
  return getUnallocatedUserList({
    ...query,
    roleId: +props.roleId,
  })
}

function show() {
  if (!canAuthUserSelect.value) return $sdk.msgWarning('当前操作没有权限')
  dialogRef.value.visible = true
  nextTick(() => {
    rctRef.value?.getList?.(1)
  })
}

function handleSelectUser({ loading }: any) {
  if (!canAuthUserSelect.value) {
    loading.value = false
    return $sdk.msgWarning('当前操作没有权限')
  }
  const selectedIds = rctRef.value?.selectedIds || []
  if (!selectedIds.length) {
    ElMessage.error('请选择要分配的用户')
    loading.value = false
    return
  }

  authUserSelectAll({ roleId: +props.roleId, userIds: selectedIds.join(',') })
    .then((res) => {
      if (res.code === 200 || res.code === 0) {
        $sdk.msgSuccess('授权成功')
        dialogRef.value.visible = false
        emit('ok')
      }
    })
    .finally(() => {
      loading.value = false
    })
}

defineExpose({
  show,
})
</script>
