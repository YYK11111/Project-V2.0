<script setup>
import { ref } from 'vue'
import { Edit, Refresh, Delete } from '@element-plus/icons-vue'
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
  { key: 'view', label: '查看', onClick: () => rctRef.value.goRoute({ id: row.id, action: 'view' }, '/documentManage/form') },
  { key: 'edit', label: '修改', type: 'primary', disabled: !canDocumentUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/documentManage/form') },
  { key: 'upgrade', label: '升级版本', type: 'success', disabled: !canDocumentUpdate.value, onClick: () => handleUpgradeVersion(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canDocumentDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="文档名称" prop="name"></BaInput>
        <BaSelect v-model="query.type" filterable label="类型" prop="type">
          <el-option v-for="(value, key) of docType" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canDocumentAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/documentManage/form')">新增文档</el-button>
          <el-button v-if="canDocumentDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
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
.tableOperation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  
  :deep(.el-button) {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 13px;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
