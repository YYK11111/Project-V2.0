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
import { useRouter } from 'vue-router'
import { checkPermi } from '@/utils/permission'

const router = useRouter()
const rctRef = ref<any>(null)
const dialogRef = ref<any>(null)
const menuRef = ref<any>(null)

const menuOptions = ref<any[]>([])
const menuExpand = ref(false)
const menuNodeAll = ref(false)

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
    canRoleUpdate.value && (!protectedRole || canManageAdminRole.value)
      ? {
          key: 'edit',
          label: '修改',
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

function getMenuAllCheckedKeys() {
  const checkedKeys = menuRef.value?.getCheckedKeys?.() || []
  const halfCheckedKeys = menuRef.value?.getHalfCheckedKeys?.() || []
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

function resetForm() {
  menuRef.value?.setCheckedKeys?.([])
  menuExpand.value = false
  menuNodeAll.value = false
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
  resetForm()
  await loadMenuTree()
  dialogRef.value.visible = true
}

async function handleEdit(row: any) {
  if (!canRoleUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (row.permissionKey === 'admin' && !canManageAdminRole.value) return $sdk.msgWarning('当前操作没有权限')
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
    ;(menuData.checkedKeys || []).forEach((id: any) => {
      menuRef.value?.setChecked?.(id, true, false)
    })
  })
}

function submit({ form, visible, loading }: any) {
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
  <div>
    <RequestChartTable ref="rctRef" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="角色名称" prop="name"></BaInput>
        <BaInput v-model="query.permissionKey" label="权限字符" prop="permissionKey"></BaInput>
        <BaSelect v-model="query.isActive" isAll label="状态" prop="isActive">
          <el-option label="正常" value="1"></el-option>
          <el-option label="停用" value="0"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <div>
            <el-button v-if="canRoleAdd" type="primary" @click="handleAdd">新增</el-button>
            <el-button v-if="canRoleUpdate" class="ml-10" :disabled="selectedIds.length !== 1" @click="handleEdit({ id: selectedIds[0] })">修改</el-button>
            <el-button v-if="canRoleDelete" class="ml-10" type="danger" :disabled="!selectedIds.length" @click="rctRef?.del(delRole)">批量删除</el-button>
          </div>
        </div>
      </template>

      <template #table>
        <el-table-column type="selection" width="50" />
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

    <BaDialog ref="dialogRef" dynamicTitle="角色" width="600" :rules="rules" @confirm="submit">
      <template #form="{ form }">
        <BaInput v-model="form.name" prop="name" label="角色名称"></BaInput>
        <BaInput v-model="form.permissionKey" prop="permissionKey" label="权限字符"></BaInput>
        <BaInput v-model="form.order" prop="order" type="number" label="角色顺序"></BaInput>

        <el-form-item prop="isActive" label="状态">
          <el-radio-group v-model="form.isActive">
            <el-radio label="1">正常</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单权限">
          <div class="width100">
            <div class="mb10">
              <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand">展开/折叠</el-checkbox>
              <el-checkbox class="ml-10" v-model="menuNodeAll" @change="handleCheckedTreeNodeAll">全选/全不选</el-checkbox>
            </div>
            <el-tree
              ref="menuRef"
              class="tree-border"
              :data="menuOptions"
              show-checkbox
              node-key="id"
              :check-strictly="true"
              default-expand-all
              empty-text="加载中，请稍候"
              :props="{ label: 'name', children: 'children' }"
            />
          </div>
        </el-form-item>

        <BaInput v-model="form.remark" type="textarea" prop="remark" label="备注"></BaInput>
      </template>
    </BaDialog>
  </div>
</template>
