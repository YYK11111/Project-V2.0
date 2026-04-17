<script setup lang="ts">
// @ts-nocheck
import { articleTagApi, getKnowledgeTypes, getList, getStatus, getVisibilityTypes, del, rebuildArticleChunks } from './api'
import { listRole } from '@/api/system/role'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'
const params = ref({})
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))
const canArticleDelete = computed(() => checkPermi(['business/articles/delete']))
const canArticleBorrowMy = computed(() => checkPermi(['business/articleBorrows/my']))
const canArticleBorrowPending = computed(() => checkPermi(['business/articleBorrows/pending']))
const canAiDebug = computed(() => checkPermi(['content/articles/aiDebug']))
const canAiOperate = computed(() => checkPermi(['content/articles/aiOperate']))
const activeTab = ref('articles')

const status = ref([])
getStatus().then(({ data }) => (status.value = data))
const knowledgeTypes = ref([])
getKnowledgeTypes().then(({ data }) => (knowledgeTypes.value = data))
const visibilityTypes = ref([])
getVisibilityTypes().then(({ data }) => (visibilityTypes.value = data))
const roles = ref([])
listRole({ pageNum: 1, pageSize: 1000 }).then((res: any) => (roles.value = res.data || []))
const tags = ref([])
function loadTags() {
  articleTagApi.getList({ pageNum: 1, pageSize: 1000 }).then(({ list = [] }: any) => (tags.value = list))
}
loadTags()
const tagDialogRef = ref()

function openTagDialog(data?: any) {
  tagDialogRef.value.visible = true
  tagDialogRef.value.form = data ? JSON.parse(JSON.stringify(data)) : { sort: 0 }
}

function submitTag({ form, visible, loading }) {
  articleTagApi
    .save(form.value)
    .then(() => {
      visible.value = false
      loadTags()
      $sdk.msgSuccess()
    })
    .finally(() => {
      loading.value = false
    })
}

function removeTag(item: any) {
  $sdk.confirm().then(() => {
    articleTagApi.del(item.id).then(() => {
      loadTags()
      $sdk.msgSuccess()
    })
  })
}

function rebuildChunks(row: any) {
  rebuildArticleChunks(row.id).then(() => {
    $sdk.msgSuccess('切片重建成功')
    rctRef.value?.getList?.()
  })
}

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
    catalogDialogRef.value.form = {
      parentId: data.id,
      managerUserIds: [],
      defaultVisibilityType: 'public',
      defaultVisibleRoleIds: [],
      defaultVisibleUserIds: [],
      allowBorrow: '0',
      borrowApprovalMode: 'catalogManager',
      maxBorrowDays: 7,
      needBorrowReason: '1',
    }
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
  <div class="knowledge-manage-page">
    <el-tabs v-model="activeTab" class="knowledge-manage-tabs">
      <el-tab-pane label="知识列表" name="articles">
        <RequestChartTable ref="rctRef" :isCreateRequest="false" :params="params" :request="getList">
        <template #query="{ query }">
          <BaInput v-model="query.keyword" label="关键词" prop="keyword"></BaInput>
          <BaSelect v-model="query.status" filterable label="状态" prop="status">
            <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
          <BaSelect v-model="query.knowledgeType" filterable label="知识类型" prop="knowledgeType">
            <el-option v-for="(value, key) of knowledgeTypes" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
          <BaSelect v-model="query.visibilityType" filterable label="可见范围" prop="visibilityType">
            <el-option v-for="(value, key) of visibilityTypes" :key="key" :label="value" :value="key"></el-option>
          </BaSelect>
          <BaFormItem label="标签" prop="tagIds">
            <el-select v-model="query.tagIds" multiple collapse-tags collapse-tags-tooltip filterable clearable placeholder="选择标签" style="width: 240px">
              <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id"></el-option>
            </el-select>
          </BaFormItem>
        </template>

        <template #operation="{ selectedIds }">
          <div class="flexBetween">
            <el-button @click="$router.push('/content/articleManage/home')">知识首页</el-button>
            <el-button v-if="canAiDebug" @click="$router.push('/content/articleManage/aiRetrieveDebug')">AI检索调试</el-button>
            <el-button v-if="canArticleAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/content/aev')">新增</el-button>
            <el-button v-if="canArticleBorrowMy" @click="$router.push('/content/articleManage/myBorrows')">我的借阅</el-button>
            <el-button v-if="canArticleBorrowPending" @click="$router.push('/content/articleManage/borrowApproval')">借阅审批</el-button>
            <el-button v-if="canArticleDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
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
          <el-table-column label="标题" prop="title" min-width="220" :show-overflow-tooltip="true">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push({ path: '/content/articleManage/detail', query: { id: row.id } })">{{ row.title }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="分类" prop="catalog.name" width="140">
            <template #default="{ row }">{{ row.catalog?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="知识类型" prop="knowledgeType" width="140">
            <template #default="{ row }">{{ knowledgeTypes[row.knowledgeType] || '-' }}</template>
          </el-table-column>
          <el-table-column label="标签" min-width="180">
            <template #default="{ row }">
              <div class="article-tag-list">
                <el-tag v-for="item in row.tags || []" :key="item.id" size="small">{{ item.name }}</el-tag>
                <span v-if="!(row.tags || []).length">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="摘要" prop="summary" min-width="220" :show-overflow-tooltip="true">
            <template #default="{ row }">{{ row.hasAccess === false ? '当前知识受限，暂无查看权限' : row.summary || row.desc || '-' }}</template>
          </el-table-column>
          <el-table-column label="作者" width="140">
            <template #default="{ row }">{{ row.author?.nickname || row.author?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="维护人" width="140">
            <template #default="{ row }">{{ row.maintainer?.nickname || row.maintainer?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="可见范围" prop="visibilityType" width="120">
            <template #default="{ row }">{{ visibilityTypes[row.visibilityType] || '-' }}</template>
          </el-table-column>
          <el-table-column label="切片数" width="90">
            <template #default="{ row }">{{ row.contentChunks?.length || 0 }}</template>
          </el-table-column>
          <el-table-column label="向量状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.embeddingStatus === 'ready' ? 'success' : row.embeddingStatus === 'failed' ? 'danger' : 'warning'" size="small">
                {{ row.embeddingStatus || 'pending' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="canAiOperate" label="AI优先" width="90">
            <template #default="{ row }">
              <el-tag :type="row.aiPreferred === '1' ? 'success' : 'info'" size="small">{{ row.aiPreferred === '1' ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="canAiOperate" label="权威知识" width="90">
            <template #default="{ row }">
              <el-tag :type="row.authorityLevel === '1' ? 'warning' : 'info'" size="small">{{ row.authorityLevel === '1' ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="canAiOperate" label="检索权重" width="100" prop="retrievalWeight" />
          <el-table-column label="访问状态" width="140">
            <template #default="{ row }">
              <el-tag v-if="row.hasAccess === false" type="warning" size="small">受限</el-tag>
              <el-tag v-else type="success" size="small">可访问</el-tag>
              <el-tag v-if="row.canBorrow" class="ml4" type="info" size="small">可借阅</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="100">
            <template #default="{ row }">
              {{ status[row.status] }}
            </template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updateTime" width="180" />
          <el-table-column label="发布时间" prop="publishTime" width="180" />
        </template>
        <template #tableOperation="{ row }">
          <TbOpBtn icon="view" @click="$router.push({ path: '/content/articleManage/detail', query: { id: row.id } })">详情</TbOpBtn>
          <TbOpBtn v-if="checkPermi(['business/articles/update'])" icon="edit" @click="$refs.rctRef.goRoute(row.id, '/content/aev')">修改</TbOpBtn>
          <TbOpBtn v-if="canAiOperate" icon="refresh" @click="rebuildChunks(row)">重建切片</TbOpBtn>
          <TbOpBtn v-if="checkPermi(['business/articles/delete'])" icon="delete" @click="$refs.rctRef.del(del, row.id)">删除</TbOpBtn>
        </template>
        </RequestChartTable>
      </el-tab-pane>

      <el-tab-pane label="分类治理" name="catalogs">
        <div class="Gcard" v-loading="catalog.loading">
          <div class="title mb20">
            <div class="title-name">分类治理</div>
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
            @node-click="(data) => (params.catalogId = data.id)">
            <template #default="{ node, data }">
              <div class="flexBetween flexAuto">
                <div>{{ node.label }}</div>
                <div>
                  <el-icon-plus class="hoverColor" @click.stop="catalog.add(data)" title="新增"></el-icon-plus>
                  <el-icon-EditPen class="hoverColor" @click.stop="catalog.edit(data)" title="编辑"></el-icon-EditPen>
                  <el-icon-delete class="hoverColor" @click.stop="catalog.del(data, node)" title="删除"></el-icon-delete>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>

      <el-tab-pane label="标签治理" name="tags">
        <div class="Gcard">
          <div class="title mb20">
            <div class="title-name">标签治理</div>
            <span @click="openTagDialog()" class="hoverColor pointer">
              <el-icon-plus class="el-icon-plus"></el-icon-plus>
              新增
            </span>
          </div>
          <div class="tag-panel">
            <div v-for="item in tags" :key="item.id" class="tag-panel__item">
              <el-tag :color="item.color || undefined" :style="item.color ? { color: '#fff', borderColor: item.color } : undefined">{{ item.name }}</el-tag>
              <div class="tag-panel__actions">
                <el-icon-edit-pen class="hoverColor" @click="openTagDialog(item)" />
                <el-icon-delete class="hoverColor" @click="removeTag(item)" />
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

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
        <BaFormItem label="分类管理员">
          <UserSelect v-model="form.managerUserIds" placeholder="请选择分类管理员" clearable multiple />
        </BaFormItem>
        <BaSelect v-model="form.defaultVisibilityType" prop="defaultVisibilityType" label="默认可见范围">
          <el-option v-for="(value, key) of visibilityTypes" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaFormItem v-if="form.defaultVisibilityType === 'role'" label="默认可见角色">
          <el-select v-model="form.defaultVisibleRoleIds" multiple filterable clearable collapse-tags collapse-tags-tooltip placeholder="选择角色" style="width: 100%">
            <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="String(item.id)" />
          </el-select>
        </BaFormItem>
        <BaFormItem v-if="form.defaultVisibilityType === 'specified'" label="默认可见人员">
          <UserSelect v-model="form.defaultVisibleUserIds" placeholder="请选择用户" clearable multiple />
        </BaFormItem>
        <el-form-item label="允许借阅">
          <el-switch v-model="form.allowBorrow" active-value="1" inactive-value="0" />
        </el-form-item>
        <BaInputNumber v-model="form.maxBorrowDays" :precision="0" :step="1" :min="1" prop="maxBorrowDays" label="最大借阅天数" />
        <el-form-item label="借阅理由必填">
          <el-switch v-model="form.needBorrowReason" active-value="1" inactive-value="0" />
        </el-form-item>
      </template>
    </BaDialog>

    <BaDialog ref="tagDialogRef" dynamicTitle="标签管理" width="500" @confirm="submitTag">
      <template #form="{ form }">
        <BaInput v-model="form.name" prop="name" label="标签名称" required></BaInput>
        <BaInput v-model="form.color" prop="color" label="颜色"></BaInput>
        <BaInputNumber v-model="form.sort" :precision="0" :step="1" :min="0" prop="sort" label="排序" />
        <BaInput v-model="form.remark" prop="remark" label="备注"></BaInput>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-manage-tabs :deep(.el-tabs__content) {
  padding-top: 8px;
}

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

.mt20 {
  margin-top: 20px;
}

.tag-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tag-panel__actions {
  display: flex;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.ml4 {
  margin-left: 4px;
}
</style>
