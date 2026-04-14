<script setup lang="ts">
// @ts-nocheck
import RequestChartTable from '@/components/RequestChartTable.vue'
import TableOperation from '@/components/TableOperation.vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllocatedUserList, authUserCancel, authUserCancelAll } from './api'
import SelectUser from './selectUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const rctRef = ref<any>(null)
const selectRef = ref<any>(null)

const roleId = computed(() => route.params.roleId)
const yesOrNo = {
  1: '激活',
  0: '停用',
}

const canAuthUserSelect = computed(() => checkPermi(['system/roles/authUser/select']))
const canAuthUserCancel = computed(() => checkPermi(['system/roles/authUser/cancel']))
const canAuthUserCancelAll = computed(() => checkPermi(['system/roles/authUser/cancelAll']))

function getList(query: any) {
  return getAllocatedUserList({
    ...query,
    roleId: +roleId.value,
  })
}

function getButtons(row: any) {
  return [
    {
      key: 'cancel',
      label: '取消授权',
      danger: true,
      disabled: !canAuthUserCancel.value,
      onClick: () => cancelAuthUser(row),
    },
  ]
}

function openSelectUser() {
  if (!canAuthUserSelect.value) return $sdk.msgWarning('当前操作没有权限')
  selectRef.value?.show()
}

function cancelAuthUser(row: any) {
  if (!canAuthUserCancel.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm('确认要取消该用户角色吗？').then(async () => {
    await authUserCancel({ userId: row.id, roleId: +roleId.value })
    $sdk.msgSuccess('取消授权成功')
    rctRef.value?.getList?.(1)
  })
}

function cancelAuthUserAll(selectedIds: any[]) {
  if (!canAuthUserCancelAll.value) return $sdk.msgWarning('当前操作没有权限')
  if (!selectedIds.length) {
    return
  }
  $sdk.confirm('是否取消选中用户授权数据项?').then(async () => {
    await authUserCancelAll({ roleId: +roleId.value, userIds: selectedIds.join(',') })
    $sdk.msgSuccess('取消授权成功')
    rctRef.value?.getList?.(1)
  })
}

function handleClose() {
  router.push('/system/roles')
}
</script>

<template>
  <div>
    <RequestChartTable ref="rctRef" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.userName" label="用户账号" prop="userName"></BaInput>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <div>
            <el-button v-if="canAuthUserSelect" type="primary" @click="openSelectUser">添加用户</el-button>
            <el-button v-if="canAuthUserCancelAll" class="ml-10" type="danger" :disabled="!selectedIds.length" @click="cancelAuthUserAll(selectedIds)">
              批量取消授权
            </el-button>
            <el-button class="ml-10" @click="handleClose">关闭</el-button>
          </div>
        </div>
      </template>

      <template #table>
        <el-table-column type="selection" width="50" />
        <el-table-column label="用户账号" prop="name" min-width="140" />
        <el-table-column label="用户昵称" prop="nickname" min-width="140" />
        <el-table-column label="邮箱" prop="email" min-width="180" />
        <el-table-column label="手机" prop="phone" min-width="140" />
        <el-table-column label="状态" prop="isActive" width="100">
          <template #default="{ row }">
            {{ yesOrNo[row.isActive] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" min-width="180" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <SelectUser ref="selectRef" :roleId="roleId" @ok="rctRef?.getList?.(1)" />
  </div>
</template>
