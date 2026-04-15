<script setup lang="ts">
import { reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { getList, addReport, updateReport, deleteReport } from './api'
import TableOperation from '@/components/TableOperation.vue'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import { useUserStore } from '@/stores/user'
import { checkPermi } from '@/utils/permission'

const params = ref<Record<string, any>>({})
const userStore = useUserStore()
const rctRef = ref()
const formRef = ref()
const dialogVisible = ref(false)
const dialogTitle = ref('新增任务汇报')
const submitLoading = ref(false)
const currentUserId = computed(() => String(userStore.id || ''))
const canTaskReportAdd = computed(() => checkPermi(['business/tasks/timelog/add']))
const canTaskReportDelete = computed(() => checkPermi(['business/tasks/timelog/delete']))

const reportForm = reactive({
  id: '',
  taskId: '',
  workDate: dayjs().format('YYYY-MM-DD'),
  hours: 1,
  description: '',
  attachments: [],
})

const reportRules = {
  taskId: [{ required: true, message: '请输入任务ID', trigger: 'blur' }],
  workDate: [{ required: true, message: '请选择工作日期', trigger: 'change' }],
  hours: [{ required: true, message: '请输入工时', trigger: 'blur' }],
}

function resetReportForm() {
  reportForm.id = ''
  reportForm.taskId = ''
  reportForm.workDate = dayjs().format('YYYY-MM-DD')
  reportForm.hours = 1
  reportForm.description = ''
  reportForm.attachments = []
}

function handleAddReport(row?: any) {
  if (!canTaskReportAdd.value) return $sdk.msgError('当前操作没有权限')
  resetReportForm()
  reportForm.taskId = String(row?.taskId || params.value.taskId || '')
  dialogTitle.value = '新增任务汇报'
  dialogVisible.value = true
}

function handleEditReport(row: any) {
  if (!isCurrentUserReport(row)) return $sdk.msgError('只能编辑自己的任务汇报')
  resetReportForm()
  reportForm.id = String(row.id || '')
  reportForm.taskId = String(row.taskId || '')
  reportForm.workDate = row.workDate || dayjs().format('YYYY-MM-DD')
  reportForm.hours = Number(row.hours || 1)
  reportForm.description = row.description || ''
  reportForm.attachments = row.attachments || []
  dialogTitle.value = '编辑任务汇报'
  dialogVisible.value = true
}

function handleDeleteReport(row: any) {
  if (!canTaskReportDelete.value) return $sdk.msgError('当前操作没有权限')
  $sdk.confirm('确定要删除该任务汇报吗？').then(() => {
    deleteReport(row.id).then(() => {
      $sdk.msgSuccess('任务汇报删除成功')
      rctRef.value.getList()
    })
  })
}

function submitReport() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = {
        workDate: reportForm.workDate,
        hours: Number(reportForm.hours),
        description: reportForm.description || '',
        attachments: reportForm.attachments || [],
      }
      if (reportForm.id) {
        await updateReport(reportForm.id, payload)
        $sdk.msgSuccess('任务汇报修改成功')
      } else {
        await addReport(reportForm.taskId, payload)
        $sdk.msgSuccess('任务汇报添加成功')
      }
      dialogVisible.value = false
      rctRef.value.getList()
    } catch (error: any) {
      $sdk.msgError(error?.message || error?.response?.data?.message || '任务汇报提交失败')
    } finally {
      submitLoading.value = false
    }
  })
}

function isCurrentUserReport(row: any) {
  return String(row?.userId || '') === currentUserId.value
}

const getButtons = (row: any) => [
  { key: 'add', label: '补汇报', type: 'primary', disabled: !canTaskReportAdd.value, onClick: () => handleAddReport(row) },
  ...(canTaskReportAdd.value && isCurrentUserReport(row)
    ? [{ key: 'edit', label: '编辑', type: 'primary', onClick: () => handleEditReport(row) }]
    : []),
  ...(canTaskReportDelete.value && isCurrentUserReport(row)
    ? [{ key: 'delete', label: '删除', danger: true, onClick: () => handleDeleteReport(row) }]
    : []),
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
        <BaInput v-model="query.taskId" label="任务ID" prop="taskId" />
        <BaInput v-model="query.userId" label="用户ID" prop="userId" />
        <BaDatePicker v-model="query.beginDate" label="开始日期" prop="beginDate" value-format="YYYY-MM-DD" />
        <BaDatePicker v-model="query.endDate" label="结束日期" prop="endDate" value-format="YYYY-MM-DD" />
      </template>

      <template #operation>
        <div class="flexBetween">
          <el-button v-if="canTaskReportAdd" type="primary" @click="handleAddReport">新增汇报</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="所属任务" min-width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">{{ row.task?.name || row.taskId || '-' }}</template>
        </el-table-column>
        <el-table-column label="汇报人" width="120">
          <template #default="{ row }">{{ row.user?.nickname || row.user?.name || row.userId || '-' }}</template>
        </el-table-column>
        <el-table-column label="工作日期" prop="workDate" width="120" />
        <el-table-column label="工时" width="90">
          <template #default="{ row }">{{ row.hours }} 小时</template>
        </el-table-column>
        <el-table-column label="汇报内容" prop="description" min-width="300" :show-overflow-tooltip="true">
          <template #default="{ row }"><span v-html="row.description || '未填写汇报内容'"></span></template>
        </el-table-column>
        <el-table-column label="附件" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.attachments?.length" type="success" size="small">{{ row.attachments.length }}个</el-tag>
            <el-tag v-else type="info" size="small">无</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" prop="createTime" width="170" />
      </template>

      <template #tableOperation="{ row }">
        <TableOperation :buttons="getButtons(row)" :row="row" :rct-ref="rctRef" />
      </template>
    </RequestChartTable>

    <BaDialog v-model="dialogVisible" :title="dialogTitle" width="760" @confirm="submitReport">
      <template #form>
        <el-form ref="formRef" :model="reportForm" :rules="reportRules" label-width="90px" v-loading="submitLoading">
          <el-form-item label="任务ID" prop="taskId">
            <el-input v-model="reportForm.taskId" placeholder="请输入任务ID" :disabled="!!reportForm.id" />
          </el-form-item>
          <el-form-item label="工作日期" prop="workDate">
            <el-date-picker v-model="reportForm.workDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择工作日期" style="width: 100%" />
          </el-form-item>
          <el-form-item label="工时" prop="hours">
            <el-input-number v-model="reportForm.hours" :min="0.5" :step="0.5" style="width: 100%" />
          </el-form-item>
          <el-form-item label="汇报内容" prop="description">
            <Editor v-model="reportForm.description" style="min-height: 220px" />
          </el-form-item>
          <el-form-item label="汇报附件">
            <Upload v-model:fileList="reportForm.attachments" type="file" multiple />
          </el-form-item>
          <el-form-item v-if="reportForm.attachments?.length" label="已选附件">
            <ViewFileList :files="reportForm.attachments" />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
  </div>
</template>
