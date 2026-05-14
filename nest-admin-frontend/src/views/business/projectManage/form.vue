<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getOne, save, update, getStatus, getPriority, getProjectType, submitApproval, submitClose, getFieldPermissions } from './api'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import { checkPermi } from '@/utils/permission'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'
import UserSelect from '@/components/UserSelect.vue'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'

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
  ownerId: '',
  delayReason: '',
  description: '',
  sort,
})

function createDefaultForm() {
  return {
    name: '',
    code: '',
    leaderId: '',
    creatorId: '',
    departmentId: '',
    category: '',
    tags: [],
    phase: '',
    startDate: '',
    endDate: '',
    planStartDate: '',
    planEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    phaseStartDate: '',
    phaseEndDate: '',
    status: '1',
    projectType: '1',
    priority: '2',
    description: '',
    baselineDeliverables: '',
    scopeBoundary: '',
    baselinePlanNote: '',
    closeSummary: '',
    closeDeliverables: '',
    closeOpenIssues: '',
    closeReview: '',
    acceptanceDate: '',
    attachments: [],
    customerId: null,
    contractId: '',
    opportunityId: '',
    projectSource: '',
    contract: null,
    opportunity: null,
    budget: 0,
    actualCost: 0,
    currency: 'CNY',
    riskLevel: '',
    qualityLevel: '',
    businessLine: '',
    industry: '',
    projectSource: '',
    spentHours: 0,
    progress: 0,
    members: [defaultMember(1)],
    milestones: createMilestonesByType('1'),
  }
}

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
    ...defaultMilestone(index + 1),
    name,
  }))
}

const formRef = ref()
const shellRef = ref(null)
const milestonesManuallyEdited = ref(false)
const form = ref(createDefaultForm())
const stickyBarStyle = ref({})
let stickyBarResizeObserver = null
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  leaderId: [{ required: true, message: '请选择项目负责人', trigger: 'change' }],
  creatorId: [{ required: true, message: '请选择项目发起人', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  startDate: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
    {
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (value && form.value.endDate && value > form.value.endDate) {
          callback(new Error('开始时间不能晚于结束时间'))
          return
        }
        callback()
      },
    },
  ],
  endDate: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (value && form.value.startDate && value < form.value.startDate) {
          callback(new Error('结束时间不能早于开始时间'))
          return
        }
        callback()
      },
    },
  ],
  planStartDate: [
    {
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (value && form.value.planEndDate && value > form.value.planEndDate) {
          callback(new Error('计划开始不能晚于计划结束'))
          return
        }
        callback()
      },
    },
  ],
  planEndDate: [
    {
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (value && form.value.planStartDate && value < form.value.planStartDate) {
          callback(new Error('计划结束不能早于计划开始'))
          return
        }
        callback()
      },
    },
  ],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  baselineDeliverables: [{ required: true, message: '请输入主要交付物', trigger: 'blur' }],
  scopeBoundary: [{ required: true, message: '请输入范围边界说明', trigger: 'blur' }],
}

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const isCreate = computed(() => !route.query.id && !isView.value)
const isDraftMode = computed(() => isCreate.value || String(form.value.status || '') === '1')
const isClosureMode = computed(() => !isCreate.value && String(form.value.status || '') !== '1')
const pageStatusText = computed(() => {
  if (isView.value) {
    return isClosureMode.value ? '已进入结项阶段' : '查看中'
  }
  if (isDraftMode.value) return '草稿'
  return '审批/执行中'
})
const canProjectAdd = computed(() => checkPermi(['business/projects/add']))
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))
const canProjectSubmitApproval = computed(() => checkPermi(['business/projects/submitApproval']))
const canEditCurrentProject = computed(() => isDraftMode.value)
const isMobileScreen = computed(() => viewportWidth.value < 768)
const isTabletScreen = computed(() => viewportWidth.value >= 768 && viewportWidth.value < 1024)
const isCompactScreen = computed(() => viewportWidth.value < 1024)
const formLabelPosition = computed(() => (isCompactScreen.value ? 'top' : 'right'))
const saveLoading = ref(false)
const approvalLoading = ref(false)
const fieldPermissionResult = ref(null)

const status = ref({})
const priority = ref({})
const projectType = ref({})
const customerList = ref([])
const deptList = ref([])

const flattenDepts = (depts, result = []) => {
  depts.forEach((dept) => {
    result.push(dept)
    if (dept.children?.length) {
      flattenDepts(dept.children, result)
    }
  })
  return result
}

getStatus().then(({ data }) => (status.value = data || {}))
getPriority().then(({ data }) => (priority.value = data || {}))
getProjectType().then(({ data }) => (projectType.value = data || {}))
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = (res.list || []).map(c => ({...c, id: Number(c.id)}))
})
getDeptTrees({}).then((res) => {
  deptList.value = (res.data ? flattenDepts(res.data) : []).map(d => ({...d, id: Number(d.id)}))
})

const customerMap = computed(() => new Map((customerList.value || []).map((item) => [String(item.id), item])))
const currentCustomer = computed(() => form.value.customer || customerMap.value.get(String(form.value.customerId || '')) || null)
const deptMap = computed(() => Object.fromEntries((deptList.value || []).map((item) => [String(item.id), item.name])))
const groupPermissions = computed(() => fieldPermissionResult.value?.groups || {})

function canViewGroup(groupCode) {
  return (groupPermissions.value[groupCode] || 'editable') !== 'hidden'
}

function canEditGroup(groupCode) {
  return (groupPermissions.value[groupCode] || 'editable') === 'editable'
}

function isGroupReadonly(groupCode) {
  return isView.value || !canEditGroup(groupCode)
}

function hydrateFromContractQuery() {
  if (String(route.query.fromContract || '') !== '1') return null
  return {
    name: String(route.query.name || ''),
    customerId: route.query.customerId ? Number(route.query.customerId) : null,
    contractId: String(route.query.contractId || ''),
    opportunityId: String(route.query.opportunityId || ''),
    startDate: String(route.query.startDate || ''),
    endDate: String(route.query.endDate || ''),
    projectSource: String(route.query.projectSource || 'contract'),
    contract: route.query.contractId
      ? {
          id: String(route.query.contractId || ''),
          code: String(route.query.contractCode || ''),
          name: String(route.query.contractName || ''),
        }
      : null,
    opportunity: route.query.opportunityId
      ? {
          id: String(route.query.opportunityId || ''),
          code: String(route.query.opportunityCode || ''),
          name: String(route.query.opportunityName || ''),
        }
      : null,
  }
}

const isProjectFormRoute = useCurrentRouteGuard(route, '/projectManage/form')

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

watch(
  () => form.value.customerId,
  (customerId) => {
    if (!customerId) {
      form.value.industry = ''
      return
    }
    const customer = customerMap.value.get(String(customerId))
    if (customer?.industry) {
      form.value.industry = customer.industry
    }
  },
)

async function loadProject() {
  if (!isProjectFormRoute()) return
  milestonesManuallyEdited.value = false
  if (!(isEdit.value || isView.value)) {
    form.value = {
      ...createDefaultForm(),
      ...(hydrateFromContractQuery() || {}),
    }
    fieldPermissionResult.value = null
    return
  }
  const { data } = await getOne(route.query.id)
  if (isEdit.value && String(data?.status || '') !== '1') {
    $sdk.msgWarning('项目立项后不允许直接编辑，请通过项目变更发起调整')
    router.replace({ path: '/projectManage/detail', query: { id: route.query.id } })
    return
  }
  form.value = {
    attachments: [],
    tags: [],
    members: [],
    milestones: [],
    ...data,
    budget: data.budget || 0,
    actualCost: data.actualCost || 0,
    spentHours: data.spentHours || 0,
    progress: data.progress || 0,
    members: (data.members || []).length ? data.members : [defaultMember(1)],
    milestones: (data.milestones || []).length ? data.milestones : createMilestonesByType(data.projectType || '1'),
  }
  const permissionRes = await getFieldPermissions(route.query.id)
  fieldPermissionResult.value = permissionRes?.data || permissionRes || null
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isProjectFormRoute()) return
    loadProject()
  },
  { immediate: true },
)

function resequenceMembers() {
  form.value.members = form.value.members.map((item, index) => ({
    ...item,
    sort: index + 1,
  }))
}

function resequenceMilestones() {
  form.value.milestones = form.value.milestones.map((item, index) => ({
    ...item,
    sort: index + 1,
  }))
}

function addMemberRow() {
  form.value.members.push(defaultMember(form.value.members.length + 1))
}

function removeMemberRow(index) {
  const target = form.value.members[index]
  if (!target) return
  if (form.value.members.length === 1 && !target.id) {
    form.value.members = [defaultMember(1)]
  } else {
    form.value.members.splice(index, 1)
  }
  resequenceMembers()
}

function getMemberRoleText(role) {
  return memberRoleOptions[role] || '-'
}

function getMilestoneStatusText(statusValue) {
  return ({ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[statusValue] || '-')
}

function addMilestoneRow() {
  milestonesManuallyEdited.value = true
  form.value.milestones.push(defaultMilestone(form.value.milestones.length + 1))
}

function removeMilestoneRow(index) {
  milestonesManuallyEdited.value = true
  if (form.value.milestones.length === 1) {
    form.value.milestones = [defaultMilestone(1)]
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
  const payload = {
    ...form.value,
    contractId: form.value.contractId || null,
    opportunityId: form.value.opportunityId || null,
    members: form.value.members
      .filter((item) => item.userId && item.role)
      .map((item, index) => ({
        id: item.id,
        userId: item.userId,
        role: item.role,
        remark: item.remark || '',
        sort: Number(item.sort ?? (index + 1) * 10),
        isCore: item.isCore || '0',
      })),
    milestones: form.value.milestones
      .filter((item) => item.name)
      .map((item, index) => ({
        id: item.id,
        name: item.name,
        dueDate: item.dueDate,
        ownerId: item.ownerId || '',
        description: item.description || '',
        delayReason: item.delayReason || '',
        sort: Number(item.sort ?? (index + 1) * 10),
        status: item.status || '1',
        deliverables: item.deliverables || [],
      })),
  }

  if (isCreate.value) {
    payload.phase = 'init'
    payload.status = '1'
    payload.actualStartDate = ''
    payload.actualEndDate = ''
    payload.phaseStartDate = ''
    payload.phaseEndDate = ''
    payload.actualCost = 0
    payload.spentHours = 0
    payload.riskLevel = ''
    payload.qualityLevel = ''
    payload.closeSummary = ''
    payload.closeDeliverables = ''
    payload.closeOpenIssues = ''
    payload.closeReview = ''
    payload.acceptanceDate = ''
    payload.members = payload.members.map((item) => ({
      userId: item.userId,
      role: item.role,
      isCore: item.isCore,
      sort: item.sort,
    }))
    payload.milestones = payload.milestones.map((item) => ({
      name: item.name,
      dueDate: item.dueDate,
      sort: item.sort,
    }))
  }

  return payload
}

function persistProject(payload, api) {
  return api(payload).then((res) => {
    const savedProjectId = String(res?.id || res?.data?.id || payload.id || '')
    if (!savedProjectId) {
      throw new Error('项目保存成功，但未获取到项目ID，无法继续处理')
    }
    form.value.id = savedProjectId
    if (!isEdit.value) {
      router.replace({ path: '/projectManage/form', query: { id: savedProjectId } })
    }
    return savedProjectId
  })
}

function launchProjectApproval(savedProjectId) {
  return submitApproval(savedProjectId)
}

function saveProject(triggerApproval = false) {
  if ((isEdit.value && !canProjectUpdate.value) || (!isEdit.value && !canProjectAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  if (isEdit.value && !canEditCurrentProject.value) {
    return $sdk.msgWarning('执行中的项目不允许编辑')
  }
  if (triggerApproval && !canProjectSubmitApproval.value) {
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
    if (triggerApproval) {
      const invalidMilestone = payload.milestones.find((item) => !item.name || !item.dueDate)
      if (invalidMilestone) {
        return $sdk.msgWarning('发起立项审批前，请补齐所有关键里程碑的名称和计划日期')
      }
      if (!payload.baselineDeliverables?.trim()) {
        return $sdk.msgWarning('发起立项审批前，请补齐主要交付物')
      }
      if (!payload.scopeBoundary?.trim()) {
        return $sdk.msgWarning('发起立项审批前，请补齐范围边界说明')
      }
    }
    const api = isEdit.value ? update : save
    if (triggerApproval) {
      approvalLoading.value = true
    } else {
      saveLoading.value = true
    }
    persistProject(payload, api)
      .then(async (savedProjectId) => {
        if (triggerApproval) {
          try {
            await launchProjectApproval(savedProjectId)
            $sdk.msgSuccess('立项审批提交成功')
            router.push({ path: '/projectManage/approval', query: { id: savedProjectId } })
          } catch (error) {
            $sdk.msgWarning('项目已保存，立项审批发起失败，请在审批页重试')
            router.push({ path: '/projectManage/approval', query: { id: savedProjectId, approvalFailed: '1' } })
          }
        } else {
          $sdk.msgSuccess(isEdit.value ? '暂存成功' : '新建项目已暂存')
          router.back()
        }
      })
      .catch((error) => {
        const payload = error?.response?.data || {}
        const message = String(payload?.message || error?.message || '项目保存失败')
        $sdk.msgError(message)
      })
      .finally(() => {
        saveLoading.value = false
        approvalLoading.value = false
      })
  })
}

function submitCloseApproval() {
  if (!isEdit.value) {
    return $sdk.msgWarning('请先保存项目后再发起结项审批')
  }
  if (!form.value.closeSummary?.trim()) {
    return $sdk.msgWarning('发起结项审批前，请补齐验收说明')
  }
  if (!form.value.closeDeliverables?.trim()) {
    return $sdk.msgWarning('发起结项审批前，请补齐交付清单')
  }
  if (!form.value.closeReview?.trim()) {
    return $sdk.msgWarning('发起结项审批前，请补齐项目复盘')
  }
  saveLoading.value = true
  update(form.value).then(() => {
    return submitClose(form.value.id || route.query.id)
  }).then(() => {
    $sdk.msgSuccess('结项审批提交成功')
    router.replace({ path: '/projectManage/detail', query: { id: form.value.id || route.query.id } })
  }).catch((e) => {
    $sdk.msgError(e.message || '提交结项审批失败')
  }).finally(() => {
    saveLoading.value = false
  })
}

function submit() {
  saveProject(false)
}

function submitProjectApproval() {
  saveProject(true)
}

function cancel() {
  router.back()
}

function updateStickyBarStyle() {
  const shellElement = shellRef.value
  if (!shellElement) return
  const rect = shellElement.getBoundingClientRect()
  stickyBarStyle.value = {
    left: `${Math.max(rect.left, 12)}px`,
    width: `${Math.max(rect.width, 0)}px`,
  }
}

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  updateViewportWidth()
  updateStickyBarStyle()
  window.addEventListener('resize', updateViewportWidth)
  window.addEventListener('resize', updateStickyBarStyle)
  if (typeof ResizeObserver !== 'undefined' && shellRef.value) {
    stickyBarResizeObserver = new ResizeObserver(() => {
      updateViewportWidth()
      updateStickyBarStyle()
    })
    stickyBarResizeObserver.observe(shellRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
  window.removeEventListener('resize', updateStickyBarStyle)
  stickyBarResizeObserver?.disconnect()
  stickyBarResizeObserver = null
})
</script>

<template>
  <div class="project-form-page km-page">
    <div ref="shellRef" class="Gcard km-panel project-form-shell">
      <el-form ref="formRef" :model="form" :rules="rules" :label-position="formLabelPosition" :label-width="isCompactScreen ? 'auto' : '100px'" style="--FormItemContentMaxWidth: 100%;">
      <div class="project-sections">
        <el-alert
          v-if="!isCreate && isClosureMode && !isView"
          type="info"
          :closable="false"
          show-icon
          class="mb-16"
          title="项目已立项，当前页面仅允许维护结项资料与复盘，项目主数据和基线计划已冻结。"
        />
        <section v-if="(canViewGroup('projectBasic') || canViewGroup('projectPlan') || canViewGroup('projectBusiness')) && isDraftMode" class="section-card section-card--basic">
          <div class="section-header section-header--stack km-section-header">
            <div>
              <div class="section-title km-section-title">基本信息</div>
              <div class="section-desc km-section-desc">维护项目基础属性、负责人、时间计划和预算进度，让项目启动信息一目了然。</div>
            </div>
          </div>
            <div class="project-basic-fields">
            <el-row v-if="canViewGroup('projectBasic')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目名称" prop="name">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="form.name" />
                  <el-input v-else v-model="form.name" placeholder="请输入项目名称" maxlength="100" show-word-limit />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目编号">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="form.code" />
                  <el-input v-else v-model="form.code" placeholder="保存后自动生成" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBasic')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="所属部门" prop="departmentId">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="deptMap[form.departmentId]" />
                  <el-select v-else v-model="form.departmentId" placeholder="请选择所属部门" style="width: 100%" clearable>
                    <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目分类">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="form.category" />
                  <el-input v-else v-model="form.category" placeholder="请输入项目分类" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectPlan') && !isCreate && false" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目阶段">
                  <ViewField :value="form.phase" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBasic') || canViewGroup('projectBusiness')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="客户">
                  <ViewEntity v-if="isGroupReadonly('projectBusiness')" :title="currentCustomer?.name" :subtitle="currentCustomer?.code" />
                  <el-select v-else v-model="form.customerId" placeholder="请选择客户" style="width: 100%" clearable>
                    <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="来源合同">
                  <ViewEntity v-if="form.contract" :title="form.contract?.name" :subtitle="form.contract?.code" />
                  <ViewField v-else value="-" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="来源商机">
                  <ViewEntity v-if="form.opportunity" :title="form.opportunity?.name" :subtitle="form.opportunity?.code" />
                  <ViewField v-else value="-" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目类型" prop="projectType">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="projectType[form.projectType]" />
                  <el-select v-else v-model="form.projectType" placeholder="请选择项目类型" style="width: 100%" :disabled="isEdit">
                    <el-option v-for="(value, key) in projectType" :key="key" :label="value" :value="key" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBasic')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目标签">
                  <ViewField v-if="isGroupReadonly('projectBasic')" :value="(form.tags || []).join('、')" />
                  <el-select v-else v-model="form.tags" multiple filterable allow-create default-first-option collapse-tags collapse-tags-tooltip placeholder="请输入或选择标签" style="width: 100%">
                    <el-option v-for="tag in form.tags || []" :key="tag" :label="tag" :value="tag" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目发起人" prop="creatorId">
                  <ViewUser v-if="isGroupReadonly('projectBasic')" :user="form.creator" />
                  <UserSelect v-else v-model="form.creatorId" placeholder="请选择项目发起人" clearable />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBasic')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="项目负责人" prop="leaderId">
                  <ViewUser v-if="isGroupReadonly('projectBasic')" :user="form.leader" />
                  <UserSelect v-else v-model="form.leaderId" placeholder="请选择项目负责人" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="优先级" prop="priority">
                  <ViewTagField v-if="isGroupReadonly('projectBasic')" :text="priority[form.priority]" :type="form.priority === '3' ? 'danger' : form.priority === '2' ? 'warning' : 'info'" />
                  <el-select v-else v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                    <el-option v-for="(value, key) in priority" :key="key" :label="value" :value="key" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectPlan') && !isCreate" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="计划开始" prop="planStartDate">
                  <ViewField v-if="isGroupReadonly('projectPlan')" :value="form.planStartDate" />
                  <el-date-picker v-else v-model="form.planStartDate" type="date" placeholder="选择计划开始时间" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="计划结束" prop="planEndDate">
                  <ViewField v-if="isGroupReadonly('projectPlan')" :value="form.planEndDate" />
                  <el-date-picker v-else v-model="form.planEndDate" type="date" placeholder="选择计划结束时间" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectPlan') && !isCreate" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="实际开始">
                  <ViewField :value="form.actualStartDate" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="实际结束">
                  <ViewField :value="form.actualEndDate" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectPlan')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="12">
                <el-form-item label="开始时间" prop="startDate">
                  <ViewField v-if="isGroupReadonly('projectPlan')" :value="form.startDate" />
                  <el-date-picker v-else v-model="form.startDate" type="date" placeholder="选择开始时间" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="结束时间" prop="endDate">
                  <ViewField v-if="isGroupReadonly('projectPlan')" :value="form.endDate" />
                  <el-date-picker v-else v-model="form.endDate" type="date" placeholder="选择结束时间" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBusiness')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="8">
                <el-form-item label="项目预算">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.budget" />
                  <el-input-number v-else v-model="form.budget" :min="0" :precision="2" :step="1000" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="币种">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.currency" />
                  <el-select v-else v-model="form.currency" placeholder="请选择币种" style="width: 100%" clearable>
                    <el-option label="CNY" value="CNY" />
                    <el-option label="USD" value="USD" />
                    <el-option label="EUR" value="EUR" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBusiness') && false" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="8">
                <el-form-item label="风险等级">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.riskLevel" />
                  <el-select v-else v-model="form.riskLevel" placeholder="请选择风险等级" style="width: 100%" clearable>
                    <el-option label="低" value="low" />
                    <el-option label="中" value="medium" />
                    <el-option label="高" value="high" />
                    <el-option label="严重" value="critical" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="质量等级">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.qualityLevel" />
                  <el-select v-else v-model="form.qualityLevel" placeholder="请选择质量等级" style="width: 100%" clearable>
                    <el-option label="低" value="low" />
                    <el-option label="中" value="medium" />
                    <el-option label="高" value="high" />
                    <el-option label="优秀" value="excellent" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="canViewGroup('projectBusiness')" :gutter="20" class="basic-info-row">
              <el-col :xs="24" :sm="8">
                <el-form-item label="业务线">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.businessLine" />
                  <el-input v-else v-model="form.businessLine" placeholder="请输入业务线" maxlength="100" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="行业">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.industry" />
                  <el-input v-else v-model="form.industry" placeholder="请输入行业" maxlength="100" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item label="项目来源">
                  <ViewField v-if="isGroupReadonly('projectBusiness')" :value="form.projectSource" />
                  <el-input v-else v-model="form.projectSource" placeholder="请输入项目来源" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item v-if="!isCreate" label="进度(%)" class="basic-info-progress-item">
              <div class="progress-readonly-field">
                <ViewField :value="form.progress" />
                <div class="progress-readonly-field__tip">项目进度由任务完成率自动计算</div>
              </div>
            </el-form-item>
            <el-form-item v-if="canViewGroup('projectBusiness') && !isCreate" label="累计工时" class="basic-info-progress-item">
              <div class="progress-readonly-field">
                <ViewField :value="form.spentHours" />
                <div class="progress-readonly-field__tip">项目累计工时由任务工时自动汇总</div>
              </div>
            </el-form-item>
            </div>
        </section>

        <section v-if="isDraftMode" class="section-card section-card--table">
          <div class="section-header km-section-header">
            <div>
              <div class="section-title km-section-title">项目成员</div>
              <div class="section-desc km-section-desc">新建阶段先补齐核心成员。提醒、作用域、权限组等治理字段在项目创建后继续完善。</div>
            </div>
            <el-button v-if="!isView" type="primary" :icon="Plus" @click="addMemberRow">添加成员</el-button>
          </div>

          <div v-if="!isMobileScreen" class="table-wrapper table-wrapper--members" :class="{ 'table-wrapper--members-compact': isTabletScreen }">
            <el-table :data="form.members" border class="edit-table members-table">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="成员" width="260">
                <template #default="{ row }">
                  <ViewUser v-if="isView" :user="row.user" />
                  <div v-else class="cell-editor">
                    <UserSelect v-model="row.userId" placeholder="请选择成员" :disabled="isView" clearable />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="角色" width="180">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="memberRoleOptions[row.role]" />
                  <div v-else class="cell-editor">
                    <el-select v-model="row.role" placeholder="请选择角色" style="width: 100%" :disabled="isView">
                      <el-option v-for="(label, key) in memberRoleOptions" :key="key" :label="label" :value="key" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="核心成员" width="110">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.isCore === '1' ? '是' : '否'" />
                  <el-switch v-else v-model="row.isCore" active-value="1" inactive-value="0" :disabled="isView" />
                </template>
              </el-table-column>
              <el-table-column label="备注" width="220">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.remark" />
                  <div v-else class="cell-editor">
                    <el-input v-model="row.remark" placeholder="请输入备注" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.sort" />
                  <div v-else class="cell-editor cell-editor--compact">
                    <el-input-number v-model="row.sort" :min="0" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isView" label="操作" width="120">
                <template #default="{ $index }">
                  <div class="cell-action">
                    <el-button type="danger" link :icon="Delete" @click="removeMemberRow($index)">{{ form.members[$index]?.id ? '退出' : '移除' }}</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="mobile-card-list">
            <div v-for="(row, index) in form.members" :key="row.id || index" class="mobile-edit-card">
              <div class="mobile-edit-card__header">
                <div class="mobile-edit-card__title">成员 {{ index + 1 }}</div>
                <el-button v-if="!isView" type="danger" link :icon="Delete" @click="removeMemberRow(index)">{{ row.id ? '退出' : '移除' }}</el-button>
              </div>
              <div class="mobile-edit-card__grid">
                <el-form-item label="成员" class="mobile-edit-card__item">
                  <ViewUser v-if="isView" :user="row.user" />
                  <UserSelect v-else v-model="row.userId" placeholder="请选择成员" clearable />
                </el-form-item>
                <el-form-item label="角色" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="getMemberRoleText(row.role)" />
                  <el-select v-else v-model="row.role" placeholder="请选择角色" style="width: 100%">
                    <el-option v-for="(label, key) in memberRoleOptions" :key="key" :label="label" :value="key" />
                  </el-select>
                </el-form-item>
                <el-form-item label="核心成员" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="row.isCore === '1' ? '是' : '否'" />
                  <el-switch v-else v-model="row.isCore" active-value="1" inactive-value="0" />
                </el-form-item>
                <el-form-item label="排序" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="row.sort" />
                  <el-input-number v-else v-model="row.sort" :min="0" style="width: 100%" />
                </el-form-item>
                <el-form-item label="备注" class="mobile-edit-card__item mobile-edit-card__item--full">
                  <ViewField v-if="isView" :value="row.remark" />
                  <el-input v-else v-model="row.remark" type="textarea" :rows="2" placeholder="请输入备注" />
                </el-form-item>
              </div>
            </div>
          </div>
        </section>

        <section v-if="canViewGroup('projectPlan') && isDraftMode" class="section-card section-card--table" style="--FormItemContentMaxWidth: 100%;">
          <div class="section-header km-section-header section-header--stack">
            <div>
              <div class="section-title km-section-title">立项基线计划</div>
              <div class="section-desc km-section-desc">立项审批前先收口项目的时间承诺、关键里程碑、主要交付物与范围边界。正式立项后，再在项目详情页继续细化执行计划。</div>
            </div>
          </div>

          <div class="project-baseline-plan-grid">
            <el-form-item label="主要交付物" prop="baselineDeliverables" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.baselineDeliverables" />
              <el-input v-else v-model="form.baselineDeliverables" type="textarea" :rows="3" placeholder="请输入本项目的主要交付物，如实施方案、培训材料、上线清单、验收资料等" />
            </el-form-item>

            <el-form-item label="范围边界" prop="scopeBoundary" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.scopeBoundary" />
              <el-input v-else v-model="form.scopeBoundary" type="textarea" :rows="3" placeholder="请输入本项目的范围边界、约束条件或不在本次交付范围内的事项" />
            </el-form-item>

            <el-form-item label="计划说明" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.baselinePlanNote" />
              <el-input v-else v-model="form.baselinePlanNote" type="textarea" :rows="3" placeholder="可选，补充说明本次基线计划的假设前提、关键依赖或阶段说明" />
            </el-form-item>
          </div>
        </section>

        <section v-if="canViewGroup('projectPlan') && isDraftMode" class="section-card section-card--table">
          <div class="section-header km-section-header">
            <div>
              <div class="section-title km-section-title">里程碑计划</div>
              <div class="section-desc km-section-desc">新建阶段先录入关键里程碑与计划完成日期，执行中的责任人、状态、延期原因和影响标记在项目详情中继续维护。</div>
            </div>
            <div class="section-actions">
              <el-button v-if="!isView" @click="resetMilestoneTemplate">重置模板</el-button>
              <el-button v-if="!isView" type="primary" :icon="Plus" @click="addMilestoneRow">添加里程碑</el-button>
            </div>
          </div>

          <div v-if="!isMobileScreen" class="table-wrapper table-wrapper--milestones" :class="{ 'table-wrapper--milestones-wide': !isCreate, 'table-wrapper--milestones-compact': isTabletScreen }">
            <el-table :data="form.milestones" border class="edit-table milestones-table" @cell-click="milestonesManuallyEdited = true">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="里程碑名称" width="180">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.name" />
                  <div v-else class="cell-editor">
                    <el-input v-model="row.name" placeholder="请输入里程碑名称" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="计划完成日期" width="140">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.dueDate" />
                  <div v-else class="cell-editor">
                    <el-date-picker v-model="row.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isCreate" label="责任人" width="150">
                <template #default="{ row }">
                  <ViewUser v-if="isView" :user="row.owner" />
                  <div v-else class="cell-editor">
                    <UserSelect v-model="row.ownerId" placeholder="请选择责任人" clearable />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isCreate" label="状态" width="130">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="{ '1': '待完成', '2': '已完成', '3': '已延期', '4': '已取消' }[row.status]" />
                  <div v-else class="cell-editor">
                    <el-select v-model="row.status" style="width: 100%" :disabled="isView">
                      <el-option label="待完成" value="1" />
                      <el-option label="已完成" value="2" />
                      <el-option label="已延期" value="3" />
                      <el-option label="已取消" value="4" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isCreate" label="交付物" width="220">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="(row.deliverables || []).join('、')" />
                  <div v-else class="cell-editor">
                    <el-select v-model="row.deliverables" multiple filterable allow-create default-first-option collapse-tags collapse-tags-tooltip placeholder="请输入交付物" style="width: 100%" :disabled="isView">
                      <el-option v-for="item in row.deliverables || []" :key="item" :label="item" :value="item" />
                    </el-select>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isCreate" label="描述" width="180">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.description" />
                  <div v-else class="cell-editor">
                    <el-input v-model="row.description" placeholder="请输入说明" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isCreate" label="延期原因" width="180">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.delayReason" />
                  <div v-else class="cell-editor">
                    <el-input v-model="row.delayReason" placeholder="请输入延期原因" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120">
                <template #default="{ row }">
                  <ViewField v-if="isView" :value="row.sort" />
                  <div v-else class="cell-editor cell-editor--compact">
                    <el-input-number v-model="row.sort" :min="0" style="width: 100%" :disabled="isView" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="!isView" label="操作" width="120">
                <template #default="{ $index }">
                  <div class="cell-action">
                    <el-button type="danger" link :icon="Delete" @click="removeMilestoneRow($index)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="mobile-card-list">
            <div v-for="(row, index) in form.milestones" :key="row.id || `${row.name}-${index}`" class="mobile-edit-card">
              <div class="mobile-edit-card__header">
                <div class="mobile-edit-card__title">里程碑 {{ index + 1 }}</div>
                <el-button v-if="!isView" type="danger" link :icon="Delete" @click="removeMilestoneRow(index)">删除</el-button>
              </div>
              <div class="mobile-edit-card__grid">
                <el-form-item label="名称" class="mobile-edit-card__item mobile-edit-card__item--full">
                  <ViewField v-if="isView" :value="row.name" />
                  <el-input v-else v-model="row.name" placeholder="请输入里程碑名称" />
                </el-form-item>
                <el-form-item label="计划日期" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="row.dueDate" />
                  <el-date-picker v-else v-model="row.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
                </el-form-item>
                <el-form-item v-if="!isCreate" label="责任人" class="mobile-edit-card__item">
                  <ViewUser v-if="isView" :user="row.owner" />
                  <UserSelect v-else v-model="row.ownerId" placeholder="请选择责任人" clearable />
                </el-form-item>
                <el-form-item v-if="!isCreate" label="状态" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="getMilestoneStatusText(row.status)" />
                  <el-select v-else v-model="row.status" style="width: 100%">
                    <el-option label="待完成" value="1" />
                    <el-option label="已完成" value="2" />
                    <el-option label="已延期" value="3" />
                    <el-option label="已取消" value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="排序" class="mobile-edit-card__item">
                  <ViewField v-if="isView" :value="row.sort" />
                  <el-input-number v-else v-model="row.sort" :min="0" style="width: 100%" />
                </el-form-item>
                <el-form-item v-if="!isCreate" label="交付物" class="mobile-edit-card__item mobile-edit-card__item--full">
                  <ViewField v-if="isView" :value="(row.deliverables || []).join('、')" />
                  <el-select v-else v-model="row.deliverables" multiple filterable allow-create default-first-option collapse-tags collapse-tags-tooltip placeholder="请输入交付物" style="width: 100%">
                    <el-option v-for="item in row.deliverables || []" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="!isCreate" label="描述" class="mobile-edit-card__item mobile-edit-card__item--full">
                  <ViewField v-if="isView" :value="row.description" />
                  <el-input v-else v-model="row.description" type="textarea" :rows="2" placeholder="请输入说明" />
                </el-form-item>
                <el-form-item v-if="!isCreate" label="延期原因" class="mobile-edit-card__item mobile-edit-card__item--full">
                  <ViewField v-if="isView" :value="row.delayReason" />
                  <el-input v-else v-model="row.delayReason" type="textarea" :rows="2" placeholder="请输入延期原因" />
                </el-form-item>
              </div>
            </div>
          </div>
        </section>

        <section v-if="isDraftMode" class="section-card section-card--content">
          <div class="section-header section-header--stack km-section-header">
            <div>
              <div class="section-title km-section-title">项目描述与附件</div>
              <div class="section-desc km-section-desc">补充项目背景、范围说明以及相关附件资料，减少后续沟通信息缺口。</div>
            </div>
          </div>

          <el-form-item label="项目描述">
            <ViewRichText v-if="isView" :html="form.description" />
            <Editor v-else v-model="form.description" style="min-height: 260px" />
          </el-form-item>

          <el-form-item label="项目附件" class="project-attachments-item">
            <ViewFileList v-if="isView" :files="form.attachments || []" />
            <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
          </el-form-item>
        </section>

        <section v-if="!isCreate && canViewGroup('projectClosure')" class="section-card section-card--table">
          <div class="section-header km-section-header section-header--stack">
            <div>
              <div class="section-title km-section-title">结项资料与复盘</div>
              <div class="section-desc km-section-desc">在发起结项审批前，先沉淀验收说明、交付清单、遗留问题和项目复盘，让结项从流程动作变成业务闭环。</div>
            </div>
            <div v-if="!isView && isEdit" class="section-header__actions">
              <el-button @click="router.push({ path: '/goLiveManage/form', query: { projectId: form.id || route.query.id } })">新增上线单</el-button>
              <el-button @click="router.push({ path: '/acceptanceManage/form', query: { projectId: form.id || route.query.id } })">新增验收单</el-button>
              <el-button @click="router.push({ path: '/handoverManage/form', query: { projectId: form.id || route.query.id } })">新增运维交接单</el-button>
              <el-button type="warning" @click="submitCloseApproval">提交结项审批</el-button>
            </div>
          </div>

          <div class="project-baseline-plan-grid">
            <el-form-item label="验收日期" class="project-baseline-plan-grid__item">
              <ViewField v-if="isView" :value="form.acceptanceDate" />
              <el-date-picker v-else v-model="form.acceptanceDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择验收日期" style="width: 100%" />
            </el-form-item>

            <el-form-item label="验收说明" prop="closeSummary" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.closeSummary" />
              <el-input v-else v-model="form.closeSummary" type="textarea" :rows="3" placeholder="请输入项目验收情况、验收范围、验收结论等内容" />
            </el-form-item>

            <el-form-item label="交付清单" prop="closeDeliverables" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.closeDeliverables" />
              <el-input v-else v-model="form.closeDeliverables" type="textarea" :rows="3" placeholder="请输入最终交付物清单，如实施成果、培训材料、上线资料、交接内容等" />
            </el-form-item>

            <el-form-item label="遗留问题" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.closeOpenIssues" />
              <el-input v-else v-model="form.closeOpenIssues" type="textarea" :rows="3" placeholder="请输入尚未关闭但已达成处理共识的遗留问题、后续安排或风险说明" />
            </el-form-item>

            <el-form-item label="项目复盘" prop="closeReview" class="project-baseline-plan-grid__item project-baseline-plan-grid__item--wide">
              <ViewField v-if="isView" :value="form.closeReview" />
              <el-input v-else v-model="form.closeReview" type="textarea" :rows="4" placeholder="请输入项目复盘，包括关键经验、问题原因、改进建议和可复用实践" />
            </el-form-item>
          </div>
        </section>
      </div>

      <div class="project-form-sticky-actions" :style="stickyBarStyle">
        <div class="project-form-sticky-actions__meta">
          <span class="project-form-sticky-actions__title">{{ pageStatusText }}</span>
          <span v-if="!isMobileScreen" class="project-form-sticky-actions__desc">
            {{ isView ? '当前为查看模式，可直接返回上一页。' : '当前页面支持分区录入，底部统一收口操作。' }}
          </span>
        </div>
        <div class="footer-actions project-form-sticky-actions__buttons">
          <el-button
            v-if="!isView && ((isEdit && isDraftMode && canProjectUpdate) || (isCreate && canProjectAdd))"
            type="primary"
            :loading="saveLoading"
            :disabled="approvalLoading"
            @click="submit">
            暂存
          </el-button>
          <el-button
            v-if="!isView && canProjectSubmitApproval && form.status === '1'"
            type="primary"
            :loading="approvalLoading"
            :disabled="saveLoading"
            @click="submitProjectApproval">
            发起项目立项审批
          </el-button>
          <el-button @click="cancel">{{ isView ? '返回' : '取消' }}</el-button>
        </div>
      </div>
    </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-form-page {
  min-height: 100%;
  padding-bottom: 120px;
}

.project-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.project-form-shell :deep(.el-form--label-top .el-form-item__label) {
  padding: 0 0 6px;
}

.project-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}

.section-card {
  padding: 22px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  min-width: 0;
  max-width: 100%;
}

.section-header--stack {
  justify-content: flex-start;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-card--basic .section-header {
  margin-bottom: 18px;
}

.section-card--table .section-header {
  margin-bottom: 20px;
}

.section-card--table .table-wrapper {
  margin-top: 4px;
}

.project-basic-fields :deep(.el-form-item) {
  margin-bottom: 10px;
}

.project-basic-fields :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.project-baseline-plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
}

.project-baseline-plan-grid__item {
  margin-bottom: 0 !important;
}

.project-baseline-plan-grid__item--wide {
  grid-column: 1 / -1;
}

.project-baseline-plan-grid :deep(.el-textarea__inner) {
  min-height: 96px;
}

.section-card :deep(.el-form-item) {
  margin-bottom: 10px;
}

.section-card :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.project-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-edit-card {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.mobile-edit-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.mobile-edit-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mobile-edit-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mobile-edit-card__item {
  margin-bottom: 0 !important;
}

.mobile-edit-card__item--full {
  grid-column: 1 / -1;
}

.progress-readonly-field {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f7f7;
  border: 1px solid var(--el-border-color-lighter);
}

.progress-readonly-field__tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.section-card--content .section-header {
  margin-bottom: 20px;
}

.section-card--content :deep(.el-form-item) {
  margin-bottom: 10px;
}

.section-card--content :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.basic-info-row {
  margin-bottom: 10px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.basic-info-progress-item {
  margin-top: 10px;
  padding-top: 16px;
}

.project-attachments-item {
  padding-top: 12px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.edit-table {
  width: 100%;
  --el-table-cell-padding: 0;
}

.edit-table :deep(th.el-table__cell) {
  background: #f7f7f7;
  height: 34px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.edit-table :deep(th.el-table__cell),
.edit-table :deep(td.el-table__cell) {
  padding-top: 0;
  padding-bottom: 0;
}

.edit-table :deep(.el-table__row .el-table__cell) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.edit-table :deep(.cell) {
  line-height: 1.2;
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 6px;
  padding-right: 6px;
}

.table-wrapper {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.table-wrapper--milestones {
  padding-bottom: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  border-radius: 10px;
}

.table-wrapper--milestones-wide :deep(.el-table) {
  min-width: 1280px;
  width: 1280px;
  max-width: none;
}

.table-wrapper--milestones-wide :deep(.el-table__inner-wrapper),
.table-wrapper--milestones-wide :deep(.el-table__header-wrapper),
.table-wrapper--milestones-wide :deep(.el-table__body-wrapper),
.table-wrapper--milestones-wide :deep(table) {
  min-width: 1280px;
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

.edit-table :deep(.el-input__wrapper),
.edit-table :deep(.el-select__wrapper) {
  padding-inline: 8px;
}

.edit-table :deep(.el-textarea__inner) {
  padding: 4px 8px;
}

.cell-editor {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
}

.members-table :deep(tbody tr),
.milestones-table :deep(tbody tr) {
  height: 28px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button),
.footer-actions .el-button {
  min-width: 112px;
}

.footer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.project-form-sticky-actions {
  position: fixed;
  bottom: 16px;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
}

.project-form-sticky-actions--mobile {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.project-form-sticky-actions__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.project-form-sticky-actions__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.project-form-sticky-actions__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.project-form-sticky-actions__buttons {
  justify-content: flex-end;
}

.project-form-sticky-actions__buttons :deep(.el-button) {
  min-width: 112px;
}

@media (max-width: 1024px) {
  .project-form-page {
    padding-bottom: 132px;
  }

  .project-baseline-plan-grid {
    grid-template-columns: 1fr;
  }

  .table-wrapper--milestones-wide :deep(.el-table),
  .table-wrapper--milestones-wide :deep(.el-table__inner-wrapper),
  .table-wrapper--milestones-wide :deep(.el-table__header-wrapper),
  .table-wrapper--milestones-wide :deep(.el-table__body-wrapper),
  .table-wrapper--milestones-wide :deep(table) {
    min-width: 1120px;
    width: 1120px;
  }

  .table-wrapper--members-compact :deep(.el-table),
  .table-wrapper--members-compact :deep(.el-table__inner-wrapper),
  .table-wrapper--members-compact :deep(.el-table__header-wrapper),
  .table-wrapper--members-compact :deep(.el-table__body-wrapper),
  .table-wrapper--members-compact :deep(table) {
    min-width: 860px;
    width: 860px;
  }

  .table-wrapper--milestones-compact :deep(.el-table),
  .table-wrapper--milestones-compact :deep(.el-table__inner-wrapper),
  .table-wrapper--milestones-compact :deep(.el-table__header-wrapper),
  .table-wrapper--milestones-compact :deep(.el-table__body-wrapper),
  .table-wrapper--milestones-compact :deep(table) {
    min-width: 960px;
    width: 960px;
  }
}

@media (max-width: 768px) {
  .project-form-page {
    padding-bottom: 212px;
  }

  .section-card {
    padding: 18px;
  }

  .project-sections {
    gap: 16px;
  }

  .project-form-shell :deep(.el-form-item__label) {
    padding: 0 0 6px;
  }

  .project-form-sticky-actions {
    flex-direction: column;
    align-items: stretch;
    bottom: 12px;
    padding: 14px;
  }

  .project-form-sticky-actions__meta {
    gap: 0;
  }

  .project-form-sticky-actions__title {
    line-height: 1.2;
  }

  .project-form-sticky-actions__buttons {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 8px;
  }

  .project-form-sticky-actions__buttons :deep(.el-button) {
    width: 100%;
    min-width: 0;
  }

  .table-wrapper--milestones {
    margin-inline: -6px;
    padding-inline: 6px;
  }

  .mobile-edit-card__grid {
    grid-template-columns: 1fr;
  }

  .mobile-edit-card {
    padding: 12px;
  }

  .mobile-edit-card__header {
    margin-bottom: 10px;
  }

  .mobile-edit-card__item--full {
    grid-column: auto;
  }

  .table-wrapper--milestones-wide :deep(.el-table),
  .table-wrapper--milestones-wide :deep(.el-table__inner-wrapper),
  .table-wrapper--milestones-wide :deep(.el-table__header-wrapper),
  .table-wrapper--milestones-wide :deep(.el-table__body-wrapper),
  .table-wrapper--milestones-wide :deep(table) {
    min-width: 980px;
    width: 980px;
  }

}

</style>
