import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { AcceptanceRecordsController } from "src/modulesBusi/acceptance-records/controller";
import { ChangesController } from "src/modulesBusi/changes/controller";
import { GoLiveRecordsController } from "src/modulesBusi/go-live-records/controller";
import { HandoverRecordsController } from "src/modulesBusi/handover-records/controller";
import { MilestonesController } from "src/modulesBusi/milestones/controller";
import { RisksController } from "src/modulesBusi/risks/controller";
import { SprintsController } from "src/modulesBusi/sprints/controller";
import { TasksController } from "src/modulesBusi/tasks/controller";
import { TicketsController } from "src/modulesBusi/tickets/controller";

type ControllerConstructor = new (...args: any[]) => any;

const projectScopedControllers: Array<{
  name: string;
  ControllerClass: ControllerConstructor;
}> = [
  { name: "acceptance-records", ControllerClass: AcceptanceRecordsController },
  { name: "changes", ControllerClass: ChangesController },
  { name: "go-live-records", ControllerClass: GoLiveRecordsController },
  { name: "handover-records", ControllerClass: HandoverRecordsController },
  { name: "milestones", ControllerClass: MilestonesController },
  { name: "risks", ControllerClass: RisksController },
  { name: "sprints", ControllerClass: SprintsController },
  { name: "tasks", ControllerClass: TasksController },
  { name: "tickets", ControllerClass: TicketsController },
];

function getRouteMetadata(
  ControllerClass: ControllerConstructor,
  methodName: string,
) {
  const method = ControllerClass.prototype[methodName];
  return {
    path: Reflect.getMetadata(PATH_METADATA, method),
    requestMethod: Reflect.getMetadata(METHOD_METADATA, method),
  };
}

function createController(
  ControllerClass: ControllerConstructor,
  service: any,
) {
  return new ControllerClass(service, {});
}

describe("项目执行对象 HTTP 权限路由", () => {
  describe.each(projectScopedControllers)("$name", ({ ControllerClass }) => {
    it("必须直接覆盖 list/getOne 并保留标准 GET 路由 metadata", () => {
      expect(
        Object.prototype.hasOwnProperty.call(ControllerClass.prototype, "list"),
      ).toBe(true);
      expect(
        Object.prototype.hasOwnProperty.call(
          ControllerClass.prototype,
          "getOne",
        ),
      ).toBe(true);

      expect(getRouteMetadata(ControllerClass, "list")).toEqual({
        path: "list",
        requestMethod: RequestMethod.GET,
      });
      expect(getRouteMetadata(ControllerClass, "getOne")).toEqual({
        path: "getOne/:id",
        requestMethod: RequestMethod.GET,
      });
      expect(ControllerClass.prototype).not.toHaveProperty(
        "listWithProjectScope",
      );
      expect(ControllerClass.prototype).not.toHaveProperty("listWithDefaults");
      expect(ControllerClass.prototype).not.toHaveProperty(
        "getOneWithProjectScope",
      );
    });

    it("getOne 必须向 service 透传操作人和权限", async () => {
      const permissions = ["business:project:view"];

      const service = {
        getOne: jest.fn().mockResolvedValue({ id: "42" }),
      };
      const controller = createController(ControllerClass, service);

      await controller.getOne("42", {
        user: {
          id: "user-1",
          permissions,
        },
      });

      expect(service.getOne).toHaveBeenCalledWith({
        id: "42",
        _operatorId: "user-1",
        _operatorPermissions: permissions,
      });
    });

    it("getOne 在用户权限缺省时必须传空权限数组", async () => {
      const service = {
        getOne: jest.fn().mockResolvedValue({ id: "42" }),
      };
      const controller = createController(ControllerClass, service);

      await controller.getOne("42", {
        user: {
          id: "user-1",
        },
      });

      expect(service.getOne).toHaveBeenCalledWith({
        id: "42",
        _operatorId: "user-1",
        _operatorPermissions: [],
      });
    });
  });
});
