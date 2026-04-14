<script setup>
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, getType, getStatus, del } from './api'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const type = ref({})
getType().then(({ data }) => (type.value = data))

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const rctRef = ref()
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))
const canTicketDelete = computed(() => checkPermi(['business/tickets/delete']))
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.title" label="工单标题" prop="title"></BaInput>
        <BaSelect v-model="query.type" filterable label="类型" prop="type">
          <el-option v-for="(value, key) of type" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaSelect v-model="query.status" filterable label="状态" prop="status">
          <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canTicketAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/ticketManage/form')">新增工单</el-button>
          <el-button v-if="canTicketDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="工单标题" prop="title" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="类型" prop="type" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '1' ? 'danger' : row.type === '2' ? 'primary' : 'info'" size="small">
              {{ type[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" prop="submitter.nickname" width="100" />
        <el-table-column label="处理人" prop="handler.nickname" width="100" />
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'info'" 
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" />
      </template>

      <template #tableOperation="{ row }">
        <div class="tableOperation">
          <el-tooltip content="修改" placement="top">
            <el-button 
              link 
              type="primary" 
              :icon="Edit" 
              size="small" 
              circle
              :disabled="!canTicketUpdate"
              @click="canTicketUpdate && $refs.rctRef.goRoute(row.id, '/ticketManage/form')"
            />
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button 
              link 
              type="danger" 
              :icon="Delete" 
              size="small" 
              circle
              :disabled="!canTicketDelete"
              @click="canTicketDelete && $refs.rctRef.del(del, row.id)"
            />
          </el-tooltip>
        </div>
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
