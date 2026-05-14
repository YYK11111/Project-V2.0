import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readViewSource(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

function readApiSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('project cockpit data boundary', () => {
  it('api 拆分系统总览和单项目驾驶舱入口', () => {
    const source = readApiSource()

    expect(source).toContain('export function getCockpitOverview')
    expect(source).toContain("`${baseUrl}/cockpit/overview`")
    expect(source).toContain('export function getProjectCockpit')
    expect(source).toContain("`${baseUrl}/cockpit/project/${id}`")
  })

  it('页面默认展示系统总览，项目详情必须通过视图和项目选择进入', () => {
    const source = readViewSource('cockpit')

    expect(source).toContain("const activeView = ref(projectId.value ? 'project' : 'overview')")
    expect(source).toContain('getCockpitOverview')
    expect(source).toContain('getProjectCockpit')
    expect(source).not.toContain('getCockpit({')
    expect(source).toContain('系统总览')
    expect(source).toContain('项目详情')
    expect(source).toContain('<el-tabs v-model="activeView"')
    expect(source).toContain('<el-tab-pane v-for="item in viewOptions"')
    expect(source).not.toContain('<el-radio-group v-model="activeView"')
    expect(source).toContain('v-if="activeView === \'project\' && projectId"')
    expect(source).not.toContain("projects[0]?.id")
  })

  it('系统总览的汇报摘要和筛选区放在总览内容最下方', () => {
    const source = readViewSource('cockpit')
    const overviewStart = source.indexOf('class="cockpit-overview"')
    const projectTable = source.indexOf('<template #header>项目总览表</template>')
    const bottomReport = source.indexOf('class="report-card overview-bottom-card"')
    const bottomFilter = source.indexOf('class="filter-card overview-bottom-card"')
    const projectViewStart = source.indexOf('class="cockpit-main mt20"')

    expect(overviewStart).toBeGreaterThan(-1)
    expect(projectTable).toBeGreaterThan(overviewStart)
    expect(bottomReport).toBeGreaterThan(projectTable)
    expect(bottomFilter).toBeGreaterThan(bottomReport)
    expect(bottomFilter).toBeLessThan(projectViewStart)
  })

  it('系统总览页头不展示项目选择和项目操作按钮', () => {
    const source = readViewSource('cockpit')

    expect(source).toContain('class="cockpit-project-actions"')
    expect(source).toContain('v-if="activeView === \'project\'"')
    expect(source).toContain('placeholder="选择项目"')
    expect(source).toContain('复制汇报摘要')
    expect(source).toContain('导出筛选结果')
    expect(source).toContain('项目详情')
  })
})
