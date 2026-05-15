<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus, getLevel, getCategory, publishKnowledge, convertToTask } from './api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'
import { confirmRepublishIfNeeded } from '@/utils/knowledge'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'
import FormPageShell from '@/components/FormPageShell.vue'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  category: '8',
  level: '2',
  status: '1',
  description: '',
  mitigation: '',
  impactEstimate: 0,
  ownerId: '',
  identifiedDate: '',
  dueDate: '',
  resolvedDate: '',
  attachments: [],
  sort: 0,
})

const rules = {
  name: [{ required: true, message: '请输入风险名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

const statusMap = ref({})
const levelMap = ref({})
const categoryMap = ref({})

getStatus().then(({ data }) => (statusMap.value = data || {}))
getLevel().then(({ data }) => (levelMap.value = data || {}))
getCategory().then(({ data }) => (categoryMap.value = data || {}))

const isView = computed(() => route.query.action === 'view')
const hasRiskId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const canRiskAdd = computed(() => checkPermi(['business/risks/add']))
const canRiskUpdate = computed(() => checkPermi(['business/risks/update']))
const canArticleAdd = computed(() => checkPermi(['business/articles/add']))
const canEditCurrentRisk = computed(() => !hasRiskId.value || form.value?.canEdit !== false)

const isRiskFormRoute = useCurrentRouteGuard(route, '/riskManage/form')

const defaultForm = () => ({
  name: '',
  projectId: '',
  category: '8',
  level: '2',
  status: '1',
  description: '',
  mitigation: '',
  impactEstimate: 0,
  ownerId: '',
  identifiedDate: '',
  dueDate: '',
  resolvedDate: '',
  attachments: [],
  sort: 0,
})

async function loadRisk() {
  if (!isRiskFormRoute()) return
  if (!hasRiskId.value) {
    form.value = {
      ...defaultForm(),
      projectId: String(route.query.projectId || ''),
    }
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isRiskFormRoute()) return
    loadRisk()
  },
  { immediate: true },
)

function submit() {
  if ((isEdit.value && !canRiskUpdate.value) || (!isEdit.value && !canRiskAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  if (hasRiskId.value && !canEditCurrentRisk.value) {
    return $sdk.msgWarning('当前无编辑该风险的权限')
  }
  formRef.value.validate((valid) => {
    if (valid) {
      const api = isEdit.value ? update : save
      api(form.value).then(() => {
        $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
        router.back()
      })
    }
  })
}

function cancel() {
  router.back()
}

async function handlePublishKnowledge() {
  if (!route.query.id) return
  if (!canArticleAdd.value) return $sdk.msgWarning('当前操作没有权限')
  await confirmRepublishIfNeeded({ articleId: form.value?.knowledgeArticleId, entityLabel: '风险' })
  await publishKnowledge(route.query.id)
  $sdk.msgSuccess('风险案例已沉淀到知识中心')
  await loadRisk()
}

async function handleConvertToTask() {
  if (!route.query.id) return
  const res = await convertToTask(route.query.id)
  const taskId = res?.data?.taskId || res?.taskId
  $sdk.msgSuccess('风险已转为任务')
  if (taskId) {
    router.push({ path: '/taskManage/form', query: { id: taskId } })
  }
}
</script>

<template>
  <FormPageShell class="risk-form-page risk-form-shell">
    <template #footerMeta>
      <span>{{ isView ? '查看模式' : isEdit ? '编辑模式' : '新建模式' }}</span>
      <span v-if="form.knowledgeArticleId">已沉淀知识</span>
    </template>

    <el-page-header class="business-form-header" @back="$router.back()" :title="isView ? '风险详情' : isEdit ? '编辑风险' : '新增风险'">
      <template #extra>
        <el-button v-if="form.knowledgeArticleId" type="primary" plain @click="router.push({ path: '/content/articleManage/view', query: { id: form.knowledgeArticleId } })">查看知识</el-button>
        <el-button v-if="route.query.id && canArticleAdd && canEditCurrentRisk" type="primary" plain @click="handlePublishKnowledge">{{ form.knowledgeArticleId ? '重新沉淀' : '转知识' }}</el-button>
        <el-button v-if="route.query.id && canEditCurrentRisk" type="warning" plain @click="handleConvertToTask">转任务</el-button>
      </template>
    </el-page-header>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="business-form" style="max-width: 800px; --FormItemContentMaxWidth: 100%;">
      <div class="risk-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护风险名称、归属项目、等级状态和责任人，先把风险上下文建立完整。</div>
          </div>
        </div>
        <div class="risk-section-fields">
      <el-form-item label="风险名称" prop="name">
        <ViewField v-if="isView" :value="form.name" />
        <el-input v-else v-model="form.name" placeholder="请输入风险名称" maxlength="200" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isView" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>

      <el-form-item label="风险分类">
        <ViewField v-if="isView" :value="categoryMap[form.category]" />
        <el-select v-else v-model="form.category" placeholder="请选择分类" style="width: 100%">
          <el-option v-for="(v, k) in categoryMap" :key="k" :label="v" :value="k" />
        </el-select>
      </el-form-item>

      <el-form-item label="风险等级">
        <ViewField v-if="isView" :value="levelMap[form.level]" />
        <el-select v-else v-model="form.level" placeholder="请选择等级" style="width: 100%">
          <el-option v-for="(v, k) in levelMap" :key="k" :label="v" :value="k" />
        </el-select>
      </el-form-item>

      <el-form-item label="风险状态" v-if="hasRiskId">
        <ViewTagField v-if="isView" :text="statusMap[form.status]" :type="form.status === '4' ? 'success' : form.status === '5' ? 'info' : 'warning'" />
        <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
        </el-select>
      </el-form-item>

      <el-form-item label="责任人">
        <ViewUser v-if="isView" :user="form.riskOwner" />
        <UserSelect v-else v-model="form.ownerId" placeholder="请选择责任人" clearable />
      </el-form-item>

      <el-form-item label="识别日期">
        <ViewField v-if="isView" :value="form.identifiedDate" />
        <el-date-picker v-else v-model="form.identifiedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="计划解决日期">
        <ViewField v-if="isView" :value="form.dueDate" />
        <el-date-picker v-else v-model="form.dueDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="实际解决日期" v-if="isEdit">
        <el-date-picker v-model="form.resolvedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">风险分析</div>
            <div class="section-desc">补充风险描述、应对措施和影响程度，便于后续跟踪与处理。</div>
          </div>
        </div>
        <div class="risk-section-fields">

      <el-form-item label="风险描述">
        <ViewField v-if="isView" :value="form.description" />
        <el-input v-else v-model="form.description" type="textarea" :rows="3" placeholder="请输入风险描述" />
      </el-form-item>

      <el-form-item label="应对措施">
        <ViewField v-if="isView" :value="form.mitigation" />
        <el-input v-else v-model="form.mitigation" type="textarea" :rows="3" placeholder="请输入应对措施" />
      </el-form-item>

      <el-form-item label="影响程度(%)">
        <ViewField v-if="isView" :value="form.impactEstimate" />
        <el-input-number v-else v-model="form.impactEstimate" :min="0" :max="100" />
      </el-form-item>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">关联信息与附件</div>
            <div class="section-desc">统一查看关联任务、附件材料和排序信息，减少处理过程中的信息缺口。</div>
          </div>
        </div>
        <div class="risk-section-fields">
      <el-form-item label="风险附件">
        <ViewFileList v-if="isView" :files="form.attachments || []" />
        <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item label="关联任务" v-if="form.linkedTask">
        <div class="linked-task-inline">
          <ViewEntity :title="form.linkedTask?.name" :subtitle="form.linkedTask?.code" />
          <el-button link type="primary" @click="router.push({ path: '/taskManage/form', query: { id: form.linkedTask?.id, action: 'view' } })">查看任务</el-button>
        </div>
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>
        </div>
      </section>

      </div>
    </el-form>
    <template #footer>
      <el-button v-if="!isView && (isEdit ? canRiskUpdate : canRiskAdd)" type="primary" @click="submit">提交</el-button>
      <el-button @click="cancel">取消</el-button>
    </template>
  </FormPageShell>
</template>

<style lang="scss" scoped>
.risk-form-page {
  min-height: 100%;
}

.risk-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.risk-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 22px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.section-header {
  margin-bottom: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.risk-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.risk-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

.risk-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
