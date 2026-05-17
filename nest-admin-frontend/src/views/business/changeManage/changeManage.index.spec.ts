import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('变更列表页治理守卫', () => {
  it('项目筛选使用项目选择器，列表继续展示项目名称', () => {
    const source = readBusinessView('index.vue')

    expect(source).toContain("import ProjectSelect from '@/components/ProjectSelect.vue'")
    expect(source).toContain('<ProjectSelect v-model="query.projectId" placeholder="请选择所属项目" />')
    expect(source).toContain("{{ projectMap[row.projectId] || '-' }}")
    expect(source).not.toContain('<el-option v-for="(v, k) in projectMap"')
  })
})
