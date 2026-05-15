<script setup>
import { ref } from 'vue'
import { QuestionFilled, CaretBottom } from '@element-plus/icons-vue'
import { getList, getStatus, getPriority, getProjectType, del, archive, recalculateProgress } from './api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import TableOperation from '@/components/TableOperation.vue'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'
import { phaseMap, qualityLevelMap, riskLevelMap } from './fieldMaps'

const params = ref({})
const status = ref({})
const priority = ref({})
const projectType = ref({})
const deptMap = ref({})

getStatus().then(({ data }) => (status.value = data))
getPriority().then(({ data }) => (priority.value = data))
getProjectType().then(({ data }) => (projectType.value = data))
getDeptTrees({}).then((res) => {
  const map = {}
  const walk = (nodes = []) => {
    nodes.forEach((item) => {
      map[item.id] = item.name
      if (item.children?.length) walk(item.children)
    })
  }
  walk(res.data || [])
  deptMap.value = map
})

const rctRef = ref()
const canProjectAdd = computed(() => checkPermi(['business/projects/add']))
const showAdvanced = ref(false)
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))
const canProjectDelete = computed(() => checkPermi(['business/projects/delete']))
const canProjectArchive = computed(() => checkPermi(['business/projects/archive']))
const recalculatingProgress = ref(false)

function getProjectApprovalText(row) {
  if (row?.approvalStatus === '0') return '未提交审批'
  const hasApprovalStarted = Boolean(row?.workflowInstanceId) || !['', '0', undefined, null].includes(row?.approvalStatus)
  if (!hasApprovalStarted) return '-'
  if (row?.approvalStatus === '3' && String(row?.currentNodeName || '').includes('退回发起人')) return '已退回发起人'
  return ({ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[row?.approvalStatus] || '-')
}

function canEditProject(row) {
  return canProjectUpdate.value && row.permissionContext?.canEdit !== false && String(row.status || '') === '1'
}

function isProjectInitiationStage(row) {
  return ['1', '2'].includes(String(row.status || ''))
}

function canViewProjectDetail(row) {
  return row.permissionContext?.canView !== false && !isProjectInitiationStage(row)
}

function canEnterApprovalPage(row) {
  return row.permissionContext?.canView !== false && isProjectInitiationStage(row)
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
  canViewProjectDetail(row) ? { key: 'view', label: '详情', onClick: () => rctRef.value.goRoute({ id: row.id }, '/projectManage/detail') } : null,
  canEditProject(row) ? { key: 'edit', label: '编辑', onClick: () => rctRef.value.goRoute(row.id, '/projectManage/form') } : null,
  canEnterApprovalPage(row) ? { key: 'approval', label: '立项信息', onClick: () => rctRef.value.goRoute({ id: row.id }, '/projectManage/approval') } : null,
  canProjectArchive.value && row.permissionContext?.canArchive !== false ? { key: 'archive', label: '归档', type: 'success', onClick: () => handleArchive(row) } : null,
  canProjectDelete.value && row.permissionContext?.canDelete !== false ? { key: 'delete', label: '删除', danger: true, onClick: () => rctRef.value.del(del, row.id) } : null,
].filter(Boolean)
</script>

<template>
  <div class="project-index-page page-shell">
    <RequestChartTable ref="rctRef" class="project-index-panel business-list-panel" :params="params" :request="getList" :is-selection="true">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
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
              <BaSelect v-model="query.phase" filterable label="项目阶段" prop="phase">
                <el-option v-for="(label, key) in phaseMap" :key="key" :label="label" :value="key" />
              </BaSelect>
            </div>
          </div>

          <div v-if="showAdvanced" class="query-section query-section--advanced">
            <div class="query-section__header">
              <div class="query-section__title">高级筛选</div>
              <div class="query-section__desc">按组织、质量、归档和业务属性进一步缩小范围</div>
            </div>
            <div class="query-grid">
              <div class="query-select-item">
                <div class="query-select-label">所属部门</div>
                <el-select v-model="query.departmentId" placeholder="请选择所属部门" clearable filterable>
                  <el-option v-for="(label, key) in deptMap" :key="key" :label="label" :value="key" />
                </el-select>
              </div>
              <div class="query-select-item">
                <div class="query-select-label">项目发起人</div>
                <UserSelect v-model="query.creatorId" placeholder="请选择项目发起人" clearable />
              </div>
              <BaSelect v-model="query.riskLevel" filterable label="风险等级" prop="riskLevel">
                <el-option v-for="(label, key) in riskLevelMap" :key="key" :label="label" :value="key" />
              </BaSelect>
              <BaSelect v-model="query.qualityLevel" filterable label="质量等级" prop="qualityLevel">
                <el-option v-for="(label, key) in qualityLevelMap" :key="key" :label="label" :value="key" />
              </BaSelect>
              <BaSelect v-model="query.isArchived" filterable label="是否归档" prop="isArchived">
                <el-option label="未归档" value="0" />
                <el-option label="已归档" value="1" />
              </BaSelect>
              <BaInput v-model="query.category" label="项目分类" prop="category" />
              <BaInput v-model="query.businessLine" label="业务线" prop="businessLine" />
              <BaInput v-model="query.industry" label="行业" prop="industry" />
              <BaInput v-model="query.projectSource" label="项目来源" prop="projectSource" />
            </div>
          </div>
        </div>
      </template>

      <template #extraButtons>
        <el-button class="advanced-filter-toggle" plain type="primary" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起高级筛选' : '展开高级筛选' }}
          <el-icon :class="{ 'rotate-180': showAdvanced }"><CaretBottom /></el-icon>
        </el-button>
      </template>

      <template #operation="{ selectedIds }">
        <div class="project-index-operation">
          <div class="project-index-operation__left">
            <span class="project-index-operation__meta">已选 {{ selectedIds.length }} 项</span>
          </div>
          <div class="project-index-operation__actions">
            <el-button v-if="canProjectAdd" type="primary" @click="rctRef.goRoute(null, '/projectManage/form')">新增项目</el-button>
            <el-button v-if="canProjectUpdate" :loading="recalculatingProgress" @click="handleRecalculateAllProgress">重算全部进度</el-button>
            <el-button v-if="canProjectDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
          </div>
        </div>
      </template>

      <template #table>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="项目名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="项目编号" prop="code" width="150" />
        <el-table-column label="负责人" prop="leader.nickname" width="100" />
        <el-table-column label="发起人" width="100">
          <template #default="{ row }">
            {{ row.creator?.nickname || row.creator?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="所属部门" width="140">
          <template #default="{ row }">
            {{ deptMap[row.departmentId] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="项目分类" prop="category" width="120" />
        <el-table-column label="项目阶段" width="100">
          <template #default="{ row }">
            {{ phaseMap[row.phase] || row.phase || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="项目类型" prop="projectType" width="140">
          <template #default="{ row }">
            {{ projectType[row.projectType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" prop="startDate" width="120" />
        <el-table-column label="结束时间" prop="endDate" width="120" />
        <el-table-column label="计划开始" prop="planStartDate" width="120" />
        <el-table-column label="计划结束" prop="planEndDate" width="120" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '6' ? 'success' : row.status === '2' || row.status === '3' || row.status === '5' ? 'warning' : row.status === '7' ? 'danger' : 'info'" effect="plain">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" prop="approvalStatus" width="140">
          <template #default="{ row }">
            <el-tag :type="row.approvalStatus === '2' ? 'success' : row.approvalStatus === '1' ? 'warning' : row.approvalStatus === '3' ? 'danger' : 'info'" size="small" effect="plain">
              {{ getProjectApprovalText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" prop="currentNodeName" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="优先级" prop="priority" width="100">
          <template #default="{ row }">
            <el-tag :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" size="small" effect="plain">
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
        <el-table-column label="币种" prop="currency" width="90" />
        <el-table-column label="业务线" prop="businessLine" width="120" />
        <el-table-column label="行业" prop="industry" width="120" />
        <el-table-column label="项目来源" prop="projectSource" width="120" />
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.riskLevel" :type="row.riskLevel === 'critical' ? 'danger' : row.riskLevel === 'high' ? 'warning' : 'info'" size="small" effect="plain">
              {{ riskLevelMap[row.riskLevel] || row.riskLevel }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="质量等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.qualityLevel" :type="row.qualityLevel === 'excellent' ? 'success' : row.qualityLevel === 'high' ? 'warning' : 'info'" size="small" effect="plain">
              {{ qualityLevelMap[row.qualityLevel] || row.qualityLevel }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="累计工时" prop="spentHours" width="110" />
        <el-table-column label="是否归档" prop="isArchived" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isArchived === '1' ? 'success' : 'info'" size="small" effect="plain">
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
.project-index-page {
  min-height: 100%;
}

.project-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.project-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.project-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.project-index-operation__meta {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.project-index-operation__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.query-select-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  width: 80px;
  min-width: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s;
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

.project-index-panel :deep(.el-tag--plain) {
  border-color: var(--el-border-color-lighter);
  background: #f7f7f7;
}

.project-index-panel :deep(th.el-table__cell) {
  background: #f7f7f7;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.project-index-panel :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #f7f7f7;
}

.project-index-panel :deep(.el-table__header-wrapper),
.project-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.query-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.query-section {
  min-width: 0;
}

.query-section--advanced {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: #f7f7f7;
}

.query-section__header {
  margin-bottom: 14px;
}

.query-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.query-section__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
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
.query-grid :deep(.el-input) {
  width: 100%;
  flex: 1;
}

.query-select-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.query-select-item :deep(.el-select),
.query-select-item :deep(.el-input),
.query-select-item :deep(.user-select) {
  flex: 1;
  min-width: 0;
}

.advanced-filter-toggle :deep(.el-icon) {
  margin-left: 4px;
  transition: transform 0.2s ease;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .project-index-header {
    flex-direction: column;
  }

  .project-index-header .page-header__actions {
    width: 100%;
  }

  .project-index-panel {
    padding-top: 18px;
  }

  .project-index-operation,
  .project-index-operation__left {
    align-items: stretch;
  }

  .project-index-operation__actions {
    width: 100%;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .project-index-operation,
  .project-index-operation__left {
    align-items: stretch;
  }
}
</style>
