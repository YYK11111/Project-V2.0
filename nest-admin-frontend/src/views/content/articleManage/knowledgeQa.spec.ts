import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readApiSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/api.ts'), 'utf-8')
}

function readRouteSource() {
  return readFileSync(resolve(process.cwd(), 'src/router/routes.js'), 'utf-8')
}

function readManageSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/index.vue'), 'utf-8')
}

function readPageSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/knowledgeQa.vue'), 'utf-8')
}

describe('knowledge qa 前端闭环', () => {
  it('需要提供知识问答页面文件', () => {
    const pagePath = resolve(process.cwd(), 'src/views/content/articleManage/knowledgeQa.vue')

    expect(existsSync(pagePath)).toBe(true)
  })

  it('需要暴露知识问答 API', () => {
    const source = readApiSource()

    expect(source).toContain("'/knowledge-qa/ask'")
    expect(source).toContain('export const askKnowledgeQa')
  })

  it('需要注册知识问答路由', () => {
    const source = readRouteSource()

    expect(source).toContain("/content/articleManage/knowledgeQa")
    expect(source).toContain("KnowledgeQaHidden")
  })

  it('需要在知识后台提供知识问答入口', () => {
    const source = readManageSource()

    expect(source).toContain('知识问答')
    expect(source).toContain("/content/articleManage/knowledgeQa")
  })

  it('需要展示正式问答页结构', () => {
    const source = readPageSource()

    expect(source).toContain('question')
    expect(source).toContain('askKnowledgeQa')
    expect(source).toContain('references')
    expect(source).toContain('引用来源')
    expect(source).toContain('开始提问')
    expect(source).not.toContain('命中片段')
  })
})
