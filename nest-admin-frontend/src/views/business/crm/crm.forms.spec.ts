import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readCrmView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('CRM 表单治理守卫', () => {
  it('四个 CRM 表单页使用卡片分区结构', () => {
    const files = [
      'customerManage/form.vue',
      'opportunityManage/form.vue',
      'contractManage/form.vue',
      'interactionManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readCrmView(file)
      expect(source).toMatch(/section-card/)
      expect(source).toMatch(/footer-actions/)
    })
  })

  it('合同和互动记录表单接入附件组件', () => {
    const contractSource = readCrmView('contractManage/form.vue')
    const interactionSource = readCrmView('interactionManage/form.vue')

    expect(contractSource).toMatch(/Upload/)
    expect(contractSource).toMatch(/ViewFileList/)
    expect(contractSource).not.toMatch(/el-input v-else v-model="form\.contractFile"/)

    expect(interactionSource).toMatch(/Upload/)
    expect(interactionSource).toMatch(/ViewFileList/)
    expect(interactionSource).toMatch(/attachments/)
  })
})
