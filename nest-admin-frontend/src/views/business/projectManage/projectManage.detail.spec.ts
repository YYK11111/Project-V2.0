import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readDetailSource() {
  return readFileSync(resolve(__dirname, 'detail.vue'), 'utf-8')
}

describe('projectManage 详情页治理守卫', () => {
  it('项目详情页仅草稿项目显示编辑项目入口', () => {
    const source = readDetailSource()

    expect(source).toContain("String(project.value?.status || '') === '1'")
    expect(source).toContain('v-if="canEditCurrentProject"')
    expect(source).not.toContain(':disabled="!canEditCurrentProject"')
    expect(source).not.toContain("canEditCurrentProject ? goToEdit() : $sdk.msgWarning('当前无编辑该项目的权限')")
  })

  it('立项后基线计划和结项资料调整应进入项目变更而不是项目编辑', () => {
    const source = readDetailSource()

    expect(source).toContain("router.push({ path: '/changeManage/form', query: { projectId: projectId.value, type } })")
    expect(source).toContain("@click=\"goToProjectChange('2')\"")
    expect(source).toContain("@click=\"goToProjectChange('6')\"")
    expect(source).not.toContain('<el-button type="primary" @click="goToEdit">调整基线计划</el-button>')
    expect(source).not.toContain('<el-button link type="primary" @click="goToEdit">调整基线计划</el-button>')
    expect(source).not.toContain('<el-button @click="goToEdit">去完善结项资料</el-button>')
  })
})
