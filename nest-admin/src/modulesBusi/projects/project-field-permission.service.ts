import { Injectable } from "@nestjs/common";
import { SystenConfigsService } from "src/modules/configs/service";
import { Project } from "./entity";
import { ProjectMemberRole } from "../project-members/entity";

type PermissionLevel = "hidden" | "readonly" | "editable";
type MatrixRole =
  | "projectManager"
  | "deliveryManager"
  | "ownerRole"
  | "member"
  | "visitor";

@Injectable()
export class ProjectFieldPermissionService {
  private readonly groupFieldMap: Record<string, string[]> = {
    projectBasic: [
      "name",
      "code",
      "projectType",
      "priority",
      "description",
      "category",
      "tags",
      "departmentId",
      "leaderId",
      "creatorId",
    ],
    projectMember: ["members"],
    projectPlan: [
      "startDate",
      "endDate",
      "planStartDate",
      "planEndDate",
      "actualStartDate",
      "actualEndDate",
      "phase",
      "phaseStartDate",
      "phaseEndDate",
      "baselinePlanNote",
      "scopeBoundary",
      "baselineDeliverables",
      "milestones",
    ],
    projectBusiness: [
      "customerId",
      "budget",
      "actualCost",
      "currency",
      "spentHours",
      "businessLine",
      "industry",
      "projectSource",
    ],
    projectClosure: [
      "closeSummary",
      "closeDeliverables",
      "closeOpenIssues",
      "closeReview",
      "acceptanceDate",
    ],
    projectKnowledge: [],
  };

  constructor(private readonly systemConfigsService: SystenConfigsService) {}

  private readonly roleMap: Record<string, MatrixRole> = {
    [ProjectMemberRole.manager]: "projectManager",
    [ProjectMemberRole.deliveryManager]: "deliveryManager",
    [ProjectMemberRole.techLead]: "ownerRole",
    [ProjectMemberRole.implementationLead]: "ownerRole",
    [ProjectMemberRole.testLead]: "ownerRole",
    [ProjectMemberRole.customerContact]: "ownerRole",
    [ProjectMemberRole.businessContact]: "ownerRole",
    [ProjectMemberRole.developer]: "member",
    [ProjectMemberRole.implementationConsultant]: "member",
    [ProjectMemberRole.tester]: "member",
    [ProjectMemberRole.operationsEngineer]: "member",
    [ProjectMemberRole.trainer]: "member",
    [ProjectMemberRole.dataMigrationEngineer]: "member",
    [ProjectMemberRole.onsiteSupport]: "member",
    [ProjectMemberRole.member]: "member",
    [ProjectMemberRole.visitor]: "visitor",
  };

  private rank(level: PermissionLevel) {
    return {
      hidden: 0,
      readonly: 1,
      editable: 2,
    }[level];
  }

  private minLevel(
    current: PermissionLevel,
    maxAllowed: PermissionLevel,
  ): PermissionLevel {
    return this.rank(current) <= this.rank(maxAllowed) ? current : maxAllowed;
  }

  resolveMatrixRole(rawRole?: string, canVisit = false): MatrixRole | null {
    if (!rawRole) return canVisit ? "visitor" : null;
    return this.roleMap[rawRole] || "member";
  }

  async getProjectFieldPermissions(options: {
    project: Project;
    rawRole?: string;
    canVisit?: boolean;
  }) {
    const matrix =
      await this.systemConfigsService.getProjectFieldPermissionMatrix();
    const matrixRole = this.resolveMatrixRole(
      options.rawRole,
      options.canVisit,
    );
    const roleLabelMap: Record<MatrixRole, string> = {
      projectManager: "项目经理",
      deliveryManager: "交付经理",
      ownerRole: "负责人类角色",
      member: "普通成员",
      visitor: "访客",
    };

    const baseGroups =
      matrixRole && matrix?.project?.[matrixRole]
        ? { ...matrix.project[matrixRole] }
        : { ...matrix.project.visitor };

    const contextRules = {
      approvalLocked: String(options.project?.approvalStatus || "") === "2",
      archivedReadonly: String(options.project?.isArchived || "") === "1",
      closedReadonly: String(options.project?.status || "") === "6",
    };

    if (contextRules.approvalLocked) {
      baseGroups.projectBasic = this.minLevel(
        baseGroups.projectBasic,
        "readonly",
      );
      baseGroups.projectBusiness = this.minLevel(
        baseGroups.projectBusiness,
        "readonly",
      );
      baseGroups.projectClosure = this.minLevel(
        baseGroups.projectClosure,
        "readonly",
      );
    }

    if (contextRules.archivedReadonly || contextRules.closedReadonly) {
      baseGroups.projectBasic = this.minLevel(
        baseGroups.projectBasic,
        "readonly",
      );
      baseGroups.projectPlan = this.minLevel(
        baseGroups.projectPlan,
        "readonly",
      );
      baseGroups.projectBusiness = this.minLevel(
        baseGroups.projectBusiness,
        "readonly",
      );
      baseGroups.projectClosure = this.minLevel(
        baseGroups.projectClosure,
        "readonly",
      );
    }

    const fields: Record<string, PermissionLevel> = {};
    Object.entries(this.groupFieldMap).forEach(([groupCode, fieldKeys]) => {
      fieldKeys.forEach((fieldKey) => {
        fields[fieldKey] = baseGroups[groupCode] || "readonly";
      });
    });

    return {
      businessType: "project",
      businessId: options.project?.id,
      projectRole: {
        rawRole: options.rawRole || "",
        matrixRole: matrixRole || "visitor",
        roleLabel: roleLabelMap[(matrixRole || "visitor") as MatrixRole],
      },
      groups: baseGroups,
      fields,
      contextRules,
    };
  }

  getGroupFieldMap() {
    return this.groupFieldMap;
  }
}
