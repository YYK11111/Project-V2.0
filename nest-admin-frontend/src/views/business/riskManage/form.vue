<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus, getLevel, getCategory } from './api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

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

if (hasRiskId.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = data || {}
  })
}

function submit() {
  if ((isEdit.value && !canRiskUpdate.value) || (!isEdit.value && !canRiskAdd.value)) {
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
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isView ? '查看风险' : isEdit ? '编辑风险' : '新增风险'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
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

      <el-form-item label="实际解决日期" v-if="isEdit.value">
        <el-date-picker v-model="form.resolvedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canRiskUpdate : canRiskAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
