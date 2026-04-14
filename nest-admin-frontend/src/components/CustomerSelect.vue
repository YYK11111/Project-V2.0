<script setup>
import { ref, watch, nextTick } from 'vue'
import { getList as getCustomerList } from '@/views/business/crm/customerManage/api'

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
    default: '请选择客户'
  },
  filterLevel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false)
const customerList = ref([])
const levelList = ref([
  { label: 'VIP', value: '1' },
  { label: '重要', value: '2' },
  { label: '普通', value: '3' }
])
const searchLevel = ref('')

function loadCustomerList(keywords = '') {
  loading.value = true
  const query = {
    pageNum: 1,
    pageSize: 100
  }
  
  if (keywords) {
    query.name = keywords
  }
  
  if (props.filterLevel && searchLevel.value) {
    query.level = searchLevel.value
  }
  
  getCustomerList(query)
    .then(({ data }) => {
      customerList.value = data || []
    })
    .finally(() => {
      loading.value = false
    })
}

function handleSearch(query) {
  loadCustomerList(query)
}

function handleLevelChange() {
  loadCustomerList()
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
    loadCustomerList()
  }
}

loadCustomerList()

watch(() => props.modelValue, () => {
  nextTick(() => {
    loadCustomerList()
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
    remote-method.handleSearch
    @change="handleChange"
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    style="width: 100%"
  >
    <template #header v-if="filterLevel">
      <el-select
        v-model="searchLevel"
        placeholder="筛选等级"
        clearable
        filterable
        size="small"
        style="width: 100%; margin-bottom: 4px"
        @change="handleLevelChange"
      >
        <el-option
          v-for="level in levelList"
          :key="level.value"
          :label="level.label"
          :value="level.value"
        />
      </el-select>
    </template>
    
    <el-option
      v-for="customer in customerList"
      :key="customer.id"
      :label="customer.name"
      :value="customer.id"
    >
      <div class="customer-option">
        <span class="customer-code">{{ customer.code }}</span>
        <span class="customer-name">{{ customer.name }}</span>
        <el-tag v-if="customer.level" size="small" :type="customer.level === '1' ? 'danger' : customer.level === '2' ? 'warning' : 'info'">
          {{ levelList.find(l => l.value === customer.level)?.label }}
        </el-tag>
      </div>
    </el-option>

    <template #empty>
      <div class="empty-text">暂无数据</div>
    </template>
  </el-select>
</template>

<style scoped>
.customer-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-code {
  color: #909399;
  font-size: 12px;
  min-width: 80px;
}

.customer-name {
  font-weight: 500;
  flex: 1;
}

.empty-text {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style>