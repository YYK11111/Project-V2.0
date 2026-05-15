<script setup lang="ts">
// @ts-nocheck
import { getTrees, getTypes, save, del } from './api'
import { getMenuDisplayTypeLabel, getMenuDisplayTypeTagType } from './menu-display'
import { yesOrNO } from '@/utils/dictionary'
import { checkPermi } from '@/utils/permission'

const isActive = { '1': '正常', '0': '停用' }
const formDefault = { isHidden: '0', isActive: '1' }
const rules = { name: [$sdk.ruleRequiredBlur], key: [$sdk.ruleRequiredBlur] }
const canMenuAdd = computed(() => checkPermi(['system/menus/add']))
const canMenuUpdate = computed(() => checkPermi(['system/menus/update']))
const canMenuDelete = computed(() => checkPermi(['system/menus/delete']))
const canManageProtectedMenu = computed(() => checkPermi(['system/menus/manageProtected']))
const activeView = ref('tree')
const currentMenuId = ref('')
const treeKeyword = ref('')
const treeExpanded = ref(true)
const treeRef = ref()
const dialogRef = ref()
const menuDialogMode = ref('add')
const isMenuDialogView = computed(() => menuDialogMode.value === 'view')
const menuDialogTitle = computed(() => {
  return {
    add: '新增菜单',
    edit: '编辑菜单',
    view: '查看菜单',
  }[menuDialogMode.value] || '菜单'
})

function isAdmin(row) {
  return row.permissionKey === 'admin'
}

function canOperateProtectedMenu(row) {
  return !isAdmin(row) || canManageProtectedMenu.value
}

function findMenuById(rows, targetId) {
  for (const row of rows || []) {
    if (String(row.id) === String(targetId)) return row
    const child = findMenuById(row.children || [], targetId)
    if (child) return child
  }
  return null
}

function findParentMenu(rows, targetId, parent = null) {
  for (const row of rows || []) {
    if (String(row.id) === String(targetId)) return parent
    const matched = findParentMenu(row.children || [], targetId, row)
    if (matched) return matched
  }
  return null
}

const menuTreeData = computed(() => trees.value[0]?.children || [])
const filteredMenuTreeData = computed(() => {
  const filterByKeyword = (rows) => {
    const normalizedKeyword = String(treeKeyword.value || '').trim().toLowerCase()
    if (!normalizedKeyword) return rows || []
    return (rows || [])
      .map((row) => ({
        ...row,
        children: filterByKeyword(row.children || []),
      }))
      .filter((row) => {
        const searchText = `${row.name || ''} ${row.path || ''} ${row.permissionKey || ''} ${row.component || ''}`.toLowerCase()
        return searchText.includes(normalizedKeyword) || row.children?.length
      })
  }

  return filterByKeyword(menuTreeData.value)
})
const currentMenu = computed(() => findMenuById(menuTreeData.value, currentMenuId.value))
const currentParentMenu = computed(() => findParentMenu(menuTreeData.value, currentMenuId.value))

function selectMenu(menu) {
  currentMenuId.value = String(menu?.id || '')
}

function syncCurrentMenu(rows) {
  if (!rows?.length) {
    currentMenuId.value = ''
    return
  }
  const matched = currentMenuId.value ? findMenuById(rows, currentMenuId.value) : null
  currentMenuId.value = String((matched || rows[0])?.id || '')
}

function setTreeExpanded(nodes, expanded) {
  ;(nodes || []).forEach((node) => {
    const currentNode = treeRef.value?.store?.nodesMap?.[node.id]
    if (currentNode) currentNode.expanded = expanded
    if (node.children?.length) setTreeExpanded(node.children, expanded)
  })
}

function toggleTreeExpanded() {
  treeExpanded.value = !treeExpanded.value
  setTreeExpanded(filteredMenuTreeData.value, treeExpanded.value)
}

function openMenuDialog(mode, data = {}) {
  menuDialogMode.value = mode
  dialogRef.value?.action(JSON.parse(JSON.stringify(data)))
}

const menuTypes = ref([])
getTypes().then(({ data }) => (menuTypes.value = data))

const trees = ref([{ id: '0', name: '主类目', children: [] }])
function getTreesFun() {
  getTrees().then(({ data }) => {
    trees.value[0].children = data || []
    syncCurrentMenu(trees.value[0].children)
  })
}
getTreesFun()
</script>
<template>
  <div class="menu-index-page">
    <el-tabs v-model="activeView" class="menu-manage-tabs">
      <el-tab-pane label="树形维护" name="tree">
        <div class="menu-workbench">
          <div class="menu-workbench__tree Gcard">
            <div class="menu-workbench__header">
              <div>
                <div class="panel-title">菜单结构</div>
                <div class="panel-description">按树形关系维护菜单层级，先选节点，再在右侧查看详情或执行操作。</div>
              </div>
              <el-button v-if="canMenuAdd" type="primary" @click="openMenuDialog('add', formDefault)">新建</el-button>
            </div>

            <div class="menu-tree-toolbar">
              <el-input v-model="treeKeyword" placeholder="搜索菜单名称、路由、权限标识、组件路径" clearable>
                <template #prefix>
                  <el-icon-search />
                </template>
              </el-input>
              <el-button @click="toggleTreeExpanded">{{ treeExpanded ? '一键收起' : '一键展开' }}</el-button>
            </div>

            <el-tree
              ref="treeRef"
              class="menu-structure-tree"
              node-key="id"
              :current-node-key="currentMenuId"
              highlight-current
              :data="filteredMenuTreeData"
              :props="{ label: 'name' }"
              :expand-on-click-node="false"
              :default-expand-all="true"
              @node-click="selectMenu">
              <template #default="{ node, data }">
                <div class="menu-tree-node">
                  <div class="menu-tree-node__main">
                    <div class="menu-tree-node__title">{{ node.label }}</div>
                    <div class="menu-tree-node__meta">
                      <el-tag size="small" :type="getMenuDisplayTypeTagType(data)" effect="light">{{ getMenuDisplayTypeLabel(data, menuTypes) }}</el-tag>
                      <span>{{ data.path || '-' }}</span>
                    </div>
                    <div class="menu-tree-node__badges">
                      <el-tag v-if="data.permissionKey" size="small" effect="plain">{{ data.permissionKey }}</el-tag>
                      <el-tag size="small" :type="data.isActive === '1' ? 'success' : 'info'">{{ yesOrNO[data.isActive] || '未知' }}</el-tag>
                      <el-tag size="small" :type="data.isHidden === '1' ? 'warning' : 'success'">{{ data.isHidden === '1' ? '已隐藏' : '显示中' }}</el-tag>
                    </div>
                  </div>
                  <div class="menu-tree-node__actions">
                    <el-icon-plus v-if="canMenuAdd" class="hoverColor" title="新增" @click.stop="openMenuDialog('add', { parentId: data.id, ...formDefault })"></el-icon-plus>
                    <el-icon-edit-pen v-if="canMenuUpdate" class="hoverColor" title="编辑" @click.stop="canOperateProtectedMenu(data) ? openMenuDialog('edit', data) : $sdk.msgWarning('当前操作没有权限')"></el-icon-edit-pen>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>

          <div class="menu-workbench__detail Gcard">
            <div class="menu-workbench__header">
              <div>
                <div class="panel-title">菜单详情</div>
                <div class="panel-description">查看当前菜单的路由、组件、权限和风险信息，减少在宽表里来回横向滚动。</div>
              </div>
              <div class="menu-detail-actions" v-if="currentMenu">
                <el-button v-if="canMenuAdd" plain @click="openMenuDialog('add', { parentId: currentMenu.id, ...formDefault })">新增子菜单</el-button>
                <el-button v-if="canMenuUpdate" type="primary" @click="canOperateProtectedMenu(currentMenu) ? openMenuDialog('edit', currentMenu) : $sdk.msgWarning('当前操作没有权限')">编辑</el-button>
                <el-button v-if="canMenuDelete" type="danger" plain :disabled="isAdmin(currentMenu) && !canManageProtectedMenu" @click="canOperateProtectedMenu(currentMenu) ? $refs.rctRef.del(del, currentMenu.id) : $sdk.msgWarning('当前操作没有权限')">删除</el-button>
              </div>
            </div>

            <template v-if="currentMenu">
              <el-descriptions :column="2" border class="menu-detail-card">
                <el-descriptions-item label="菜单名称">{{ currentMenu.name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="菜单类型">{{ getMenuDisplayTypeLabel(currentMenu, menuTypes) }}</el-descriptions-item>
                <el-descriptions-item label="上级菜单">{{ currentParentMenu?.name || '顶级菜单' }}</el-descriptions-item>
                <el-descriptions-item label="子菜单数量">{{ currentMenu.children?.length || 0 }}</el-descriptions-item>
                <el-descriptions-item label="路由地址">{{ currentMenu.path || '-' }}</el-descriptions-item>
                <el-descriptions-item label="组件路径">{{ currentMenu.component || '-' }}</el-descriptions-item>
                <el-descriptions-item label="权限标识">{{ currentMenu.permissionKey || '-' }}</el-descriptions-item>
                <el-descriptions-item label="显示排序">{{ currentMenu.order ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="是否隐藏">{{ yesOrNO[currentMenu.isHidden] || '-' }}</el-descriptions-item>
                <el-descriptions-item label="是否启用">{{ yesOrNO[currentMenu.isActive] || '-' }}</el-descriptions-item>
                <el-descriptions-item label="最近更新">
                  {{ currentMenu.updateUser || currentMenu.createUser || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                  {{ currentMenu.updateTime || currentMenu.createTime || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </template>
            <el-empty v-else description="请选择左侧菜单节点" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="列表审计" name="table">
        <RequestChartTable ref="rctRef" class="menu-index-panel" :request="getTrees">
          <template #query="{ query }">
            <div class="query-sections">
              <div class="query-section query-section--primary">
                <div class="query-grid">
                  <BaInput v-model="query.name" label="菜单名称" prop="name"></BaInput>
                  <BaSelect v-model="query.type" label="菜单类型" prop="type" isAll>
                    <el-option v-for="(value, key) in menuTypes" :key="key" :label="value" :value="key" />
                  </BaSelect>
                  <BaSelect v-model="query.isActive" label="是否启用" prop="isActive" isAll>
                    <el-option v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-option>
                  </BaSelect>
                </div>
              </div>
            </div>
          </template>

          <template #operation>
            <div class="menu-index-operation">
              <div class="menu-index-operation__left">
                <el-button v-if="canMenuAdd" type="primary" @click="openMenuDialog('add', formDefault)">新建</el-button>
              </div>
            </div>
          </template>

          <template #tableView>
            <el-table-column type="index" label="序号" width="70" />
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
                <el-button text @click="openMenuDialog('view', row)">查看</el-button>
                <el-button v-if="canMenuUpdate" text @click="canOperateProtectedMenu(row) ? openMenuDialog('edit', row) : $sdk.msgWarning('当前操作没有权限')">编辑</el-button>
                <el-button v-if="canMenuAdd" text @click="openMenuDialog('add', { parentId: row.id, ...formDefault })">新增</el-button>
                <el-button v-if="canMenuDelete" text @click="canOperateProtectedMenu(row) ? $refs.rctRef.del(del, row.id) : $sdk.msgWarning('当前操作没有权限')" :disabled="isAdmin(row) && !canManageProtectedMenu">删除</el-button>
              </template>
            </el-table-column>
          </template>
        </RequestChartTable>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加或修改菜单对话框 -->
    <BaDialog
      ref="dialogRef"
      :title="menuDialogTitle"
      :rules="rules"
      width="800"
      :show-footer="!isMenuDialogView"
        @confirm="(data) => { if (isMenuDialogView) { data.loading.value = false; return }; const form = data.form.value; const isEdit = !!form.id; if ((isEdit && !canMenuUpdate) || (!isEdit && !canMenuAdd)) { data.loading.value = false; return $sdk.msgWarning('当前操作没有权限') }; if (isAdmin(form) && !canManageProtectedMenu) { data.loading.value = false; return $sdk.msgWarning('当前操作没有权限') }; $refs.dialogRef.confirm(save, () => { $refs.rctRef?.getList?.(1); getTreesFun() }) }">
      <template #form="{ form }">
        <el-form-item class="width100" label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="trees"
            node-key="id"
            show-checkbox
            check-strictly="true"
            :props="{ label: 'name' }"
            :disabled="isMenuDialogView"
            placeholder="选择上级菜单" />
        </el-form-item>
        <BaInput v-model="form.name" label="菜单名称" prop="name" :disabled="isMenuDialogView" />
        <BaInput v-model="form.desc" label="菜单描述" prop="desc" :disabled="isMenuDialogView" />
        <BaRadioGroup v-model="form.type" label="菜单类型" prop="type" :disabled="isMenuDialogView">
          <el-radio v-for="(value, key) in menuTypes" :key="key" :label="value" :value="key" />
        </BaRadioGroup>
        <el-form-item v-if="form.type != 'button'" label="菜单图标">
          <el-popover placement="bottom-start" width="460" trigger="click" @show="$refs['iconSelect'].reset()">
            <IconSelect ref="iconSelect" @selected="(name) => (form.icon = name)" />
            <template #reference>
              <el-select v-model="form.icon" remote placeholder="点击选择图标" :disabled="isMenuDialogView" @clear="form.icon = '#'">
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
          <el-input-number v-model="form.order" :precision="0" :step="1" :min="0" :disabled="isMenuDialogView" />
        </el-form-item>
        <!-- <BaRadioGroup v-model="form.isFrame" v-if="form.type != 'button'" label="是否外链">
					<el-radio label="0">否</el-radio>
					<el-radio label="1">是</el-radio>
				</BaRadioGroup> -->
        <BaInput v-model="form.path" v-if="form.type != 'button'" label="路由地址" prop="path" required :disabled="isMenuDialogView" />
        <BaInput v-model="form.component" v-if="form.type == 'menu'" label="组件路径" prop="component" :disabled="isMenuDialogView" />
        <BaInput v-model="form.permissionKey" v-if="form.type != 'catalog'" label="权限标识" maxlength="50" :disabled="isMenuDialogView" />
        <BaRadioGroup v-model="form.isHidden" v-if="form.type != 'button'" label="是否隐藏" :disabled="isMenuDialogView">
          <el-radio v-for="(value, key) of yesOrNO" :key="key" :label="value" :value="key"></el-radio>
        </BaRadioGroup>
        <BaRadioGroup v-model="form.isActive" v-if="form.type != 'button'" label="是否启用" :disabled="isMenuDialogView">
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
.menu-index-page {
  min-height: 100%;
}

.menu-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.menu-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.menu-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.menu-index-panel :deep(.el-table__header-wrapper),
.menu-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.menu-manage-tabs :deep(.el-tabs__content) {
  padding-top: 8px;
}

.menu-workbench {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.menu-workbench__tree,
.menu-workbench__detail {
  padding: 18px;
}

.menu-workbench__tree {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.menu-workbench__detail {
  min-height: 0;
  position: sticky;
  top: 16px;
}

.menu-workbench__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.menu-workbench__header :deep(.el-button) {
  min-width: 88px;
  white-space: nowrap;
}

.menu-tree-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.menu-tree-toolbar :deep(.el-input) {
  flex: 1;
}

.menu-structure-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 6px 0;
}

.menu-structure-tree :deep(.el-tree-node__children) {
  position: relative;
  margin-left: 14px;
  padding-left: 14px;
}

.menu-structure-tree :deep(.el-tree-node__children::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 8px;
  width: 1px;
  background: var(--el-border-color-lighter);
}

.menu-structure-tree :deep(.el-tree-node.is-current > .el-tree-node__content .menu-tree-node) {
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.06) 100%);
  border-color: rgba(64, 158, 255, 0.28);
  box-shadow: 0 8px 18px rgba(64, 158, 255, 0.12);
}

.menu-structure-tree :deep(.el-tree-node.is-current > .el-tree-node__content .menu-tree-node__title) {
  color: var(--el-color-primary);
}

.menu-structure-tree {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 320px);
  overflow: auto;
  padding-right: 6px;
}

.menu-tree-node {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.menu-tree-node:hover {
  background: var(--el-fill-color-extra-light);
  border-color: var(--el-border-color-lighter);
}

.menu-tree-node__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-tree-node__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.menu-tree-node__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.menu-tree-node__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.menu-tree-node__badges :deep(.el-tag) {
  max-width: 100%;
}

.menu-tree-node__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
}

.menu-tree-node__actions :deep(svg) {
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.menu-tree-node__actions :deep(svg:hover) {
  background: rgba(64, 158, 255, 0.12);
  color: var(--el-color-primary);
  transform: translateY(-1px);
}

.menu-detail-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  white-space: nowrap;
}

.menu-detail-actions :deep(.el-button) {
  white-space: nowrap;
  min-width: max-content;
}

.menu-detail-actions :deep(.el-button > span) {
  white-space: nowrap;
}

.menu-detail-card {
  margin-top: 4px;
}

.panel-title,
.panel-subtitle {
  font-weight: 600;
  color: var(--FontBlack);
}

.panel-description {
  margin-top: 8px;
  color: var(--FontBlack2);
}

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

@media (max-width: 768px) {
  .menu-workbench {
    grid-template-columns: 1fr;
  }

  .menu-workbench__tree,
  .menu-workbench__detail,
  .menu-index-panel {
    padding-top: 18px;
  }

  .menu-workbench__tree,
  .menu-workbench__detail {
    padding: 16px;
  }

  .menu-workbench__header {
    flex-direction: column;
    align-items: stretch;
  }

  .menu-tree-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .menu-structure-tree {
    max-height: none;
  }

  .menu-workbench__detail {
    position: static;
  }

  .menu-index-operation,
  .menu-index-operation__left {
    align-items: stretch;
  }
}
</style>
