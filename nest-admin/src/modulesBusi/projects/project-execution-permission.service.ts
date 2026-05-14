import { Injectable } from "@nestjs/common";
import { getProjectScopedPermissions } from "src/common/utils/business-list-permission";
import { ProjectsService } from "./service";

@Injectable()
export class ProjectExecutionPermissionService {
  constructor(private readonly projectsService: ProjectsService) {}

  async getVisibleProjectIds(
    userId: string,
    permissions: string[] = [],
    manageAllPermissionKey?: string,
  ) {
    if (!userId) return [];
    const scopedPermissions = getProjectScopedPermissions(
      permissions,
      manageAllPermissionKey,
    );
    const projectIds = await this.projectsService.getVisibleProjectIdsForUser(
      userId,
      scopedPermissions,
    );
    if (projectIds === null) return null;
    const visibleProjectIds: string[] = [];
    for (const projectId of projectIds) {
      const normalizedProjectId = String(projectId || "");
      if (!normalizedProjectId) continue;
      try {
        await this.assertReadableProject(
          normalizedProjectId,
          userId,
          scopedPermissions,
        );
        visibleProjectIds.push(normalizedProjectId);
      } catch (error) {
        continue;
      }
    }
    return visibleProjectIds;
  }

  async assertReadableProject(
    projectId: string,
    userId: string,
    permissions: string[] = [],
    manageAllPermissionKey?: string,
  ) {
    const scopedPermissions = getProjectScopedPermissions(
      permissions,
      manageAllPermissionKey,
    );
    return this.projectsService.assertExecutionObjectPermission(
      projectId,
      userId,
      scopedPermissions,
    );
  }

  async assertWritableProject(
    projectId: string,
    userId: string,
    permissions: string[] = [],
    manageAllPermissionKey?: string,
  ) {
    const scopedPermissions = getProjectScopedPermissions(
      permissions,
      manageAllPermissionKey,
    );
    await this.projectsService.assertProjectNotArchived(projectId);
    return this.projectsService.assertExecutionObjectPermission(
      projectId,
      userId,
      scopedPermissions,
    );
  }
}
