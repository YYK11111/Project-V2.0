const permissionKeyAliasMap = new Map<string, string>([
  ["business/projectManage/cockpit", "business/projects/dashboard"],
  ["business/projects/cockpit", "business/projects/dashboard"],
]);

export function normalizePermissionKey(permissionKey?: string) {
  if (!permissionKey || permissionKey === "*") {
    return permissionKey || "";
  }

  return permissionKeyAliasMap.get(permissionKey) || permissionKey;
}

export function normalizePermissionKeys(permissionKeys: string[] = []) {
  return [
    ...new Set(
      permissionKeys
        .map((permissionKey) => normalizePermissionKey(permissionKey))
        .filter(Boolean),
    ),
  ];
}
