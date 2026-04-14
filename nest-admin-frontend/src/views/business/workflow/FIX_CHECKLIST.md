# 前端工作流模块 - 快速修复清单

**创建时间**: 2026-04-09  
**目标**: 让工作流前端可以正常使用

---

## 🔴 P0 - 必须立即修复（阻塞性问题）

### ✅ 任务1: 添加前端路由配置

**文件**: `nest-admin-frontend/src/router/routes.js`

**操作**: 在 `constantRoutes` 数组末尾添加以下配置：

```javascript
{
  path: '/workflow',
  component: Layout,
  redirect: '/workflow/index',
  meta: {
    title: '工作流管理',
    icon: 'workflow'
  },
  children: [
    {
      path: 'index',
      name: 'WorkflowIndex',
      component: () => import('@/views/business/workflow/index'),
      meta: { title: '流程定义', icon: 'list' }
    },
    {
      path: 'designer',
      name: 'WorkflowDesigner',
      component: () => import('@/views/business/workflow/designer'),
      meta: { title: '流程设计器', icon: 'edit' },
      isHidden: true
    },
    {
      path: 'tasks',
      name: 'WorkflowTasks',
      component: () => import('@/views/business/workflow/tasks'),
      meta: { title: '我的待办', icon: 'task' }
    }
  ]
}
```

**验证**: 
```bash
# 重启前端服务后访问
http://localhost:8080/#/workflow/index
```

---

### ✅ 任务2: 修复API调用中的userId参数

**文件**: `nest-admin-frontend/src/views/business/workflow/api.ts`

**操作**: 修改以下函数，添加userId参数

```typescript
import { useUserStore } from '@/stores/user'

// 修改 getMyTasks
export function getMyTasks() {
  const userId = useUserStore().userInfo?.id
  return request({
    url: '/workflow/tasks/my',
    method: 'get',
    params: { userId },  // ✅ 添加这行
  })
}

// 修改 startWorkflow
export function startWorkflow(data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: '/workflow/instances/start',
    method: 'post',
    params: { userId },  // ✅ 添加这行
    data,
  })
}

// 修改 completeTask
export function completeTask(id, data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: `/workflow/tasks/${id}/complete`,
    method: 'post',
    params: { userId },  // ✅ 添加这行
    data,
  })
}

// 修改 transferTask
export function transferTask(id, data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: `/workflow/tasks/${id}/transfer`,
    method: 'post',
    params: { userId },  // ✅ 添加这行
    data,
  })
}
```

**验证**: 
- 打开浏览器开发者工具
- 查看Network标签
- 确认请求URL包含 `?userId=xxx`

---

### ✅ 任务3: 修复designer.vue的路由跳转

**文件**: `nest-admin-frontend/src/views/business/workflow/index.vue`

**当前代码** (第132行):
```javascript
const handleDesign = (row) => {
  window.open(`/workflow/designer?id=${row.id}`, '_blank')  // ❌ 绝对路径
}
```

**修改为**:
```javascript
import { useRouter } from 'vue-router'

const router = useRouter()

const handleDesign = (row) => {
  router.push({
    path: '/workflow/designer',
    query: { id: row.id }
  })
}
```

---

## 🟡 P1 - 本周内完成（重要功能）

### ⏳ 任务4: 实现简化的连接线功能

**文件**: `nest-admin-frontend/src/views/business/workflow/designer.vue`

**方案**: 自动按节点顺序生成连接线

在 `handleSave` 函数中添加：

```javascript
const generateFlows = () => {
  if (nodes.value.length < 2) return []
  
  const flows = []
  for (let i = 0; i < nodes.value.length - 1; i++) {
    flows.push({
      id: `flow_${i}`,
      sourceNodeId: nodes.value[i].id,
      targetNodeId: nodes.value[i + 1].id,
      label: '',
    })
  }
  return flows
}

const handleSave = async () => {
  // ... 现有验证代码
  
  const data = {
    name: workflowName.value,
    code: workflowCode.value,
    category: workflowCategory.value,
    description: workflowDescription.value,
    nodes: nodes.value,
    flows: flows.value.length > 0 ? flows.value : generateFlows(),  // ✅ 修改这行
  }
  
  // ... 后续保存逻辑
}
```

---

### ⏳ 任务5: 创建流程实例列表页面

**新建文件**: `nest-admin-frontend/src/views/business/workflow/instances.vue`

**基础模板**:

```vue
<template>
  <div class="workflow-instances">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>流程实例</span>
          <el-button type="primary" @click="loadInstances" :loading="loading">刷新</el-button>
        </div>
      </template>

      <el-table :data="instances" v-loading="loading">
        <el-table-column prop="name" label="流程名称" width="150" />
        <el-table-column prop="businessKey" label="业务单号" width="150" />
        <el-table-column prop="starterId" label="发起人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from './api'

const loading = ref(false)
const instances = ref([])

const loadInstances = async () => {
  loading.value = true
  try {
    // TODO: 需要后端提供列表接口
    // const res = await api.getWorkflowInstances()
    // instances.value = res.data || []
    ElMessage.warning('流程实例列表接口待开发')
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const types = {
    '1': 'success',  // 进行中
    '2': 'info',     // 已完成
    '3': 'danger',   // 已取消
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    '1': '进行中',
    '2': '已完成',
    '3': '已取消',
  }
  return texts[status] || status
}

const viewDetail = (row) => {
  ElMessage.info(`查看实例详情: ${row.id}`)
}

onMounted(() => {
  loadInstances()
})
</script>

<style scoped>
.workflow-instances {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

**注意**: 需要后端先提供 `GET /api/workflow/instances` 列表接口

---

### ⏳ 任务6: 添加流程发起入口

**文件**: `nest-admin-frontend/src/views/business/workflow/index.vue`

在操作列添加"发起流程"按钮：

```vue
<el-table-column label="操作" width="350" fixed="right">
  <template #default="{ row }">
    <el-button link type="primary" size="small" @click="handleDesign(row)">设计</el-button>
    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
    <el-button link type="success" size="small" v-if="row.isActive !== '1'" @click="handlePublish(row)">发布</el-button>
    <el-button link type="info" size="small" v-else @click="handleUnpublish(row)">停用</el-button>
    <el-button link type="warning" size="small" @click="handleStart(row)">发起流程</el-button>  <!-- ✅ 新增 -->
    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>
```

添加发起流程对话框和方法：

```vue
<!-- 在模板末尾添加 -->
<el-dialog v-model="startDialogVisible" title="发起流程" width="500px">
  <el-form :model="startForm" label-width="100px">
    <el-form-item label="业务单号">
      <el-input v-model="startForm.businessKey" placeholder="请输入业务单号" />
    </el-form-item>
    <el-form-item label="流程变量">
      <el-input 
        v-model="startForm.variablesJson" 
        type="textarea" 
        :rows="5"
        placeholder='JSON格式，如: {"days": 3, "reason": "请假"}'
      />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="startDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="submitStart">确定</el-button>
  </template>
</el-dialog>
```

```javascript
// 在 script 中添加
const startDialogVisible = ref(false)
const currentDefinition = ref(null)
const startForm = reactive({
  businessKey: '',
  variablesJson: '{}',
})

const handleStart = (row) => {
  currentDefinition.value = row
  startForm.businessKey = `${row.code}_${Date.now()}`
  startForm.variablesJson = '{}'
  startDialogVisible.value = true
}

const submitStart = async () => {
  try {
    const variables = JSON.parse(startForm.variablesJson)
    await api.startWorkflow({
      code: currentDefinition.value.code,
      businessKey: startForm.businessKey,
      variables,
    })
    ElMessage.success('流程发起成功')
    startDialogVisible.value = false
  } catch (error) {
    ElMessage.error('发起失败')
  }
}
```

---

## 🟢 P2 - 下周优化（体验改进）

### ⏸️ 任务7: 增强错误提示

在所有 catch 块中改进错误处理：

```javascript
catch (error) {
  const message = error.response?.data?.message || error.message || '操作失败'
  ElMessage.error(message)
  console.error('Workflow Error:', error)
}
```

### ⏸️ 任务8: 添加表单验证

在 designer.vue 的 handleSave 中添加：

```javascript
const handleSave = async () => {
  if (!workflowName.value || !workflowCode.value) {
    ElMessage.warning('请填写流程名称和编码')
    return
  }
  
  if (nodes.value.length === 0) {
    ElMessage.warning('请至少添加一个节点')
    return
  }
  
  const hasStart = nodes.value.some(n => n.type === 'start')
  const hasEnd = nodes.value.some(n => n.type === 'end')
  
  if (!hasStart) {
    ElMessage.warning('流程必须包含开始节点')
    return
  }
  
  if (!hasEnd) {
    ElMessage.warning('流程必须包含结束节点')
    return
  }
  
  // ... 继续保存逻辑
}
```

---

## ✅ 验证清单

完成P0修复后，执行以下验证：

- [ ] 访问 http://localhost:8080/#/workflow/index 能看到流程定义列表
- [ ] 点击"新建流程"能打开对话框
- [ ] 点击"设计"能打开设计器页面
- [ ] 在设计器中能拖拽添加节点
- [ ] 点击"保存"能成功保存流程定义
- [ ] 访问 http://localhost:8080/#/workflow/tasks 能看到待办任务
- [ ] 点击"同意"/"拒绝"能成功审批
- [ ] 浏览器Network中看到请求包含userId参数

---

## 📞 需要后端配合的事项

1. **流程实例列表接口**
   - 需要: `GET /api/workflow/instances`
   - 支持分页和筛选

2. **后端菜单配置**
   - 需要在sys_menu表中添加工作流相关菜单
   - 或确认是否使用硬编码路由

3. **任务列表增强**
   - 建议在getPendingTasks返回更多字段
   - 包括流程名称、发起人姓名等

---

**预计工作量**: 
- P0修复: 2小时
- P1完善: 6小时
- P2优化: 4小时
- **总计**: 12小时

**建议执行顺序**: P0 → 测试 → P1 → 测试 → P2
