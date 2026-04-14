<script setup lang="ts">
// @ts-nocheck
import { getList, getStatus, del } from './api'
const params = ref({})

const status = ref([])
getStatus().then(({ data }) => (status.value = data))

/** -- 分类目录 模块 -- */
import * as apiCatalog from './api.catalog'
const rctRef = ref()
const catalogDialogRef = ref()
function useCatalog(rctRef, catalogDialogRef, params) {
  const treeData = ref([])
  const loading = ref(false)

  function getTrees() {
    loading.value = true
    apiCatalog
      .getTrees()
      .then(({ data }: any) => {
        treeData.value = data
        setTimeout(() => {
          params.value.catalogId = data[0]?.id
          rctRef.value.getList()
        }, 0)
      })
      .finally(() => (loading.value = false))
  }

  function add(data) {
    catalogDialogRef.value.visible = true
    catalogDialogRef.value.form = { parentId: data.id }
  }
  function edit(data) {
    catalogDialogRef.value.visible = true
    catalogDialogRef.value.form = JSON.parse(JSON.stringify(data))
  }
  function del(data, node) {
    $sdk.confirm().then(() => {
      loading.value = true
      apiCatalog
        .del(data.id)
        .then(() => {
          node.remove()
          $sdk.msgSuccess()
        })
        .finally(() => (loading.value = false))
    })
  }

  function submit({ form, visible, loading: dialogLoading }) {
    loading.value = true
    apiCatalog
      .save(form.value)
      .then(() => {
        getTrees()
        $sdk.msgSuccess()
        visible.value = false
      })
      .finally(() => (loading.value = false), (dialogLoading.value = false))
  }

  return { treeData, loading, getTrees, add, edit, del, submit }
}
const catalog = reactive(useCatalog(rctRef, catalogDialogRef, params))
catalog.getTrees()
/** -- 分类目录 模块 -- */
</script>

<template>
  <div class="GleftRight">
    <div class="GleftRightL Gcard" v-loading="catalog.loading">
      <div class="title mb20">
        <div class="title-name">分类</div>
        <span @click="catalog.add({ id: '0' })" class="hoverColor pointer">
          <el-icon-plus class="el-icon-plus"></el-icon-plus>
          新增
        </span>
      </div>
      <el-tree
        node-key="id"
        :current-node-key="params.catalogId"
        highlight-current
        :data="catalog.treeData"
        :props="{ label: 'name' }"
        :expand-on-click-node="false"
        :default-expand-all="true"
        @node-click="(data) => ((params.catalogId = data.id), rctRef.getList(1))">
        <template #default="{ node, data }">
          <div class="flexBetween flexAuto">
            <div>
              <!-- <el-icon-folder-opened class="el-icon-folder-opened" style="color: var(--color)" /> -->
              {{ node.label }}
            </div>
            <div>
              <el-icon-plus class="hoverColor" @click.stop="catalog.add(data)" title="新增"></el-icon-plus>
              <el-icon-EditPen class="hoverColor" @click.stop="catalog.edit(data)" title="编辑"></el-icon-EditPen>
              <el-icon-delete class="hoverColor" @click.stop="catalog.del(data, node)" title="删除"></el-icon-delete>
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

      <!-- 分类目录 dialog -->
      <BaDialog ref="catalogDialogRef" dynamicTitle="分类目录" width="500" @confirm="(v) => catalog.submit(v)">
        <template #form="{ form }">
          <BaFormItem prop="parentId" class="width100" label="上级" required>
            <el-tree-select
              v-model="form.parentId"
              :data="[{ id: '0', name: '主类目', children: catalog.treeData }]"
              node-key="id"
              show-checkbox
              check-strictly="true"
              :props="{ label: 'name' }"
              placeholder="选择上级" />
          </BaFormItem>
          <BaInput v-model="form.name" prop="name" label="名称" required></BaInput>
        </template>
      </BaDialog>
    </div>

    <div class="GleftRightR">
      <RequestChartTable ref="rctRef" :isCreateRequest="false" :params="params" :request="getList">
        <template #query="{ query }">
          <BaInput v-model="query.title" label="标题" prop="title"></BaInput>
          <BaSelect v-model="query.status" filterable label="状态" prop="status">
            <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
        </template>

        <template #operation="{ selectedIds }">
          <div class="flexBetween">
            <el-button type="primary" @click="$refs.rctRef.goRoute()">新增</el-button>
            <el-button :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
          </div>
        </template>

        <template #table>
          <el-table-column label="封面" prop="thumb">
            <template #default="{ row }">
              <el-popover v-if="row.thumb" placement="bottom" trigger="hover" show-after="200">
                <template #reference><el-image :src="row.thumb" style="width: 50px"></el-image></template>
                <el-image :src="row.thumb" style="width: 200px"></el-image>
              </el-popover>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="标题" prop="title" :show-overflow-tooltip="true" />
          <el-table-column label="描述" prop="desc" />
          <el-table-column label="状态" prop="status">
            <template #default="{ row }">
              {{ status[row.status] }}
            </template>
          </el-table-column>
        </template>
        <template #tableOperation="{ row }">
          <TbOpBtn icon="edit" @click="$refs.rctRef.goRoute(row.id)">修改</TbOpBtn>
          <TbOpBtn icon="delete" @click="$refs.rctRef.del(del, row.id)">删除</TbOpBtn>
        </template>
      </RequestChartTable>
    </div>
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
