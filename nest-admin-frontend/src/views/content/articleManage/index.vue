<script setup lang="ts">
// @ts-nocheck
import { articleTagApi, getKnowledgeTypes, getList, getStatus, getVisibilityTypes, del, rebuildArticleChunks, rebuildArticleEmbeddings } from './api'
import { listRole } from '@/api/system/role'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'
import { sourceTypeMap, templateTypeMap } from '@/views/business/projectManage/fieldMaps'
import { downloadCsv } from '@/utils/csv'
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

function rebuildEmbeddings(row: any) {
  rebuildArticleEmbeddings(row.id).then(() => {
    $sdk.msgSuccess('向量重建成功')
    rctRef.value?.getList?.()
  })
}

function exportArticleList() {
  const rows = [
    ['标题', '分类', '知识类型', '来源类型', '来源项目ID', '来源对象ID', '模板类型', '作者', '维护人', '状态', '更新时间'],
    ...((rctRef.value?.data || []).map((row: any) => [
      row.title || '-',
      row.catalog?.name || '-',
      knowledgeTypes.value[row.knowledgeType] || '-',
      sourceTypeMap[row.sourceType] || row.sourceType || '-',
      row.sourceProjectId || '-',
      row.sourceId || '-',
      templateTypeMap[row.templateType] || row.templateType || '-',
      row.author?.nickname || row.author?.name || '-',
      row.maintainer?.nickname || row.maintainer?.name || '-',
      status.value[row.status] || '-',
      row.updateTime || '-',
    ])),
  ]
  downloadCsv('知识列表导出.csv', rows)
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
  <div class="knowledge-manage-page km-page">
    <div class="knowledge-manage-hero Gcard km-hero">
      <div class="knowledge-manage-hero__eyebrow km-hero__eyebrow">知识治理</div>
      <div class="knowledge-manage-hero__title km-hero__title">统一维护知识条目、分类目录与标签体系</div>
      <div class="knowledge-manage-hero__desc km-hero__desc">在同一个后台完成知识沉淀、分类治理、标签维护和 AI 检索能力运营，保证内容结构清晰、权限可控、检索质量稳定。</div>
    </div>

    <el-tabs v-model="activeTab" class="knowledge-manage-tabs">
      <el-tab-pane label="知识列表" name="articles">
        <RequestChartTable ref="rctRef" class="knowledge-article-table-panel" :isCreateRequest="false" :params="params" :request="getList" :is-selection="true">
        <template #query="{ query }">
          <div class="query-sections">
            <div class="query-section query-section--primary">
              <div class="query-grid">
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
                <BaSelect v-model="query.sourceType" filterable label="来源类型" prop="sourceType">
                  <el-option v-for="(label, key) in sourceTypeMap" :key="key" :label="label" :value="key"></el-option>
                </BaSelect>
                <BaInput v-model="query.sourceProjectId" label="来源项目ID" prop="sourceProjectId"></BaInput>
                <BaSelect v-model="query.templateType" filterable label="模板类型" prop="templateType">
                  <el-option v-for="(label, key) in templateTypeMap" :key="key" :label="label" :value="key"></el-option>
                </BaSelect>
                <BaFormItem label="标签" prop="tagIds">
                  <el-select v-model="query.tagIds" multiple collapse-tags collapse-tags-tooltip filterable clearable placeholder="选择标签">
                    <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id"></el-option>
                  </el-select>
                </BaFormItem>
              </div>
            </div>
          </div>
        </template>

        <template #operation="{ selectedIds }">
          <div class="knowledge-manage-actions">
            <el-button @click="$router.push('/content/articleManage/home')">知识首页</el-button>
            <el-button v-if="canAiDebug" @click="$router.push('/content/articleManage/aiRetrieveDebug')">AI检索调试</el-button>
            <el-button @click="exportArticleList">导出</el-button>
            <el-button v-if="canArticleAdd" type="primary" @click="rctRef.goRoute(null, '/content/aev')">新增</el-button>
            <el-button v-if="canArticleBorrowMy" @click="$router.push('/content/articleManage/myBorrows')">我的借阅</el-button>
            <el-button v-if="canArticleBorrowPending" @click="$router.push('/content/articleManage/borrowApproval')">借阅审批</el-button>
            <el-button v-if="canArticleDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
          </div>
        </template>

        <template #table>
          <el-table-column type="index" label="序号" width="70" />
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
              <el-button link type="primary" @click="$router.push({ path: '/content/articleManage/view', query: { id: row.id } })">{{ row.title }}</el-button>
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
          <el-table-column label="来源类型" width="120">
            <template #default="{ row }">{{ sourceTypeMap[row.sourceType] || row.sourceType || '-' }}</template>
          </el-table-column>
          <el-table-column label="来源项目" prop="sourceProjectId" width="120" />
          <el-table-column label="模板类型" width="120">
            <template #default="{ row }">{{ templateTypeMap[row.templateType] || row.templateType || '-' }}</template>
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
          <el-table-column label="首页推荐" width="180">
            <template #default="{ row }">
              <div class="article-top-meta">
                <el-tag :type="row.isTop === '1' ? 'danger' : 'info'" size="small">{{ row.isTop === '1' ? '置顶' : '普通' }}</el-tag>
                <span class="article-top-meta__text">排序 {{ row.topSort || 0 }}</span>
              </div>
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
          <TbOpBtn v-if="checkPermi(['business/articles/update']) && row.canEdit !== false" icon="edit" @click="rctRef.goRoute(row.id, '/content/aev')">修改</TbOpBtn>
          <TbOpBtn v-if="canAiOperate" icon="refresh" @click="rebuildChunks(row)">重建切片</TbOpBtn>
          <TbOpBtn v-if="canAiOperate" icon="refresh" @click="rebuildEmbeddings(row)">重建向量</TbOpBtn>
          <TbOpBtn v-if="checkPermi(['business/articles/delete']) && row.canDelete !== false" icon="delete" @click="rctRef.del(del, row.id)">删除</TbOpBtn>
        </template>
        </RequestChartTable>
      </el-tab-pane>

      <el-tab-pane label="分类治理" name="catalogs">
        <div class="knowledge-panel Gcard km-panel" v-loading="catalog.loading">
          <div class="knowledge-panel__header km-panel__header">
            <div>
              <div class="knowledge-panel__title km-panel__title">分类治理</div>
              <div class="knowledge-panel__desc km-panel__desc">维护知识目录结构、分类管理员和默认可见范围。</div>
            </div>
            <el-button type="primary" plain @click="catalog.add({ id: '0' })">
              <el-icon-plus class="mr6"></el-icon-plus>
              新增分类
            </el-button>
          </div>
          <el-tree
            class="knowledge-catalog-tree"
            node-key="id"
            :current-node-key="params.catalogId"
            highlight-current
            :data="catalog.treeData"
            :props="{ label: 'name' }"
            :expand-on-click-node="false"
            :default-expand-all="true"
            @node-click="(data) => (params.catalogId = data.id)">
            <template #default="{ node, data }">
              <div class="knowledge-catalog-tree__node">
                <div class="knowledge-catalog-tree__label">{{ node.label }}</div>
                <div class="knowledge-catalog-tree__actions">
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
        <div class="knowledge-panel Gcard km-panel">
          <div class="knowledge-panel__header km-panel__header">
            <div>
              <div class="knowledge-panel__title km-panel__title">标签治理</div>
              <div class="knowledge-panel__desc km-panel__desc">收敛高频主题标签，避免语义重复与命名混乱。</div>
            </div>
            <el-button type="primary" plain @click="openTagDialog()">
              <el-icon-plus class="mr6"></el-icon-plus>
              新增标签
            </el-button>
          </div>
          <div class="tag-panel">
            <div v-for="item in tags" :key="item.id" class="tag-panel__item">
              <div class="tag-panel__main">
                <el-tag :color="item.color || undefined" :style="item.color ? { color: '#fff', borderColor: item.color } : undefined">{{ item.name }}</el-tag>
                <span v-if="item.remark" class="tag-panel__remark">{{ item.remark }}</span>
              </div>
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
.knowledge-manage-tabs :deep(.el-tabs__content) {
  padding-top: 8px;
}

.knowledge-manage-tabs :deep(.el-tabs__item) {
  height: 40px;
}

.knowledge-manage-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.knowledge-article-table-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
}

.query-grid :deep(.el-form-item) {
  display: flex;
  width: 100%;
  margin-bottom: 0;
}

.query-grid :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.query-grid :deep(.el-select),
.query-grid :deep(.el-input),
.query-grid :deep(.el-date-editor) {
  width: 100%;
  flex: 1;
}

.knowledge-article-table-panel :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.knowledge-article-table-panel :deep(.el-table__header-wrapper),
.knowledge-article-table-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  gap: 12px;
}

.tag-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.tag-panel__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-panel__remark {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.tag-panel__actions {
  display: flex;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.article-top-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-top-meta__text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-catalog-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 6px 0;
}

.knowledge-catalog-tree__node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.knowledge-catalog-tree__node:hover {
  background: var(--el-fill-color-extra-light);
  border-color: var(--el-border-color-lighter);
}

.knowledge-catalog-tree__label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.knowledge-catalog-tree__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
}

.mr6 {
  margin-right: 6px;
}

.ml4 {
  margin-left: 4px;
}

@media (max-width: 768px) {
  .knowledge-article-table-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .knowledge-panel__header,
  .tag-panel__item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
