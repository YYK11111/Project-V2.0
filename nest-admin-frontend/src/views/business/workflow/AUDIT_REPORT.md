# 前端工作流模块审计报告

**审计时间**: 2026-04-09  
**审计范围**: `/nest-admin-frontend/src/views/business/workflow/`  
**对比基准**: 后端接口 (`nest-admin/src/modulesBusi/workflow/controller.ts`)  
**审计结论**: ⚠️ **发现12个问题，需要补充完善**

---

## 📊 审计概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 页面完整性 | ⚠️ 部分缺失 | 缺少流程实例/历史查询页面 |
| API覆盖度 | ❌ 不完整 | 缺少userId参数传递 |
| 路由配置 | ❌ 未配置 | 前端路由未注册 |
| 菜单配置 | ❌ 未配置 | 需要从后端菜单系统配置 |
| 功能完整性 | ⚠️ 部分缺失 | 设计器缺少连接线功能 |

---

## 🔴 严重问题（必须修复）

### 1. ❌ 前端路由未注册

**问题描述**:
- `routes.js` 中没有任何工作流相关的路由配置
- 虽然页面文件存在，但无法通过URL访问
- designer.vue 使用 `window.open('/workflow/designer?id=${row.id}')` 会跳转到404

**影响**:
- 所有工作流页面都无法访问
- 从 index.vue 点击"设计"按钮会打开空白页或404

**修复方案**:

在 `routes.js` 中添加工作流路由：

```javascript
// 在 constantRoutes 数组末尾添加
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
      isHidden: true  // 不在菜单显示，通过按钮跳转
    },
    {
      path: 'tasks',
      name: 'WorkflowTasks',
      component: () => import('@/views/business/workflow/tasks'),
      meta: { title: '我的待办', icon: 'task' }
    },
    {
      path: 'instances',
      name: 'WorkflowInstances',
      component: () => import('@/views/business/workflow/instances'),
      meta: { title: '流程实例', icon: 'example' }
    }
  ]
}
```

**优先级**: 🔴 P0（阻塞性问题）

---

### 2. ❌ API调用缺少userId参数

**问题描述**:

**后端接口要求**:
```typescript
// controller.ts
@Get('tasks/my')
async getMyTasks(@Query('userId') userId: string) {
  return this.workflowService.getPendingTasks(userId);
}

@Post('instances/start')
async startWorkflow(
  @Body() dto: StartWorkflowDto,
  @Query('userId') userId: string,  // ← 需要userId
) {
  return this.workflowService.startWorkflow(dto, userId);
}

@Post('tasks/:id/complete')
async completeTask(
  @Param('id') id: string,
  @Body() dto: CompleteTaskDto,
  @Query('userId') userId: string,  // ← 需要userId
) {
  return this.workflowService.completeTask(id, userId, dto);
}
```

**前端API缺失**:
```typescript
// api.ts - 当前实现
export function getMyTasks() {
  return request({
    url: '/workflow/tasks/my',  // ❌ 缺少 userId 参数
    method: 'get',
  })
}

export function startWorkflow(data) {
  return request({
    url: '/workflow/instances/start',  // ❌ 缺少 userId 参数
    method: 'post',
    data,
  })
}

export function completeTask(id, data) {
  return request({
    url: `/workflow/tasks/${id}/complete`,  // ❌ 缺少 userId 参数
    method: 'post',
    data,
  })
}
```

**修复方案**:

```typescript
// api.ts - 修复后
import { useUserStore } from '@/stores/user'

export function getMyTasks() {
  const userId = useUserStore().userInfo?.id
  return request({
    url: '/workflow/tasks/my',
    method: 'get',
    params: { userId },  // ✅ 添加userId
  })
}

export function startWorkflow(data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: '/workflow/instances/start',
    method: 'post',
    params: { userId },  // ✅ 添加userId
    data,
  })
}

export function completeTask(id, data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: `/workflow/tasks/${id}/complete`,
    method: 'post',
    params: { userId },  // ✅ 添加userId
    data,
  })
}

export function transferTask(id, data) {
  const userId = useUserStore().userInfo?.id
  return request({
    url: `/workflow/tasks/${id}/transfer`,
    method: 'post',
    params: { userId },  // ✅ 添加userId
    data,
  })
}
```

**优先级**: 🔴 P0（导致API调用失败）

---

### 3. ❌ 缺少流程实例查询页面

**问题描述**:
- 后端有 `GET /api/workflow/instances/:id` 接口
- 前端没有对应的实例列表和详情页面
- 用户无法查看已启动的流程实例

**缺失功能**:
- 流程实例列表（支持按状态、发起人、时间筛选）
- 流程实例详情（显示当前节点、历史记录）
- 流程实例操作（取消、挂起等）

**建议实现**: 创建 `instances.vue` 页面

**优先级**: 🟡 P1（重要功能缺失）

---

## 🟡 中等问题（建议修复）

### 4. ⚠️ 流程设计器缺少连接线功能

**问题描述**:
- designer.vue 中有 `flows` 数组，但没有UI支持创建连接线
- 节点之间无法建立流转关系
- 保存的流程定义中 `flows` 始终为空数组

**当前代码**:
```javascript
const flows = ref([])  // 定义了但从未使用

// onDrop 只添加节点，不创建连接
const onDrop = (event) => {
  // ... 只创建节点
  nodes.value.push(newNode)
}
```

**影响**:
- 流程无法正确流转
- 后端执行时会因为没有连接线而失败

**修复方案**:
1. 实现节点之间的连线功能（拖拽连接点）
2. 或使用简化的自动连接（按节点顺序自动连接）

**简化方案**（快速实现）:
```javascript
// 在 handleSave 时自动生成连接线
const generateFlows = () => {
  const flows = []
  for (let i = 0; i < nodes.value.length - 1; i++) {
    flows.push({
      id: `flow_${i}`,
      sourceNodeId: nodes.value[i].id,
      targetNodeId: nodes.value[i + 1].id,
    })
  }
  return flows
}

// 修改 handleSave
const handleSave = async () => {
  // ...
  const data = {
    // ...
    flows: flows.value.length > 0 ? flows.value : generateFlows(),
  }
}
```

**优先级**: 🟡 P1（核心功能不完整）

---

### 5. ⚠️ tasks.vue 缺少流程实例信息展示

**问题描述**:
- 待办任务列表只显示 taskId、nodeName、instanceId
- 缺少流程名称、发起人、业务数据等关键信息
- 用户体验不佳

**当前表格列**:
```vue
<el-table-column prop="nodeName" label="任务名称" />
<el-table-column prop="instanceId" label="流程实例ID" />
<el-table-column prop="startTime" label="创建时间" />
```

**建议增加**:
- 流程名称（从 instance 关联获取）
- 发起人姓名
- 业务标题（如请假天数、项目名称等）
- 紧急程度标识

**修复方案**:
后端需要返回更丰富的任务信息，或前端通过 instanceId 额外查询。

**优先级**: 🟡 P1（用户体验问题）

---

### 6. ⚠️ 缺少流程发起入口

**问题描述**:
- 前端没有"发起流程"的页面或按钮
- 虽然有 `startWorkflow` API，但没有UI触发
- 用户无法实际使用工作流

**建议实现**:
在 `index.vue` 的操作列添加"发起流程"按钮，或创建独立的发起页面。

**优先级**: 🟡 P1（功能不可用）

---

### 7. ⚠️ 设计器缺少流程预览可视化

**问题描述**:
- previewVisible 对话框只显示 JSON 数据
- 没有可视化的流程图预览
- 不利于用户理解流程结构

**当前实现**:
```vue
<el-dialog v-model="previewVisible" title="流程预览" width="60%">
  <pre><code>{{ workflowData }}</code></pre>  <!-- 纯JSON -->
</el-dialog>
```

**建议改进**:
- 集成流程图渲染库（如 bpmn-js、logic-flow）
- 或至少用简单的图形展示节点和连接

**优先级**: 🟢 P2（体验优化）

---

## 🟢 轻微问题（可选优化）

### 8. 🟢 缺少流程分类字典

**问题描述**:
- workflowCategory 是自由文本输入
- 建议改为下拉选择，统一管理分类

**修复方案**:
```vue
<el-form-item label="流程分类">
  <el-select v-model="form.category">
    <el-option label="人事审批" value="HR" />
    <el-option label="财务审批" value="Finance" />
    <el-option label="项目管理" value="Project" />
  </el-select>
</el-form-item>
```

**优先级**: 🟢 P2

---

### 9. 🟢 缺少表单验证

**问题描述**:
- designer.vue 中只有基础的非空验证
- 缺少节点配置完整性校验
- 可能导致保存无效的流程定义

**建议增加**:
- 必须有开始和结束节点
- 每个节点必须有后续节点（除了结束节点）
- 条件节点必须有至少一个条件分支

**优先级**: 🟢 P2

---

### 10. 🟢 缺少加载状态反馈

**问题描述**:
- tasks.vue 有 loading 状态
- index.vue 和 designer.vue 缺少统一的loading状态
- 用户不知道数据是否正在加载

**优先级**: 🟢 P2

---

### 11. 🟢 错误处理不够友好

**问题描述**:
- 所有错误都显示通用的"操作失败"
- 应该显示具体的错误信息

**当前代码**:
```javascript
catch (error) {
  ElMessage.error('操作失败')  // ❌ 通用错误
}
```

**建议改进**:
```javascript
catch (error) {
  const message = error.response?.data?.message || '操作失败'
  ElMessage.error(message)  // ✅ 具体错误
}
```

**优先级**: 🟢 P2

---

### 12. 🟢 缺少权限控制

**问题描述**:
- 所有用户都可以访问工作流管理
- 应该根据角色限制访问权限

**建议**:
- 流程定义管理：仅管理员
- 流程发起：所有用户
- 审批任务：仅审批人

**优先级**: 🟢 P2

---

## 📋 待确认问题清单

### 高优先级（必须确认）

1. **路由配置方式**
   - ❓ 工作流路由是硬编码在 `routes.js` 还是从后端菜单系统动态加载？
   - ❓ 如果需要动态加载，后端菜单表中是否已配置工作流菜单？
   
2. **userId获取方式**
   - ❓ 当前项目中 `useUserStore().userInfo?.id` 是否能正确获取用户ID？
   - ❓ 是否需要在请求拦截器中统一添加userId？

3. **流程实例页面需求**
   - ❓ 是否需要流程实例列表页面？
   - ❓ 是否需要流程历史追踪页面？

### 中优先级（建议确认）

4. **连接线实现方案**
   - ❓ 设计器是否需要完整的拖拽连线功能？
   - ❓ 还是采用简化的自动连接方案？

5. **流程发起入口**
   - ❓ 流程发起放在哪里？流程定义列表的操作列？还是独立页面？
   - ❓ 发起流程时是否需要填写业务表单？

6. **任务列表增强**
   - ❓ 任务列表是否需要显示更多字段（流程名称、发起人等）？
   - ❓ 是否需要批量审批功能？

### 低优先级（可选确认）

7. **可视化预览**
   - ❓ 是否需要集成专业的流程图渲染库？
   - ❓ 还是保持简单的JSON预览即可？

8. **权限控制粒度**
   - ❓ 工作流功能是否需要细粒度的权限控制？
   - ❓ 哪些角色可以管理流程定义？

---

## ✅ 已实现的功能

### 页面层面
- ✅ 流程定义列表页 (`index.vue`)
- ✅ 流程设计器 (`designer.vue`)
- ✅ 我的待办任务 (`tasks.vue`)

### 功能层面
- ✅ 流程定义CRUD
- ✅ 流程发布/停用
- ✅ 节点拖拽添加
- ✅ 节点属性配置
- ✅ 待办任务列表
- ✅ 任务审批/拒绝

### API层面
- ✅ 所有后端接口的封装（除userId参数外）

---

## 🎯 修复优先级建议

### 第一阶段（立即修复 - P0）
1. ✅ 添加前端路由配置
2. ✅ 修复API调用中的userId参数
3. ✅ 测试基本流程能否跑通

### 第二阶段（本周完成 - P1）
4. ✅ 实现流程设计器的连接线功能（至少简化版）
5. ✅ 创建流程实例列表页面
6. ✅ 添加流程发起入口
7. ✅ 增强任务列表信息展示

### 第三阶段（下周优化 - P2）
8. ✅ 改进流程预览
9. ✅ 添加表单验证
10. ✅ 优化错误提示
11. ✅ 添加权限控制

---

## 📝 总结

### 现状评估
- **页面完整度**: 60%（3个页面，缺少实例页面）
- **功能完整度**: 50%（核心功能有，但缺少关键细节）
- **API集成度**: 70%（接口封装完整，但参数传递有问题）
- **可用性**: 40%（路由未配置，无法正常访问）

### 核心问题
1. 🔴 **路由未配置** - 导致所有页面无法访问
2. 🔴 **userId参数缺失** - 导致API调用失败
3. 🟡 **设计器不完整** - 缺少连接线功能
4. 🟡 **缺少实例页面** - 无法查看流程执行情况

### 建议行动
1. **立即**: 修复路由和userId问题
2. **短期**: 完善设计器和实例页面
3. **长期**: 优化用户体验和权限控制

---

**审计人员**: AI Assistant  
**审核状态**: ⚠️ 需要修复  
**可交付状态**: ❌ 暂不可交付  

**最后更新**: 2026-04-09
