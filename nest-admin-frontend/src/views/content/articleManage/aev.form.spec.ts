import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('知识编辑页结构治理守卫', () => {
  it('aev 页面删除 Hero 并保留主工作区', () => {
    const source = readAev()

    expect(source).not.toMatch(/knowledge-editor-hero/)
    expect(source).toMatch(/knowledge-form-section/)
    expect(source).toMatch(/OperateBar/)
    expect(source).toMatch(/Upload/)
  })

  it('基础信息和治理信息在同一行，知识内容独占下一行', () => {
    const source = readAev()

    const gridStart = source.indexOf('<div class="knowledge-form-grid">')
    const contentSection = source.indexOf('knowledge-form-section knowledge-form-section--full knowledge-form-section--content-main')
    const governanceSection = source.indexOf('<div class="section-title">治理信息</div>')

    expect(gridStart).toBeGreaterThan(-1)
    expect(governanceSection).toBeGreaterThan(gridStart)
    expect(contentSection).toBeGreaterThan(governanceSection)
  })

  it('操作栏不再提供复制 Markdown 入口', () => {
    const source = readAev()
    const operateBarStart = source.indexOf('<OperateBar v-if="!accessDeniedInfo && canEditCurrentArticle" class="knowledge-editor-operate-bar">')
    const cancelButton = source.indexOf('<ElButton type="primary" @click="cancel">取消</ElButton>')
    const draftButton = source.indexOf('<ElButton type="primary" @click="submit(\'draft\')">保存草稿</ElButton>')
    const publishButton = source.indexOf('<ElButton type="primary" @click="submit()">发布</ElButton>')

    expect(source).not.toMatch(/function handleCopyMarkdown\(\)/)
    expect(source).not.toContain('复制 Markdown')
    expect(source).not.toContain('htmlToMarkdown')
    expect(operateBarStart).toBeGreaterThan(-1)
    expect(cancelButton).toBeGreaterThan(operateBarStart)
    expect(draftButton).toBeGreaterThan(operateBarStart)
    expect(publishButton).toBeGreaterThan(operateBarStart)
    expect(cancelButton).toBeLessThan(draftButton)
    expect(draftButton).toBeLessThan(publishButton)
  })

  it('页面正文已切到 Isle 编辑器，不再依赖旧公共 Editor', () => {
    const source = readAev()

    expect(source).toContain('IsleArticleEditor')
    expect(source).not.toContain('KnowledgeEditorHost')
    expect(source).not.toContain("@/components/Editor/index.vue")
    expect(source).not.toContain('<Editor v-model="form.content"')
  })

  it('保存时只提交 JSON 正文字段', () => {
    const source = readAev()

    expect(source).toContain('contentJson')
    expect(source).toContain('contentVersion')
    expect(source).toContain('contentStatus')
    expect(source).not.toContain('save(_form)')
    expect(source).not.toContain('form.content?.replace(/<[^>]+>/g, \' \' )')
  })

  it('正文区域应覆盖 ready、legacy_html、invalid 三种状态渲染', () => {
    const source = readAev()

    expect(source).toContain('contentStatus')
    expect(source).toContain('getKnowledgeDocumentBlockMessage')
    expect(source).toContain('showEditBlockedMessage')
  })

  it('知识页应接入 Isle 正文编辑器组件', () => {
    const source = readAev()

    expect(source).toContain("@/features/isle-editor/components/IsleArticleEditor.vue")
    expect(source).toContain('<IsleArticleEditor')
    expect(source).toContain('v-model="form.contentJson"')
    expect(source).toContain('@update:model-value="handleArticleContentUpdate"')
  })
})
