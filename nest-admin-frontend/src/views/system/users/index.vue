<script setup lang="ts">
// @ts-nocheck
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

// 公共数据
const params = ref({
  includeNoDept: true,
})
const rules = { name: [$sdk.ruleRequiredBlur], phone: [$sdk.ruleRequiredBlur], deptId: [$sdk.ruleRequiredChange] }

const canUserAdd = computed(() => checkPermi(['system/users/add']))
const canUserUpdate = computed(() => checkPermi(['system/users/update']))
const canUserDelete = computed(() => checkPermi(['system/users/delete']))
const canUserResetPassword = computed(() => checkPermi(['system/users/resetPassword']))
const canManageAdminUser = computed(() => checkPermi(['system/users/manageAdmin']))

const canDeptAdd = computed(() => checkPermi(['system/dept/add']))
const canDeptUpdate = computed(() => checkPermi(['system/dept/update']))
const canDeptDelete = computed(() => checkPermi(['system/dept/delete']))
const canManageProtectedDept = computed(() => checkPermi(['system/dept/manageProtected']))

/** -- 人员 模块 -- */
import { getList, add, update, del, resetPassword } from './api'
import { getList as getRoleListApi } from '../roles/api'

function User(params) {
  const roleList = ref([])
  const userDialogRef = ref()
  const resetPasswordDialogRef = ref()

  function action(type: string, data: any) {
    switch (type) {
      case 'add':
        if (!canUserAdd.value) return $sdk.msgWarning('当前操作没有权限')
        userDialogRef.value.visible = true
        userDialogRef.value.form = { deptId: params.value.deptId }
        break
      case 'edit':
        if (!canUserUpdate.value) return $sdk.msgWarning('当前操作没有权限')
        if (isAdmin(data) && !canManageAdminUser.value) return $sdk.msgWarning('当前操作没有权限')
        userDialogRef.value.visible = true
        data.roleIds = (data.roles || []).map((e) => e.id ?? e.roleId)
        userDialogRef.value.form = JSON.parse(JSON.stringify(data))
        break
      case 'resetPassword':
        if (!canUserResetPassword.value) return $sdk.msgWarning('当前操作没有权限')
        if (isAdmin(data) && !canManageAdminUser.value) return $sdk.msgWarning('当前操作没有权限')
        resetPasswordDialogRef.value.visible = true
        resetPasswordDialogRef.value.form = { id: data.id }
        break
    }
  }

  function getRoleList() {
    getRoleListApi().then(({ data }) => {
      roleList.value = data || []
    })
  }
  getRoleList()

  return {
    action,
    roleList,
    userDialogRef,
    resetPasswordDialogRef,
  }
}
let { action, roleList, userDialogRef, resetPasswordDialogRef } = User(params)
/** -- 人员 模块 -- */

/** -- 部门 模块 -- */
import * as apiDept from './apiDept'
const rctRef = ref()
const deptDialogRef = ref()

/** -- 用户列表（用于部门负责人选择）-- */
const userList = ref([])
const filteredUserList = ref([])

function loadUsers() {
  getList({ pageNum: 1, pageSize: 1000 }).then(({ data }) => {
    userList.value = data || []
    filteredUserList.value = data || []
  })
}

function filterUser(keyword) {
  if (!keyword) {
    filteredUserList.value = userList.value
  } else {
    filteredUserList.value = userList.value.filter(u =>
      u.name.includes(keyword) || u.phone?.includes(keyword)
    )
  }
}

function isProtectedDept(data: any) {
  return !data?.parentId || data.parentId === '0' || data.parentId === 0
}

class Dept {
  loading = false
  treeData = []
  isEdit = false
  // rctRef = ref()
  constructor(
    private rctRef,
    private deptDialogRef,
    private params,
  ) {}
  getTrees() {
    this.loading = true
    apiDept
      .getTrees()
      .then(({ data }: any) => {
        this.treeData = data
        setTimeout(() => {
          this.params.deptId = data[0]?.id
          this.rctRef.getList()
        }, 0)
      })
      .finally(() => (this.loading = false))
  }

  action(type: string, data: any, node) {
    switch (type) {
      case 'add':
        if (!canDeptAdd.value) return $sdk.msgWarning('当前操作没有权限')
        this.isEdit = false
        this.deptDialogRef.visible = true
        this.deptDialogRef.form = { parentId: data.id }
        break
      case 'edit':
        if (!canDeptUpdate.value) return $sdk.msgWarning('当前操作没有权限')
        if (isProtectedDept(data) && !canManageProtectedDept.value) return $sdk.msgWarning('当前操作没有权限')
        this.isEdit = true
        this.deptDialogRef.form = JSON.parse(JSON.stringify(data))
        this.deptDialogRef.visible = true
        break
      case 'del':
        if (!canDeptDelete.value) return $sdk.msgWarning('当前操作没有权限')
        if (isProtectedDept(data) && !canManageProtectedDept.value) return $sdk.msgWarning('当前操作没有权限')
        $sdk.confirm().then(() => {
          this.loading = true
          apiDept
            .del(data.id)
            .then(() => {
              // this.getTrees()
              node.remove()
              $sdk.msgSuccess()
            })
            .finally(() => (this.loading = false))
        })
        break
    }
  }

  submit({ form, visible, loading }) {
    const isEdit = !!form.value?.id
    if ((isEdit && !canDeptUpdate.value) || (!isEdit && !canDeptAdd.value)) {
      loading.value = false
      return $sdk.msgWarning('当前操作没有权限')
    }
    if (isProtectedDept(form.value) && !canManageProtectedDept.value) {
      loading.value = false
      return $sdk.msgWarning('当前操作没有权限')
    }
    this.loading = true
    apiDept
      .save(form.value)
      .then(() => {
        this.getTrees()
        $sdk.msgSuccess()
        visible.value = false
      })
      .finally(() => (this.loading = false), (loading.value = false))
  }
}
const dept = reactive(new Dept(rctRef, deptDialogRef, params))
dept.getTrees()
loadUsers()
/** -- 部门 模块 -- */

/** */
function isAdmin(row) {
  return row.roles?.some((e) => (e.permissionKey || e.roleKey) === 'admin')
}

const getButtons = (row: any) => {
  const targetIsAdmin = isAdmin(row)
  return [
    {
      key: 'edit',
      label: '修改',
      disabled: !canUserUpdate.value || (targetIsAdmin && !canManageAdminUser.value),
      onClick: () => action('edit', row),
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      disabled: !canUserDelete.value || (targetIsAdmin && !canManageAdminUser.value),
      onClick: () => rctRef.value.del(del, row.id),
    },
    {
      key: 'reset',
      label: '重置密码',
      disabled: !canUserResetPassword.value || (targetIsAdmin && !canManageAdminUser.value),
      onClick: () => action('resetPassword', row),
    },
  ]
}
</script>

<template>
  <div class="GleftRight">
    <div class="GleftRightL Gcard" v-loading="dept.loading">
      <div class="title mb20">
        <div class="title-name">组织架构</div>
        <span v-if="canDeptAdd" @click="dept.action('add', { id: '0' })" class="hoverColor pointer">
          <el-icon-plus class="el-icon-plus"></el-icon-plus>
          新增
        </span>
      </div>
      <el-tree
        node-key="id"
        :current-node-key="params.deptId"
        highlight-current
        :data="dept.treeData"
        :props="{ label: 'name' }"
        :expand-on-click-node="false"
        :default-expand-all="true"
        @node-click="(data) => ((params.deptId = data.id), rctRef.getList(1))">
        <template #default="{ node, data }">
          <div class="flexBetween flexAuto">
            <div>
              <!-- <el-icon-folder-opened class="el-icon-folder-opened" style="color: var(--color)" /> -->
              {{ node.label }}
            </div>
            <div>
              <el-icon-plus v-if="canDeptAdd" class="hoverColor" @click.stop="dept.action('add', data)" title="新增"></el-icon-plus>
              <el-icon-EditPen
                v-if="canDeptUpdate"
                class="hoverColor"
                @click.stop="dept.action('edit', data)"
                title="编辑"></el-icon-EditPen>
              <el-icon-delete
                v-if="canDeptDelete"
                class="hoverColor"
                @click.stop="dept.action('del', data, node)"
                title="删除"></el-icon-delete>
            </div>
            <!-- <el-dropdown @command="commandDept($event, node)">
							<span class="dot">
								<el-icon-MoreFilled class="el-icon-MoreFilled content-icon"></el-icon-MoreFilled>
							</span>
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item command="edit">编辑</el-dropdown-item>
									<el-dropdown-item command="del">删除</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown> -->
          </div>
        </template>
      </el-tree>

      <!-- 部门 dialog -->
      <BaDialog ref="deptDialogRef" :dynamicTitle="dept.isEdit ? '编辑部门' : '新增部门'" width="500" :rules="rules" @confirm="(v) => dept.submit(v)">
        <template #form="{ form }">
          <el-form-item prop="parentId" class="width100" label="上级">
            <el-tree-select
              v-model="form.parentId"
              :data="[{ id: '0', name: '主类目', children: dept.treeData }]"
              node-key="id"
              show-checkbox
              check-strictly="true"
              :props="{ label: 'name' }"
              placeholder="选择上级" />
          </el-form-item>
          <BaInput v-model="form.name" prop="name" label="名称"></BaInput>
          <el-form-item prop="leaderId" label="负责人">
            <el-select
              v-model="form.leaderId"
              placeholder="选择负责人"
              clearable
              filterable
              :filter-method="filterUser"
              @visible-change="(v) => v && filterUser('')"
            >
              <el-option
                v-for="user in filteredUserList"
                :key="user.id"
                :label="user.name"
                :value="user.id"
              >
                <span>{{ user.name }}</span>
                <span class="text-gray ml-10" v-if="user.phone">{{ user.phone }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </template>
      </BaDialog>
    </div>

    <div class="GleftRightR">
      <RequestChartTable ref="rctRef" :isCreateRequest="false" :params="params" :request="getList">
        <template #query="{ query }">
          <BaInput v-model="query.name" label="姓名" prop="name"></BaInput>
          <!-- <BaInput v-model="query.nickname" label="昵称" prop="nickname"></BaInput> -->
          <BaSelect v-model="query.roleId" isAll filterable label="角色" prop="roleId">
            <el-option v-for="(data, key) in roleList" :key="data.id" :label="data.name" :value="data.id"></el-option>
          </BaSelect>
          <el-checkbox v-model="params.includeNoDept" class="ml-10">显示无部门人员</el-checkbox>
        </template>

        <template #operation="{ selectedIds }">
          <div class="flexBetween">
            <el-button v-if="canUserAdd" type="primary" @click="action('add')">新增人员</el-button>
            <el-button v-if="canUserDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
          </div>
        </template>

        <template #table>
          <el-table-column label="头像" prop="avatar">
            <template #default="{ row }">
              <!-- <el-popover v-if="row.avatar" placement="bottom" trigger="hover" show-after="200">
                <template #reference><el-image :src="row.avatar" style="width: 50px"></el-image></template>
                <el-image :src="row.avatar" style="width: 200px"></el-image>
              </el-popover> -->
              <BaImage class="size-[50px] --RadiusSmall" v-if="row.avatar" :src="row.avatar"></BaImage>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="姓名" prop="name" :show-overflow-tooltip="true" />
          <el-table-column label="部门" prop="dept" width="150">
            <template #default="{ row }">
              <MultiTags v-if="row.dept?.name" :list="row.dept?.name" />
            </template>
          </el-table-column>
          <!-- <el-table-column label="职务" prop="position" /> -->
          <el-table-column label="手机" prop="phone" />
          <el-table-column label="角色" prop="role" width="250">
            <template #default="{ row }">
              <MultiTags :list="row.roles" />
            </template>
          </el-table-column>
        </template>
      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
      </RequestChartTable>

      <!-- 人员 dialog -->
      <BaDialog
        key="userDialogRef"
        ref="userDialogRef"
        dynamicTitle="人员"
        :rules="rules"
        width="500"
        @confirm="$refs.userDialogRef.confirm(add, () => $refs.rctRef.getList(), update)">
        <template #form="{ form }">
          <BaInput v-model="form.name" prop="name" label="名称" maxlength="30"></BaInput>
          <!-- show-password -->
          <BaInput v-model="form.phone" prop="phone" label="手机" maxlength="11"></BaInput>
          <el-form-item prop="avatar" label="头像">
            <Upload v-model:fileUrl="form.avatar" :params="{ module: 'avatar' }"></Upload>
          </el-form-item>
          <el-form-item prop="deptId" label="部门">
            <el-tree-select
              v-model="form.deptId"
              :data="dept.treeData"
              node-key="id"
              show-checkbox
              check-strictly="true"
              :props="{ label: 'name' }"
              placeholder="选择部门" />
          </el-form-item>
          <BaSelect v-model="form.roleIds" multiple prop="roleIds" label="角色">
            <el-option v-for="(data, index) in roleList" :key="data.id" :label="data.name" :value="data.id"></el-option>
          </BaSelect>
        </template>
      </BaDialog>

      <!-- 重置密码 dialog -->
      <BaDialog
        key="resetPasswordDialogRef"
        ref="resetPasswordDialogRef"
        title="重置密码"
        :rules="rules"
        width="500"
        @confirm="$refs.resetPasswordDialogRef.confirm(resetPassword)">
        <template #form="{ form }">
          <BaInput v-model="form.passwordOld" prop="password" label="旧密码" maxlength="30"></BaInput>
          <BaInput v-model="form.passwordNew" prop="password" label="新密码" maxlength="30"></BaInput>
          <BaInput
            v-model="form.passwordNewConfirm"
            prop="password"
            label="新密码"
            placeholder="请再次输入新密码"
            maxlength="30"></BaInput>
        </template>
      </BaDialog>
    </div>
  </div>
</template>

<style scoped lang="scss">
.text-gray {
  color: #999;
}
.ml-10 {
  margin-left: 10px;
}
</style>
