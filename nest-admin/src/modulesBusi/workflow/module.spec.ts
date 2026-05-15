import { MODULE_METADATA } from "@nestjs/common/constants";
import { UsersModule } from "../../modules/users/users.module";
import { SysFileModule } from "../../modules/sys/file/module";
import { ArticleBorrowsModule } from "../articleBorrows/module";
import { ChangesModule } from "../changes/module";
import { ProjectsModule } from "../projects/module";
import { TasksBusiModule } from "../tasks/module";
import { TicketsModule } from "../tickets/module";
import { WorkflowModule } from "./module";

function hasForwardRefImport(moduleClass: any, expectedModule: any) {
  const imports =
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) || [];
  return imports.some((item) => {
    return (
      item &&
      typeof item.forwardRef === "function" &&
      item.forwardRef() === expectedModule
    );
  });
}

describe("WorkflowModule 循环依赖声明", () => {
  it("WorkflowModule 通过 forwardRef 引入 UsersModule", () => {
    expect(hasForwardRefImport(WorkflowModule, UsersModule)).toBe(true);
  });

  it("ArticleBorrowsModule 通过 forwardRef 引入 WorkflowModule", () => {
    expect(hasForwardRefImport(ArticleBorrowsModule, WorkflowModule)).toBe(
      true,
    );
  });

  it("TicketsModule 通过 forwardRef 引入 UsersModule", () => {
    expect(hasForwardRefImport(TicketsModule, UsersModule)).toBe(true);
  });

  it("TicketsModule 通过 forwardRef 引入项目、任务和文件模块", () => {
    expect(hasForwardRefImport(TicketsModule, ProjectsModule)).toBe(true);
    expect(hasForwardRefImport(TicketsModule, TasksBusiModule)).toBe(true);
    expect(hasForwardRefImport(TicketsModule, SysFileModule)).toBe(true);
  });

  it("ChangesModule 通过 forwardRef 引入 UsersModule", () => {
    expect(hasForwardRefImport(ChangesModule, UsersModule)).toBe(true);
  });

  it("ChangesModule 通过 forwardRef 引入项目和文件模块", () => {
    expect(hasForwardRefImport(ChangesModule, ProjectsModule)).toBe(true);
    expect(hasForwardRefImport(ChangesModule, SysFileModule)).toBe(true);
  });
});
