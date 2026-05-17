import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('业务表单必填与对象展示守卫', () => {
  it('任务表单的来源对象应自动识别，不再暴露来源对象ID输入', () => {
    const source = readBusinessView('taskManage/form.vue')

    expect(source).toContain('async function loadSourceEntity()')
    expect(source).toContain("sourceEntity.value = route.query.sourceType === 'story' && route.query.sourceId")
    expect(source).toContain("import { sourceTypeMap } from '../projectManage/fieldMaps'")
    expect(source).not.toContain('label="来源对象ID"')
    expect(source).not.toContain('v-model="form.sourceId"')
    expect(source).toContain('<el-form-item v-if="sourceEntity" label="来源对象">')
  })

  it('变更表单查看态不再直接显示影响对象ID', () => {
    const source = readBusinessView('changeManage/form.vue')

    expect(source).not.toContain('<ViewField v-if="isReadonly" :value="form.impactedTaskId" />')
    expect(source).not.toContain('<ViewField v-if="isReadonly" :value="form.impactedMilestoneId" />')
    expect(source).not.toContain('<ViewField v-if="isReadonly" :value="form.impactedSprintId" />')
    expect(source).toContain('impactedTaskName')
    expect(source).toContain('impactedMilestoneName')
    expect(source).toContain('impactedSprintName')
  })

  it('变更、上线、交接、验收表单应在提审时使用统一消息提醒并继续做前置校验', () => {
    const changeSource = readBusinessView('changeManage/form.vue')
    const goLiveSource = readBusinessView('goLiveManage/form.vue')
    const handoverSource = readBusinessView('handoverManage/form.vue')
    const acceptanceSource = readBusinessView('acceptanceManage/form.vue')

    expect(changeSource).not.toContain('提交审批前必填')
    expect(changeSource).toContain("$sdk.msgWarning(`提交审批前，请先确认已补齐：${changeApprovalRequirements.join('、')}`)")
    expect(changeSource).toContain('请补齐变更原因')
    expect(changeSource).toContain('请补齐变更描述')
    expect(changeSource).toContain('请补齐影响分析')

    expect(goLiveSource).not.toContain('提交审批前必填')
    expect(goLiveSource).toContain("$sdk.msgWarning(`提交审批前，请先确认已补齐：${goLiveApprovalRequirements.join('、')}`)")
    expect(goLiveSource).toContain('请补齐计划上线日期')
    expect(goLiveSource).toContain('请补齐负责人')
    expect(goLiveSource).toContain('请补齐检查项摘要')
    expect(goLiveSource).toContain('请补齐回退预案')

    expect(handoverSource).not.toContain('提交审批前必填')
    expect(handoverSource).toContain("$sdk.msgWarning(`提交审批前，请先确认已补齐：${handoverApprovalRequirements.join('、')}`)")
    expect(handoverSource).toContain('请补齐接维对象')
    expect(handoverSource).toContain('请补齐交接日期')

    expect(acceptanceSource).not.toContain('提交审批前必填')
    expect(acceptanceSource).toContain("$sdk.msgWarning(`提交审批前，请先确认已补齐：${acceptanceApprovalRequirements.join('、')}`)")
    expect(acceptanceSource).toContain('请补齐验收日期')
    expect(acceptanceSource).toContain('请补齐验收范围')
    expect(acceptanceSource).toContain('请先明确验收结果')
  })

  it('交付列表和项目查看页不再回退显示裸ID', () => {
    const goLiveIndexSource = readBusinessView('goLiveManage/index.vue')
    const handoverIndexSource = readBusinessView('handoverManage/index.vue')
    const acceptanceIndexSource = readBusinessView('acceptanceManage/index.vue')
    const projectApprovalSource = readBusinessView('projectManage/approval.vue')
    const changeSource = readBusinessView('changeManage/form.vue')

    expect(goLiveIndexSource).not.toContain('label="项目ID"')
    expect(handoverIndexSource).not.toContain('label="项目ID"')
    expect(acceptanceIndexSource).not.toContain('label="项目ID"')
    expect(goLiveIndexSource).toContain("row.project?.name || row.projectName || '-'")
    expect(handoverIndexSource).toContain("row.project?.name || row.projectName || '-'")
    expect(acceptanceIndexSource).toContain("row.project?.name || row.projectName || '-'")
    expect(projectApprovalSource).not.toContain('workflowInstance?.starterId')
    expect(changeSource).not.toContain('item.operatorId ||')
  })
})
