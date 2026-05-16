<script setup lang="ts">
// @ts-nocheck
import { getList as getOpportunityList, getStages } from '../../opportunityManage/api'
import { getList as getContractList, getContractStatuses } from '../../contractManage/api'
import { getList as getInteractionList, getInteractionTypes } from '../../interactionManage/api'
import { checkPermi } from '@/utils/permission'

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()
const activeTab = ref('opportunities')
const stages = ref({})
const contractStatuses = ref({})
const interactionTypes = ref({})

const canViewOpportunities = computed(() => checkPermi(['business/crm/opportunities/list']))
const canViewContracts = computed(() => checkPermi(['business/crm/contracts/list']))
const canViewInteractions = computed(() => checkPermi(['business/crm/interactions/list']))

const opportunityState = reactive({
  loading: false,
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  loaded: false,
})

const contractState = reactive({
  loading: false,
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  loaded: false,
})

const interactionState = reactive({
  loading: false,
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  loaded: false,
})

const availableTabs = computed(() => [
  canViewOpportunities.value ? 'opportunities' : '',
  canViewContracts.value ? 'contracts' : '',
  canViewInteractions.value ? 'interactions' : '',
].filter(Boolean))

function normalizeListResult(res: any) {
  const page = res?.data?.data || res?.data || res || {}
  return {
    list: page.list || page.rows || page.data || [],
    total: Number(page.total || 0),
  }
}

async function loadOpportunities() {
  if (!props.customerId || !canViewOpportunities.value) return
  opportunityState.loading = true
  try {
    const page = normalizeListResult(await getOpportunityList({
      customerId: props.customerId,
      pageNum: opportunityState.pageNum,
      pageSize: opportunityState.pageSize,
    }))
    opportunityState.list = page.list
    opportunityState.total = page.total
    opportunityState.loaded = true
  } catch (error) {
    opportunityState.list = []
    opportunityState.total = 0
    console.error(error)
  } finally {
    opportunityState.loading = false
  }
}

async function loadContracts() {
  if (!props.customerId || !canViewContracts.value) return
  contractState.loading = true
  try {
    const page = normalizeListResult(await getContractList({
      customerId: props.customerId,
      pageNum: contractState.pageNum,
      pageSize: contractState.pageSize,
    }))
    contractState.list = page.list
    contractState.total = page.total
    contractState.loaded = true
  } catch (error) {
    contractState.list = []
    contractState.total = 0
    console.error(error)
  } finally {
    contractState.loading = false
  }
}

async function loadInteractions() {
  if (!props.customerId || !canViewInteractions.value) return
  interactionState.loading = true
  try {
    const page = normalizeListResult(await getInteractionList({
      customerId: props.customerId,
      pageNum: interactionState.pageNum,
      pageSize: interactionState.pageSize,
    }))
    interactionState.list = page.list
    interactionState.total = page.total
    interactionState.loaded = true
  } catch (error) {
    interactionState.list = []
    interactionState.total = 0
    console.error(error)
  } finally {
    interactionState.loading = false
  }
}

function loadActiveTab() {
  if (activeTab.value === 'opportunities') return loadOpportunities()
  if (activeTab.value === 'contracts') return loadContracts()
  if (activeTab.value === 'interactions') return loadInteractions()
}

function handleOpportunityPageChange() {
  loadOpportunities()
}

function handleContractPageChange() {
  loadContracts()
}

function handleInteractionPageChange() {
  loadInteractions()
}

function goOpportunityDetail(row: any) {
  router.push({ path: '/crm/opportunityManage/form', query: { id: row.id, action: 'view' } })
}

function goContractDetail(row: any) {
  router.push({ path: '/crm/contractManage/form', query: { id: row.id, action: 'view' } })
}

function goInteractionDetail(row: any) {
  router.push({ path: '/crm/interactionManage/form', query: { id: row.id, action: 'view' } })
}

watch(
  availableTabs,
  (tabs) => {
    if (!tabs.length) return
    if (!tabs.includes(activeTab.value)) {
      activeTab.value = tabs[0]
      return
    }
    loadActiveTab()
  },
  { immediate: true },
)

watch(activeTab, loadActiveTab)

watch(
  () => props.customerId,
  () => {
    opportunityState.loaded = false
    contractState.loaded = false
    interactionState.loaded = false
    opportunityState.pageNum = 1
    contractState.pageNum = 1
    interactionState.pageNum = 1
    loadActiveTab()
  },
)

getStages().then(({ data }) => (stages.value = data || {}))
getContractStatuses().then(({ data }) => (contractStatuses.value = data || {}))
getInteractionTypes().then(({ data }) => (interactionTypes.value = data || {}))
</script>

<template>
  <section class="business-form-section customer-related-records">
    <div class="business-form-section__header">
      <div>
        <div class="business-form-section__title">关联业务</div>
        <div class="business-form-section__desc">查看该客户关联的销售机会、合同管理和互动记录。</div>
      </div>
    </div>

    <el-empty v-if="!availableTabs.length" description="暂无可查看的关联业务权限" />

    <el-tabs v-else v-model="activeTab" class="customer-related-records__tabs">
      <el-tab-pane v-if="canViewOpportunities" label="销售机会" name="opportunities">
        <el-table v-loading="opportunityState.loading" :data="opportunityState.list" show-overflow-tooltip>
          <el-table-column label="机会名称" prop="name" min-width="160" />
          <el-table-column label="机会编号" prop="code" min-width="140" />
          <el-table-column label="预期金额(元)" prop="expectedAmount" width="130" />
          <el-table-column label="销售阶段" prop="stage" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ stages[row.stage] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成功概率" prop="successRate" width="100">
            <template #default="{ row }">{{ row.successRate || 0 }}%</template>
          </el-table-column>
          <el-table-column label="预计成交时间" prop="expectedCloseDate" width="160" />
          <el-table-column label="销售负责人" prop="sales.nickname" width="120" />
          <el-table-column label="操作" fixed="right" width="90">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="goOpportunityDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-if="opportunityState.total >= 0"
          :total="opportunityState.total"
          v-model:page="opportunityState.pageNum"
          v-model:limit="opportunityState.pageSize"
          @pagination="handleOpportunityPageChange"
        />
      </el-tab-pane>

      <el-tab-pane v-if="canViewContracts" label="合同管理" name="contracts">
        <el-table v-loading="contractState.loading" :data="contractState.list" show-overflow-tooltip>
          <el-table-column label="合同名称" prop="name" min-width="160" />
          <el-table-column label="合同编号" prop="code" min-width="140" />
          <el-table-column label="合同金额(元)" prop="amount" width="130" />
          <el-table-column label="已收款(元)" prop="receivedAmount" width="130" />
          <el-table-column label="合同状态" prop="status" width="110">
            <template #default="{ row }">
              <el-tag :type="row.status === '1' ? 'success' : row.status === '2' ? 'warning' : 'info'" size="small">
                {{ contractStatuses[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签订时间" prop="signingDate" width="160" />
          <el-table-column label="开始时间" prop="startDate" width="160" />
          <el-table-column label="结束时间" prop="endDate" width="160" />
          <el-table-column label="负责人" prop="owner.nickname" width="120" />
          <el-table-column label="操作" fixed="right" width="90">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="goContractDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-if="contractState.total >= 0"
          :total="contractState.total"
          v-model:page="contractState.pageNum"
          v-model:limit="contractState.pageSize"
          @pagination="handleContractPageChange"
        />
      </el-tab-pane>

      <el-tab-pane v-if="canViewInteractions" label="互动记录" name="interactions">
        <el-table v-loading="interactionState.loading" :data="interactionState.list" show-overflow-tooltip>
          <el-table-column label="互动类型" prop="interactionType" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ interactionTypes[row.interactionType] || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="互动时间" prop="interactionTime" width="160" />
          <el-table-column label="互动人" prop="operatorName" width="120" />
          <el-table-column label="互动内容" prop="content" min-width="220" />
          <el-table-column label="下次跟进时间" prop="nextFollowTime" width="160" />
          <el-table-column label="操作" fixed="right" width="90">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="goInteractionDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-if="interactionState.total >= 0"
          :total="interactionState.total"
          v-model:page="interactionState.pageNum"
          v-model:limit="interactionState.pageSize"
          @pagination="handleInteractionPageChange"
        />
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<style scoped lang="scss">
.customer-related-records {
  min-width: 0;
}

.customer-related-records__tabs {
  min-width: 0;
}

.customer-related-records :deep(.el-tabs__header) {
  margin-bottom: 14px;
}

.customer-related-records :deep(th.el-table__cell) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.customer-related-records :deep(.pagination-container) {
  margin-bottom: 0;
}
</style>
