<script setup>
import { ref, watch, nextTick } from 'vue'
import { getList as getProjectList } from '@/views/business/projectManage/api'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: undefined
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '请选择项目'
  },
  filterStatus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false)
const projectList = ref([])
const statusList = ref([
  { label: '草稿', value: '1' },
  { label: '立项审批中', value: '2' },
  { label: '执行中', value: '3' },
  { label: '暂停中', value: '4' },
  { label: '结项审批中', value: '5' },
  { label: '已结项', value: '6' },
  { label: '已取消', value: '7' }
])
const searchStatus = ref('')

function loadProjectList(keywords = '') {
  loading.value = true
  const query = {
    pageNum: 1,
    pageSize: 100
  }
  
  if (keywords) {
    query.name = keywords
  }
  
  if (props.filterStatus && searchStatus.value) {
    query.status = searchStatus.value
  }
  
  getProjectList(query)
    .then(({ data }) => {
      projectList.value = data || []
    })
    .finally(() => {
      loading.value = false
    })
}

function handleSearch(query) {
  loadProjectList(query)
}

function handleStatusChange() {
  loadProjectList()
}

function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function handleClear() {
  emit('update:modelValue', props.multiple ? [] : undefined)
  emit('change', props.multiple ? [] : undefined)
}

function handleVisibleChange(visible) {
  if (visible) {
    loadProjectList()
  }
}

loadProjectList()

watch(() => props.modelValue, () => {
  nextTick(() => {
    loadProjectList()
  })
})
</script>

<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :filterable="true"
    :remote="true"
    :reserve-keyword="false"
    :loading="loading"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    :remote-method="handleSearch"
    @change="handleChange"
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    style="width: 100%"
  >
    <template #header v-if="filterStatus">
      <el-select
        v-model="searchStatus"
        placeholder="筛选状态"
        clearable
        filterable
        size="small"
        style="width: 100%; margin-bottom: 4px"
        @change="handleStatusChange"
      >
        <el-option
          v-for="status in statusList"
          :key="status.value"
          :label="status.label"
          :value="status.value"
        />
      </el-select>
    </template>
    
    <el-option
      v-for="project in projectList"
      :key="project.id"
      :label="project.name"
      :value="project.id"
    >
      <div class="project-option">
        <span class="project-code">{{ project.code }}</span>
        <span class="project-name">{{ project.name }}</span>
        <el-tag v-if="project.status" size="small" type="info">
          {{ statusList.find(s => s.value === project.status)?.label }}
        </el-tag>
      </div>
    </el-option>

    <template #empty>
      <div class="empty-text">暂无数据</div>
    </template>
  </el-select>
</template>

<style scoped>
.project-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-code {
  color: #909399;
  font-size: 12px;
  min-width: 80px;
}

.project-name {
  font-weight: 500;
  flex: 1;
}

.empty-text {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style>
