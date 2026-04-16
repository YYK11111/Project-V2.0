<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getList, getRoles, getStats, getProjectOverview, addMember, updateMember, removeMember } from './api'
import { getStatus as getProjectStatus } from '../projectManage/api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'

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

const rctRef = ref()
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref()
const addForm = reactive({
  projectId: '',
  userId: '',
  role: '2',
})
const addRules = {
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  userId: [{ required: true, message: '请选择成员', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const canProjectMemberAdd = computed(() => checkPermi(['business/projectMembers/add']))
const canProjectMemberUpdate = computed(() => checkPermi(['business/projectMembers/update']))
const canProjectMemberDelete = computed(() => checkPermi(['business/projectMembers/delete']))

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
  if (!canProjectMemberUpdate.value) return $sdk.msgError('当前操作没有权限')
  editForm.id = row.id
  editForm.projectName = row.project?.name || '-'
  editForm.userName = row.user?.nickname || row.user?.name || row.userId || '-'
  editForm.role = row.role || '2'
  editForm.isCore = row.isCore || '0'
  editForm.isActive = row.isActive || '1'
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
  if (!canProjectMemberDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要移除该项目成员吗？').then(() => {
    removeMember(row.id).then(() => {
      $sdk.msgSuccess('成员移除成功')
      rctRef.value.getList()
    })
  })
}

const getButtons = (row: any) => [
  { key: 'edit', label: '编辑', disabled: !canProjectMemberUpdate.value, onClick: () => handleEditMember(row) },
  { key: 'remove', label: '移除', danger: true, disabled: !canProjectMemberDelete.value, show: row.isActive === '1', onClick: () => handleRemoveMember(row) },
]

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

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="Gcard">
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

    <RequestChartTable ref="rctRef" :params="params" :request="viewMode === 'member' ? getList : getProjectOverview">
      <template #query="{ query }">
        <BaInput v-model="query.keyword" label="关键词" prop="keyword" placeholder="项目名/姓名/昵称" />
        <div class="query-select-item">
          <div class="query-select-label">所属项目</div>
          <ProjectSelect v-model="query.projectId" placeholder="请选择项目" clearable />
        </div>
        <div class="query-select-item">
          <div class="query-select-label">项目成员</div>
          <UserSelect v-model="query.userId" placeholder="请选择成员" filter-dept clearable />
        </div>
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
      </template>

      <template #operation="{ selectedIds }">
        <div v-if="viewMode === 'member'" class="flexBetween">
          <el-button v-if="canProjectMemberAdd" type="primary" @click="handleAddMember">添加成员</el-button>
          <el-button v-if="canProjectMemberDelete" :disabled="!selectedIds.length" @click="handleBatchRemove(selectedIds)" type="danger">批量移除</el-button>
        </div>
      </template>

      <template #table>
        <template v-if="viewMode === 'member'">
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
          <el-table-column label="备注" prop="remark" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="排序" prop="sort" width="90" />
          <el-table-column label="加入时间" prop="createTime" width="180" />
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
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToProject(row)">查看项目</el-button>
            </template>
          </el-table-column>
        </template>
      </template>

      <template v-if="viewMode === 'member'" #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
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
.query-select-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
}

.query-select-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1;
}

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
</style>
