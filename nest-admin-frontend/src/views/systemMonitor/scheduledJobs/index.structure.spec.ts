import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('scheduled jobs structure', () => {
  it('页面展示定时任务管理与运行日志模块', () => {
    const source = readSource()

    expect(source).toContain('定时任务管理')
    expect(source).toContain('运行日志')
  })

  it('任务列表按钮基于四个权限点做显隐控制', () => {
    const source = readSource()

    expect(source).toContain('canViewLogs')
    expect(source).toContain('canRunJob')
    expect(source).toContain('canEnableJob')
    expect(source).toContain('canDisableJob')

    expect(source).toContain("system/scheduledJobs/logs")
    expect(source).toContain("system/scheduledJobs/run")
    expect(source).toContain("system/scheduledJobs/enable")
    expect(source).toContain("system/scheduledJobs/disable")

    expect(source).toContain('v-if="canViewLogs"')
    expect(source).toContain('v-if="canRunJob"')
    expect(source).toContain("v-if=\"row.enabled === '0' && canEnableJob\"")
    expect(source).toContain("v-else-if=\"row.enabled !== '0' && canDisableJob\"")
    expect(source).toContain('class="scheduled-jobs-card Gcard"')
    expect(source).toContain('if (canViewLogs.value)')
  })

  it('运行日志详情通过抽屉和详情分区展示', () => {
    const source = readSource()

    expect(source).toContain('getScheduledJobLogDetail')
    expect(source).toContain('日志详情')
    expect(source).toContain('执行统计')
    expect(source).toContain('错误信息')
    expect(source).toContain('执行上下文')
    expect(source).toContain('el-drawer')
    expect(source).toContain('formatDetailText')
    expect(source).toContain('详情')
  })
})
