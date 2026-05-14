import { describe, expect, it } from "@jest/globals";
import {
  hasPermissionOrAccess,
  hasModuleFullAccess,
  hasPermissionOrManageAll,
} from "./business-list-permission";
import { normalizePermissionKey } from "./permission-key";

describe("business-list-permission", () => {
  it("模块全量权限可以放行同模块的列表和按钮权限", () => {
    expect(
      hasPermissionOrManageAll(
        ["business/projects/manageAll"],
        "business/projects/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrManageAll(
        ["business/projects/manageAll"],
        "business/projects/update",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrManageAll(
        ["business/projects/manageAll"],
        "business/tasks/update",
      ),
    ).toBe(false);
  });

  it("旧 listAll 权限字符会归一为 manageAll", () => {
    expect(normalizePermissionKey("business/projects/listAll")).toBe(
      "business/projects/manageAll",
    );
  });

  it("manageAll 也应视为模块全量权限", () => {
    expect(
      hasModuleFullAccess(
        ["business/projects/manageAll"],
        "business/projects/list",
      ),
    ).toBe(true);
    expect(
      hasModuleFullAccess(
        ["business/projects/manageAll"],
        "business/tasks/list",
      ),
    ).toBe(false);
  });

  it("access 只放行业务模块只读权限", () => {
    expect(
      hasPermissionOrAccess(
        ["business/projects/access"],
        "business/projects/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/projects/access"],
        "business/projects/getOne",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/projects/access"],
        "business/projects/update",
      ),
    ).toBe(false);
    expect(
      hasPermissionOrAccess(
        ["business/projects/access"],
        "business/tasks/list",
      ),
    ).toBe(false);
  });

  it("access 覆盖明确的业务只读动作但不覆盖写动作", () => {
    expect(
      hasPermissionOrAccess(
        ["business/projects/access"],
        "business/projects/dashboard",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/tasks/access"],
        "business/tasks/dependency/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/tasks/access"],
        "business/tasks/dependency/add",
      ),
    ).toBe(false);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/history",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/cancel",
      ),
    ).toBe(false);
  });

  it("工作流定义 access 只放行配置侧查看接口", () => {
    expect(
      hasPermissionOrAccess(
        ["business/workflow/definitions/access"],
        "business/workflow/definitions/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/definitions/access"],
        "business/workflow/definitions/getOne",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/definitions/access"],
        "business/workflow/definitions/update",
      ),
    ).toBe(false);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/definitions/access"],
        "business/workflow/definitions/publish",
      ),
    ).toBe(false);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/definitions/access"],
        "business/workflow/definitions/start",
      ),
    ).toBe(false);
  });

  it("工作流实例 access 放行参与实例查看但不放行撤回取消", () => {
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/getOne",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/history",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/tasks",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/withdraw",
      ),
    ).toBe(false);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/instances/access"],
        "business/workflow/instances/cancel",
      ),
    ).toBe(false);
  });

  it("工作流任务 access 放行我的待办和本人审批处理动作", () => {
    expect(
      hasPermissionOrAccess(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/list",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/complete",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/transfer",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/addSign",
      ),
    ).toBe(true);
    expect(
      hasPermissionOrAccess(
        ["business/workflow/tasks/access"],
        "business/workflow/definitions/getOne",
      ),
    ).toBe(false);
  });
});
