<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, getList, save, update, getStatus, getType } from './api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'
import UserSelect from '@/components/UserSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  description: '',
  type: '2',
  status: '1',
  storyPoints: 0,
  acceptanceCriteria: '',
  priority: 0,
  sprintId: null,
  parentId: null,
  assigneeId: null,
  reporterId: null,
  projectId: '',
  estimatedDate: '',
})

const rules = {
  title: [{ required: true, message: '请输入故事标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
}

const statusMap = ref({})
const typeMap = ref({})
const sprintList = ref([])
const parentStoryList = ref([])

const isView = computed(() => route.query.action === 'view')
const hasStoryId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const canStoryAdd = computed(() => checkPermi(['business/stories/add']))
const canStoryUpdate = computed(() => checkPermi(['business/stories/update']))

onMounted(async () => {
  await loadOptions()
  if (hasStoryId.value) {
    loadData()
  }
})

async function loadOptions() {
  const [statusRes, typeRes, sprintRes] = await Promise.all([
    getStatus(),
    getType(),
    getSprintList({ pageNum: 1, pageSize: 100 }),
  ])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
  sprintList.value = sprintRes.list || []
}

function loadData() {
  getOne(route.query.id).then(({ data }) => {
    form.value = {
      ...data,
      storyPoints: data.storyPoints || 0,
      priority: data.priority || 0,
    }
    if (data.projectId) {
      loadParentStories(data.projectId)
    }
  })
}

watch(
  () => [route.query.id, route.query.action],
  async () => {
    if (hasStoryId.value) {
      loadData()
    } else {
      form.value = {
        title: '',
        description: '',
        type: '2',
        status: '1',
        storyPoints: 0,
        acceptanceCriteria: '',
        priority: 0,
        sprintId: null,
        parentId: null,
        assigneeId: null,
        reporterId: null,
        projectId: '',
        estimatedDate: '',
      }
      parentStoryList.value = []
    }
  },
  { immediate: true },
)

async function loadParentStories(projectId) {
  if (!projectId) {
    parentStoryList.value = []
    return
  }
  const res = await getList({ pageNum: 1, pageSize: 1000, projectId })
  parentStoryList.value = (res.list || []).filter((story) => story.id !== route.query.id)
}

async function onProjectChange(projectId) {
  form.value.parentId = null
  await loadParentStories(projectId)
}

function submit() {
  if ((isEdit.value && !canStoryUpdate.value) || (!isEdit.value && !canStoryAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
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
</script>

<template>
  <div class="story-form-page km-page">
    <div class="story-form-hero Gcard km-hero">
      <div class="story-form-hero__eyebrow km-hero__eyebrow">用户故事管理</div>
      <div class="story-form-hero__title km-hero__title">{{ isView ? '查看用户故事的业务背景、排期归属与验收标准' : isEdit ? '统一维护用户故事信息、归属关系与交付要求' : '创建新用户故事并补齐计划与验收信息' }}</div>
      <div class="story-form-hero__desc km-hero__desc">先完成故事标题、项目归属和负责人，再补齐故事点、优先级、描述与验收标准，让需求拆解更清楚、排期更顺畅、交付口径更一致。</div>
      <div class="story-form-hero__stats">
        <div class="story-form-hero__stat">
          <div class="story-form-hero__stat-label">当前模式</div>
          <div class="story-form-hero__stat-value">{{ isView ? '查看故事' : isEdit ? '编辑故事' : '新增故事' }}</div>
        </div>
        <div class="story-form-hero__stat">
          <div class="story-form-hero__stat-label">故事状态</div>
          <div class="story-form-hero__stat-value">{{ statusMap[form.status] || '待处理' }}</div>
        </div>
        <div class="story-form-hero__stat">
          <div class="story-form-hero__stat-label">故事点</div>
          <div class="story-form-hero__stat-value">{{ Number(form.storyPoints || 0) }}</div>
        </div>
        <div class="story-form-hero__stat">
          <div class="story-form-hero__stat-label">优先级</div>
          <div class="story-form-hero__stat-value">{{ Number(form.priority || 0) }}</div>
        </div>
      </div>
    </div>

    <div class="Gcard km-panel story-form-shell">
      <div class="story-form-shell__top">
        <el-page-header @back="$router.back()" :title="isView ? '用户故事详情' : isEdit ? '编辑用户故事' : '新增用户故事'" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="story-form">
        <div class="story-form-sections">
          <section class="section-card section-card--basic">
            <div class="section-header km-section-header">
              <div>
                <div class="section-title km-section-title">基本信息</div>
                <div class="section-desc km-section-desc">维护故事类型、状态、项目归属、负责人和排期信息，先把故事的执行上下文建立完整。</div>
              </div>
            </div>

            <div class="story-basic-fields">
              <el-form-item label="故事标题" prop="title">
                <ViewField v-if="isView" :value="form.title" />
                <el-input v-else v-model="form.title" placeholder="请输入故事标题" maxlength="200" show-word-limit />
              </el-form-item>

              <el-row :gutter="20" class="story-info-row">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="类型" prop="type">
                    <ViewField v-if="isView" :value="typeMap[form.type]" />
                    <el-select v-else v-model="form.type" placeholder="请选择类型" style="width: 100%">
                      <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="状态" prop="status">
                    <ViewTagField v-if="isView" :text="statusMap[form.status]" :type="form.status === '4' || form.status === '5' ? 'success' : form.status === '3' ? 'warning' : form.status === '6' ? 'danger' : 'info'" />
                    <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
                      <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="story-info-row">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="所属项目" prop="projectId">
                    <ViewEntity v-if="isView" :title="form.project?.name" :subtitle="form.project?.code" />
                    <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" @change="onProjectChange" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="父级故事">
                    <ViewEntity v-if="isView" :title="form.parent?.title" />
                    <el-select v-else v-model="form.parentId" placeholder="请选择父级故事" style="width: 100%" clearable>
                      <el-option v-for="story in parentStoryList" :key="story.id" :label="story.title" :value="story.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="story-info-row">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="所属Sprint">
                    <ViewEntity v-if="isView" :title="form.sprint?.name" />
                    <el-select v-else v-model="form.sprintId" placeholder="请选择Sprint" style="width: 100%" clearable>
                      <el-option v-for="sprint in sprintList" :key="sprint.id" :label="sprint.name" :value="sprint.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="负责人">
                    <ViewUser v-if="isView" :user="form.assignee" />
                    <UserSelect v-else v-model="form.assigneeId" placeholder="请选择负责人" clearable />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="story-info-row story-info-row--last">
                <el-col :xs="24" :sm="8">
                  <el-form-item label="故事点">
                    <ViewField v-if="isView" :value="form.storyPoints" />
                    <el-input-number v-else v-model="form.storyPoints" :min="0" :step="1" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="8">
                  <el-form-item label="优先级">
                    <ViewField v-if="isView" :value="form.priority" />
                    <el-input-number v-else v-model="form.priority" :min="0" :step="1" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="8">
                  <el-form-item label="预估日期">
                    <ViewField v-if="isView" :value="form.estimatedDate" />
                    <el-date-picker
                      v-else
                      v-model="form.estimatedDate"
                      type="date"
                      placeholder="选择日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </section>

          <section class="section-card section-card--content">
            <div class="section-header section-header--stack km-section-header">
              <div>
                <div class="section-title km-section-title">故事描述与验收</div>
                <div class="section-desc km-section-desc">补齐用户场景、需求目标和验收标准，减少开发、测试和产品之间的理解偏差。</div>
              </div>
            </div>

            <div class="story-content-fields">
              <el-form-item label="故事描述">
                <ViewField v-if="isView" :value="form.description" />
                <el-input v-else v-model="form.description" type="textarea" :rows="4" placeholder="请输入故事描述（As a... I want... So that...）" />
              </el-form-item>

              <el-form-item label="验收标准">
                <ViewField v-if="isView" :value="form.acceptanceCriteria" />
                <el-input v-else v-model="form.acceptanceCriteria" type="textarea" :rows="3" placeholder="请输入验收标准" />
              </el-form-item>
            </div>
          </section>
        </div>

        <el-form-item class="footer-actions">
          <el-button v-if="!isView && (isEdit ? canStoryUpdate : canStoryAdd)" type="primary" @click="submit">提交</el-button>
          <el-button @click="cancel">{{ isView ? '返回' : '取消' }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.story-form-page {
  padding: 0;
}

.story-form-hero__title,
.story-form-hero__desc {
  max-width: none;
}

.story-form-hero__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.story-form-hero__stat {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(64, 158, 255, 0.12);
  background: rgba(255, 255, 255, 0.72);
}

.story-form-hero__stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.story-form-hero__stat-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.story-form-shell {
  margin-top: 18px;
}

.story-form-shell__top {
  margin-bottom: 20px;
}

.story-form-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  padding: 22px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.section-header {
  margin-bottom: 18px;
}

.section-card--basic .section-header {
  margin-bottom: 22px;
}

.section-card--content .section-header {
  margin-bottom: 20px;
}

.story-basic-fields {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-content-fields {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.story-info-row {
  margin-bottom: 0;
}

.story-info-row--last {
  margin-bottom: 0;
}

.story-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.story-form {
  --FormItemContentMaxWidth: 100%;
}

.story-form :deep(.el-input),
.story-form :deep(.el-select),
.story-form :deep(.el-textarea),
.story-form :deep(.el-input-number),
.story-form :deep(.el-cascader),
.story-form :deep(.el-date-editor--daterange),
.story-form :deep(.el-date-editor--datetimerange),
.story-form :deep(.el-date-editor) {
  max-width: none;
}

.story-basic-fields :deep(.el-form-item),
.story-content-fields :deep(.el-form-item) {
  margin: 0 !important;
}

.footer-actions {
  margin-top: 4px;
  padding-top: 12px;
}

.footer-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button) {
  min-width: 112px;
}

.footer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 1080px) {
  .story-form-hero__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .story-form-hero__stats {
    grid-template-columns: 1fr;
  }

  .story-form-sections {
    gap: 18px;
  }

  .section-card {
    padding: 18px;
    border-radius: 12px;
  }
}
</style>
