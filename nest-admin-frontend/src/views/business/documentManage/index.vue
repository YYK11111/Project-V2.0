<script setup>
import { ref } from 'vue'
import { getList, getType, del, upgradeVersion } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const docType = ref({})
getType().then(({ data }) => (docType.value = data))

const rctRef = ref()
const canDocumentAdd = computed(() => checkPermi(['business/documents/add']))
const canDocumentUpdate = computed(() => checkPermi(['business/documents/update']))
const canDocumentDelete = computed(() => checkPermi(['business/documents/delete']))

function handleUpgradeVersion(row) {
  if (!canDocumentUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm(`确定要将 "${row.name}" 升级到新版本吗？`).then(() => {
    upgradeVersion(row.id).then(() => {
      $sdk.msgSuccess('版本升级成功')
      rctRef.value.getList()
    })
  })
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/documentManage/form') },
  canDocumentUpdate.value ? { key: 'edit', label: '修改', type: 'primary', onClick: () => rctRef.value.goRoute(row.id, '/documentManage/form') } : null,
  canDocumentUpdate.value ? { key: 'upgrade', label: '升级版本', type: 'success', onClick: () => handleUpgradeVersion(row) } : null,
  canDocumentDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="document-index-page">
    <RequestChartTable ref="rctRef" class="document-index-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="文档名称" prop="name"></BaInput>
        <BaSelect v-model="query.type" filterable label="类型" prop="type">
          <el-option v-for="(value, key) of docType" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="document-index-operation">
          <div class="document-index-operation__left">
            <el-button v-if="canDocumentAdd" type="primary" @click="rctRef.goRoute(null, '/documentManage/form')">新增项目文档</el-button>
          </div>
          <el-button v-if="canDocumentDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="文档名称" prop="name" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="类型" prop="type" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '1' ? 'primary' : 'success'" size="small">
              {{ docType[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="版本号" prop="version" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">v{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上传人" prop="uploader.nickname" width="100" />
        <el-table-column label="文件大小" prop="fileSize" width="100">
          <template #default="{ row }">
            {{ row.fileSize ? `${row.fileSize} KB` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style lang="scss" scoped>
.document-index-page {
  min-height: 100%;
}

.document-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.document-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.document-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.document-index-panel :deep(.el-table__header-wrapper),
.document-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

@media (max-width: 768px) {
  .document-index-panel {
    padding-top: 18px;
  }

  .document-index-operation,
  .document-index-operation__left {
    align-items: stretch;
  }
}
</style>
