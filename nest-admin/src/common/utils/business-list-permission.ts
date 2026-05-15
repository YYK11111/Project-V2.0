import {
  normalizePermissionKey,
  normalizePermissionKeys,
} from "./permission-key";

export const projectManageAllPermission = "business/projects/manageAll";
export const projectListAllPermission = projectManageAllPermission;

export function getManageAllPermissionKey(listPermissionKey: string) {
  const normalizedKey = normalizePermissionKey(listPermissionKey);
  if (!normalizedKey.endsWith("/list")) return "";
  return normalizedKey.replace(/\/list$/, "/manageAll");
}

export function getPermissionModuleKey(permissionKey: string) {
  const normalizedKey = normalizePermissionKey(permissionKey);
  const segments = normalizedKey.split("/").filter(Boolean);
  if (segments.length < 2) return "";
  return segments.slice(0, -1).join("/");
}

const businessReadActions = new Set([
  "list",
  "getOne",
  "statistics",
  "dashboard",
  "kanban",
  "backlog",
  "children",
  "history",
  "tasks",
  "home",
  "hot-keywords",
  "retrieveForAi",
]);

const businessAccessModuleAliases: Record<string, string[]> = {
  "business/tasks/dependency": ["business/tasks"],
};

const businessAccessActionAliases: Record<string, Record<string, string[]>> = {
  "business/projects": {
    getOne: ["business/workflow/tasks"],
    fieldPermissions: ["business/workflow/tasks"],
    viewContext: ["business/workflow/tasks"],
  },
};

const businessAccessActionMap: Record<string, Set<string>> = {
  "business/projects": new Set([
    "getOne",
    "fieldPermissions",
    "viewContext",
    "update",
    "submitApproval",
    "submitClose",
  ]),
  "business/workflow/definitions": new Set(["list", "getOne"]),
  "business/workflow/instances": new Set([
    "list",
    "getOne",
    "history",
    "tasks",
  ]),
  "business/workflow/tasks": new Set([
    "list",
    "complete",
    "transfer",
    "addSign",
  ]),
};

export function isBusinessReadPermission(permissionKey: string) {
  const normalizedKey = normalizePermissionKey(permissionKey);
  if (!normalizedKey.startsWith("business/")) return false;
  const segments = normalizedKey.split("/").filter(Boolean);
  const action = segments.at(-1) || "";
  return businessReadActions.has(action);
}

function isBusinessModuleAccessPermission(permissionKey: string) {
  const normalizedKey = normalizePermissionKey(permissionKey);
  if (!normalizedKey.startsWith("business/")) return false;
  if (isBusinessReadPermission(normalizedKey)) return true;
  const moduleKey = getPermissionModuleKey(normalizedKey);
  const segments = normalizedKey.split("/").filter(Boolean);
  const action = segments.at(-1) || "";
  return businessAccessActionMap[moduleKey]?.has(action) || false;
}

export function hasModuleFullAccess(
  permissions: string[] = [],
  permissionKey: string,
) {
  const normalizedPermissions = normalizePermissionKeys(permissions);
  const normalizedKey = normalizePermissionKey(permissionKey);
  if (!normalizedKey) return false;
  if (normalizedPermissions.includes("*")) return true;
  const moduleKey = getPermissionModuleKey(normalizedKey);
  if (!moduleKey) return false;
  return normalizedPermissions.includes(`${moduleKey}/manageAll`);
}

export function hasModuleAccess(
  permissions: string[] = [],
  permissionKey: string,
) {
  const normalizedPermissions = normalizePermissionKeys(permissions);
  const normalizedKey = normalizePermissionKey(permissionKey);
  if (!isBusinessModuleAccessPermission(normalizedKey)) return false;
  if (normalizedPermissions.includes("*")) return true;
  const moduleKey = getPermissionModuleKey(normalizedKey);
  if (!moduleKey) return false;
  const segments = normalizedKey.split("/").filter(Boolean);
  const action = segments.at(-1) || "";
  const moduleKeys = [
    moduleKey,
    ...(businessAccessModuleAliases[moduleKey] || []),
    ...(businessAccessActionAliases[moduleKey]?.[action] || []),
  ];
  return moduleKeys.some((key) =>
    normalizedPermissions.includes(`${key}/access`),
  );
}

export function hasPermissionOrManageAll(
  permissions: string[] = [],
  permissionKey: string,
) {
  const normalizedPermissions = normalizePermissionKeys(permissions);
  const normalizedKey = normalizePermissionKey(permissionKey);
  return (
    normalizedPermissions.includes("*") ||
    normalizedPermissions.includes(normalizedKey) ||
    hasModuleFullAccess(normalizedPermissions, normalizedKey)
  );
}

export function hasPermissionOrAccess(
  permissions: string[] = [],
  permissionKey: string,
) {
  return (
    hasPermissionOrManageAll(permissions, permissionKey) ||
    hasModuleAccess(permissions, permissionKey)
  );
}

export function getProjectScopedPermissions(
  permissions: string[] = [],
  manageAllPermissionKey?: string,
) {
  const normalizedPermissions = normalizePermissionKeys(permissions);
  const normalizedManageAllPermissionKey = normalizePermissionKey(
    manageAllPermissionKey,
  );
  if (
    normalizedPermissions.includes("*") ||
    normalizedPermissions.includes(projectManageAllPermission) ||
    !normalizedManageAllPermissionKey ||
    !normalizedPermissions.includes(normalizedManageAllPermissionKey)
  ) {
    return normalizedPermissions;
  }
  return normalizePermissionKeys([
    ...normalizedPermissions,
    projectManageAllPermission,
  ]);
}

export const getListAllPermissionKey = getManageAllPermissionKey;
export const hasPermissionOrListAll = hasPermissionOrManageAll;
