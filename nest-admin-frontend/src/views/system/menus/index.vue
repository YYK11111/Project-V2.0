<script setup lang="ts">
// @ts-nocheck
import { getTrees, getTypes, save, del } from './api'
import { yesOrNO } from '@/utils/dictionary'
import { checkPermi } from '@/utils/permission'

const isActive = { '1': '正常', '0': '停用' }
const formDefault = { isHidden: '0', isActive: '1' }
const rules = { name: [$sdk.ruleRequiredBlur], key: [$sdk.ruleRequiredBlur] }
const canMenuAdd = computed(() => checkPermi(['system/menus/add']))
const canMenuUpdate = computed(() => checkPermi(['system/menus/update']))
const canMenuDelete = computed(() => checkPermi(['system/menus/delete']))
const canManageProtectedMenu = computed(() => checkPermi(['system/menus/manageProtected']))

function isAdmin(row) {
  return row.permissionKey === 'admin'
}

function canOperateProtectedMenu(row) {
  return !isAdmin(row) || canManageProtectedMenu.value
}
const menuTypes = ref([])
getTypes().then(({ data }) => (menuTypes.value = data))

const trees = ref([{ id: '0', name: '主类目', children: [] }])
function getTreesFun() {
  getTrees().then(({ data }) => (trees.value[0].children = data))
}
getTreesFun()
</script>
<template>
  <div>
    <RequestChartTable ref="rctRef" :request="getTrees">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="菜单名称" prop="name"></BaInput>
        <BaSelect v-model="query.type" label="菜单类型" prop="type" isAll>
          <el-option v-for="(value, key) in menuTypes" :key="key" :label="value" :value="key" />
        </BaSelect>
        <BaSelect v-model="query.isActive" label="是否启用" prop="isActive" isAll>
          <el-option v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
          <el-button v-if="canMenuAdd" type="primary" @click="$refs.dialogRef.action(formDefault)">新增</el-button>
      </template>

      <template #="{ data }">
        <el-table :data="data" row-key="id" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
          <el-table-column prop="name" label="名称" align="left"></el-table-column>
          <el-table-column prop="icon" label="图标" width="100">
            <template #default="{ row }">
              <svg-icon :icon="row.icon" />
            </template>
          </el-table-column>
          <el-table-column prop="order" label="排序" width="100"></el-table-column>
          <el-table-column prop="permissionKey" label="权限标识" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column prop="path" label="路由地址" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column prop="component" label="组件路径" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column prop="isHidden" label="是否隐藏">
            <template #default="{ row }">
              {{ yesOrNO[row.isHidden] }}
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="是否启用">
            <template #default="{ row }">
              {{ yesOrNO[row.isActive] }}
            </template>
          </el-table-column>
          <el-table-column label="最近更新" prop="updateTime">
            <template #default="{ row }">
              {{ row.updateUser || row.createUser || '-' }}
              <br />
              {{ row.updateTime || row.createTime || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button v-if="canMenuUpdate" text @click="canOperateProtectedMenu(row) ? $refs.dialogRef.action(row) : $sdk.msgWarning('当前操作没有权限')">修改</el-button>
              <el-button v-if="canMenuAdd" text @click="$refs.dialogRef.action({ parentId: row.id, ...formDefault })">新增</el-button>
              <el-button v-if="canMenuDelete" text @click="canOperateProtectedMenu(row) ? $refs.rctRef.del(del, row.id) : $sdk.msgWarning('当前操作没有权限')" :disabled="isAdmin(row) && !canManageProtectedMenu">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </RequestChartTable>

    <!-- 添加或修改菜单对话框 -->
    <BaDialog
      ref="dialogRef"
      dynamicTitle="菜单"
      :rules="rules"
      width="800"
        @confirm="(data) => { const form = data.form.value; const isEdit = !!form.id; if ((isEdit && !canMenuUpdate) || (!isEdit && !canMenuAdd)) return $sdk.msgWarning('当前操作没有权限'); if (isAdmin(form) && !canManageProtectedMenu) return $sdk.msgWarning('当前操作没有权限'); $refs.dialogRef.confirm(save, () => $refs.rctRef.getList(1), getTreesFun()) }">
      <template #form="{ form }">
        <el-form-item class="width100" label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="trees"
            node-key="id"
            show-checkbox
            check-strictly="true"
            :props="{ label: 'name' }"
            placeholder="选择上级菜单" />
        </el-form-item>
        <BaInput v-model="form.name" label="菜单名称" prop="name" />
        <BaInput v-model="form.desc" label="菜单描述" prop="desc" />
        <BaRadioGroup v-model="form.type" label="菜单类型" prop="type">
          <el-radio v-for="(value, key) in menuTypes" :key="key" :label="value" :value="key" />
        </BaRadioGroup>
        <el-form-item v-if="form.type != 'button'" label="菜单图标">
          <el-popover placement="bottom-start" width="460" trigger="click" @show="$refs['iconSelect'].reset()">
            <IconSelect ref="iconSelect" @selected="(name) => (form.icon = name)" />
            <template #reference>
              <el-select v-model="form.icon" remote placeholder="点击选择图标" @clear="form.icon = '#'">
                <template #prefix>
                  <svg-icon
                    v-if="form.icon"
                    :icon="form.icon"
                    class="el-input__icon"
                    style="height: 32px; width: 16px" />
                  <el-icon-search v-else class="el-icon-search el-input__icon" />
                </template>
              </el-select>
            </template>
          </el-popover>
        </el-form-item>

        <el-form-item label="显示排序" prop="order">
          <el-input-number v-model="form.order" :precision="2" :step="1" :min="0" />
        </el-form-item>
        <!-- <BaRadioGroup v-model="form.isFrame" v-if="form.type != 'button'" label="是否外链">
					<el-radio label="0">否</el-radio>
					<el-radio label="1">是</el-radio>
				</BaRadioGroup> -->
        <BaInput v-model="form.path" v-if="form.type != 'button'" label="路由地址" prop="path" required />
        <BaInput v-model="form.component" v-if="form.type == 'menu'" label="组件路径" prop="component" />
        <BaInput v-model="form.permissionKey" v-if="form.type != 'catalog'" label="权限标识" maxlength="50" />
        <BaRadioGroup v-model="form.isHidden" v-if="form.type != 'button'" label="是否隐藏">
          <el-radio v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-radio>
        </BaRadioGroup>
        <BaRadioGroup v-model="form.isActive" v-if="form.type != 'button'" label="是否启用">
          <el-radio v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-radio>
          <!-- <el-radio
            v-for="(key, data) of Object.keys(isActive).sort((a, b) => b - a)"
            :key="key"
            :label="isActive[key]"
            :value="key"></el-radio> -->
        </BaRadioGroup>
      </template>
    </BaDialog>
  </div>
</template>

<!-- <script>
import { arrayToTree } from '@/utils/common'
import { getList, getMenu, delMenu, addMenu, updateMenu, getDicts } from './api'
import IconSelect from '@/components/IconSelect'

export default {
	name: 'Menu',
	components: { IconSelect },
	data() {
		return {
			getList,
			// 遮罩层
			loading: true,
			// 显示搜索条件
			showSearch: true,
			// 菜单表格树数据
			menuList: [],
			// 菜单树选项
			menuOptions: [],
			// 弹出层标题
			title: '',
			// 是否显示弹出层
			open: false,
			// 显示状态数据字典
			visibleOptions: [
				{
					value: '0',
					label: '显示',
				},
				{
					value: '1',
					label: '隐藏',
				},
			],
			// 菜单状态数据字典
			statusOptions: [],
			// 查询参数
			queryParams: {
				name: undefined,
				visible: undefined,
			},
			// 表单参数
			form: {},
			// 表单校验
			rules: {
				name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
				order: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
				path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
			},
		}
	},
	created() {
		// getDicts('sys_show_hide').then((response) => {
		//   this.visibleOptions = response.data
		// })
		getDicts().then(({ data }) => {
			this.statusOptions = data
		})
	},
	methods: {
		// 选择图标
		selected(name) {
			this.form.icon = name
		},
		// getList() {
		//   this.loading = true
		//   getList(this.queryParams).then((response) => {
		//     // console.log('1', arrayToTree(response.data, 'id'))
		//     this.menuList = arrayToTree(response.data, 'id')
		//     // console.log('2', this.menuList)
		//     this.loading = false
		//   })
		// },
		// 显示状态字典翻译
		visibleFormat(row, column) {
			if (row.menuType == 'F') {
				return ''
			}
			return this.selectlabel(this.visibleOptions, row.visible)
		},
		// 菜单状态字典翻译
		statusFormat(row, column) {
			if (row.menuType == 'F') {
				return ''
			}
			return this.selectlabel(this.statusOptions, row.isActive)
		},
		// 取消按钮
		cancel() {
			this.open = false
			this.reset()
		},
		// 表单重置
		reset() {
			this.form = {
				id: undefined,
				parentId: 0,
				name: undefined,
				icon: undefined,
				menuType: 'M',
				order: undefined,
				isFrame: '1',
				isShow: 1,
				isActive: 1,
			}
			setTimeout(() => {
				this.$refs.form.clearValidate()
			}, 0)
		},
		/** 搜索按钮操作 */
		handleQuery() {
			this.getList()
		},
		/** 重置按钮操作 */
		resetQuery() {
			this.resetForm('queryForm')
			this.handleQuery()
		},
		addOrUpdate(row = { isShow: 1, isActive: 1 }) {
			this.form = JSON.parse(JSON.stringify(row))
			this.form.parentId = row.id || 0
			this.open = true
			setTimeout(() => {
				this.$refs.form.clearValidate()
			}, 0)
		},
		/** 修改按钮操作 */
		handleUpdate(row) {
			this.reset()
			this.getTreeselect()
			getMenu(row.id).then((response) => {
				this.form = response.data
				this.open = true
			})
		},
		/** 提交按钮 */
		submitForm: function () {
			this.$refs['form'].validate((valid) => {
				if (valid) {
					if (this.form.id != undefined) {
						updateMenu(this.form).then((response) => {
							if (response.code === 200) {
								$sdk.msgSuccess('修改成功')
								this.open = false
								this.getList()
							}
						})
					} else {
						addMenu(this.form).then((response) => {
							if (response.code === 200) {
								$sdk.msgSuccess('新增成功')
								this.open = false
								this.getList()
							}
						})
					}
				}
			})
		},
		/** 删除按钮操作 */
		handleDelete(row) {
			$sdk
				.confirm('是否确认删除名称为"' + row.name + '"的数据项?', '警告', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning',
				})
				.then(function () {
					return delMenu(row.id)
				})
				.then(() => {
					this.getList()
					$sdk.msgSuccess('删除成功')
				})
				.catch(function () {})
		},
	},
}
</script> -->

<style lang="scss" scoped>
:deep() .BaDialog .dialogForm {
  max-width: none;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  flex-wrap: wrap;
  .el-form-item {
    flex: auto;
  }
}
</style>
