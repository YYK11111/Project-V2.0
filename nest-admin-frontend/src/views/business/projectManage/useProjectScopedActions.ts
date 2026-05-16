import { computed, ref, unref, watch } from 'vue'
import { getViewContext } from './api'

export function useProjectScopedActions(route: any, projectIdSource?: any) {
  const projectPermissionContext = ref<Record<string, any> | null>(null)
  const projectId = computed(() => String(unref(projectIdSource) || route?.query?.projectId || ''))
  let loadVersion = 0

  async function loadProjectPermissionContext() {
    const currentVersion = ++loadVersion
    projectPermissionContext.value = null
    if (!projectId.value) return

    try {
      const res: any = await getViewContext(projectId.value, {})
      if (currentVersion !== loadVersion) return
      projectPermissionContext.value = res?.data?.permissionContext || res?.permissionContext || {}
    } catch {
      if (currentVersion !== loadVersion) return
      projectPermissionContext.value = {}
    }
  }

  function canUseProjectCapability(capability: string) {
    if (!projectId.value) return true
    const context = projectPermissionContext.value || {}
    if (context.isVisitor === true) return false
    return context[capability] === true
  }

  function canCreateProjectScopedRecord(globalAllowed: boolean, capability: string) {
    return globalAllowed === true && canUseProjectCapability(capability)
  }

  function canBatchDeleteProjectScopedRecord(globalAllowed: boolean, capability: string) {
    return globalAllowed === true && canUseProjectCapability(capability)
  }

  function canWriteProjectScopedRecord(globalAllowed: boolean, capability: string) {
    return globalAllowed === true && canUseProjectCapability(capability)
  }

  function getProjectScopedCreateQuery(extraQuery: Record<string, any> = {}) {
    const query = {
      ...extraQuery,
      ...(projectId.value ? { projectId: projectId.value } : {}),
    }
    return Object.keys(query).length ? query : null
  }

  watch(projectId, loadProjectPermissionContext, { immediate: true })

  return {
    projectId,
    projectPermissionContext,
    canUseProjectCapability,
    canCreateProjectScopedRecord,
    canBatchDeleteProjectScopedRecord,
    canWriteProjectScopedRecord,
    getProjectScopedCreateQuery,
  }
}
