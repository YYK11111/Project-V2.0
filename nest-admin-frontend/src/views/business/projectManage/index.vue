<script setup>
import { ref } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { getList, getStatus, getPriority, getProjectType, del, archive, recalculateProgress } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})
const status = ref({})
const priority = ref({})
const projectType = ref({})

getStatus().then(({ data }) => (status.value = data))
getPriority().then(({ data }) => (priority.value = data))
getProjectType().then(({ data }) => (projectType.value = data))

const rctRef = ref()
const canProjectAdd = computed(() => checkPermi(['business/projects/add']))
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))
const canProjectDelete = computed(() => checkPermi(['business/projects/delete']))
const canProjectArchive = computed(() => checkPermi(['business/projects/archive']))
const canProjectSubmitApproval = computed(() => checkPermi(['business/projects/submitApproval']))
const recalculatingProgress = ref(false)

function canEditProject(row) {
  return canProjectUpdate.value && String(row.status || '') !== '3'
}

function canEnterApprovalPage(row) {
  return canProjectSubmitApproval.value && (
    String(row.status || '') === '1'
    || ['1', '3'].includes(String(row.approvalStatus || '0'))
  )
}

function handleArchive(row) {
  if (!canProjectArchive.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm('确定要归档该项目吗？').then(() => {
    archive(row.id).then(() => {
      $sdk.msgSuccess('归档成功')
      rctRef.value.getList()
    })
  })
}

function handleRecalculateAllProgress() {
  if (!canProjectUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm('确定要重算全部项目进度吗？系统会按项目下已完成任务数 / 总任务数重新计算。').then(() => {
    recalculatingProgress.value = true
    recalculateProgress().then((res) => {
      const total = Number(res?.data?.total || res?.total || 0)
      $sdk.msgSuccess(`已完成 ${total} 个项目的进度重算`)
      rctRef.value.getList()
    }).finally(() => {
      recalculatingProgress.value = false
    })
  })
}

const getButtons = (row) => [
  { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id }, '/projectManage/detail') },
  canEditProject(row) ? { key: 'edit', label: '修改', onClick: () => rctRef.value.goRoute(row.id, '/projectManage/form') } : null,
  canEnterApprovalPage(row) ? { key: 'approval', label: '立项审批', onClick: () => rctRef.value.goRoute({ id: row.id }, '/projectManage/approval') } : null,
  canProjectArchive.value ? { key: 'archive', label: '归档', type: 'success', onClick: () => handleArchive(row) } : null,
  canProjectDelete.value ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.name" label="项目名称" prop="name" />
        <BaSelect v-model="query.status" filterable label="状态" prop="status">
          <el-option v-for="(value, key) in status" :key="key" :label="value" :value="key" />
        </BaSelect>
        <BaSelect v-model="query.priority" filterable label="优先级" prop="priority">
          <el-option v-for="(value, key) in priority" :key="key" :label="value" :value="key" />
        </BaSelect>
        <BaSelect v-model="query.projectType" filterable label="项目类型" prop="projectType">
          <el-option v-for="(value, key) in projectType" :key="key" :label="value" :value="key" />
        </BaSelect>
        <BaSelect v-model="query.isArchived" filterable label="是否归档" prop="isArchived">
          <el-option label="未归档" value="0" />
          <el-option label="已归档" value="1" />
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <div class="operation-left">
            <el-button v-if="canProjectAdd" type="primary" @click="rctRef.goRoute(null, '/projectManage/form')">新增项目</el-button>
            <el-button v-if="canProjectUpdate" :loading="recalculatingProgress" @click="handleRecalculateAllProgress">重算全部进度</el-button>
          </div>
          <el-button v-if="canProjectDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="项目名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="项目编号" prop="code" width="150" />
        <el-table-column label="负责人" prop="leader.nickname" width="100" />
        <el-table-column label="项目类型" prop="projectType" width="140">
          <template #default="{ row }">
            {{ projectType[row.projectType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" prop="startDate" width="120" />
        <el-table-column label="结束时间" prop="endDate" width="120" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '6' ? 'success' : row.status === '3' ? 'primary' : row.status === '2' || row.status === '5' ? 'warning' : row.status === '7' ? 'danger' : 'info'">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="140">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small">
              {{ row.approvalStatus === '3' && String(row.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : ({ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row.approvalStatus] || '无需审批') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="优先级" prop="priority" width="100">
          <template #default="{ row }">
            <el-tag :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" size="small">
              {{ priority[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" width="120">
          <template #header>
            <span class="progress-column-label">
              进度
              <el-tooltip content="按项目下已完成任务数 / 总任务数自动计算" placement="top">
                <el-icon class="progress-column-label__tip"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="是否归档" prop="isArchived" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isArchived === '1' ? 'success' : 'info'" size="small">
              {{ row.isArchived === '1' ? '已归档' : '未归档' }}
            </el-tag>
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>
  </div>
</template>

<style scoped>
.operation-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.progress-column-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.progress-column-label__tip {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  cursor: help;
}
</style>
