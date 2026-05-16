import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'business-form.scss'), 'utf-8')
}

describe('business form styles', () => {
  it('统一样式按表单容器宽度收敛成单列并将标签切到顶部', () => {
    const source = readSource()

    expect(source).toContain('container-type: inline-size;')
    expect(source).toContain('container-name: business-form-shell;')
    expect(source).toContain('@container business-form-shell (max-width: 1024px)')
    expect(source).toContain('@media (max-width: 1024px)')
    expect(source).toContain('.business-form .el-form-item {')
    expect(source).toContain('flex-direction: column;')
    expect(source).toContain('.business-form .el-col {')
    expect(source).toContain('flex: 0 0 100% !important;')
    expect(source).toContain('max-width: 100% !important;')
    expect(source).toContain('.business-form .el-col.is-guttered {')
    expect(source).toContain('padding-left: 0 !important;')
    expect(source).toContain('padding-right: 0 !important;')
    expect(source).toContain('.business-form .el-form-item__label {')
    expect(source).toContain('width: auto !important;')
    expect(source).toContain('max-width: 100%;')
    expect(source).toContain('white-space: normal;')
    expect(source).toContain('padding: 0 0 6px;')
  })

  it('统一样式要压住表单列和表单项的最小宽度，避免内容把页面撑宽', () => {
    const source = readSource()

    const shellBlock = source.match(/\.business-form-page \.business-form-shell \{[\s\S]*?\}/)?.[0] || ''
    const formBlock = source.match(/\.business-form \{[\s\S]*?\}/)?.[0] || ''
    const sectionsBlock = source.match(/\.business-form-sections \{[\s\S]*?\}/)?.[0] || ''
    const sectionBlock = source.match(/\.business-form-section \{[\s\S]*?\}/)?.[0] || ''
    const fieldsBlock = source.match(/\.business-form-fields \{[\s\S]*?\}/)?.[0] || ''
    const colBlock = source.match(/\.business-form \.el-col \{[\s\S]*?\}/)?.[0] || ''
    const formItemBlock = source.match(/\.business-form \.el-form-item \{[\s\S]*?\}/)?.[0] || ''
    const contentBlock = source.match(/\.business-form \.el-form-item__content \{[\s\S]*?\}/)?.[0] || ''

    expect(shellBlock).toContain('overflow-x: hidden;')
    expect(shellBlock).toContain('box-sizing: border-box;')
    expect(formBlock).toContain('overflow-x: hidden;')
    expect(formBlock).toContain('box-sizing: border-box;')
    expect(sectionsBlock).toContain('width: 100%;')
    expect(sectionsBlock).toContain('max-width: 100%;')
    expect(sectionsBlock).toContain('overflow-x: hidden;')
    expect(sectionBlock).toContain('width: 100%;')
    expect(sectionBlock).toContain('overflow-x: hidden;')
    expect(fieldsBlock).toContain('width: 100%;')
    expect(fieldsBlock).toContain('max-width: 100%;')
    expect(fieldsBlock).toContain('overflow-x: hidden;')
    expect(colBlock).toContain('min-width: 0;')
    expect(formItemBlock).toContain('min-width: 0;')
    expect(contentBlock).toContain('min-width: 0;')
  })

  it('统一样式要限制表单控件和富文本编辑器宽度，避免内部组件撑开页面', () => {
    const source = readSource()

    expect(source).toContain('.business-form .el-input,')
    expect(source).toContain('.business-form .el-select,')
    expect(source).toContain('.business-form .el-input-number,')
    expect(source).toContain('.business-form .user-select,')
    expect(source).toContain('.business-form .Editor')
    expect(source).toContain('.business-form .ql-toolbar')
    expect(source).toContain('overflow-x: auto;')
  })

  it('统一样式要保护接入 business-form 的自定义分区卡片', () => {
    const source = readSource()
    const customSectionBlock = source.match(/\.business-form \.section-card \{[\s\S]*?\}/)?.[0] || ''

    expect(customSectionBlock).toContain('min-width: 0;')
    expect(customSectionBlock).toContain('max-width: 100%;')
    expect(customSectionBlock).toContain('overflow-x: hidden;')
    expect(customSectionBlock).toContain('box-sizing: border-box;')
  })
})
