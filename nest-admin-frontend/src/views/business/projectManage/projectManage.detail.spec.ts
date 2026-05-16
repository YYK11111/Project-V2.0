import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readDetailSource() {
  return readFileSync(resolve(__dirname, 'detail.vue'), 'utf-8')
}

function readProjectComponentSource(name: string) {
  return readFileSync(resolve(__dirname, 'components', name), 'utf-8')
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

  it('项目详情页操作按钮使用完整项目内权限上下文', () => {
    const source = readDetailSource()

    expect(source).toContain('...(dashboard.value.permissionContext || {})')
    expect(source).toContain('...(fieldPermissionResult.value?.permissionContext || {})')
    expect(source).toContain("const canOperateProject = computed(() => projectPermissionContext.value != null && projectPermissionContext.value?.isVisitor !== true)")
    expect(source).toContain("const canAddTaskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)")
    expect(source).toContain("const canAddTicketInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)")
    expect(source).toContain("const canAddRiskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageRisks === true)")
    expect(source).toContain("const canAddChangeInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageChanges === true)")
    expect(source).toContain("const canAddSprintInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageExecution === true)")
    expect(source).toContain("const canAddKnowledgeInProject = computed(() => canOperateProject.value && (projectPermissionContext.value?.canEdit === true || projectPermissionContext.value?.canManageExecution === true || projectPermissionContext.value?.canManageDelivery === true))")
    expect(source).toContain("const canSubmitCloseCurrentProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canSubmitClose === true)")
    expect(source).toContain("const isProjectVisitor = computed(() => projectPermissionContext.value == null || projectPermissionContext.value?.isVisitor === true)")
    expect(source).not.toContain("const canTaskAdd = computed(() => checkPermi(['business/tasks/add']))")
    expect(source).not.toContain("const canProjectSubmitClose = computed(() => checkPermi(['business/projects/submitClose']))")
  })

  it('项目详情页统一展示计划周期和实际周期', () => {
    const source = readDetailSource()

    expect(source).toContain("const displayPlanStartDate = computed(() => project.value?.planStartDate || project.value?.startDate || '')")
    expect(source).toContain("const displayPlanEndDate = computed(() => project.value?.planEndDate || project.value?.endDate || '')")
    expect(source).toContain("const displayActualStartDate = computed(() => project.value?.actualStartDate || '')")
    expect(source).toContain("const displayActualEndDate = computed(() => project.value?.actualEndDate || '')")
    expect(source).toContain('function formatDateRange(startDate, endDate)')
    expect(source).toContain('<span class="project-meta-item__label">计划周期</span>')
    expect(source).toContain('<span class="project-meta-item__label">实际周期</span>')
    expect(source).not.toContain('<span class="project-meta-item__label">开始时间</span>')
    expect(source).not.toContain('<span class="project-meta-item__label">结束时间</span>')
    expect(source).not.toContain('<span class="project-meta-item__label">计划开始</span>')
    expect(source).not.toContain('<span class="project-meta-item__label">计划结束</span>')
  })

  it('项目详情页计划入口去重并保留里程碑和 Sprint 独立页签', () => {
    const source = readDetailSource()

    expect(source).toContain('name="milestones"')
    expect(source).toContain('name="sprints"')
    expect((source.match(/调整基线计划/g) || []).length).toBe(1)
    expect(source).toContain('v-if="canManagePlanInProject" type="primary" @click="goToProjectChange(\'2\')"')
  })

  it('项目详情页只保留一个提交结项主入口', () => {
    const source = readDetailSource()

    expect((source.match(/@click="handleSubmitClose"/g) || []).length).toBe(1)
    expect(source).toContain('v-if="canSubmitCloseCurrentProject && project.status === \'3\'"')
    expect(source).toContain('提交结项申请')
    expect(source).not.toContain(':disabled="!canSubmitCloseCurrentProject"')
    expect(source).not.toContain('提交结项审批')
  })

  it('计划影响确认动作必须受项目内计划权限控制', () => {
    const source = readDetailSource()

    expect(source).toContain("if (!canManagePlanInProject.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(source).toContain("v-if=\"canManagePlanInProject && !item.planImpactScopes?.milestone?.confirmed\"")
    expect(source).toContain("v-if=\"canManagePlanInProject && !item.planImpactScopes?.sprint?.confirmed\"")
    expect(source).toContain("v-if=\"canManagePlanInProject && !item.planImpactScopes?.task?.confirmed\"")
    expect(source).toContain("v-if=\"canManagePlanInProject && String(item.planImpactConfirmed || '0') !== '1'\"")
    expect(source).toContain("v-if=\"canManagePlanInProject && !item.confirms?.some((confirm) => confirm.changeId === change.id)\"")
  })

  it('知识模板和复盘沉淀动作必须受项目内知识权限控制', () => {
    const source = readDetailSource()

    expect(source).toContain("if (!canAddKnowledgeInProject.value) return $sdk.msgWarning('当前操作没有权限')")
    expect(source).toContain('v-if="canAddKnowledgeInProject" type="primary" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeCreate"')
    expect(source).toContain('v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate(\'implementationGuide\')"')
    expect(source).toContain('v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate(\'faq\')"')
    expect(source).toContain('v-if="canAddKnowledgeInProject" :loading="publishReviewLoading" :disabled="!project.closeReview" @click="handlePublishCloseReview"')
    expect(source).toContain('v-if="canAddKnowledgeInProject" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate(\'review\')"')
    expect(source).not.toContain('v-if="!isProjectVisitor" :disabled="!project.knowledgeCatalogId" @click="goToProjectKnowledgeTemplate')
  })

  it('访客模式不展示执行类概览指标入口', () => {
    const source = readProjectComponentSource('ProjectOverviewSummary.vue')

    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'tasks\', \'all\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'tickets\', \'open\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'risks\', \'active\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'changes\', \'pending\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'sprints\', \'active\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitMetricCardClick(\'milestones\', \'delayed\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="emitGoToTab(\'plan\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card"')
    expect(source).toContain('v-if="!isProjectVisitor && canViewProjectClosure" shadow="hover" class="metric-card metric-card--clickable" @click="emitGoToTab(\'closure\')"')
  })

  it('访客模式不展示执行类页签和图表', () => {
    const source = readDetailSource()

    expect(source).toContain("if (isProjectVisitor.value && ['focus', 'plan', 'tasks', 'tickets', 'milestones', 'risks', 'changes', 'sprints', 'closure'].includes(tab))")
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="交付焦点" name="focus">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="缺陷" name="tickets">')
    expect(source).toContain(':is-project-visitor="isProjectVisitor"')
    expect(source).toContain(':has-overview-charts="hasOverviewCharts"')
  })

  it('项目详情页重页签按需渲染且图表不随页签切换重建', () => {
    const source = readDetailSource()

    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="交付焦点" name="focus">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="计划" name="plan">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="任务" name="tasks">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="缺陷" name="tickets">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="里程碑" name="milestones">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="风险" name="risks">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="变更" name="changes">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" lazy label="Sprint" name="sprints">')
    expect(source).toContain('<el-tab-pane v-if="canViewGroup(\'projectKnowledge\')" lazy label="知识" name="knowledge">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor && canViewGroup(\'projectClosure\')" lazy label="结项" name="closure">')
    expect(source).not.toContain(':key="`task-${activeTab}`"')
    expect(source).not.toContain(':key="`ticket-${activeTab}`"')
    expect(source).not.toContain(':key="`risk-${activeTab}`"')
  })

  it('概览图表区应拆分为独立组件，避免详情页继续堆叠图表模板', () => {
    const source = readDetailSource()

    expect(source).toContain("import ProjectOverviewCharts from './components/ProjectOverviewCharts.vue'")
    expect(source).toContain('<ProjectOverviewCharts')
    expect(source).toContain('@chart-slice-click="handleChartSliceClick"')
    expect(source).not.toContain("import ChartPie from '@/components/ChartPie.vue'")
    expect(source).not.toContain('<ChartPie')
  })

  it('概览摘要区应拆分为独立组件，详情页只保留数据传入和事件转发', () => {
    const source = readDetailSource()

    expect(source).toContain("import ProjectOverviewSummary from './components/ProjectOverviewSummary.vue'")
    expect(source).toContain('<ProjectOverviewSummary')
    expect(source).toContain(':can-view-project-closure="canViewGroup(\'projectClosure\')"')
    expect(source).toContain('@metric-card-click="handleMetricCardClick"')
    expect(source).toContain('@go-to-tab="goToTab"')
    expect(source).toContain('@project-alert-click="handleProjectAlertClick"')
    expect(source).not.toContain('<div class="metric-grid">')
    expect(source).not.toContain('class="project-alert-grid"')
    expect(source).not.toContain('class="focus-grid mt20"')
  })

  it('概览详情面板应拆分为独立组件，详情页只保留数据传入和事件转发', () => {
    const source = readDetailSource()

    expect(source).toContain("import ProjectOverviewPanels from './components/ProjectOverviewPanels.vue'")
    expect(source).toContain('<ProjectOverviewPanels')
    expect(source).toContain(':project="project"')
    expect(source).toContain(':task-summary="taskSummary"')
    expect(source).toContain(':milestone-summary="milestoneSummary"')
    expect(source).toContain(':project-health-summary="projectHealthSummary"')
    expect(source).toContain(':due-soon-milestones="dueSoonMilestones"')
    expect(source).toContain(':milestones="milestones"')
    expect(source).toContain(':can-view-project-member="canViewGroup(\'projectMember\')"')
    expect(source).toContain(':cost-variance="costVariance"')
    expect(source).not.toContain('class="panel-progress-list"')
    expect(source).not.toContain('class="cost-grid"')
    expect(source).not.toContain('class="health-score-card"')
    expect(source).not.toContain('class="health-dimension-grid"')
    expect(source).not.toContain('class="health-alert-list"')
    expect(source).not.toContain('class="side-panel-block"')
    expect(source).not.toContain('<ViewRichText')
  })

  it('项目权限在数据加载前默认收口，避免先放行后收紧', () => {
    const source = readDetailSource()

    expect(source).toContain('const projectPermissionContext = ref(null)')
    expect(source).toContain('const fieldPermissionResult = ref(null)')
    expect(source).toContain('projectPermissionContext.value = null')
    expect(source).toContain('fieldPermissionResult.value = null')
    expect(source).toContain('if (!fieldPermissionResult.value) return false')
  })

  it('概览详情面板组件应保留进度、健康度和成员信息结构', () => {
    const source = readProjectComponentSource('ProjectOverviewPanels.vue')

    expect(source).toContain('class="panel-progress-list"')
    expect(source).toContain('class="cost-grid"')
    expect(source).toContain('class="health-score-card"')
    expect(source).toContain('class="health-dimension-grid"')
    expect(source).toContain('class="health-alert-list"')
    expect(source).toContain('<ViewRichText :html="project.description" />')
    expect(source).toContain('v-if="canViewProjectMember && coreMembers.length"')
    expect(source).toContain('memberRoleMap[row.role] || row.role')
    expect(source).toContain('milestoneStatusMap[item.status] || \'-\'')
  })

  it('顶部快捷发起应拆分并收敛为常用动作加更多操作', () => {
    const source = readDetailSource()

    expect(source).toContain("import ProjectHeroActions from './components/ProjectHeroActions.vue'")
    expect(source).toContain('<ProjectHeroActions')
    expect(source).toContain('@create-record="createProjectScopedRecord"')
    expect(source).toContain('@create-knowledge="goToProjectKnowledgeCreate"')
    expect(source).not.toContain('hero-action-card__grid')
    expect(source).not.toContain('从项目上下文直接发起核心业务动作')
  })
})
