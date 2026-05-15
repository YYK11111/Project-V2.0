<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from 'vue'
import { checkPermi } from '@/utils/permission'
import { getList, save, syncFeishuAccount, syncFeishuAccounts } from './api'
import TableOperation from '@/components/TableOperation.vue'

const rctRef = ref<any>(null)
const dialogRef = ref<any>(null)
const syncLoading = ref(false)

const canList = computed(() => checkPermi(['system/externalAccounts/list']))
const canUpdate = computed(() => checkPermi(['system/externalAccounts/update']))

const platformOptions = [
  { label: '飞书', value: 'feishu' },
  { label: '钉钉', value: 'dingtalk' },
  { label: '企业微信', value: 'wecom' },
]
const bindStatusMap = {
  1: { label: '已绑定', type: 'success' },
  0: { label: '已解绑', type: 'info' },
  2: { label: '冲突', type: 'warning' },
  3: { label: '失效', type: 'danger' },
}

const getButtons = (row: any) => [
  canUpdate.value ? { key: 'edit', label: '编辑', type: 'primary', onClick: () => openEdit(row) } : null,
  canUpdate.value && row.platform === 'feishu'
    ? { key: 'sync', label: '同步飞书', onClick: () => syncOne(row) }
    : null,
].filter(Boolean)

function getPlatformLabel(platform: string) {
  return platformOptions.find((item) => item.value === platform)?.label || platform || '-'
}

function openEdit(row: any) {
  if (!canUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  dialogRef.value?.action(JSON.parse(JSON.stringify(row)))
}

async function submit(data) {
  if (!canUpdate.value) {
    data.loading.value = false
    return $sdk.msgWarning('当前操作没有权限')
  }
  await dialogRef.value?.confirm(save, () => rctRef.value?.getList(1))
}

async function syncOne(row: any) {
  if (!canUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (!row.userId) return $sdk.msgWarning('缺少系统用户ID')
  await syncFeishuAccount(row.userId)
  $sdk.msgSuccess('同步完成')
  rctRef.value?.getList()
}

async function syncAll() {
  if (!canUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  syncLoading.value = true
  try {
    const { data } = await syncFeishuAccounts({ limit: 1000 })
    $sdk.msgSuccess(`同步完成：成功 ${data?.synced || 0}，跳过 ${data?.skipped || 0}，失败 ${data?.failed || 0}`)
    rctRef.value?.getList()
  } finally {
    syncLoading.value = false
  }
}
</script>

<template>
  <div class="external-account-page business-list-page">
    <RequestChartTable v-if="canList" ref="rctRef" class="external-account-panel business-list-panel" :request="getList" :is-selection="false">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.userId" label="系统用户ID" prop="userId" />
              <BaInput v-model="query.keyword" label="关键字" prop="keyword" placeholder="外部ID/姓名/邮箱/手机号" />
              <BaSelect v-model="query.platform" label="平台" prop="platform" isAll>
                <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
              </BaSelect>
              <BaSelect v-model="query.bindStatus" label="绑定状态" prop="bindStatus" isAll>
                <el-option v-for="(item, key) in bindStatusMap" :key="key" :label="item.label" :value="key" />
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation>
        <div class="external-account-operation">
          <el-button v-if="canUpdate" type="primary" :loading="syncLoading" @click="syncAll">批量同步飞书</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="userId" label="系统用户ID" width="110" />
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">{{ getPlatformLabel(row.platform) }}</template>
        </el-table-column>
        <el-table-column prop="externalUserId" label="外部用户ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="name" label="外部姓名" width="130" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="bindStatus" label="绑定状态" width="110">
          <template #default="{ row }">
            <el-tag :type="bindStatusMap[row.bindStatus]?.type || 'info'" size="small" effect="plain">{{ bindStatusMap[row.bindStatus]?.label || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bindSource" label="来源" width="100" />
        <el-table-column prop="lastSyncTime" label="同步时间" width="170" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <el-empty v-else description="当前操作没有权限" />

    <BaDialog ref="dialogRef" dynamicTitle="外部账号映射" width="620" @confirm="submit">
      <template #form="{ form }">
        <BaInput v-model="form.userId" label="系统用户ID" prop="userId" disabled />
        <BaSelect v-model="form.platform" label="平台" prop="platform">
          <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
        </BaSelect>
        <BaInput v-model="form.externalUserId" label="外部用户ID" prop="externalUserId" maxlength="100" />
        <BaInput v-model="form.name" label="外部姓名" prop="name" maxlength="100" />
        <BaInput v-model="form.email" label="邮箱" prop="email" maxlength="100" />
        <BaInput v-model="form.mobile" label="手机号" prop="mobile" maxlength="50" />
        <BaSelect v-model="form.bindStatus" label="绑定状态" prop="bindStatus">
          <el-option v-for="(item, key) in bindStatusMap" :key="key" :label="item.label" :value="key" />
        </BaSelect>
      </template>
    </BaDialog>
  </div>
</template>

<style scoped lang="scss">
.external-account-operation {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
