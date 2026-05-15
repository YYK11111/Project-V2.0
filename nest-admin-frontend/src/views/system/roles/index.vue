<script setup lang="ts">
// @ts-nocheck
import RequestChartTable from '@/components/RequestChartTable.vue'
import TableOperation from '@/components/TableOperation.vue'
import {
  getList as getRoleList,
  save,
  delRole,
  getOne,
  getMenuTree,
  getRoleMenuTree,
} from './api'
import {
  getMenuNodeTooltipLines,
  getMenuNodeTagType,
  getMenuNodeTypeLabel,
} from './menu-tree'
import { useRouter } from 'vue-router'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const rctRef = ref<any>(null)
const dialogRef = ref<any>(null)
const menuRef = ref<any>(null)

const menuOptions = ref<any[]>([])
const menuExpand = ref(false)
const menuNodeAll = ref(false)
const menuKeyword = ref('')
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const isViewMode = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => {
  return {
    add: '新增角色',
    edit: '编辑角色',
    view: '查看角色',
  }[dialogMode.value]
})
const menuTreeProps = computed(() => ({
  label: 'name',
  children: 'children',
  disabled: () => isViewMode.value,
}))

const yesOrNo = {
  1: '正常',
  0: '停用',
}

const rules = {
  name: [$sdk.ruleRequiredBlur],
  permissionKey: [$sdk.ruleRequiredBlur],
  order: [$sdk.ruleRequiredBlur],
}

const canRoleAdd = computed(() => checkPermi(['system/roles/add']))
const canRoleUpdate = computed(() => checkPermi(['system/roles/update']))
const canRoleDelete = computed(() => checkPermi(['system/roles/delete']))
const canRoleAuthUser = computed(() => checkPermi(['system/roles/authUser/select']))
const canManageAdminRole = computed(() => checkPermi(['system/roles/manageAdminRole']))

function normalizeQuery(query: any) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

function getList(query: any) {
  return getRoleList(normalizeQuery(query))
}

function getButtons(row: any) {
  const protectedRole = row.permissionKey === 'admin'
  return [
    {
      key: 'view',
      label: '查看',
      onClick: () => handleView(row),
    },
    canRoleUpdate.value && (!protectedRole || canManageAdminRole.value)
      ? {
          key: 'edit',
          label: '编辑',
          onClick: () => handleEdit(row),
        }
      : null,
    canRoleAuthUser.value && (!protectedRole || canManageAdminRole.value)
      ? {
          key: 'authUser',
          label: '分配用户',
          onClick: () => router.push({ name: 'RoleAuthUser', params: { roleId: row.id } }),
        }
      : null,
    canRoleDelete.value && (!protectedRole || canManageAdminRole.value)
      ? {
          key: 'delete',
          label: '删除',
          danger: true,
          onClick: () => rctRef.value?.del(delRole, row.id),
        }
      : null,
  ].filter(Boolean)
}

function setTreeExpanded(nodes: any[], expanded: boolean) {
  nodes.forEach((node) => {
    menuRef.value?.store?.nodesMap?.[node.id] && (menuRef.value.store.nodesMap[node.id].expanded = expanded)
    node.children?.length && setTreeExpanded(node.children, expanded)
  })
}

function handleCheckedTreeExpand(value: boolean) {
  setTreeExpanded(menuOptions.value, value)
}

function handleCheckedTreeNodeAll(value: boolean) {
  menuRef.value?.setCheckedNodes(value ? menuOptions.value : [])
}

function filterMenuNode(keyword: string, data: any) {
  if (!keyword) return true
  const normalizedKeyword = String(keyword).trim().toLowerCase()
  if (!normalizedKeyword) return true
  return [data?.name, data?.permissionKey, data?.path, data?.desc, getMenuNodeTypeLabel(data)]
    .filter(Boolean)
    .some((item) => String(item).toLowerCase().includes(normalizedKeyword))
}

function handleMenuKeywordChange(value: string) {
  menuRef.value?.filter?.(value)
}

function getMenuAllCheckedKeys() {
  const checkedKeys = menuRef.value?.getCheckedKeys?.() || []
  const halfCheckedKeys = menuRef.value?.getHalfCheckedKeys?.() || []
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return [...new Set(checkedKeys.map((id: any) => String(id)).filter(Boolean))]
}

function resetForm() {
  menuRef.value?.setCheckedKeys?.([])
  menuExpand.value = false
  menuNodeAll.value = false
  menuKeyword.value = ''
  dialogRef.value.form = {
    id: undefined,
    name: '',
    permissionKey: '',
    order: 1,
    isActive: '1',
    menuIds: [],
    remark: '',
  }
}

async function loadMenuTree() {
  menuOptions.value = await getMenuTree()
}

async function handleAdd() {
  if (!canRoleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  dialogMode.value = 'add'
  resetForm()
  await loadMenuTree()
  dialogRef.value.visible = true
}

async function handleEdit(row: any) {
  if (!canRoleUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (row.permissionKey === 'admin' && !canManageAdminRole.value) return $sdk.msgWarning('当前操作没有权限')
  dialogMode.value = 'edit'
  await openRoleDialog(row)
}

async function handleView(row: any) {
  dialogMode.value = 'view'
  await openRoleDialog(row)
}

async function openRoleDialog(row: any) {
  resetForm()
  const roleId = row.id
  const [role, menuData] = await Promise.all([getOne(roleId), getRoleMenuTree(roleId)])
  dialogRef.value.form = {
    ...(role || {}),
    order: Number(role?.order || 1),
    menuIds: role?.menus?.map((item: any) => item.id) || [],
  }
  menuOptions.value = menuData.menus || []
  dialogRef.value.visible = true
  nextTick(() => {
    menuExpand.value = false
    handleCheckedTreeExpand(false)
    menuRef.value?.filter?.('')
    ;(menuData.checkedKeys || []).forEach((id: any) => {
      menuRef.value?.setChecked?.(id, true)
    })
  })
}

function submit({ form, visible, loading }: any) {
  if (isViewMode.value) {
    loading.value = false
    return
  }
  form.value.menuIds = getMenuAllCheckedKeys()
  form.value.order = String(form.value.order)
  const request = save
  request(form.value)
    .then(() => {
      $sdk.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      visible.value = false
      rctRef.value?.getList?.(1)
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="role-index-page">
    <RequestChartTable ref="rctRef" class="role-index-panel" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.name" label="角色名称" prop="name"></BaInput>
              <BaInput v-model="query.permissionKey" label="权限字符" prop="permissionKey"></BaInput>
              <BaSelect v-model="query.isActive" isAll label="状态" prop="isActive">
                <el-option label="正常" value="1"></el-option>
                <el-option label="停用" value="0"></el-option>
              </BaSelect>
            </div>
          </div>
        </div>
      </template>

      <template #operation="{ selectedIds }">
        <div class="role-index-operation">
          <div class="role-index-operation__left">
            <el-button v-if="canRoleAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button v-if="canRoleUpdate" class="ml-10" :disabled="selectedIds.length !== 1" @click="handleEdit({ id: selectedIds[0] })">编辑</el-button>
            <el-button v-if="canRoleDelete" class="ml-10" type="danger" :disabled="!selectedIds.length" @click="rctRef?.del(delRole)">批量删除</el-button>
          </div>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="角色编号" prop="id" width="100" />
        <el-table-column label="角色名称" prop="name" min-width="140" />
        <el-table-column label="权限字符" prop="permissionKey" min-width="140" />
        <el-table-column label="显示顺序" prop="order" width="100" />
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

    <BaDialog ref="dialogRef" :title="dialogTitle" width="600" :rules="rules" :show-footer="!isViewMode" @confirm="submit">
      <template #form="{ form }">
        <BaInput v-model="form.name" prop="name" label="角色名称" :disabled="isViewMode"></BaInput>
        <BaInput v-model="form.permissionKey" prop="permissionKey" label="权限字符" :disabled="isViewMode"></BaInput>
        <BaInput v-model="form.order" prop="order" type="number" label="角色顺序" :disabled="isViewMode"></BaInput>

        <el-form-item prop="isActive" label="状态">
          <el-radio-group v-model="form.isActive" :disabled="isViewMode">
            <el-radio label="1">正常</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单权限">
          <div class="width100">
            <div v-if="!isViewMode" class="mb10">
              <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand">展开/折叠</el-checkbox>
              <el-checkbox class="ml-10" v-model="menuNodeAll" @change="handleCheckedTreeNodeAll">全选/全不选</el-checkbox>
            </div>
            <el-input
              v-model="menuKeyword"
              class="mb10"
              clearable
              placeholder="搜索名称 / 权限字符 / 路径 / 说明"
              @input="handleMenuKeywordChange"
            />
            <el-tree
              ref="menuRef"
              class="tree-border"
              :data="menuOptions"
              show-checkbox
              node-key="id"
              :check-strictly="false"
              empty-text="加载中，请稍候"
              :filter-node-method="filterMenuNode"
              :props="menuTreeProps"
            >
              <template #default="{ data }">
                <el-tooltip placement="top-start" effect="light" :show-after="300">
                  <template #content>
                    <div class="menu-node-tooltip">
                      <div v-for="(line, index) in getMenuNodeTooltipLines(data)" :key="`${data.id || data.permissionKey || 'menu'}-${index}`">
                        {{ line }}
                      </div>
                    </div>
                  </template>
                  <div class="menu-node">
                    <div class="menu-node__head">
                      <span class="menu-node__name">{{ data.name }}</span>
                      <el-tag size="small" :type="getMenuNodeTagType(data)" effect="plain">
                        {{ getMenuNodeTypeLabel(data) }}
                      </el-tag>
                    </div>
                    <div class="menu-node__meta">
                      <span class="menu-node__key">{{ data.permissionKey || '无权限字符' }}</span>
                      <span v-if="data.path" class="menu-node__path">{{ data.path }}</span>
                    </div>
                  </div>
                </el-tooltip>
              </template>
            </el-tree>
          </div>
        </el-form-item>

        <BaInput v-model="form.remark" type="textarea" prop="remark" label="备注" :disabled="isViewMode"></BaInput>
      </template>
    </BaDialog>
  </div>
</template>

<style scoped>
.role-index-page {
  min-height: 100%;
}

.role-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.role-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.role-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.role-index-panel :deep(.el-table__header-wrapper),
.role-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.role-index-page :deep(.el-tree-node__content) {
  height: auto;
  min-height: 36px;
  align-items: flex-start;
  padding-top: 6px;
  padding-bottom: 6px;
}

.role-index-page :deep(.el-tree-node__label) {
  width: 100%;
}

.menu-node {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.menu-node__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.menu-node__name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.menu-node__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.menu-node__key,
.menu-node__path {
  min-width: 0;
  word-break: break-all;
}

.menu-node-tooltip {
  white-space: pre-line;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .role-index-panel {
    padding-top: 18px;
  }

  .role-index-operation,
  .role-index-operation__left {
    align-items: stretch;
  }
}
</style>
