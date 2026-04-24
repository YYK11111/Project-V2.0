# Role-Only Permission Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the super-admin `"*"` permission shortcut so every API permission is resolved from the union of the user's role permissions, while admin-only operations still check for the `admin` role.

**Architecture:** Keep the existing JWT payload-based authorization flow, but change permission population to always derive from `RolesService.getUserMenus(user)`. Update guard and admin checks to remove `"*"` semantics and rely on role membership for admin-only actions.

**Tech Stack:** NestJS, Jest, TypeScript, TypeORM

---

### Task 1: Lock Expected AuthService Behavior With Tests

**Files:**
- Modify: `nest-admin/src/modules/auth/auth.service.spec.ts`
- Test: `nest-admin/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("超级管理员登录时按角色菜单权限写入权限并集而不是星号", async () => {
  const service = createService();
  jest.spyOn(passwordUtils, "verifyPassword").mockResolvedValue(true);
  const req = {
    body: {
      account: "NestAdmin",
      password: "Password@123",
      uuid: "uuid-1",
      code: "1234",
    },
    headers: {},
    connection: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    cookie: jest.fn(),
  };

  usersService.getOne.mockResolvedValue({
    id: "1",
    name: "NestAdmin",
    password: "scrypt$hash",
    roles: [{ id: "1", permissionKey: "admin", isActive: 1 }],
  });
  rolesService.getUserMenus.mockResolvedValue([
    { id: "m1", permissionKey: "system/users/getOne" },
    { id: "m2", permissionKey: "system/users/update" },
    { id: "m3", permissionKey: "system/users/update" },
  ]);

  await service.login(req as any, res as any);

  expect(jwtService.signAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      permissions: ["system/users/getOne", "system/users/update"],
    }),
    expect.any(Object),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/auth/auth.service.spec.ts --runInBand`
Expected: FAIL because payload permissions currently contain `"*"`

- [ ] **Step 3: Write minimal implementation**

```ts
const menus = await this.rolesService.getUserMenus(user);
user.permissions = [
  ...new Set(menus.flatMap((menu) => menu.permissionKey || []).filter(Boolean)),
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/modules/auth/auth.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modules/auth/auth.service.spec.ts nest-admin/src/modules/auth/auth.service.ts
git commit -m "test: cover role-based auth permissions"
```

### Task 2: Lock Expected Guard And Admin Check Behavior With Tests

**Files:**
- Modify: `nest-admin/src/modules/auth/auth.guard.spec.ts`
- Modify: `nest-admin/src/modules/auth/auth.service.spec.ts`
- Test: `nest-admin/src/modules/auth/auth.guard.spec.ts`
- Test: `nest-admin/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing guard test**

```ts
it("不再把星号当作超级权限放行", async () => {
  const guard = new AuthGuard(
    jwtService as unknown as JwtService,
    reflector as unknown as Reflector,
    redisService as any,
  );
  const request: Record<string, any> = {
    headers: {
      cookie: "admin_session=header.payload.signature",
    },
    path: "/api/system/users/updateTheme",
    method: "PUT",
    body: {},
  };

  jwtService.verifyAsync.mockResolvedValue({
    permissions: ["*"],
    id: "user_1",
  });
  redisService.getPermissions.mockResolvedValue(["system/users/update"]);

  await expect(guard.canActivate(createContext(request))).rejects.toThrow(
    "接口无权限",
  );
});
```

- [ ] **Step 2: Write the failing admin-role test**

```ts
it("拥有 admin 角色时允许执行管理员限定能力", () => {
  const service = createService();

  expect(() =>
    service.ensureAdmin({
      roles: [{ permissionKey: "admin" }],
      permissions: [],
    } as any),
  ).not.toThrow();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/modules/auth/auth.guard.spec.ts src/modules/auth/auth.service.spec.ts --runInBand`
Expected: FAIL because guard still bypasses `"*"` and `ensureAdmin` still checks `permissions`

- [ ] **Step 4: Write minimal implementation**

```ts
const hasAdminRole = user?.roles?.some(
  (role) => role?.permissionKey === config.adminKey,
);
if (!hasAdminRole) {
  throw new ForbiddenException("接口无权限");
}
```

```ts
if (
  requiredPermission &&
  permissions.includes(requiredPermission) &&
  !payload.permissions?.includes(requiredPermission)
) {
  throw new HttpException("接口无权限", 403);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/modules/auth/auth.guard.spec.ts src/modules/auth/auth.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin/src/modules/auth/auth.guard.spec.ts nest-admin/src/modules/auth/auth.service.spec.ts nest-admin/src/modules/auth/auth.guard.ts nest-admin/src/modules/auth/auth.service.ts
git commit -m "refactor: remove wildcard auth bypass"
```

### Task 3: Run Focused Verification

**Files:**
- No code changes required

- [ ] **Step 1: Run auth-related Jest coverage**

Run: `npm test -- src/modules/auth/auth.service.spec.ts src/modules/auth/auth.guard.spec.ts src/modules/auth/auth.controller.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 2: Run backend lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Record any follow-up if admin role data is incomplete**

If verification passes but runtime still shows 403 for super-admin accounts, inspect `sys_role_menu` data for the `admin` role and confirm it includes the required button permissions such as `system/users/update`.
