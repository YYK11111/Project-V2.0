import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readWorkflowView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('workflow 列表治理守卫', () => {
  it('流程定义列表使用 4 列 query-grid 并保留选中列与序号列', () => {
    const source = readWorkflowView()

    expect(source).toContain(':is-selection="true"')
    expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
    expect(source).toMatch(/class="query-grid"/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
    expect(source).toContain('class="query-sections"')
    expect(source).toContain('class="query-section query-section--primary"')
  })

  it('列表页修改流程定义时使用按 ID 的直接更新接口', () => {
    const source = readWorkflowView()

    expect(source).toContain("import { getWorkflowDefinitionList, createWorkflowDefinition, updateWorkflowDefinitionById")
    expect(source).toContain('const action = form.value.id ? updateWorkflowDefinitionById(form.value.id, form.value) : createWorkflowDefinition(form.value)')
  })

  it('列表页使用已发布最新版本列表接口', () => {
    const source = readWorkflowView()

    expect(source).toContain(':request="getWorkflowDefinitionList"')
    expect(source).not.toContain(':request="getWorkflowDefinitions"')
  })

  it('流程分类在列表页按中文名称展示并兼容旧值', () => {
    const source = readWorkflowView()

    expect(source).toContain("const workflowCategoryOptions = [")
    expect(source).toContain("Project: '项目管理'")
    expect(source).toContain("project: '项目管理'")
    expect(source).toContain("getWorkflowCategoryName(row.category)")
    expect(source).toMatch(/<el-option v-for="item in workflowCategoryOptions"[\s\S]*:label="item\.label"[\s\S]*:value="item\.value"/)
  })

  it('流程管理列表保留版本列', () => {
    const source = readWorkflowView()

    expect(source).toContain('<el-table-column prop="version" label="版本" width="80" />')
  })
})
