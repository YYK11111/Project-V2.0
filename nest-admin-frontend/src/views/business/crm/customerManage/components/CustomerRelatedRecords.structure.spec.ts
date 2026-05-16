import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'CustomerRelatedRecords.vue'), 'utf-8')
}

describe('customer related records structure', () => {
  it('应按客户展示销售机会、合同和互动记录', () => {
    const source = readSource()

    expect(source).toContain("import { getList as getOpportunityList, getStages } from '../../opportunityManage/api'")
    expect(source).toContain("import { getList as getContractList, getContractStatuses } from '../../contractManage/api'")
    expect(source).toContain("import { getList as getInteractionList, getInteractionTypes } from '../../interactionManage/api'")
    expect(source).toContain("checkPermi(['business/crm/opportunities/list'])")
    expect(source).toContain("checkPermi(['business/crm/contracts/list'])")
    expect(source).toContain("checkPermi(['business/crm/interactions/list'])")
    expect(source).toContain('customerId: props.customerId')
    expect(source).toContain('getOpportunityList')
    expect(source).toContain('getContractList')
    expect(source).toContain('getInteractionList')
    expect(source).toContain('/crm/opportunityManage/form')
    expect(source).toContain('/crm/contractManage/form')
    expect(source).toContain('/crm/interactionManage/form')
    expect(source).toContain('销售机会')
    expect(source).toContain('合同管理')
    expect(source).toContain('互动记录')
  })
})
