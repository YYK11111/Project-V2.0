<script setup>
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { getList, getStatus, getPriority, del, updateProgress, submitApproval } from './api'
import { checkPermi } from '@/utils/permission'

const params = ref({})

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const priority = ref({})
getPriority().then(({ data }) => (priority.value = data))

const rctRef = ref()
const canTaskAdd = computed(() => checkPermi(['business/tasks/add']))
const canTaskUpdate = computed(() => checkPermi(['business/tasks/update']))
const canTaskDelete = computed(() => checkPermi(['business/tasks/delete']))
const canTaskUpdateProgress = computed(() => checkPermi(['business/tasks/updateProgress']))
const canTaskSubmitApproval = computed(() => checkPermi(['business/tasks/update']))

function handleProgressChange(row) {
  if (!canTaskUpdateProgress.value) return $sdk.msgWarning('当前操作没有权限')
  updateProgress(row.id, row.progress).then(() => {
    $sdk.msgSuccess('进度更新成功')
  })
}

async function handleSubmitApproval(row) {
  if (!canTaskSubmitApproval.value) return $sdk.msgWarning('当前操作没有权限')
  await $sdk.confirm('确定提交该任务审批吗？')
  await submitApproval(row.id)
  $sdk.msgSuccess('提交审批成功')
  rctRef.value?.getList()
}
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="任务名称" prop="name"></BaInput>
        <BaSelect v-model="query.status" filterable label="状态" prop="status">
          <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
        <BaSelect v-model="query.priority" filterable label="优先级" prop="priority">
          <el-option v-for="(value, key) of priority" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canTaskAdd" type="primary" @click="$refs.rctRef.goRoute(null, '/taskManage/form')">新增任务</el-button>
          <el-button v-if="canTaskDelete" :disabled="!selectedIds.length" @click="$refs.rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="任务名称" prop="name" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="任务编号" prop="code" width="120" />
        <el-table-column label="负责人" prop="leader.nickname" width="100" />
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="开始时间" prop="startDate" width="120" />
        <el-table-column label="截止时间" prop="endDate" width="120" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '3' ? 'success' : row.status === '2' ? 'primary' : 'info'"
              size="small">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="110">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ { '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已拒绝' }[row.approvalStatus] || '无需审批' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="优先级" prop="priority" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" 
              size="small">
              {{ priority[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="180">
          <template #default="{ row }">
            <el-slider
              v-model="row.progress"
              :max="100"
              :step="5"
              :disabled="!canTaskUpdateProgress"
              style="width: 150px"
              @change="handleProgressChange(row)" />
          </template>
        </el-table-column>
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
              :disabled="!canTaskUpdate"
              @click="canTaskUpdate && $refs.rctRef.goRoute(row.id, '/taskManage/form')"
            />
          </el-tooltip>
          <el-tooltip content="提交审批" placement="top">
            <el-button
              link
              type="warning"
              size="small"
              circle
              :disabled="!canTaskSubmitApproval || row.status !== '1' || row.approvalStatus === '1'"
              @click="canTaskSubmitApproval && handleSubmitApproval(row)"
            >审</el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button 
              link 
              type="danger" 
              :icon="Delete" 
              size="small" 
              circle
              :disabled="!canTaskDelete"
              @click="canTaskDelete && $refs.rctRef.del(del, row.id)"
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
