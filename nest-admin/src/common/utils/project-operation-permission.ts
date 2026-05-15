type ProjectExecutionPermissionLike = {
  assertWritableProject: (
    projectId: string,
    userId: string,
    permissions?: string[],
    manageAllPermissionKey?: string,
  ) => Promise<unknown>;
};

export function getListRows(result: any) {
  if (Array.isArray(result?.list)) return result.list;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export async function getProjectOperationPermissions(
  projectExecutionPermissionService: ProjectExecutionPermissionLike,
  projectId: string,
  operatorId: string,
  permissions: string[] = [],
  manageAllPermissionKey: string,
) {
  if (!projectId || !operatorId) {
    return { canEdit: false, canDelete: false };
  }
  try {
    await projectExecutionPermissionService.assertWritableProject(
      projectId,
      operatorId,
      permissions,
      manageAllPermissionKey,
    );
    return { canEdit: true, canDelete: true };
  } catch {
    return { canEdit: false, canDelete: false };
  }
}

export async function appendProjectOperationPermissions(
  result: any,
  projectExecutionPermissionService: ProjectExecutionPermissionLike,
  operatorId: string,
  permissions: string[] = [],
  manageAllPermissionKey: string,
) {
  const rows = getListRows(result);
  for (const row of rows) {
    Object.assign(
      row,
      await getProjectOperationPermissions(
        projectExecutionPermissionService,
        String(row?.projectId || ""),
        operatorId,
        permissions,
        manageAllPermissionKey,
      ),
    );
  }
  return result;
}
