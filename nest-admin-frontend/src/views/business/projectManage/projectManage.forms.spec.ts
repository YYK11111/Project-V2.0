import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8')
}

function readBusinessFormStyle() {
  return readFileSync(resolve(__dirname, '..', '..', '..', 'styles', 'business-form.scss'), 'utf-8')
}

function readElementUiStyle() {
  return readFileSync(resolve(__dirname, '..', '..', '..', 'styles', 'element-ui.scss'), 'utf-8')
}

function getStyleBlock(source: string, selector: string) {
  const styleSource = Array.from(source.matchAll(/<style[^>]*>(?<content>[\s\S]*?)<\/style>/g))
    .map((match) => match.groups?.content || '')
    .join('\n')
  const sourceWithoutMedia = styleSource.replace(/@media[\s\S]*?\n\}/g, '')
  const rules = sourceWithoutMedia.matchAll(/(?<selectors>[^{}]+)\{(?<styles>[^{}]*)\}/g)

  for (const rule of rules) {
    const selectors = (rule.groups?.selectors || '').split(',').map((item) => item.trim())
    if (selectors.includes(selector)) return rule.groups?.styles || ''
  }

  return ''
}

describe('项目链路表单结构整改守卫', () => {
  it('全局 Element Plus 必填星号不应再被统一隐藏', () => {
    const source = readElementUiStyle()

    expect(source).not.toMatch(/\.el-form-item\.is-required:not\(\.is-no-asterisk\)\s*>\s*\.el-form-item__label:before\s*\{[\s\S]*?display:\s*none;/)
  })

  it('目标表单页不再保留 Hero 结构', () => {
    const files = [
      'projectManage/form.vue',
      'taskManage/form.vue',
      'userStoryManage/form.vue',
      'ticketManage/form.vue',
      'riskManage/form.vue',
      'changeManage/form.vue',
      'sprintManage/form.vue',
      'milestoneManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).not.toMatch(/km-hero/)
      expect(source).not.toMatch(/form-hero__/)
    })
  })

  it('需要补附件的表单页应显式接入 Upload 与 ViewFileList', () => {
    const files = [
      'userStoryManage/form.vue',
      'riskManage/form.vue',
      'changeManage/form.vue',
      'sprintManage/form.vue',
      'milestoneManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toMatch(/Upload/)
      expect(source).toMatch(/ViewFileList/)
      expect(source).toMatch(/attachments/)
    })
  })

  it('高风险项目链路表单页仅在自身路由下响应 id 变化', () => {
    const routeGuards = [
      { file: 'projectManage/form.vue', routePath: '/projectManage/form' },
      { file: 'ticketManage/form.vue', routePath: '/ticketManage/form' },
      { file: 'changeManage/form.vue', routePath: '/changeManage/form' },
      { file: 'riskManage/form.vue', routePath: '/riskManage/form' },
      { file: 'milestoneManage/form.vue', routePath: '/milestoneManage/form' },
      { file: 'sprintManage/form.vue', routePath: '/sprintManage/form' },
      { file: 'userStoryManage/form.vue', routePath: '/userStoryManage/form' },
    ]

    routeGuards.forEach(({ file, routePath }) => {
      const source = readBusinessView(file)
      expect(source).toContain('useCurrentRouteGuard')
      expect(source).toContain(`'${routePath}'`)
    })
  })

  it('新增项目页表格容器承接横向溢出，避免固定列宽撑大页面', () => {
    const source = readBusinessView('projectManage/form.vue')
    const tableWrapperBlock = source.match(/^\.table-wrapper\s*\{(?<styles>[^}]*)\}/m)?.groups?.styles || ''

    expect(tableWrapperBlock).toContain('overflow-x: auto;')
  })

  it('新增项目页外层卡片不承接横向滚动，避免左侧字段被挤出可视区', () => {
    const source = readBusinessView('projectManage/form.vue')
    const shellBlock = source.match(/^\.project-form-shell\s*\{(?<styles>[^}]*)\}/m)?.groups?.styles || ''

    expect(shellBlock).toContain('overflow-x: hidden;')
  })

  it('新增项目页基础信息行抵消 Element Plus gutter 负边距，避免字段区横向溢出', () => {
    const source = readBusinessView('projectManage/form.vue')
    const basicInfoRowBlock = source.match(/^\.basic-info-row\s*\{(?<styles>[^}]*)\}/m)?.groups?.styles || ''

    expect(basicInfoRowBlock).toContain('margin-left: 0 !important;')
    expect(basicInfoRowBlock).toContain('margin-right: 0 !important;')
  })

  it('新增项目页里程碑表不默认写死宽度，避免新建态少列表格撑大表单', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain("'table-wrapper--milestones-wide': !isDraftCreateLikeMode")
    expect(source).not.toMatch(/\.table-wrapper--milestones\s+:deep\(\.el-table\)\s*\{[\s\S]*width:\s*1280px;/)
  })

  it('新建项目页里程碑计划应录入交付物和描述并随暂存提交', () => {
    const source = readBusinessView('projectManage/form.vue')
    const desktopMilestoneSection = source.slice(
      source.indexOf('<el-table :data="form.milestones"'),
      source.indexOf('<el-table-column v-if="!isDraftCreateLikeMode" label="延期原因"'),
    )
    const mobileMilestoneSection = source.slice(
      source.indexOf('<div v-else class="mobile-card-list">'),
      source.indexOf('<el-form-item v-if="!isDraftCreateLikeMode" label="延期原因"'),
    )
    const draftPayloadSection = source.slice(
      source.indexOf('payload.milestones = payload.milestones.map((item) => ({'),
      source.indexOf('  return payload'),
    )

    expect(desktopMilestoneSection).toContain('label="交付物"')
    expect(desktopMilestoneSection).toContain('label="描述"')
    expect(desktopMilestoneSection).not.toContain('v-if="!isDraftCreateLikeMode" label="交付物"')
    expect(desktopMilestoneSection).not.toContain('v-if="!isDraftCreateLikeMode" label="描述"')
    expect(mobileMilestoneSection).toContain('label="交付物"')
    expect(mobileMilestoneSection).toContain('label="描述"')
    expect(mobileMilestoneSection).not.toContain('v-if="!isDraftCreateLikeMode" label="交付物"')
    expect(mobileMilestoneSection).not.toContain('v-if="!isDraftCreateLikeMode" label="描述"')
    expect(draftPayloadSection).toContain('description: item.description || \'\'')
    expect(draftPayloadSection).toContain('deliverables: item.deliverables || []')
  })

  it('立项后项目编辑页应跳转详情并提示走项目变更', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain("isEdit.value && String(data?.status || '') !== '1'")
    expect(source).toContain("项目立项后不允许直接编辑，请通过项目变更发起调整")
    expect(source).toContain("router.replace({ path: '/projectManage/detail', query: { id: route.query.id } })")
  })

  it('新建项目自动把项目发起人识别为当前用户并随提交保持一致', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain("import { useUserStore } from '@/stores/user'")
    expect(source).toContain('const userStore = useUserStore()')
    expect(source).toContain('getCurrentUserAsProjectCreator')
    expect(source).toContain('creatorId: String(userStore.id || \'\')')
    expect(source).toContain('payload.creatorId = String(userStore.id || payload.creatorId || \'\')')
  })

  it('暂存项目编辑态应复用新建项目表单体验', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain("const isDraftCreateLikeMode = computed(() => isCreate.value || (isEdit.value && String(form.value.status || '') === '1'))")
    expect(source).toContain('if (isDraftCreateLikeMode.value) {')
    expect(source).toContain(':disabled="isDraftCreateLikeMode"')
    expect(source).toContain(':disabled="!isDraftCreateLikeMode && isEdit"')
    expect(source).toContain("if (isDraftCreateLikeMode.value) return true")
    expect(source).toContain("if (isDraftCreateLikeMode.value) return false")
    expect(source).toContain("if (isDraftCreateLikeMode.value) {")
    expect(source).toContain("fieldPermissionResult.value = null")
    expect(source).not.toContain('v-if="!isCreate" label="进度(%)"')
    expect(source).not.toContain('v-if="!isCreate && canViewGroup(\'projectClosure\')"')
    expect(source).not.toContain('v-if="!isCreate" label="责任人"')
    expect(source).not.toContain('v-if="!isCreate" label="状态"')
  })

  it('高频业务表单外层卡片不承接横向滚动', () => {
    const shellGuards = [
      { file: 'taskManage/form.vue', selector: '.task-form-shell' },
      { file: 'userStoryManage/form.vue', selector: '.story-form-shell' },
      { file: 'ticketManage/form.vue', selector: '.ticket-form-shell' },
      { file: 'crm/customerManage/form.vue', selector: '.customer-form-shell' },
      { file: 'crm/opportunityManage/form.vue', selector: '.opportunity-form-shell' },
      { file: 'crm/interactionManage/form.vue', selector: '.interaction-form-shell' },
      { file: 'crm/contractManage/form.vue', selector: '.contract-form-shell' },
      { file: 'riskManage/form.vue', selector: '.risk-form-shell' },
      { file: 'changeManage/form.vue', selector: '.change-form-shell' },
      { file: 'sprintManage/form.vue', selector: '.sprint-form-shell' },
      { file: 'milestoneManage/form.vue', selector: '.milestone-form-shell' },
      { file: 'goLiveManage/form.vue', selector: '.go-live-form-shell' },
      { file: 'acceptanceManage/form.vue', selector: '.acceptance-form-shell' },
      { file: 'handoverManage/form.vue', selector: '.handover-form-shell' },
    ]

    shellGuards.forEach(({ file, selector }) => {
      const source = readBusinessView(file)
      const shellBlock = getStyleBlock(source, selector)
      const globalShellBlock = readBusinessFormStyle().match(/\.business-form-shell,\n\.business-form-page \.form-page-shell__content \{[\s\S]*?\}/)?.[0] || ''

      if (shellBlock) {
        expect(shellBlock).toContain('width: 100%;')
        expect(shellBlock).toContain('max-width: 100%;')
        expect(shellBlock).toContain('min-width: 0;')
        expect(shellBlock).toContain('overflow-x: hidden;')
      } else {
        expect(source).toContain('business-form-page')
        expect(globalShellBlock).toContain('width: 100%;')
        expect(globalShellBlock).toContain('max-width: 100%;')
        expect(globalShellBlock).toContain('min-width: 0;')
        expect(globalShellBlock).toContain('overflow-x: hidden;')
      }
    })
  })

  it('高频业务表单行抵消 Element Plus gutter 负边距', () => {
    const rowGuards = [
      { file: 'taskManage/form.vue', selector: '.task-info-row' },
      { file: 'userStoryManage/form.vue', selector: '.story-info-row' },
      { file: 'ticketManage/form.vue', selector: '.ticket-form-page :deep(.el-row)' },
      { file: 'crm/customerManage/form.vue', selector: '.customer-form-page :deep(.el-row)' },
      { file: 'crm/opportunityManage/form.vue', selector: '.opportunity-form-page :deep(.el-row)' },
      { file: 'crm/interactionManage/form.vue', selector: '.interaction-form-page :deep(.el-row)' },
      { file: 'crm/contractManage/form.vue', selector: '.contract-form-page :deep(.el-row)' },
      { file: 'changeManage/form.vue', selector: '.change-form-page :deep(.el-row)' },
      { file: 'sprintManage/form.vue', selector: '.sprint-form-page :deep(.el-row)' },
      { file: 'projectManage/approval.vue', selector: '.summary-row' },
      { file: 'projectManage/approval.vue', selector: '.basic-info-row' },
    ]

    rowGuards.forEach(({ file, selector }) => {
      const source = readBusinessView(file)
      const rowBlock = getStyleBlock(source, selector)
      const globalRowBlock = readBusinessFormStyle().match(/\.business-form \.el-row \{[\s\S]*?\}/)?.[0] || ''

      if (rowBlock) {
        expect(rowBlock).toContain('margin-left: 0 !important;')
        expect(rowBlock).toContain('margin-right: 0 !important;')
      } else {
        expect(source).toContain('business-form')
        expect(globalRowBlock).toContain('margin-left: 0 !important;')
        expect(globalRowBlock).toContain('margin-right: 0 !important;')
      }
    })
  })

  it('项目编辑页使用项目内权限上下文，不再把全局 update 作为前置条件', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain('const projectPermissionContext = ref(null)')
    expect(source).toContain("const canEditCurrentProject = computed(() => isCreate.value || (projectPermissionContext.value?.canEdit === true && String(form.value.status || '') === '1'))")
    expect(source).not.toContain('(isEdit.value && !canProjectUpdate.value)')
    expect(source).not.toContain('isEdit && isDraftMode && canProjectUpdate')
  })

  it('项目表单统一使用计划周期作为主时间输入，旧开始结束字段仅做兼容提交', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain("{ required: true, message: '请选择计划开始时间', trigger: 'change' }")
    expect(source).toContain("{ required: true, message: '请选择计划结束时间', trigger: 'change' }")
    expect(source).toContain("const normalizedPlanStartDate = payload.planStartDate || payload.startDate || ''")
    expect(source).toContain("const normalizedPlanEndDate = payload.planEndDate || payload.endDate || ''")
    expect(source).toContain('payload.planStartDate = normalizedPlanStartDate')
    expect(source).toContain('payload.planEndDate = normalizedPlanEndDate')
    expect(source).toContain('payload.startDate = normalizedPlanStartDate')
    expect(source).toContain('payload.endDate = normalizedPlanEndDate')
    expect(source).toContain("planStartDate: String(route.query.planStartDate || route.query.startDate || '')")
    expect(source).toContain("planEndDate: String(route.query.planEndDate || route.query.endDate || '')")
    expect(source).not.toContain('<el-form-item label="开始时间" prop="startDate">')
    expect(source).not.toContain('<el-form-item label="结束时间" prop="endDate">')
    expect(source).not.toContain('v-if="canViewGroup(\'projectPlan\') && !isDraftCreateLikeMode"')
  })

  it('工单表单应把工单内容纳入前端必填校验', () => {
    const source = readBusinessView('ticketManage/form.vue')

    expect(source).toContain('function validateTicketContent')
    expect(source).toContain("content: [{ required: true, validator: validateTicketContent, trigger: 'blur' }],")
    expect(source).toContain("new Error('请输入工单内容')")
    expect(source).toContain('prop="content"')
  })

  it('项目表单应显式展示立项与结项阶段性必填说明', () => {
    const source = readBusinessView('projectManage/form.vue')

    expect(source).toContain('提交立项审批前必填')
    expect(source).toContain('里程碑至少 1 条，且每条都要补齐名称和计划完成日期')
    expect(source).toContain('提交结项审批前必填')
    expect(source).toContain('至少新增 1 条上线记录和 1 条通过验收记录')
  })
})
