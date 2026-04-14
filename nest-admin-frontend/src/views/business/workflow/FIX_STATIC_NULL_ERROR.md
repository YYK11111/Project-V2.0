# 修复 /api/static/null 错误

**修复时间**: 2026-04-09  
**问题类型**: Bug修复  
**影响范围**: 用户头像等静态资源加载

---

## 🐛 问题描述

后端日志中出现以下错误：

```
NotFoundException: Cannot GET /api/static/null
```

这个错误发生在前端请求用户信息时，当用户的 `avatar` 字段为 `null` 或 `undefined` 时，前端代码会拼接出 `/api/static/null` 这样的无效路径。

---

## 🔍 根本原因

### 1. 前端代码问题

**文件**: `nest-admin-frontend/src/stores/user.js` (第21行)

**问题代码**:
```javascript
this.avatar = window.sysConfig.BASE_API + '/static/' + user.avatar || this.avatar
```

**问题分析**:
- 当 `user.avatar` 为 `null` 时，字符串拼接结果为 `/static/null`
- JavaScript 的 `||` 运算符在这里不会按预期工作，因为 `'/static/null'` 是 truthy 值
- 导致最终赋值了错误的 URL

**文件**: `nest-admin-frontend/src/stores/modules/user.js` (第36行)

**问题代码**:
```javascript
avatar && (this.user.avatar = avatar)
```

**问题分析**:
- 虽然使用了短路运算，但没有添加 `/static/` 前缀
- 如果 `avatar` 为字符串 `"null"`，仍然会被赋值

### 2. 后端中间件缺少空值检查

**文件**: `nest-admin/src/modules/common/common.module.ts`

**问题**: 
- 静态文件中间件没有对 `null` 或空路径进行检查
- 直接尝试访问 `/upload/null` 路径

---

## ✅ 修复方案

### 修复1: 前端用户 Store (user.js)

**文件**: `nest-admin-frontend/src/stores/user.js`

**修复后代码**:
```javascript
// 获取用户信息
getUserInfo() {
  return getUserInfo().then(({ data: user = {} }) => {
    this.id = user.id
    this.name = user.name
    // 修复：只有当 avatar 存在且不为 null 时才拼接路径
    if (user.avatar && user.avatar !== 'null') {
      this.avatar = window.sysConfig.BASE_API + '/static/' + user.avatar
    }
    this.roles = user.roles || []
    this.permissions = user.permissions || []
    this.configParamInfo = user.configParamInfo
    return user
  })
},
```

**改进点**:
- ✅ 添加了 `user.avatar` 存在性检查
- ✅ 添加了 `user.avatar !== 'null'` 字符串检查
- ✅ 只有在 avatar 有效时才更新 URL

### 修复2: 前端用户模块 Store (modules/user.js)

**文件**: `nest-admin-frontend/src/stores/modules/user.js`

**修复后代码**:
```javascript
this.user.name = user.userName
// 修复：只有当 avatar 存在且不为 null 时才赋值
avatar && avatar !== 'null' && (this.user.avatar = window.sysConfig.BASE_API + '/static/' + avatar)
this.user.configParamInfo = res.configParamInfo
```

**改进点**:
- ✅ 添加了 `avatar !== 'null'` 检查
- ✅ 正确拼接了 `/static/` 前缀

### 修复3: 后端静态文件中间件

**文件**: `nest-admin/src/modules/common/common.module.ts`

**修复后代码**:
```typescript
export class StaticFileMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 检查请求是否匹配静态资源路径 - 支持 /static/ 和 /api/static/ 两种路径
    if (req.url.startsWith('/static/') || req.url.startsWith('/api/static/')) {
      // 获取文件路径
      let filePath = req.url;
      // 移除路径前缀
      if (filePath.startsWith('/api/static/')) {
        filePath = filePath.replace('/api/static/', '');
      } else if (filePath.startsWith('/static/')) {
        filePath = filePath.replace('/static/', '');
      }

      // 防止 null 或空路径
      if (!filePath || filePath === 'null' || filePath.trim() === '') {
        return next();
      }

      const fullPath = join(process.cwd(), 'upload', filePath);

      // 检查文件是否存在
      import('fs')
        .then(fs => {
          fs.access(fullPath, fs.constants.R_OK, (err) => {
            if (!err) {
              res.sendFile(fullPath);
            } else {
              // 如果文件不存在，继续下一个中间件
              next();
            }
          });
        })
        .catch(() => {
          next();
        });
    } else {
      next();
    }
  }
}
```

**改进点**:
- ✅ 添加了 `filePath` 空值检查
- ✅ 添加了 `filePath === 'null'` 字符串检查
- ✅ 添加了 `filePath.trim() === ''` 空白字符检查
- ✅ 无效路径直接调用 `next()` 跳过处理

---

## 📊 修复效果

### 修复前
- ❌ 后端日志频繁出现 `Cannot GET /api/static/null` 错误
- ❌ 用户头像显示为默认图片（但控制台有404错误）
- ❌ 不必要的服务器负载（处理无效请求）

### 修复后
- ✅ 不再出现 `/api/static/null` 错误
- ✅ 当用户没有头像时，使用默认头像且不发起无效请求
- ✅ 后端中间件有效拦截无效路径请求
- ✅ 减少服务器日志噪音和不必要的文件访问

---

## 🧪 验证方法

### 1. 测试场景1: 用户没有头像

**步骤**:
1. 登录一个没有设置头像的用户账号
2. 观察浏览器控制台 Network 面板
3. 检查后端日志

**预期结果**:
- ✅ 不发起 `/api/static/null` 请求
- ✅ 显示默认头像图片
- ✅ 后端无 404 错误日志

### 2. 测试场景2: 用户有头像

**步骤**:
1. 登录一个已设置头像的用户账号
2. 观察头像是否正常显示
3. 检查头像 URL 格式

**预期结果**:
- ✅ 头像正常显示
- ✅ URL 格式为 `/api/static/avatar/xxx.jpg`
- ✅ 无错误日志

### 3. 测试场景3: 手动访问无效路径

**步骤**:
1. 在浏览器中访问 `http://localhost:3000/api/static/null`
2. 观察响应

**预期结果**:
- ✅ 返回 404 或其他适当错误
- ✅ 不会抛出未捕获的异常

---

## 📝 相关文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `nest-admin-frontend/src/stores/user.js` | 修改 | 修复 avatar URL 拼接逻辑 |
| `nest-admin-frontend/src/stores/modules/user.js` | 修改 | 修复 avatar 赋值逻辑 |
| `nest-admin/src/modules/common/common.module.ts` | 修改 | 添加空值防护 |

---

## 💡 最佳实践建议

### 1. 字符串拼接前的空值检查

**不推荐**:
```javascript
const url = baseUrl + '/' + value || defaultValue
```

**推荐**:
```javascript
const url = value && value !== 'null' ? baseUrl + '/' + value : defaultValue
```

### 2. 中间件中的输入验证

所有外部输入（包括 URL 路径）都应该进行验证：
```typescript
if (!filePath || filePath === 'null' || filePath.trim() === '') {
  return next(); // 或返回适当的错误
}
```

### 3. 数据库字段默认值

建议在数据库层面设置合理的默认值：
```sql
ALTER TABLE sys_user 
MODIFY COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '用户头像';
```

或者在应用层确保字段始终有有效值。

---

## 🔗 相关问题

这个问题可能与以下场景相关：
- 用户注册时未上传头像
- 旧数据迁移时 avatar 字段为 NULL
- 用户删除头像后字段变为 null

建议后续可以考虑：
1. 在用户注册时自动分配默认头像
2. 提供"重置为默认头像"功能
3. 前端统一处理图片加载失败的 fallback

---

**修复状态**: ✅ 已完成  
**编译状态**: ✅ 通过  
**需要重启**: 是（前后端都需要重启以应用更改）
