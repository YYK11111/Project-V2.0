import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('task form structure', () => {
  it('新建任务时不应显示任务进度字段', () => {
    const source = readSource()

    expect(source).toContain('<div v-if="hasTaskId" class="metric-card metric-card--progress">')
    expect(source).toContain('<div class="metric-card__title">进度</div>')
  })

  it('新建任务负责人字段使用统一人员选择器', () => {
    const source = readSource()

    expect(source).toContain('<UserSelect v-else v-model="form.leaderId" placeholder="请选择负责人" clearable />')
    expect(source).not.toContain('v-model="form.leaderId" placeholder="请选择负责人" clearable filterable')
  })

  it('新建任务默认负责人为当前用户', () => {
    const source = readSource()

    expect(source).toContain('const currentUserId = computed(() => String(userStore.id || \'\'))')
    expect(source).toContain('leaderId: String(route.query.leaderId || currentUserId.value || \'\')')
  })

  it('开始时间必须早于结束时间', () => {
    const source = readSource()

    expect(source).toContain("new Error('开始时间必须早于结束时间')")
    expect(source).toContain('if (!form.value.startDate || !form.value.endDate) return')
    expect(source).toContain('if (form.value.startDate >= form.value.endDate)')
  })

  it('新建任务不显示计划与实际时间字段', () => {
    const source = readSource()

    expect(source).toContain('<el-form-item v-if="hasTaskId" label="计划开始">')
    expect(source).toContain('<el-form-item v-if="hasTaskId" label="计划结束">')
    expect(source).toContain('<el-form-item v-if="hasTaskId" label="实际开始">')
    expect(source).toContain('<el-form-item v-if="hasTaskId" label="实际结束">')
  })

  it('日期选择器交给全局默认配置提供此刻快捷项', () => {
    const source = readSource()

    expect(source).not.toContain("getDatePickerShortcuts('date')")
    expect(source).not.toContain(':shortcuts="datePickerShortcuts"')
    expect(source).toContain('<el-date-picker')
  })

  it('详情页提供任务生命周期操作入口', () => {
    const source = readSource()

    expect(source).toContain('handleStartTask')
    expect(source).toContain('handlePauseTask')
    expect(source).toContain('handleResumeTask')
    expect(source).toContain('submitCompletionApproval')
    expect(source).toContain('handleDelayTask')
    expect(source).toContain('开始任务')
    expect(source).toContain('暂停任务')
    expect(source).toContain('恢复任务')
    expect(source).toContain('提交完成审批')
    expect(source).toContain('任务延期')
  })

  it('新建页展示前置任务区块', () => {
    const source = readSource()

    expect(source).toContain('<section v-if="!hasTaskId || isEdit" class="task-section section-card section-card--approval">')
    expect(source).toContain('前置任务（依赖于此任务无法开始）')
    expect(source).toContain('showDependencyDialog')
    expect(source).toContain('newDependencyId')
    expect(source).toContain('const pendingDependencies = ref([])')
    expect(source).toContain('const currentDependencies = computed(() => hasTaskId.value ? dependencies.value : pendingDependencies.value)')
    expect(source).toContain('await Promise.all(pendingDependencies.value.map((dependencyId) => addDependency(createdTaskId, dependencyId)))')
  })

  it('保存任务后不直接读取嵌套 transport data', () => {
    const source = readSource()

    expect(source).toContain("const createdTaskId = String(res?.id || '')")
    expect(source.includes(['res?', 'data?', 'data?', 'id'].join('.'))).toBe(false)
  })

  it('评论和汇报入口按约定状态收口', () => {
    const source = readSource()

    expect(source).toContain("['2', '3', '5', '6'].includes(String(form.value.status || ''))")
    expect(source).toContain("['2', '5', '6'].includes(String(form.value.status || ''))")
  })

  it('执行权限仅用于已有任务', () => {
    const source = readSource()

    expect(source).toContain("const canExecuteCurrentTask = computed(() => hasTaskId.value && form.value?.canExecute !== false)")
    expect(source).not.toContain("const canExecuteCurrentTask = computed(() => !hasTaskId.value || form.value?.canExecute !== false)")
  })
})
