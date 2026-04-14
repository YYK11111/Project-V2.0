# CRM客户管理模块 - 测试指南

## 📋 完成的工作

### 1. 数据库层面 ✅
- ✅ 创建了4个CRM数据表：
  - `crm_customer` - 客户表
  - `crm_interaction` - 客户互动记录表
  - `crm_opportunity` - 销售机会表
  - `crm_contract` - 合同表

### 2. 后端层面 ✅
- ✅ 实现了完整的NestJS模块结构
- ✅ 创建了4个子模块：customers, interactions, opportunities, contracts
- ✅ 每个模块包含：Entity, DTO, Service, Controller
- ✅ 已注册到AppModule

### 3. 前端层面 ✅
- ✅ 创建了API接口定义文件（4个）
- ✅ 创建了完整的管理页面（8个Vue文件）：
  - 客户管理：列表页 + 表单页
  - 互动记录：列表页 + 表单页
  - 销售机会：列表页 + 表单页
  - 合同管理：列表页 + 表单页

### 4. 菜单和权限 ✅
- ✅ 插入了25个CRM相关菜单项
- ✅ 为超级管理员角色分配了所有CRM权限

---

## 🧪 测试步骤

### 第一步：启动后端服务

```bash
cd /Users/yyk/工作/代码开发/Project-V2.0/nest-admin
npm run start:dev
```

确保后端服务正常运行，监听在 http://localhost:3000

### 第二步：启动前端服务

```bash
cd /Users/yyk/工作/代码开发/Project-V2.0/nest-admin-frontend
npm run dev
```

确保前端服务正常运行，通常在 http://localhost:5173

### 第三步：登录系统

1. 打开浏览器访问前端地址
2. 使用超级管理员账号登录（admin/123456 或您设置的密码）
3. 登录后，应该能在左侧菜单看到"CRM客户管理"菜单项

### 第四步：测试客户管理功能

#### 4.1 访问客户列表
- 点击左侧菜单：CRM客户管理 > 客户管理 > 客户列表
- 应该能看到空列表（如果没有数据）

#### 4.2 新增客户
- 点击"新增客户"按钮
- 填写必填字段：
  - 客户名称：测试客户A
  - 联系人：张三
  - 联系电话：13800138000
- 可选填写其他字段
- 点击"提交"
- 应该提示"新增成功"并返回列表

#### 4.3 查看客户列表
- 列表中应该显示刚创建的客户
- 检查字段显示是否正确

#### 4.4 编辑客户
- 点击某客户的"修改"按钮
- 修改某些字段
- 点击"提交"
- 应该提示"修改成功"

#### 4.5 删除客户
- 点击某客户的"删除"按钮
- 确认删除
- 应该提示删除成功，客户从列表中消失

#### 4.6 搜索功能
- 在搜索框输入客户名称
- 应该能正确过滤结果

### 第五步：测试互动记录功能

#### 5.1 访问互动记录列表
- 点击左侧菜单：CRM客户管理 > 互动记录 > 互动列表

#### 5.2 新增互动记录
- 点击"新增互动记录"按钮
- 选择客户（选择之前创建的测试客户）
- 选择互动类型：电话
- 填写互动内容：初次联系，了解客户需求
- 选择互动时间
- 点击"提交"

#### 5.3 查看和编辑
- 验证互动记录显示正确
- 测试编辑和删除功能

### 第六步：测试销售机会功能

#### 6.1 访问销售机会列表
- 点击左侧菜单：CRM客户管理 > 销售机会 > 机会列表

#### 6.2 新增销售机会
- 点击"新增销售机会"按钮
- 填写信息：
  - 机会名称：测试项目合作
  - 选择客户
  - 预期金额：100000
  - 销售阶段：初步接触
  - 成功概率：30%
  - 预计成交时间：选择一个未来日期
- 点击"提交"

#### 6.3 验证功能
- 检查列表显示
- 测试编辑、删除功能

### 第七步：测试合同管理功能

#### 7.1 访问合同列表
- 点击左侧菜单：CRM客户管理 > 合同管理 > 合同列表

#### 7.2 新增合同
- 点击"新增合同"按钮
- 填写信息：
  - 合同名称：测试服务合同
  - 选择客户
  - 合同金额：50000
  - 签订时间：选择日期
  - 开始时间和结束时间
  - 选择合同负责人
- 点击"提交"

#### 7.3 验证功能
- 检查列表显示
- 测试编辑、删除功能

### 第八步：测试关联功能

#### 8.1 客户与互动记录关联
- 在互动记录列表中，应该能看到关联的客户名称
- 筛选某个客户的互动记录

#### 8.2 客户与销售机会关联
- 在销售机会列表中，应该能看到关联的客户名称
- 筛选某个客户的销售机会

#### 8.3 客户与合同关联
- 在合同列表中，应该能看到关联的客户名称
- 筛选某个客户的合同

---

## 🔍 常见问题排查

### 问题1：菜单不显示
**原因**：可能是缓存问题或权限未生效
**解决**：
1. 清除浏览器缓存
2. 退出重新登录
3. 检查数据库中sys_role_menu表是否有对应记录

### 问题2：页面显示"待开发"
**原因**：路由配置的路径与实际文件路径不匹配
**解决**：
1. 检查数据库中sys_menu表的component字段
2. 确保路径格式为：`business/crm/customerManage/index`
3. 检查文件是否真实存在

### 问题3：API请求404
**原因**：后端路由未正确注册
**解决**：
1. 检查后端是否正常运行
2. 检查Controller的装饰器路径
3. 检查CrmModule是否已在AppModule中导入

### 问题4：数据保存失败
**原因**：可能是字段验证失败或数据库连接问题
**解决**：
1. 检查浏览器控制台的错误信息
2. 检查后端日志
3. 验证必填字段是否都已填写

---

## 📊 数据库验证SQL

### 查看所有CRM菜单
```sql
SELECT id, name, parent_id, type, path, component 
FROM sys_menu 
WHERE name LIKE '%CRM%' OR name LIKE '%客户%' OR name LIKE '%互动%' OR name LIKE '%机会%' OR name LIKE '%合同%'
ORDER BY id;
```

### 查看权限分配
```sql
SELECT rm.roleId, r.name as role_name, rm.menuId, m.name as menu_name 
FROM sys_role_menu rm 
JOIN sys_role r ON rm.roleId = r.id 
JOIN sys_menu m ON rm.menuId = m.id 
WHERE m.name LIKE '%CRM%' OR m.name LIKE '%客户%' OR m.name LIKE '%互动%' OR m.name LIKE '%机会%' OR m.name LIKE '%合同%'
ORDER BY rm.menuId;
```

### 查看CRM数据表
```sql
SHOW TABLES LIKE 'crm_%';
```

---

## ✨ 功能特性说明

### 客户管理
- **客户类型**：企业客户、个人客户
- **客户等级**：VIP、重要、普通
- **客户状态**：潜在、意向、成交、流失
- **支持字段**：统一社会信用代码、行业、规模、地址等

### 互动记录
- **互动类型**：电话、邮件、拜访、会议、其他
- **自动记录**：互动人信息自动获取当前用户
- **跟进提醒**：可设置下次跟进时间

### 销售机会
- **销售阶段**：初步接触、需求分析、方案制定、商务谈判、合同签订
- **成功概率**：0-100%滑块选择
- **关联项目**：可与具体项目关联

### 合同管理
- **合同状态**：执行中、已到期、已终止、已归档
- **收款跟踪**：记录合同金额和已收款金额
- **合同期限**：支持开始和结束时间

---

## 🎯 下一步优化建议

1. **数据字典**：将枚举值（客户类型、等级、状态等）配置化
2. **导出功能**：添加Excel导出功能
3. **统计报表**：添加CRM数据统计看板
4. **高级搜索**：实现更复杂的组合搜索
5. **批量操作**：支持批量导入客户数据
6. **附件上传**：完善合同文件和互动附件上传功能
7. **消息提醒**：跟进时间到达时发送提醒
8. **权限细化**：为不同角色配置不同的CRM权限

---

## 📝 相关文件清单

### 后端文件
- `/nest-admin/src/modulesBusi/crm/module.ts`
- `/nest-admin/src/modulesBusi/crm/customers/*` (4个文件)
- `/nest-admin/src/modulesBusi/crm/interactions/*` (4个文件)
- `/nest-admin/src/modulesBusi/crm/opportunities/*` (4个文件)
- `/nest-admin/src/modulesBusi/crm/contracts/*` (4个文件)

### 前端文件
- `/nest-admin-frontend/src/views/business/crm/customerManage/api.ts`
- `/nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
- `/nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- `/nest-admin-frontend/src/views/business/crm/interactionManage/*` (3个文件)
- `/nest-admin-frontend/src/views/business/crm/opportunityManage/*` (3个文件)
- `/nest-admin-frontend/src/views/business/crm/contractManage/*` (3个文件)

### SQL脚本
- `/nest-admin/doc/sql/crm_init.sql` - 表结构初始化
- `/nest-admin/doc/sql/crm_menus.sql` - 菜单配置
- `/nest-admin/doc/sql/crm_permissions.sql` - 权限分配

---

## ✅ 测试完成检查清单

- [ ] 后端服务正常启动
- [ ] 前端服务正常启动
- [ ] 能够成功登录系统
- [ ] 左侧菜单显示CRM客户管理
- [ ] 能够访问客户列表页面
- [ ] 能够新增客户
- [ ] 能够编辑客户
- [ ] 能够删除客户
- [ ] 能够搜索客户
- [ ] 能够新增互动记录
- [ ] 能够新增销售机会
- [ ] 能够新增合同
- [ ] 所有页面的增删改查功能正常
- [ ] 关联数据显示正确
- [ ] 没有控制台错误

---

**祝您测试顺利！如有问题，请查看后端日志和浏览器控制台错误信息。**
