export const approvalViewStatuses = [
  'none',
  'pending',
  'approved',
  'rejected',
  'returned',
] as const

export type ApprovalViewStatus = (typeof approvalViewStatuses)[number]

export type ApprovalView = {
  status: ApprovalViewStatus
  label: string
  currentNodeName: string
  canSubmit: boolean
  canResubmit: boolean
}

export const projectActionKeys = [
  'canEdit',
  'canSubmitApproval',
  'canSubmitClose',
  'canArchive',
  'canDelete',
] as const

export type ProjectActionKey = (typeof projectActionKeys)[number]

export type ProjectActions = Record<ProjectActionKey, boolean> & {
  reasons?: Record<string, string>
}

export type ProjectLifecycleContext = {
  status: string
  isArchived: boolean
  isLifecycleLocked: boolean
}

export const executionPermissionKeys = [
  'canEdit',
  'canDelete',
  'canManage',
  'canExecute',
] as const

export type ExecutionPermissionKey = (typeof executionPermissionKeys)[number]

export type ExecutionPermissionContext = Partial<
  Record<ExecutionPermissionKey, boolean>
>

export type ProjectFieldPermissions = {
  groups?: Record<string, 'hidden' | 'readonly' | 'editable'>
  fields?: Record<string, 'hidden' | 'readonly' | 'editable'>
  contextRules?: Record<string, boolean>
}

export type ProjectPermissionContext = {
  role?: string
  isManager?: boolean
  isDeliveryManager?: boolean
  isFunctionalLead?: boolean
  isVisitor?: boolean
  canView?: boolean
  canEdit?: boolean
  canSubmitApproval?: boolean
  canSubmitClose?: boolean
  canArchive?: boolean
  canDelete?: boolean
  fieldPermissions?: ProjectFieldPermissions
}
