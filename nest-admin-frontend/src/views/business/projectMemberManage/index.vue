<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getList, getRoles, addMember, updateMember, removeMember } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'

const params = ref<Record<string, any>>({})

const roles = ref<Record<string, any>>({})
getRoles().then(({ data }: any) => (roles.value = data))

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

// 更新成员角色
function handleUpdateRole(row: any) {
  if (!canProjectMemberUpdate.value) return $sdk.msgError('当前操作没有权限')
  updateMember(row.id, { role: row.role }).then(() => {
    $sdk.msgSuccess('角色更新成功')
    rctRef.value.getList()
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
  { key: 'remove', label: '移除', danger: true, disabled: !canProjectMemberDelete.value, show: row.isActive === '1', onClick: () => handleRemoveMember(row) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <div class="query-select-item">
          <div class="query-select-label">所属项目</div>
          <ProjectSelect v-model="query.projectId" placeholder="请选择项目" clearable />
        </div>
        <div class="query-select-item">
          <div class="query-select-label">项目成员</div>
          <UserSelect v-model="query.userId" placeholder="请选择成员" filter-dept clearable />
        </div>
        <BaSelect v-model="query.role" filterable label="角色" prop="role">
          <el-option v-for="(value, key) of roles" :key="key" :label="value" :value="key"></el-option>
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canProjectMemberAdd" type="primary" @click="handleAddMember">添加成员</el-button>
          <el-button v-if="canProjectMemberDelete" :disabled="!selectedIds.length" @click="handleBatchRemove(selectedIds)" type="danger">批量移除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="用户名" prop="user.nickname" width="120" />
        <el-table-column label="真实姓名" prop="user.name" width="120" />
        <el-table-column label="所属项目" prop="project.name" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="角色" prop="role" width="160">
          <template #default="{ row }">
            <el-select 
              v-model="row.role" 
              size="small"
              :disabled="!canProjectMemberUpdate"
              @change="handleUpdateRole(row)">
              <el-option v-for="(value, key) of roles" :key="key" :label="value" :value="key"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="加入时间" prop="createTime" width="180" />
        <el-table-column label="状态" prop="isActive" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive === '1' ? 'success' : 'danger'" size="small">
              {{ row.isActive === '1' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </template>

      <template #tableOperation="{ row }">
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
</style>
