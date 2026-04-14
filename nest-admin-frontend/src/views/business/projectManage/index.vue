<script setup>
import { ref } from 'vue'
import { getList, getStatus, getPriority, getProjectType, del, archive } from './api'
import TableOperation from '@/components/TableOperation.vue'
import { checkPermi } from '@/utils/permission'

const params = ref({})
const status = ref({})
const priority = ref({})
const projectType = ref({})

getStatus().then(({ data }) => (status.value = data))
getPriority().then(({ data }) => (priority.value = data))
getProjectType().then(({ data }) => (projectType.value = data))

const rctRef = ref()
const canProjectAdd = computed(() => checkPermi(['business/projects/add']))
const canProjectUpdate = computed(() => checkPermi(['business/projects/update']))
const canProjectDelete = computed(() => checkPermi(['business/projects/delete']))
const canProjectArchive = computed(() => checkPermi(['business/projects/archive']))

function handleArchive(row) {
  if (!canProjectArchive.value) return $sdk.msgWarning('当前操作没有权限')
  $sdk.confirm('确定要归档该项目吗？').then(() => {
    archive(row.id).then(() => {
      $sdk.msgSuccess('归档成功')
      rctRef.value.getList()
    })
  })
}

const getButtons = (row) => [
  { key: 'view', label: '查看', onClick: () => rctRef.value.goRoute({ id: row.id }, '/projectManage/detail') },
  { key: 'edit', label: '修改', disabled: !canProjectUpdate.value, onClick: () => rctRef.value.goRoute(row.id, '/projectManage/form') },
  { key: 'archive', label: '归档', type: 'success', disabled: !canProjectArchive.value, onClick: () => handleArchive(row) },
  { key: 'delete', label: '删除', danger: true, disabled: !canProjectDelete.value, onClick: () => rctRef.value.del(del, row.id) },
]
</script>

<template>
  <div class="Gcard">
    <RequestChartTable ref="rctRef" :params="params" :request="getList">
      <template #query="{ query }">
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
        <BaSelect v-model="query.isArchived" filterable label="是否归档" prop="isArchived">
          <el-option label="未归档" value="0" />
          <el-option label="已归档" value="1" />
        </BaSelect>
      </template>

      <template #operation="{ selectedIds }">
        <div class="flexBetween">
          <el-button v-if="canProjectAdd" type="primary" @click="rctRef.goRoute(null, '/projectManage/form')">新增项目</el-button>
          <el-button v-if="canProjectDelete" :disabled="!selectedIds.length" @click="rctRef.del(del)" type="danger">批量删除</el-button>
        </div>
      </template>

      <template #table>
        <el-table-column label="项目名称" prop="name" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="项目编号" prop="code" width="150" />
        <el-table-column label="负责人" prop="leader.nickname" width="100" />
        <el-table-column label="项目类型" prop="projectType" width="140">
          <template #default="{ row }">
            {{ projectType[row.projectType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" prop="startDate" width="120" />
        <el-table-column label="结束时间" prop="endDate" width="120" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '6' ? 'success' : row.status === '3' ? 'primary' : row.status === '2' || row.status === '5' ? 'warning' : row.status === '7' ? 'danger' : 'info'">
              {{ status[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" prop="priority" width="100">
          <template #default="{ row }">
            <el-tag :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" size="small">
              {{ priority[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="是否归档" prop="isArchived" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isArchived === '1' ? 'success' : 'info'" size="small">
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
