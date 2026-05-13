import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

function getSectionBlock(source: string, title: string) {
  const match = source.match(new RegExp(`<section class="section-card">[\\s\\S]*?<div class="section-title">${title}</div>[\\s\\S]*?<\\/section>`))
  return match?.[0] || ''
}

function getInitialFormBlock(source: string) {
  const match = source.match(/const form = ref\(\{[\s\S]*?\n\}\)/)
  return match?.[0] || ''
}

function getDefaultFormBlock(source: string) {
  const match = source.match(/const defaultForm = \(\) => \(\{[\s\S]*?\n\}\)/)
  return match?.[0] || ''
}

function getSalesIdWatchBlock(source: string) {
  const match = source.match(/watch\(\s*\(\)\s*=>\s*form\.value\.salesId[\s\S]*?\n\)/)
  return match?.[0] || ''
}

function getFooterActionsBlock(source: string) {
  const match = source.match(/<el-form-item class="footer-actions">[\s\S]*?<\/el-form-item>/)
  return match?.[0] || ''
}

function getUserListBlock(source: string) {
  const match = source.match(/if\s*\(!isReadonly\.value\)\s*\{[\s\S]*?getUserList\(\{ pageNum: 1, pageSize: 1000 \}\)[\s\S]*?\n\}/)
  return match?.[0] || ''
}

function getDeptTreeBlock(source: string) {
  const match = source.match(/if\s*\(!isReadonly\.value\)\s*\{[\s\S]*?getDeptTrees\(\)\.then\(\(res\) => \{[\s\S]*?\n\}/)
  return match?.[0] || ''
}

function getHandleSubmitApprovalBlock(source: string) {
  const match = source.match(/async function handleSubmitApproval\(\) \{[\s\S]*?\n\}/)
  return match?.[0] || ''
}

function getFormItemBlock(source: string, label: string) {
  const match = source.match(new RegExp(`<el-form-item label="${label}"[^>]*>[\\s\\S]*?<\\/el-form-item>`))
  return match?.[0] || ''
}

describe('customer form approval contract', () => {
  const source = readSource()
  const initialFormBlock = getInitialFormBlock(source)
  const defaultFormBlock = getDefaultFormBlock(source)
  const salesIdWatchBlock = getSalesIdWatchBlock(source)
  const customerAttributeSection = getSectionBlock(source, '客户属性与说明')
  const footerActionsBlock = getFooterActionsBlock(source)
  const userListBlock = getUserListBlock(source)
  const deptTreeBlock = getDeptTreeBlock(source)
  const handleSubmitApprovalBlock = getHandleSubmitApprovalBlock(source)
  const descriptionFormItemBlock = getFormItemBlock(customerAttributeSection, '客户描述')

  it('新增客户默认带出当前用户部门并联动销售负责人所属部门', () => {
    expect(initialFormBlock).toMatch(/deptId\s*:\s*currentUserDeptId\.value/)
    expect(defaultFormBlock).toMatch(/deptId\s*:\s*currentUserDeptId\.value/)
    expect(source).toContain("import { getList as getUserList, getOne as getUserOne } from '@/views/system/users/api'")
    expect(userListBlock).toContain("if (!isReadonly.value) {")
    expect(userListBlock).toContain("getUserList({ pageNum: 1, pageSize: 1000 })")
    expect(source).toMatch(/async function syncDeptIdBySalesId\(salesId\) \{[\s\S]*?const selectedUser = salesUserList\.value\.find/) 
    expect(source).toMatch(/const \{ data \} = await getUserOne\(salesId\)/)
    expect(salesIdWatchBlock).toMatch(/watch\(\s*\(\)\s*=>\s*form\.value\.salesId/s)
    expect(salesIdWatchBlock).toMatch(/if\s*\(!salesId\)\s*\{[\s\S]*?form\.value\.deptId\s*=\s*''\s*return\s*\}/)
    expect(salesIdWatchBlock).toMatch(/syncDeptIdBySalesId\(salesId\)\.catch\(\(\)\s*=>\s*\{[\s\S]*?form\.value\.deptId\s*=\s*''/)
  })

  it('审批只读场景不应请求系统用户列表', () => {
    expect(userListBlock).toContain('if (!isReadonly.value) {')
    expect(userListBlock).toContain('getUserList({ pageNum: 1, pageSize: 1000 }).then((res) => {')
  })

  it('审批只读场景不应请求部门树', () => {
    expect(deptTreeBlock).toContain('if (!isReadonly.value) {')
    expect(deptTreeBlock).toContain('getDeptTrees().then((res) => {')
  })

  it('所属部门值统一使用字符串，避免选择器回填失效', () => {
    expect(source).toMatch(/deptList\.value\s*=\s*res\.data\s*\?\s*flattenDepts\(res\.data\)\.map\(d\s*=>\s*\(\{\s*\.\.\.d,\s*id:\s*String\(d\.id\)\s*\}\)\)\s*:\s*\[\]/)
    expect(source).toMatch(/<el-option\s+v-for="dept in deptList"\s+:key="dept\.id"\s+:label="dept\.name"\s+:value="dept\.id"\s*\/>/)
    expect(source).toContain('<ViewField v-if="isReadonly" :value="deptMap[form.deptId]" />')
  })

  it('提交审批权限判断与按钮展示一致', () => {
    expect(handleSubmitApprovalBlock).toMatch(/if\s*\(\(isEdit\.value\s*&&\s*!canCustomerUpdate\.value\)\s*\|\|\s*\(!isEdit\.value\s*&&\s*!canCustomerAdd\.value\)\)\s*return\s*\$sdk\.msgWarning\('当前操作没有权限'\)/)
    expect(source).toContain("const canSubmitApprovalAction = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))")
    expect(footerActionsBlock).toMatch(/<el-button\s+v-if="!isReadonly && \(isEdit \? canCustomerUpdate : canCustomerAdd\) && canSubmitApprovalAction"\s+type="warning"\s+@click="handleSubmitApproval">提交<\/el-button>/)
    expect(handleSubmitApprovalBlock).toMatch(/if\s*\(!canCloseReturnedInstance\.value\s*&&\s*!canSubmitApprovalAction\.value\)\s*\{?[\s\S]*?\$sdk\.msgWarning\('当前状态不允许提交审批'\)/)
  })

  it('退回重提审批也必须先校验并保存后再重提流程实例', () => {
    expect(handleSubmitApprovalBlock).toMatch(/formRef\.value\.validate\(async \(valid\) => \{[\s\S]*?if\s*\(!valid\) return/)
    expect(handleSubmitApprovalBlock).toMatch(/const api = isEdit\.value \? update : save[\s\S]*?const customerId = await persistCustomer\(api\)/)
    expect(handleSubmitApprovalBlock).toMatch(/if\s*\(canCloseReturnedInstance\.value\)\s*\{[\s\S]*?await resubmitReturnedWorkflowInstance\(form\.value\.workflowInstanceId, \{ comment: '发起人重新提交审批' \}\)/)
    expect(handleSubmitApprovalBlock).not.toMatch(/if\s*\(canCloseReturnedInstance\.value\)\s*\{[\s\S]*?await resubmitReturnedWorkflowInstance[\s\S]*?return\s*\}/)
  })

  it('客户表单主按钮改为暂存和提交', () => {
    expect(footerActionsBlock).toMatch(/<el-button[^>]*@click="submit"[^>]*>\s*暂存\s*<\/el-button>/)
    expect(footerActionsBlock).toMatch(/<el-button[^>]*@click="handleSubmitApproval"[^>]*>\s*提交\s*<\/el-button>/)
    expect(footerActionsBlock).not.toMatch(/@click="handleSubmitApproval"[^>]*>\s*提交审批\s*<\/el-button>/)
  })

  it('客户描述改为项目同款富文本组件', () => {
    expect(descriptionFormItemBlock).toMatch(/<ViewRichText[^>]*:html="form\.description"[^>]*\/?>/)
    expect(descriptionFormItemBlock).toMatch(/<Editor[^>]*v-model="form\.description"[^>]*\/?>/)
    expect(descriptionFormItemBlock).not.toMatch(/<el-input[^>]*v-model="form\.description"[^>]*type="textarea"[^>]*\/?>/)
  })
})
