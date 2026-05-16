<script setup lang="ts">
// @ts-nocheck
import RequestChartTable from '@/components/RequestChartTable.vue'
import TableOperation from '@/components/TableOperation.vue'
import { useRoute, useRouter } from 'vue-router'
import { checkPermi } from '@/utils/permission'
import {
  cancelCustomerViewer,
  cancelCustomerViewers,
  getAllocatedViewerList,
  getCustomerViewerRecords,
  getOne,
} from './api'
import SelectAuthUser from './selectAuthUser.vue'

const route = useRoute()
const router = useRouter()
const rctRef = ref<any>(null)
const recordRef = ref<any>(null)
const selectRef = ref<any>(null)
const customer = ref<any>({})

const customerId = computed(() => String(route.params.customerId || ''))
const canManageAuth = computed(() => checkPermi(['business/crm/customers/update']))

const grantTypeMap = {
  permanent: '永久授权',
  temporary: '临时授权',
}

const canEditMap = {
  1: '是',
  0: '否',
}

const statusMap = {
  1: '启用',
  0: '停用',
}

const actionTypeMap = {
  grant: '新增授权',
  revoke: '取消授权',
  revokeAll: '批量取消',
  expire: '授权过期',
  enable: '启用授权',
  disable: '停用授权',
}

async function loadCustomer() {
  if (!customerId.value) return
  const { data } = await getOne(customerId.value)
  customer.value = data || {}
}

function getList(query: any) {
  return getAllocatedViewerList(customerId.value, query)
}

function getRecordList(query: any) {
  return getCustomerViewerRecords(customerId.value, query)
}

function getButtons(row: any) {
  return [
    canManageAuth.value
      ? {
          key: 'cancel',
          label: '取消授权',
          danger: true,
          onClick: () => cancelAuthUser(row),
        }
      : null,
  ].filter(Boolean)
}

function openSelectUser() {
  if (!canManageAuth.value) return $sdk.msgWarning('当前操作没有权限')
  selectRef.value?.show()
}

function refreshLists() {
  rctRef.value?.getList?.(1)
  recordRef.value?.getList?.(1)
}

function cancelAuthUser(row: any) {
  if (!canManageAuth.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm('确认要取消该用户的客户查看授权吗？').then(async () => {
    await cancelCustomerViewer(customerId.value, { userId: String(row.id) })
    $sdk.msgSuccess('取消授权成功')
    refreshLists()
  })
}

function cancelAuthUserAll(selectedIds: any[]) {
  if (!canManageAuth.value) return $sdk.msgWarning('当前操作没有权限')
  if (!selectedIds.length) return $sdk.msgWarning('请选择要取消授权的用户')
  $sdk.confirm('是否取消选中用户的客户查看授权？').then(async () => {
    await cancelCustomerViewers(customerId.value, { userIds: selectedIds.map((id) => String(id)) })
    $sdk.msgSuccess('取消授权成功')
    refreshLists()
  })
}

function formatViewerNames(row: any) {
  const items = Array.isArray(row.items) ? row.items : []
  const names = items.map((item) => item.userName || item.name || item.nickname || item.userId).filter(Boolean)
  return names.length ? names.join('、') : '-'
}

function handleBack() {
  router.push('/crm/customerManage')
}

onMounted(loadCustomer)
</script>

<template>
  <div class="customer-auth-page">
    <div class="customer-auth-header Gcard">
      <div class="customer-auth-header__main">
        <div class="customer-auth-header__title">客户授权查看</div>
        <div class="customer-auth-header__meta">
          <span>客户名称：{{ customer.name || '-' }}</span>
          <span>客户编号：{{ customer.code || '-' }}</span>
          <span>联系人：{{ customer.contactPerson || '-' }}</span>
        </div>
      </div>
      <el-button @click="handleBack">返回</el-button>
    </div>

    <RequestChartTable ref="rctRef" :request="getList" class="customer-auth-table" :is-selection="true" data-key="id">
      <template #query="{ query }">
        <BaInput v-model="query.userName" label="用户账号" prop="userName"></BaInput>
      </template>

      <template #operation="{ selectedIds }">
        <div class="customer-auth-operation">
          <el-button v-if="canManageAuth" type="primary" @click="openSelectUser">新增授权</el-button>
          <el-button v-if="canManageAuth" type="danger" :disabled="!selectedIds.length" @click="cancelAuthUserAll(selectedIds)">
            批量取消授权
          </el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="用户账号" prop="name" min-width="140" />
        <el-table-column label="用户昵称" prop="nickname" min-width="140" />
        <el-table-column label="部门" prop="deptName" min-width="140" />
        <el-table-column label="手机" prop="phone" min-width="140" />
        <el-table-column label="授权类型" prop="grantType" width="110">
          <template #default="{ row }">
            {{ grantTypeMap[row.grantType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" prop="startTime" min-width="170" />
        <el-table-column label="结束时间" prop="endTime" min-width="170" />
        <el-table-column label="允许编辑" prop="canEdit" width="100">
          <template #default="{ row }">
            <el-tag :type="row.canEdit === '1' ? 'success' : 'info'" size="small">
              {{ canEditMap[row.canEdit] || '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="授权时间" prop="grantTime" min-width="170" />
        <el-table-column label="状态" prop="status" width="90">
          <template #default="{ row }">
            {{ statusMap[row.status] || '-' }}
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <RequestChartTable ref="recordRef" title="授权记录" :request="getRecordList" class="customer-auth-records">
      <template #tableView>
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <el-table :data="row.items || []" size="small" class="customer-auth-records__inner">
              <el-table-column label="用户ID" prop="userId" min-width="120" />
              <el-table-column label="授权类型" prop="grantType" width="110">
                <template #default="{ row: item }">
                  {{ grantTypeMap[item.grantType] || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="开始时间" prop="startTime" min-width="170" />
              <el-table-column label="结束时间" prop="endTime" min-width="170" />
              <el-table-column label="允许编辑" prop="canEdit" width="100">
                <template #default="{ row: item }">
                  {{ canEditMap[item.canEdit] || '否' }}
                </template>
              </el-table-column>
              <el-table-column label="授权原因" prop="grantReason" min-width="180" />
              <el-table-column label="取消原因" prop="revokeReason" min-width="180" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" prop="operateTime" min-width="170" />
        <el-table-column label="操作人" prop="operatorName" min-width="120" />
        <el-table-column label="操作类型" prop="actionType" width="110">
          <template #default="{ row }">
            {{ actionTypeMap[row.actionType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="授权对象" min-width="220">
          <template #default="{ row }">
            {{ formatViewerNames(row) }}
          </template>
        </el-table-column>
        <el-table-column label="授权人数" prop="userCount" width="100" />
        <el-table-column label="授权类型" prop="grantType" width="110">
          <template #default="{ row }">
            {{ grantTypeMap[row.grantType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="220">
          <template #default="{ row }">
            {{ row.startTime || '-' }} 至 {{ row.endTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="允许编辑" prop="canEdit" width="100">
          <template #default="{ row }">
            {{ canEditMap[row.canEdit] || '否' }}
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="180">
          <template #default="{ row }">
            {{ row.grantReason || row.revokeReason || '-' }}
          </template>
        </el-table-column>
      </template>
    </RequestChartTable>

    <SelectAuthUser ref="selectRef" :customerId="customerId" @ok="refreshLists" />
  </div>
</template>

<style scoped lang="scss">
.customer-auth-page {
  display: grid;
  gap: 16px;
}

.customer-auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.customer-auth-header__main {
  min-width: 0;
}

.customer-auth-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.customer-auth-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.customer-auth-operation {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.customer-auth-table :deep(th.el-table__cell),
.customer-auth-records :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.customer-auth-records__inner {
  width: 100%;
}
</style>
