<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CaretBottom } from '@element-plus/icons-vue'
import { getList, getRoles, getStats, getProjectOverview, addMember, updateMember, removeMember } from './api'
import { getStatus as getProjectStatus } from '../projectManage/api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'
import { downloadCsv } from '@/utils/csv'

const params = ref<Record<string, any>>({})
const router = useRouter()

const roles = ref<Record<string, any>>({})
getRoles().then(({ data }: any) => (roles.value = data))
const projectStatusMap = ref<Record<string, string>>({})
getProjectStatus().then(({ data }: any) => (projectStatusMap.value = data || {}))

const stats = ref({
  totalMembers: 0,
  projectCount: 0,
  coreMembers: 0,
  missingManagerProjects: 0,
  missingCoreProjects: 0,
})
const viewMode = ref<'member' | 'project'>('member')
const showAdvanced = ref(false)

const rctRef = ref()
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref()
const addForm = reactive({
  projectId: '',
  userId: '',
  role: '2',
  joinDate: '',
  notificationEnabled: '1',
  responsibilityScope: ['project'],
  positionTitle: '',
  leaveDate: '',
  fieldPermissionGroup: '',
})
const addRules = {
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  userId: [{ required: true, message: '请选择成员', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const canProjectMemberAdd = computed(() => checkPermi(['business/projectMembers/add']))
const canProjectMemberUpdate = computed(() => checkPermi(['business/projectMembers/update']))
const canProjectMemberDelete = computed(() => checkPermi(['business/projectMembers/delete']))

function canManageProjectMember(row: any) {
  return row.permissionContext?.canManageMembers === true
}

const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: '',
  projectName: '',
  userName: '',
  role: '2',
  isCore: '0',
  isActive: '1',
  joinDate: '',
  notificationEnabled: '1',
  responsibilityScope: ['project'],
  positionTitle: '',
  leaveDate: '',
  fieldPermissionGroup: '',
  remark: '',
  sort: 0,
})
const editRules = {
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// 添加成员
function handleAddMember(row?: any) {
  if (!canProjectMemberAdd.value) return $sdk.msgError('当前操作没有权限')
  addForm.projectId = row?.id || params.value.projectId || ''
  addForm.userId = ''
  addForm.role = '2'
  addForm.joinDate = ''
  addForm.notificationEnabled = '1'
  addForm.responsibilityScope = ['project']
  addForm.positionTitle = ''
  addForm.leaveDate = ''
  addForm.fieldPermissionGroup = ''
  addDialogVisible.value = true
}

function submitAddMember() {
  if (!canProjectMemberAdd.value) return $sdk.msgError('当前操作没有权限')
  addFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    addLoading.value = true
    try {
      await addMember({ ...addForm })
      params.value.projectId = addForm.projectId
      ElMessage.success('成员添加成功')
      addDialogVisible.value = false
      rctRef.value?.getList?.(1)
    } catch (error: any) {
      ElMessage.error(error?.message || error?.response?.data?.message || '成员添加失败')
    } finally {
      addLoading.value = false
    }
  })
}

function handleEditMember(row: any) {
  if (!canManageProjectMember(row)) return $sdk.msgError('当前无维护项目成员的权限')
  if (!canProjectMemberUpdate.value) return $sdk.msgError('当前操作没有权限')
  editForm.id = row.id
  editForm.projectName = row.project?.name || '-'
  editForm.userName = row.user?.nickname || row.user?.name || row.userId || '-'
  editForm.role = row.role || '2'
  editForm.isCore = row.isCore || '0'
  editForm.isActive = row.isActive || '1'
  editForm.joinDate = row.joinDate || ''
  editForm.notificationEnabled = row.notificationEnabled || '1'
  editForm.responsibilityScope = row.responsibilityScope?.length ? row.responsibilityScope : ['project']
  editForm.positionTitle = row.positionTitle || ''
  editForm.leaveDate = row.leaveDate || ''
  editForm.fieldPermissionGroup = row.fieldPermissionGroup || ''
  editForm.remark = row.remark || ''
  editForm.sort = Number(row.sort || 0)
  editDialogVisible.value = true
}

function submitEditMember() {
  if (!canProjectMemberUpdate.value) return $sdk.msgError('当前操作没有权限')
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    editLoading.value = true
    try {
      await updateMember(editForm.id, {
        role: editForm.role,
        isCore: editForm.isCore,
        isActive: editForm.isActive,
        joinDate: editForm.joinDate,
        notificationEnabled: editForm.notificationEnabled,
        responsibilityScope: editForm.responsibilityScope,
        positionTitle: editForm.positionTitle,
        leaveDate: editForm.leaveDate,
        fieldPermissionGroup: editForm.fieldPermissionGroup,
        remark: editForm.remark,
        sort: editForm.sort,
      })
      $sdk.msgSuccess('成员信息更新成功')
      editDialogVisible.value = false
      rctRef.value?.getList?.()
    } finally {
      editLoading.value = false
    }
  })
}

// 批量移除成员
function handleBatchRemove(selectedIds: string[]) {
  if (!canProjectMemberDelete.value) return $sdk.msgError('当前操作没有权限')
  if (!selectedIds.length) return $sdk.msgError('请选择需要移除的成员')
  $sdk.confirm('确定要批量移除选中的成员吗？').then(() => {
    Promise.all(selectedIds.map((id) => removeMember(id))).then(() => {
      $sdk.msgSuccess('批量移除成功')
      rctRef.value.getList()
    })
  })
}

// 移除成员
function handleRemoveMember(row: any) {
  if (!canManageProjectMember(row)) return $sdk.msgError('当前无维护项目成员的权限')
  if (!canProjectMemberDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要移除该项目成员吗？').then(() => {
    removeMember(row.id).then(() => {
      $sdk.msgSuccess('成员移除成功')
      rctRef.value.getList()
    })
  })
}

const getButtons = (row: any) => [
  canProjectMemberUpdate.value && canManageProjectMember(row) ? { key: 'edit', label: '编辑', onClick: () => handleEditMember(row) } : null,
  canProjectMemberDelete.value && canManageProjectMember(row) && row.isActive === '1' ? { key: 'remove', label: '移除', danger: true, onClick: () => handleRemoveMember(row) } : null,
].filter(Boolean)

const getProjectButtons = (row: any) => [
  { key: 'detail', label: '项目详情', onClick: () => goToProject(row) },
]

const getRowButtons = (row: any) => viewMode.value === 'member' ? getButtons(row) : getProjectButtons(row)

const getRoleLabel = (role: string) => roles.value[role] || role || '-'

async function loadStats() {
  const res: any = await getStats()
  stats.value = res?.data || res || stats.value
}

function handleIssueFilter(issueType = '') {
  viewMode.value = 'project'
  params.value.issueType = issueType
  rctRef.value?.getList?.(1)
}

function goToProject(row: any) {
  if (!row?.projectId) return
  router.push({ path: '/projectManage/detail', query: { id: row.projectId } })
}

function exportProjectMemberList() {
  const rows = [
    ['所属项目', '成员姓名', '账号/昵称', '角色', '核心成员', '状态', '项目提醒', '作用域', '岗位名称', '退出时间', '权限组', '加入时间'],
    ...((rctRef.value?.data || []).map((row: any) => [
      row.project?.name || row.projectName || '-',
      row.user?.name || '-',
      row.user?.nickname || row.user?.userName || '-',
      getRoleLabel(row.role),
      row.isCore === '1' ? '是' : '否',
      row.isActive === '1' ? '激活' : '禁用',
      row.notificationEnabled === '1' ? '接收' : '关闭',
      (row.responsibilityScope || []).join('、') || '-',
      row.positionTitle || '-',
      row.leaveDate || '-',
      row.fieldPermissionGroup || '-',
      row.joinDate || row.createTime || '-',
    ])),
  ]
  downloadCsv('项目成员列表导出.csv', rows)
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="project-member-index-page Gcard">
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-card__label">成员总数</div>
        <div class="stats-card__value">{{ stats.totalMembers }}</div>
      </div>
      <div class="stats-card">
        <div class="stats-card__label">覆盖项目数</div>
        <div class="stats-card__value">{{ stats.projectCount }}</div>
      </div>
      <div class="stats-card">
        <div class="stats-card__label">核心成员数</div>
        <div class="stats-card__value">{{ stats.coreMembers }}</div>
      </div>
      <button type="button" class="stats-card stats-card--warning stats-card--clickable" @click="handleIssueFilter('missingManager')">
        <div class="stats-card__label">缺少项目经理</div>
        <div class="stats-card__value">{{ stats.missingManagerProjects }}</div>
      </button>
      <button type="button" class="stats-card stats-card--warning stats-card--clickable" @click="handleIssueFilter('missingCore')">
        <div class="stats-card__label">缺少核心成员</div>
        <div class="stats-card__value">{{ stats.missingCoreProjects }}</div>
      </button>
    </div>

    <div class="view-mode-bar">
      <el-radio-group v-model="viewMode" size="default">
        <el-radio-button label="member">成员视角</el-radio-button>
        <el-radio-button label="project">项目视角</el-radio-button>
      </el-radio-group>
    </div>

    <RequestChartTable ref="rctRef" class="project-member-index-panel business-list-panel" :params="params" :request="viewMode === 'member' ? getList : getProjectOverview" :is-selection="viewMode === 'member'">
      <template #query="{ query }">
        <div class="query-sections">
          <div class="query-section query-section--primary">
            <div class="query-grid">
              <BaInput v-model="query.keyword" label="关键词" prop="keyword" placeholder="项目名/姓名/昵称" />
              <div class="query-select-item">
                <div class="query-select-label">所属项目</div>
                <ProjectSelect v-model="query.projectId" placeholder="请选择项目" clearable />
              </div>
              <div class="query-select-item">
                <div class="query-select-label">项目成员</div>
                <UserSelect v-model="query.userId" placeholder="请选择成员" filter-dept clearable />
              </div>
            </div>
          </div>

          <div v-if="showAdvanced" class="query-section query-section--advanced">
            <div class="query-section__header">
              <div class="query-section__title">高级筛选</div>
              <div class="query-section__desc">按角色、成员状态、项目状态和配置异常进一步定位成员数据</div>
            </div>
            <div class="query-grid">
              <BaSelect v-if="viewMode === 'member'" v-model="query.role" filterable label="角色" prop="role">
                <el-option v-for="(value, key) of roles" :key="key" :label="value" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-if="viewMode === 'member'" v-model="query.isCore" filterable label="核心成员" prop="isCore">
                <el-option label="是" value="1"></el-option>
                <el-option label="否" value="0"></el-option>
              </BaSelect>
              <BaSelect v-if="viewMode === 'member'" v-model="query.isActive" filterable label="状态" prop="isActive">
                <el-option label="激活" value="1"></el-option>
                <el-option label="禁用" value="0"></el-option>
              </BaSelect>
              <BaSelect v-model="query.projectStatus" filterable label="项目状态" prop="projectStatus">
                <el-option v-for="(label, key) of projectStatusMap" :key="key" :label="label" :value="key"></el-option>
              </BaSelect>
              <BaSelect v-model="query.issueType" filterable label="异常筛选" prop="issueType">
                <el-option label="缺少项目经理" value="missingManager"></el-option>
                <el-option label="缺少核心成员" value="missingCore"></el-option>
              </BaSelect>
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
        <div v-if="viewMode === 'member'" class="project-member-index-operation">
          <div class="project-member-index-operation__left">
            <el-button v-if="canProjectMemberAdd" type="primary" @click="handleAddMember">新增成员</el-button>
            <el-button @click="exportProjectMemberList">导出</el-button>
          </div>
          <el-button v-if="canProjectMemberDelete" :disabled="!selectedIds.length" @click="handleBatchRemove(selectedIds)" type="danger">批量移除</el-button>
        </div>
      </template>

      <template #table>
        <template v-if="viewMode === 'member'">
          <el-table-column type="index" label="序号" width="70" />
          <el-table-column label="所属项目" min-width="180" :show-overflow-tooltip="true">
            <template #default="{ row }">
              <div class="project-member-project-cell">
                <div class="project-member-project-cell__name">{{ row.project?.name || '-' }}</div>
                <div class="project-member-project-cell__code">{{ row.project?.code || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="成员姓名" min-width="140">
            <template #default="{ row }">{{ row.user?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="账号/昵称" min-width="140">
            <template #default="{ row }">{{ row.user?.nickname || row.user?.userName || '-' }}</template>
          </el-table-column>
          <el-table-column label="角色" prop="role" width="160">
            <template #default="{ row }">
              {{ getRoleLabel(row.role) }}
            </template>
          </el-table-column>
          <el-table-column label="核心成员" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isCore === '1' ? 'success' : 'info'" size="small">
                {{ row.isCore === '1' ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="isActive" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isActive === '1' ? 'success' : 'danger'" size="small">
                {{ row.isActive === '1' ? '激活' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目提醒" width="100">
            <template #default="{ row }">
              <el-tag :type="row.notificationEnabled === '0' ? 'info' : 'success'" size="small">
                {{ row.notificationEnabled === '0' ? '关闭' : '接收' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="作用域" min-width="180" :show-overflow-tooltip="true">
            <template #default="{ row }">{{ (row.responsibilityScope || []).join('、') || '-' }}</template>
          </el-table-column>
          <el-table-column label="岗位名称" prop="positionTitle" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="退出时间" prop="leaveDate" width="120" />
          <el-table-column label="权限组" prop="fieldPermissionGroup" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="备注" prop="remark" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="排序" prop="sort" width="90" />
          <el-table-column label="加入时间" width="180">
            <template #default="{ row }">{{ row.joinDate || row.createTime || '-' }}</template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column label="项目名称" min-width="220" :show-overflow-tooltip="true">
            <template #default="{ row }">
              <div class="project-member-project-cell">
                <div class="project-member-project-cell__name">{{ row.projectName || '-' }}</div>
                <div class="project-member-project-cell__code">{{ row.projectCode || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="项目状态" width="120">
            <template #default="{ row }">{{ projectStatusMap[row.projectStatus] || '-' }}</template>
          </el-table-column>
          <el-table-column label="成员数" prop="memberCount" width="100" />
          <el-table-column label="核心成员数" prop="coreMemberCount" width="120" />
          <el-table-column label="项目经理" width="120">
            <template #default="{ row }">
              <el-tag :type="row.missingManager ? 'danger' : 'success'" size="small">
                {{ row.missingManager ? '缺失' : '已配置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核心成员配置" width="140">
            <template #default="{ row }">
              <el-tag :type="row.missingCore ? 'warning' : 'success'" size="small">
                {{ row.missingCore ? '缺失' : '已配置' }}
              </el-tag>
            </template>
          </el-table-column>
        </template>
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getRowButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog v-model="addDialogVisible" title="添加项目成员" width="560" @confirm="submitAddMember">
      <template #form>
        <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px" v-loading="addLoading">
          <el-form-item label="所属项目" prop="projectId">
            <ProjectSelect v-model="addForm.projectId" placeholder="请选择项目" />
          </el-form-item>
          <el-form-item label="成员" prop="userId">
            <UserSelect v-model="addForm.userId" placeholder="请选择成员" filter-dept />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="addForm.role" placeholder="请选择角色" style="width: 100%">
              <el-option v-for="(value, key) of roles" :key="key" :label="value" :value="key"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="加入时间">
            <el-date-picker v-model="addForm.joinDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择加入时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="项目提醒">
            <el-switch v-model="addForm.notificationEnabled" active-value="1" inactive-value="0" />
          </el-form-item>
          <el-form-item label="作用域">
            <el-select v-model="addForm.responsibilityScope" multiple collapse-tags collapse-tags-tooltip placeholder="请选择作用域" style="width: 100%">
              <el-option label="项目" value="project"></el-option>
              <el-option label="任务" value="task"></el-option>
              <el-option label="风险" value="risk"></el-option>
              <el-option label="工单" value="ticket"></el-option>
              <el-option label="变更" value="change"></el-option>
              <el-option label="知识" value="knowledge"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="岗位名称">
            <el-input v-model="addForm.positionTitle" placeholder="请输入岗位/职责名称" />
          </el-form-item>
          <el-form-item label="退出时间">
            <el-date-picker v-model="addForm.leaveDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择退出时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="权限组">
            <el-select v-model="addForm.fieldPermissionGroup" placeholder="请选择权限组" style="width: 100%" clearable>
              <el-option label="项目基础组" value="projectBasic"></el-option>
              <el-option label="项目计划组" value="projectPlan"></el-option>
              <el-option label="项目经营组" value="projectBusiness"></el-option>
              <el-option label="项目结项组" value="projectClosure"></el-option>
              <el-option label="项目知识组" value="projectKnowledge"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>

    <BaDialog v-model="editDialogVisible" title="编辑项目成员" width="560" @confirm="submitEditMember">
      <template #form>
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px" v-loading="editLoading">
          <el-form-item label="所属项目">
            <el-input v-model="editForm.projectName" disabled />
          </el-form-item>
          <el-form-item label="成员">
            <el-input v-model="editForm.userName" disabled />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
              <el-option v-for="(value, key) of roles" :key="key" :label="value" :value="key"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="核心成员">
            <el-switch v-model="editForm.isCore" active-value="1" inactive-value="0" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="editForm.isActive">
              <el-radio value="1">激活</el-radio>
              <el-radio value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="加入时间">
            <el-date-picker v-model="editForm.joinDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择加入时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="项目提醒">
            <el-switch v-model="editForm.notificationEnabled" active-value="1" inactive-value="0" />
          </el-form-item>
          <el-form-item label="作用域">
            <el-select v-model="editForm.responsibilityScope" multiple collapse-tags collapse-tags-tooltip placeholder="请选择作用域" style="width: 100%">
              <el-option label="项目" value="project"></el-option>
              <el-option label="任务" value="task"></el-option>
              <el-option label="风险" value="risk"></el-option>
              <el-option label="工单" value="ticket"></el-option>
              <el-option label="变更" value="change"></el-option>
              <el-option label="知识" value="knowledge"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="岗位名称">
            <el-input v-model="editForm.positionTitle" placeholder="请输入岗位/职责名称" />
          </el-form-item>
          <el-form-item label="退出时间">
            <el-date-picker v-model="editForm.leaveDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择退出时间" style="width: 100%" />
          </el-form-item>
          <el-form-item label="权限组">
            <el-select v-model="editForm.fieldPermissionGroup" placeholder="请选择权限组" style="width: 100%" clearable>
              <el-option label="项目基础组" value="projectBasic"></el-option>
              <el-option label="项目计划组" value="projectPlan"></el-option>
              <el-option label="项目经营组" value="projectBusiness"></el-option>
              <el-option label="项目结项组" value="projectClosure"></el-option>
              <el-option label="项目知识组" value="projectKnowledge"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="editForm.sort" :min="0" style="width: 100%" />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.project-member-index-page {
  min-height: 100%;
}

.project-member-index-panel {
  padding-top: 20px;
  scroll-behavior: auto;
}

.project-member-index-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.project-member-index-operation__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.project-member-index-panel :deep(.el-table__header-wrapper),
.project-member-index-panel :deep(.el-table__body-wrapper) {
  scroll-behavior: auto;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 20px;
  align-items: start;
  width: 100%;
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
  background: color-mix(in srgb, var(--el-fill-color-extra-light) 72%, transparent);
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

.advanced-filter-toggle :deep(.el-icon) {
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
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
.query-grid :deep(.project-select),
.query-grid :deep(.user-select) {
  width: 100%;
  flex: 1;
}

.query-select-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.query-select-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1;
  width: 80px;
  min-width: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.query-select-item :deep(.project-select),
.query-select-item :deep(.user-select),
.query-select-item :deep(.el-select),
.query-select-item :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

.project-member-project-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-member-project-cell__name {
  color: var(--el-text-color-primary);
}

.project-member-project-cell__code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stats-card {
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.stats-card--warning {
  background: color-mix(in srgb, var(--el-color-warning-light-9) 70%, white);
}

.stats-card__label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.stats-card__value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stats-card--clickable {
  cursor: pointer;
  text-align: left;
}

.stats-card--clickable:hover {
  border-color: var(--el-color-warning);
  transform: translateY(-1px);
}

.view-mode-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .project-member-index-panel {
    padding-top: 18px;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }

  .query-section--advanced {
    padding: 14px;
  }

  .project-member-index-operation,
  .project-member-index-operation__left {
    align-items: stretch;
  }
}
</style>
