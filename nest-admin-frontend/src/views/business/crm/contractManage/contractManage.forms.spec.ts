import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readContractForm() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('CRM 合同表单组件一致性', () => {
  it('合同文件字段应使用上传组件而不是普通输入框', () => {
    const source = readContractForm()

    expect(source).toContain('合同文件')
    expect(source).toMatch(/Upload/)
    expect(source).toMatch(/ViewFileList/)
    expect(source).not.toMatch(/el-input v-else v-model="form\.contractFile"/)
  })
})
