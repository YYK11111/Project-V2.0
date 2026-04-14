<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Delete, Document } from '@element-plus/icons-vue'
import { getOne, save, update, getStatus, getPriority, getProjectType } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import { checkPermi } from '@/utils/permission'
import UserSelect from '@/components/UserSelect.vue'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'

const route = useRoute()
const router = useRouter()

const memberRoleOptions = {
  '1': '项目经理',
  '2': '交付经理',
  '3': '技术负责人',
  '4': '实施负责人',
  '5': '测试负责人',
  '6': '客户联系人',
  '7': '商务接口人',
  '8': '开发工程师',
  '9': '实施顾问',
  A: '测试工程师',
  B: '运维工程师',
  C: '培训顾问',
  D: '数据迁移工程师',
  E: '驻场支持',
  F: '普通成员',
  G: '访客',
}

const defaultMember = (sort = 0) => ({
  id: '',
  userId: '',
  role: 'F',
  isCore: '0',
  remark: '',
  sort,
})

const defaultMilestone = (sort = 0) => ({
  id: '',
  name: '',
  dueDate: '',
  completedDate: '',
  status: '1',
  deliverables: [],
  description: '',
  sort,
})

const milestoneTemplates = {
  '1': [
    '项目启动', '需求调研完成', '实施方案确认', '系统配置完成', '联调完成', '培训完成', 'UAT完成', '上线完成', '验收完成', '结项完成'
  ],
  '2': [
    '项目启动', '需求评审通过', '方案设计评审通过', '开发完成', 'SIT完成', 'UAT完成', '上线审批通过', '上线完成', '验收完成', '结项完成'
  ],
  '3': [
    '服务启动', '运维交接完成', '巡检机制建立', '首月服务评估', '阶段服务复盘', '周期验收', '服务结项'
  ],
}

function createMilestonesByType(projectType) {
  const names = milestoneTemplates[projectType] || milestoneTemplates['1']
  return names.map((name, index) => ({
    ...defaultMilestone((index + 1) * 10),
    name,
  }))
}

const formRef = ref()
const milestonesManuallyEdited = ref(false)
const form = ref({
  name: '',
  code: '',
  leaderId: '',
  startDate: '',
  endDate: '',
  status: '1',
  projectType: '1',
  priority: '2',
  description: '',
  attachments: [],
  customerId: null,
  budget: 0,
  actualCost: 0,
  progress: 0,
  members: [defaultMember(10)],
  milestones: createMilestonesByType('1'),
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  leaderId: [{ required: true, message: '请选择项目负责人', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
}

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const canProjectAdd = computed(() => checkPermi(['business/projects/add']))
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))

const status = ref({})
const priority = ref({})
const projectType = ref({})
const customerList = ref([])

getStatus().then(({ data }) => (status.value = data || {}))
getPriority().then(({ data }) => (priority.value = data || {}))
getProjectType().then(({ data }) => (projectType.value = data || {}))
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

watch(
  () => form.value.projectType,
  (projectTypeValue, oldValue) => {
    if (!projectTypeValue || projectTypeValue === oldValue) return
    if (isEdit.value || milestonesManuallyEdited.value) return
    form.value.milestones = createMilestonesByType(projectTypeValue)
  },
)

watch(
  () => form.value.leaderId,
  (leaderId) => {
    if (!leaderId) return
    const exists = form.value.members.some((item) => item.userId === leaderId && item.role === '1')
    if (!exists) {
      form.value.members.unshift({
        ...defaultMember(0),
        userId: leaderId,
        role: '1',
        isCore: '1',
      })
      resequenceMembers()
    }
  },
)

if (isEdit.value || isView.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = {
      attachments: [],
      members: [],
      milestones: [],
      ...data,
      budget: data.budget || 0,
      actualCost: data.actualCost || 0,
      progress: data.progress || 0,
      members: (data.members || []).length ? data.members : [defaultMember(10)],
      milestones: (data.milestones || []).length ? data.milestones : createMilestonesByType(data.projectType || '1'),
    }
  })
}

function resequenceMembers() {
  form.value.members = form.value.members.map((item, index) => ({
    ...item,
    sort: (index + 1) * 10,
  }))
}

function resequenceMilestones() {
  form.value.milestones = form.value.milestones.map((item, index) => ({
    ...item,
    sort: (index + 1) * 10,
  }))
}

function addMemberRow() {
  form.value.members.push(defaultMember((form.value.members.length + 1) * 10))
}

function removeMemberRow(index) {
  if (form.value.members.length === 1) {
    form.value.members = [defaultMember(10)]
  } else {
    form.value.members.splice(index, 1)
  }
  resequenceMembers()
}

function addMilestoneRow() {
  milestonesManuallyEdited.value = true
  form.value.milestones.push(defaultMilestone((form.value.milestones.length + 1) * 10))
}

function removeMilestoneRow(index) {
  milestonesManuallyEdited.value = true
  if (form.value.milestones.length === 1) {
    form.value.milestones = [defaultMilestone(10)]
  } else {
    form.value.milestones.splice(index, 1)
  }
  resequenceMilestones()
}

function resetMilestoneTemplate() {
  milestonesManuallyEdited.value = false
  form.value.milestones = createMilestonesByType(form.value.projectType)
}

function normalizeSubmitPayload() {
  return {
    ...form.value,
    members: form.value.members
      .filter((item) => item.userId && item.role)
      .map((item, index) => ({
        ...item,
        sort: Number(item.sort ?? (index + 1) * 10),
        isCore: item.isCore || '0',
      })),
    milestones: form.value.milestones
      .filter((item) => item.name)
      .map((item, index) => ({
        ...item,
        sort: Number(item.sort ?? (index + 1) * 10),
        status: item.status || '1',
        deliverables: item.deliverables || [],
      })),
  }
}

function submit() {
  if ((isEdit.value && !canProjectUpdate.value) || (!isEdit.value && !canProjectAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }

  formRef.value.validate((valid) => {
    if (!valid) return
    const payload = normalizeSubmitPayload()
    if (!payload.members.length) {
      return $sdk.msgWarning('请至少维护一条项目成员')
    }
    if (!payload.milestones.length) {
      return $sdk.msgWarning('请至少维护一条里程碑')
    }
    const api = isEdit.value ? update : save
    api(payload).then(() => {
      $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
      router.back()
    })
  })
}

function cancel() {
  router.back()
}
</script>

<template>
  <div class="Gcard project-form-page">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isView ? '查看项目' : isEdit ? '编辑项目' : '新增项目'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <div class="project-sections">
        <section class="section-card">
          <div class="section-header section-header--stack">
            <div>
              <div class="section-title">基本信息</div>
              <div class="section-desc">维护项目基础属性、负责人、时间计划和预算进度。</div>
            </div>
          </div>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="100" show-word-limit :disabled="isView" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目编号">
                  <el-input v-model="form.code" placeholder="保存后自动生成" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="客户">
                  <el-select v-model="form.customerId" placeholder="请选择客户" style="width: 100%" clearable :disabled="isView">
                    <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目类型" prop="projectType">
                  <el-select v-model="form.projectType" placeholder="请选择项目类型" style="width: 100%" :disabled="isView || isEdit">
                    <el-option v-for="(value, key) in projectType" :key="key" :label="value" :value="key" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目负责人" prop="leaderId">
                  <UserSelect v-model="form.leaderId" placeholder="请选择项目负责人" :disabled="isView" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%" :disabled="isView">
                    <el-option v-for="(value, key) in priority" :key="key" :label="value" :value="key" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="开始时间" prop="startDate">
                  <el-date-picker v-model="form.startDate" type="date" placeholder="选择开始时间" value-format="YYYY-MM-DD" style="width: 100%" :disabled="isView" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="结束时间" prop="endDate">
                  <el-date-picker v-model="form.endDate" type="date" placeholder="选择结束时间" value-format="YYYY-MM-DD" style="width: 100%" :disabled="isView" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="8">
                <el-form-item label="状态">
                  <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%" :disabled="isView">
                    <el-option v-for="(value, key) in status" :key="key" :label="value" :value="key" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="项目预算">
                  <el-input-number v-model="form.budget" :min="0" :precision="2" :step="1000" style="width: 100%" :disabled="isView" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="实际成本">
                  <el-input-number v-model="form.actualCost" :min="0" :precision="2" :step="1000" style="width: 100%" :disabled="isView" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="进度(%)">
              <el-slider v-model="form.progress" :min="0" :max="100" show-input :disabled="isView" />
            </el-form-item>
        </section>

        <section class="section-card">
          <div class="section-header">
            <div>
              <div class="section-title">项目成员</div>
              <div class="section-desc">一个角色允许多人，项目团队直接在草稿阶段维护。</div>
            </div>
            <el-button v-if="!isView" type="primary" :icon="Plus" @click="addMemberRow">添加成员</el-button>
          </div>

          <div class="table-wrapper">
            <el-table :data="form.members" border class="edit-table members-table">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="成员" width="260">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <UserSelect v-model="row.userId" placeholder="请选择成员" :disabled="isView" clearable compact />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="角色" width="180">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-select v-model="row.role" placeholder="请选择角色" style="width: 100%" :disabled="isView">
                      <el-option v-for="(label, key) in memberRoleOptions" :key="key" :label="label" :value="key" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="核心成员" width="110">
                <template #default="{ row }">
                  <el-switch v-model="row.isCore" active-value="1" inactive-value="0" :disabled="isView" />
                </template>
              </el-table-column>
              <el-table-column label="备注" width="220">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-input v-model="row.remark" placeholder="请输入备注" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120">
                <template #default="{ row }">
                  <div class="cell-editor cell-editor--compact">
                    <el-input-number v-model="row.sort" :min="0" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isView" label="操作" width="96">
                <template #default="{ $index }">
                  <div class="cell-action">
                    <el-button type="danger" link :icon="Delete" @click="removeMemberRow($index)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>

        <section class="section-card">
          <div class="section-header">
            <div>
              <div class="section-title">里程碑计划</div>
              <div class="section-desc">按项目类型生成默认模板，草稿阶段即可调整名称、日期、交付物。</div>
            </div>
            <div class="section-actions">
              <el-button v-if="!isView" @click="resetMilestoneTemplate">重置模板</el-button>
              <el-button v-if="!isView" type="primary" :icon="Plus" @click="addMilestoneRow">添加里程碑</el-button>
            </div>
          </div>

          <div class="table-wrapper">
            <el-table :data="form.milestones" border class="edit-table milestones-table" @cell-click="milestonesManuallyEdited = true">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="里程碑名称" width="220">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-input v-model="row.name" placeholder="请输入里程碑名称" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="计划完成日期" width="160">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-date-picker v-model="row.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="130">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-select v-model="row.status" style="width: 100%" :disabled="isView">
                      <el-option label="待完成" value="1" />
                      <el-option label="已完成" value="2" />
                      <el-option label="已延期" value="3" />
                      <el-option label="已取消" value="4" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="交付物" width="260">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-select v-model="row.deliverables" multiple filterable allow-create default-first-option collapse-tags collapse-tags-tooltip placeholder="请输入交付物" style="width: 100%" :disabled="isView">
                      <el-option v-for="item in row.deliverables || []" :key="item" :label="item" :value="item" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="描述" width="240">
                <template #default="{ row }">
                  <div class="cell-editor">
                    <el-input v-model="row.description" placeholder="请输入说明" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120">
                <template #default="{ row }">
                  <div class="cell-editor cell-editor--compact">
                    <el-input-number v-model="row.sort" :min="0" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isView" label="操作" width="96">
                <template #default="{ $index }">
                  <div class="cell-action">
                    <el-button type="danger" link :icon="Delete" @click="removeMilestoneRow($index)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>

        <section class="section-card">
          <div class="section-header section-header--stack">
            <div>
              <div class="section-title">项目描述与附件</div>
              <div class="section-desc">补充项目背景、范围说明以及相关附件资料。</div>
            </div>
          </div>

          <el-form-item label="项目描述">
            <div v-if="isView" v-html="form.description || '无描述'" class="view-content" />
            <Editor v-else v-model="form.description" style="min-height: 260px" />
          </el-form-item>

          <el-form-item label="项目附件">
            <div v-if="isView" class="view-attachments">
              <div v-for="(item, index) in form.attachments" :key="index" class="view-file-item">
                <el-icon><Document /></el-icon>
                <a :href="item.url || item" target="_blank">{{ item.name || item.originalName || `附件 ${index + 1}` }}</a>
              </div>
              <span v-if="!form.attachments?.length" class="no-data">无附件</span>
            </div>
            <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
          </el-form-item>
        </section>
      </div>

      <el-form-item class="footer-actions">
        <el-button v-if="!isView && (isEdit ? canProjectUpdate : canProjectAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isView ? '返回' : '取消' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.project-form-page {
  min-height: 100%;
}

.project-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
}

.section-header--stack {
  justify-content: flex-start;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-desc {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.edit-table {
  width: auto;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.edit-table :deep(.cell) {
  overflow: hidden;
  word-break: break-word;
}

.edit-table :deep(.el-input),
.edit-table :deep(.el-select),
.edit-table :deep(.el-date-editor),
.edit-table :deep(.user-select) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.edit-table :deep(.el-select__wrapper),
.edit-table :deep(.el-input__wrapper),
.edit-table :deep(.el-textarea__inner) {
  max-width: 100%;
  box-sizing: border-box;
}

.cell-editor {
  width: 100%;
  min-width: 0;
}

.cell-editor--compact {
  max-width: 104px;
}

.cell-action {
  display: flex;
  justify-content: center;
  white-space: nowrap;
}

.footer-actions {
  margin-top: 20px;
}

.view-content {
  min-height: 120px;
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: #f8fafc;
  line-height: 1.7;
  color: #606266;
}

.view-attachments {
  width: 100%;
}

.view-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.view-file-item a {
  color: #409eff;
  text-decoration: none;
}

.view-file-item a:hover {
  text-decoration: underline;
}

.no-data {
  color: #909399;
  font-size: 14px;
}
</style>
