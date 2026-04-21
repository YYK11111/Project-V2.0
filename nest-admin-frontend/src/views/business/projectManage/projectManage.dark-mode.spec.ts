import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readViewSource(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

function readBusinessViewSource(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8')
}

function readViewsSource(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', '..', relativePath), 'utf-8')
}

describe('projectManage 页面暗黑模式样式守卫', () => {
  it('approval 页面不再使用固定浅色样式值', () => {
    const source = readViewSource('approval')

    expect(source).not.toMatch(/#fff\b/i)
    expect(source).not.toMatch(/#ffffff\b/i)
    expect(source).not.toMatch(/#ebeef5\b/i)
    expect(source).not.toMatch(/#303133\b/i)
    expect(source).not.toMatch(/#909399\b/i)
    expect(source).toMatch(/var\(--el-/)
  })

  it('detail 页面使用主题变量或颜色混合而不是浅色白底', () => {
    const source = readViewSource('detail')

    expect(source).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(source).not.toMatch(/#ffffff\b/i)
    expect(source).not.toMatch(/background:\s*#fff\b/i)
    expect(source).not.toMatch(/background:\s*rgba\(230,\s*162,\s*60/i)
    expect(source).not.toMatch(/background:\s*rgba\(245,\s*108,\s*108/i)
    expect(source).not.toMatch(/border-color:\s*rgba\(245,\s*108,\s*108/i)
    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })

  it('cockpit 页面语义卡片使用主题兼容样式', () => {
    const source = readViewSource('cockpit')

    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })

  it('任务与工单相关页面不再写死浅色面板和文字色', () => {
    const taskSource = readBusinessViewSource('taskManage/form.vue')
    const ticketSource = readBusinessViewSource('ticketManage/form.vue')
    const sprintSource = readBusinessViewSource('sprintManage/detail.vue')

    expect(taskSource).not.toMatch(/#f5f7fa\b/i)
    expect(taskSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(taskSource).not.toMatch(/#303133\b/i)
    expect(taskSource).not.toMatch(/#909399\b/i)
    expect(taskSource).toMatch(/color-mix\(/)
    expect(taskSource).toMatch(/var\(--el-/)

    expect(ticketSource).not.toMatch(/color:\s*#409eff\b/i)
    expect(ticketSource).toMatch(/var\(--el-color-primary\)/)

    expect(sprintSource).not.toMatch(/color:\s*#67C23A/i)
    expect(sprintSource).not.toMatch(/color:\s*#E6A23C/i)
    expect(sprintSource).toMatch(/var\(--el-color-success\)/)
    expect(sprintSource).toMatch(/var\(--el-color-warning\)/)
  })

  it('故事与常规工作流页面不再写死浅色背景和浅色文字', () => {
    const storyFormSource = readBusinessViewSource('userStoryManage/form.vue')
    const storyBacklogSource = readBusinessViewSource('userStoryManage/backlog.vue')
    const workflowConfigSource = readBusinessViewSource('workflow/businessConfig.vue')
    const workflowInstancesSource = readBusinessViewSource('workflow/instances.vue')

    expect(storyFormSource).not.toMatch(/background:\s*#fff\b/i)
    expect(storyFormSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(storyFormSource).not.toMatch(/border:\s*1px solid rgba\(64,\s*158,\s*255/i)
    expect(storyFormSource).toMatch(/var\(--el-bg-color\)/)
    expect(storyFormSource).toMatch(/color-mix\(/)

    expect(storyBacklogSource).not.toMatch(/#f5f7fa\b/i)
    expect(storyBacklogSource).not.toMatch(/#fff\b/i)
    expect(storyBacklogSource).not.toMatch(/#303133\b/i)
    expect(storyBacklogSource).not.toMatch(/#909399\b/i)
    expect(storyBacklogSource).toMatch(/var\(--el-/)

    expect(workflowConfigSource).not.toMatch(/#909399\b/i)
    expect(workflowConfigSource).toMatch(/var\(--el-text-color-secondary\)/)

    expect(workflowInstancesSource).not.toMatch(/#f5f7fa\b/i)
    expect(workflowInstancesSource).toMatch(/var\(--el-fill-color-extra-light\)/)
  })

  it('工作流设计器外壳与提示文案使用暗黑兼容主题变量', () => {
    const workflowDesignerSource = readBusinessViewSource('workflow/designer.vue')

    expect(workflowDesignerSource).not.toMatch(/\.workflow-designer\s*\{[^}]*background:\s*#f5f5f5/is)
    expect(workflowDesignerSource).not.toMatch(/\.designer-toolbar\s*\{[^}]*background:\s*#fff\b/is)
    expect(workflowDesignerSource).not.toMatch(/\.designer-palette\s*\{[^}]*background:\s*#fff\b/is)
    expect(workflowDesignerSource).not.toMatch(/\.designer-properties\s*\{[^}]*background:\s*#fff\b/is)
    expect(workflowDesignerSource).not.toMatch(/\.canvas-hint\s*\{[^}]*color:\s*#999/is)
    expect(workflowDesignerSource).not.toMatch(/\.issue-item-title\s*\{[^}]*color:\s*#303133/is)
    expect(workflowDesignerSource).not.toMatch(/\.issue-item-meta\s*\{[^}]*color:\s*#909399/is)
    expect(workflowDesignerSource).not.toMatch(/\.anchor\s*\{[^}]*background:\s*#fff\b/is)
    expect(workflowDesignerSource).not.toMatch(/\.node-cc\s*\{[^}]*border-color:\s*#909399/is)
    expect(workflowDesignerSource).not.toMatch(/\.condition-item\s*\{[^}]*background:\s*#f5f5f5/is)
    expect(workflowDesignerSource).not.toMatch(/\.flow-label\s*\{[^}]*fill:\s*#606266/is)
    expect(workflowDesignerSource).toMatch(/var\(--el-bg-color\)/)
    expect(workflowDesignerSource).toMatch(/var\(--el-text-color-secondary\)/)
  })

  it('内容管理页面不再写死白底和半透明白底卡片', () => {
    const articleIndexSource = readViewsSource('content/articleManage/index.vue')
    const articleAevSource = readViewsSource('content/articleManage/aev.vue')
    const articleAiDebugSource = readViewsSource('content/articleManage/aiRetrieveDebug.vue')
    const articleMyBorrowsSource = readViewsSource('content/articleManage/myBorrows.vue')
    const articleBorrowApprovalSource = readViewsSource('content/articleManage/borrowApproval.vue')

    expect(articleIndexSource).not.toMatch(/background:\s*#fff\b/i)
    expect(articleIndexSource).toMatch(/var\(--el-bg-color\)/)

    expect(articleAevSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(articleAevSource).not.toMatch(/background:\s*#fff\b/i)
    expect(articleAevSource).not.toMatch(/background:\s*#f8fafc\b/i)
    expect(articleAevSource).toMatch(/var\(--el-bg-color\)/)
    expect(articleAevSource).toMatch(/color-mix\(/)

    expect(articleAiDebugSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(articleAiDebugSource).not.toMatch(/background:\s*#fff\b/i)
    expect(articleAiDebugSource).not.toMatch(/background:\s*#f8fafc\b/i)
    expect(articleAiDebugSource).not.toMatch(/color-mix\(in srgb, var\(--Color\) 3%, #ffffff\)/i)
    expect(articleAiDebugSource).toMatch(/var\(--el-bg-color\)/)
    expect(articleAiDebugSource).toMatch(/color-mix\(/)

    expect(articleMyBorrowsSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(articleMyBorrowsSource).toMatch(/color-mix\(/)

    expect(articleBorrowApprovalSource).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(articleBorrowApprovalSource).toMatch(/color-mix\(/)
  })

  it('系统菜单树节点 hover 使用主题变量而不是浅色常量', () => {
    const menuSource = readViewsSource('system/menus/index.vue')

    expect(menuSource).not.toMatch(/\.menu-tree-node:hover\s*\{[^}]*background:\s*#f8fafc/is)
    expect(menuSource).toMatch(/var\(--el-fill-color-extra-light\)/)
  })
})
