import "reflect-metadata";
import { BaseController } from "./BaseController";
import { AcceptanceRecordsController } from "src/modulesBusi/acceptance-records/controller";
import { ChangesController } from "src/modulesBusi/changes/controller";
import { GoLiveRecordsController } from "src/modulesBusi/go-live-records/controller";
import { HandoverRecordsController } from "src/modulesBusi/handover-records/controller";
import { MilestonesController } from "src/modulesBusi/milestones/controller";
import { RisksController } from "src/modulesBusi/risks/controller";
import { SprintsController } from "src/modulesBusi/sprints/controller";
import { TasksController } from "src/modulesBusi/tasks/controller";
import { TicketsController } from "src/modulesBusi/tickets/controller";

describe("项目执行对象控制器路由覆盖", () => {
  const scopedControllers = [
    AcceptanceRecordsController,
    ChangesController,
    GoLiveRecordsController,
    HandoverRecordsController,
    MilestonesController,
    RisksController,
    SprintsController,
    TasksController,
    TicketsController,
  ];

  it("必须直接覆盖 BaseController 的 list/getOne，避免同路径双路由绕过权限", () => {
    for (const ControllerClass of scopedControllers) {
      const ownMethodNames = Object.getOwnPropertyNames(
        ControllerClass.prototype,
      );
      expect(ownMethodNames).toContain("list");
      expect(ownMethodNames).toContain("getOne");
      expect(ControllerClass.prototype.list).not.toBe(
        BaseController.prototype.list,
      );
      expect(ControllerClass.prototype.getOne).not.toBe(
        BaseController.prototype.getOne,
      );
    }
  });

  it("不应使用额外命名的同路径 list/getOne 方法", () => {
    for (const ControllerClass of scopedControllers) {
      const ownMethodNames = Object.getOwnPropertyNames(
        ControllerClass.prototype,
      );
      expect(ownMethodNames).not.toContain("listWithProjectScope");
      expect(ownMethodNames).not.toContain("listWithDefaults");
      expect(ownMethodNames).not.toContain("getOneWithProjectScope");
    }
  });
});
