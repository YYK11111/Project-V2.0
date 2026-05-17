import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('项目相关列表按钮权限守卫', () => {
  it('项目上下文操作统一通过项目内能力控制', () => {
    const helperPath = resolve(__dirname, 'projectManage/useProjectScopedActions.ts')
    expect(existsSync(helperPath)).toBe(true)
    const helperSource = readFileSync(helperPath, 'utf-8')
    expect(helperSource).toContain('function canCreateProjectScopedRecord')
    expect(helperSource).toContain('function canBatchDeleteProjectScopedRecord')
    expect(helperSource).toContain('function canWriteProjectScopedRecord')
    expect(helperSource).toContain('function getProjectScopedCreateQuery')

    const expectations = [
      ['taskManage/index.vue', 'canTaskCreate', 'canTaskBatchDelete', 'canManageTasks'],
      ['ticketManage/index.vue', 'canTicketCreate', 'canTicketBatchDelete', 'canManageTasks'],
      ['riskManage/index.vue', 'canRiskCreate', 'canRiskBatchDelete', 'canManageRisks'],
      ['changeManage/index.vue', 'canChangeCreate', 'canChangeBatchDelete', 'canManageChanges'],
      ['milestoneManage/index.vue', 'canMilestoneCreate', 'canMilestoneBatchDelete', 'canManagePlan'],
      ['sprintManage/index.vue', 'canSprintCreate', 'canSprintBatchDelete', 'canManageExecution'],
      ['goLiveManage/index.vue', 'canGoLiveCreate', 'canGoLiveBatchDelete', 'canManageDelivery'],
      ['acceptanceManage/index.vue', 'canAcceptanceCreate', 'canAcceptanceBatchDelete', 'canManageDelivery'],
      ['handoverManage/index.vue', 'canHandoverCreate', 'canHandoverBatchDelete', 'canManageDelivery'],
    ]

    expectations.forEach(([file, createName, batchDeleteName, capability]) => {
      const source = readBusinessView(file)
      expect(source).toContain('useProjectScopedActions(route)')
      expect(source).toContain(`const ${createName} = computed(() => canCreateProjectScopedRecord(`)
      expect(source).toContain(`'${capability}'`)
      expect(source).toContain(`const ${batchDeleteName} = computed(() => canBatchDeleteProjectScopedRecord(`)
      expect(source).toContain(`v-if="${createName}"`)
      expect(source).toContain(`v-if="${batchDeleteName}"`)
      expect(source).toContain('getProjectScopedCreateQuery()')
    })
  })

  it('交付单据表单保存按钮叠加项目交付能力', () => {
    const expectations = [
      ['goLiveManage/form.vue', 'canSaveGoLive'],
      ['acceptanceManage/form.vue', 'canSaveAcceptance'],
      ['handoverManage/form.vue', 'canSaveHandover'],
    ]

    expectations.forEach(([file, saveName]) => {
      const source = readBusinessView(file)
      expect(source).toContain('useProjectScopedActions(route, formProjectId)')
      expect(source).toContain(`const ${saveName} = computed(() => !isReadonly.value && (isEdit.value`)
      expect(source).toContain("canWriteProjectScopedRecord")
      expect(source).toContain("'canManageDelivery'")
      expect(source).toContain(`if (!${saveName}.value) return $sdk.msgWarning('当前操作没有权限')`)
      expect(source).toContain(`v-if="${saveName}"`)
    })
  })

  it('项目执行对象表单保存按钮叠加项目内能力', () => {
    const expectations = [
      ['taskManage/form.vue', 'canSaveTask', 'canManageTasks'],
      ['ticketManage/form.vue', 'canSaveTicket', 'canManageTasks'],
      ['riskManage/form.vue', 'canSaveRisk', 'canManageRisks'],
      ['changeManage/form.vue', 'canSaveChange', 'canManageChanges'],
      ['milestoneManage/form.vue', 'canSaveMilestone', 'canManagePlan'],
      ['sprintManage/form.vue', 'canSaveSprint', 'canManageExecution'],
    ]

    expectations.forEach(([file, saveName, capability]) => {
      const source = readBusinessView(file)
      expect(source).toContain('useProjectScopedActions(route, formProjectId)')
      expect(source).toContain(`const ${saveName} = computed(() =>`)
      expect(source).toContain(`'${capability}'`)
      expect(source).toContain(`if (!${saveName}.value) return $sdk.msgWarning('当前操作没有权限')`)
      expect(source).toContain(`v-if="${saveName}"`)
    })
  })

  it('风险和工单衍生动作叠加源对象与目标能力', () => {
    const riskSource = readBusinessView('riskManage/form.vue')
    const ticketSource = readBusinessView('ticketManage/form.vue')

    expect(riskSource).toContain("const canManageRiskRecord = computed(() => hasRiskId.value && canWriteProjectScopedRecord(canRiskUpdate.value, 'canManageRisks') && canEditCurrentRisk.value)")
    expect(riskSource).toContain("const canPublishRiskKnowledge = computed(() => canArticleAdd.value && canManageRiskRecord.value)")
    expect(riskSource).toContain("const canConvertRiskToTask = computed(() => canManageRiskRecord.value && canWriteProjectScopedRecord(canTaskAdd.value, 'canManageTasks'))")
    expect(riskSource).toContain("if (!canPublishRiskKnowledge.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(riskSource).toContain("if (!canConvertRiskToTask.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(riskSource).toContain('v-if="canPublishRiskKnowledge"')
    expect(riskSource).toContain('v-if="canConvertRiskToTask"')

    expect(ticketSource).toContain("const canManageTicketRecord = computed(() => hasTicketId.value && canWriteProjectScopedRecord(canTicketUpdate.value, 'canManageTasks') && canEditCurrentTicket.value)")
    expect(ticketSource).toContain("const canPublishTicketKnowledge = computed(() => canArticleAdd.value && canManageTicketRecord.value)")
    expect(ticketSource).toContain("const canConvertTicketToTask = computed(() => canManageTicketRecord.value && canWriteProjectScopedRecord(canTaskAdd.value, 'canManageTasks'))")
    expect(ticketSource).toContain("if (!canPublishTicketKnowledge.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(ticketSource).toContain("if (!canConvertTicketToTask.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(ticketSource).toContain("if (!canPublishTicketKnowledge.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(ticketSource).toContain('v-if="canPublishTicketKnowledge"')
    expect(ticketSource).toContain('v-if="canConvertTicketToTask"')
  })

  it('任务和工单列表行操作使用后端行级权限', () => {
    const taskSource = readBusinessView('taskManage/index.vue')
    const ticketSource = readBusinessView('ticketManage/index.vue')

    expect(taskSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(taskSource).toContain("canStartCurrentTask(row) ? { key: 'startTask'")
    expect(taskSource).toContain("canPauseCurrentTask(row) ? { key: 'pauseTask'")
    expect(taskSource).toContain("canResumeCurrentTask(row) ? { key: 'resumeTask'")
    expect(taskSource).toContain("canSubmitCompletionCurrentTask(row) ? { key: 'submitCompletionApproval'")
    expect(taskSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(taskSource).not.toContain('canTaskUpdate.value && row.canEdit')
    expect(ticketSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(ticketSource).toContain("row.canEdit === true && row.status === '1' ? { key: 'dispatch'")
    expect(ticketSource).toContain("row.canEdit === true && row.status === '2' ? { key: 'transfer'")
    expect(ticketSource).toContain("row.canEdit === true && canSubmitTicketApproval(row)")
    expect(ticketSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(ticketSource).not.toContain('canTicketUpdate.value && row.canEdit')
  })

  it('风险、变更、里程碑列表行操作使用后端行级权限', () => {
    const riskSource = readBusinessView('riskManage/index.vue')
    const changeSource = readBusinessView('changeManage/index.vue')
    const milestoneSource = readBusinessView('milestoneManage/index.vue')

    expect(riskSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(riskSource).toContain("row.canEdit === true && row.status !== '4' && row.status !== '5'")
    expect(riskSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(changeSource).toContain("row.canEdit === true && canSubmitChangeApproval(row)")
    expect(changeSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(changeSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(milestoneSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(milestoneSource).toContain("row.canDelete === true ? { key: 'delete'")
  })

  it('Sprint 列表行操作使用后端行级权限', () => {
    const sprintSource = readBusinessView('sprintManage/index.vue')

    expect(sprintSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(sprintSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(sprintSource).not.toContain('canSprintUpdate.value ? { key: \'edit\'')
    expect(sprintSource).not.toContain('canSprintDelete.value ? { key: \'delete\'')
  })

  it('交付单据列表行操作使用后端行级权限', () => {
    const files = [
      'goLiveManage/index.vue',
      'acceptanceManage/index.vue',
      'handoverManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toContain("row.canEdit === true ? { key: 'edit'")
      expect(source).toContain("row.canDelete === true ? { key: 'delete'")
    })
  })
})
