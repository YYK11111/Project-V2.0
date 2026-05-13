import { Injectable } from "@nestjs/common";
import { ProjectsService } from "./service";

@Injectable()
export class ProjectExecutionPermissionService {
  constructor(private readonly projectsService: ProjectsService) {}

  async getVisibleProjectIds(userId: string, permissions: string[] = []) {
    if (!userId) return [];
    const projectIds = await this.projectsService.getVisibleProjectIdsForUser(
      userId,
      permissions,
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
          permissions,
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
  ) {
    return this.projectsService.assertExecutionObjectPermission(
      projectId,
      userId,
      permissions,
    );
  }

  async assertWritableProject(
    projectId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    await this.projectsService.assertProjectNotArchived(projectId);
    return this.projectsService.assertExecutionObjectPermission(
      projectId,
      userId,
      permissions,
    );
  }
}
