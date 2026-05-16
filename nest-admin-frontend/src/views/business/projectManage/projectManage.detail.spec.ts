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

  it('项目详情页操作按钮使用完整项目内权限上下文', () => {
    const source = readDetailSource()

    expect(source).toContain('...(dashboard.value.permissionContext || {})')
    expect(source).toContain('...(fieldPermissionResult.value?.permissionContext || {})')
    expect(source).toContain("const canOperateProject = computed(() => projectPermissionContext.value?.isVisitor !== true)")
    expect(source).toContain("const canAddTaskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)")
    expect(source).toContain("const canAddTicketInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageTasks === true)")
    expect(source).toContain("const canAddRiskInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageRisks === true)")
    expect(source).toContain("const canAddChangeInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageChanges === true)")
    expect(source).toContain("const canAddSprintInProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canManageExecution === true)")
    expect(source).toContain("const canAddKnowledgeInProject = computed(() => canOperateProject.value && (projectPermissionContext.value?.canEdit === true || projectPermissionContext.value?.canManageExecution === true || projectPermissionContext.value?.canManageDelivery === true))")
    expect(source).toContain("const canSubmitCloseCurrentProject = computed(() => canOperateProject.value && projectPermissionContext.value?.canSubmitClose === true)")
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
    const source = readDetailSource()

    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'tasks\', \'all\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'tickets\', \'open\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'risks\', \'active\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'changes\', \'pending\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'sprints\', \'active\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="handleMetricCardClick(\'milestones\', \'delayed\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card metric-card--clickable" @click="goToTab(\'plan\')"')
    expect(source).toContain('v-if="!isProjectVisitor" shadow="hover" class="metric-card"')
    expect(source).toContain('v-if="!isProjectVisitor && canViewGroup(\'projectClosure\')" shadow="hover" class="metric-card metric-card--clickable" @click="goToTab(\'closure\')"')
  })

  it('访客模式不展示执行类页签和图表', () => {
    const source = readDetailSource()

    expect(source).toContain("if (isProjectVisitor.value && ['focus', 'plan', 'tasks', 'tickets', 'milestones', 'risks', 'changes', 'sprints', 'closure'].includes(tab))")
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" label="交付焦点" name="focus">')
    expect(source).toContain('<el-tab-pane v-if="!isProjectVisitor" label="缺陷" name="tickets">')
    expect(source).toContain('<el-row v-if="!isProjectVisitor && hasOverviewCharts"')
  })
})
