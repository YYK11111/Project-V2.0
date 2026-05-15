import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootDir = resolve(__dirname, '../..')

const readSource = (path: string) => readFileSync(resolve(rootDir, path), 'utf-8')

describe('date picker global defaults', () => {
  it('全系统日期和时间选择器使用本地默认配置包装层', () => {
    const viteConfig = readSource('vite.config.ts')

    expect(viteConfig).toContain('resolveElementPlusWithDefaults')
    expect(viteConfig).toContain("componentName === 'ElDatePicker'")
    expect(viteConfig).toContain("componentName === 'ElTimePicker'")
    expect(viteConfig).toContain('ElDatePickerWithNow.ts')
    expect(viteConfig).toContain('ElTimePickerWithNow.ts')
  })

  it('本地包装层保留 Element Plus 弹窗样式导入', () => {
    const datePickerSource = readSource('src/components/element-plus/ElDatePickerWithNow.ts')
    const timePickerSource = readSource('src/components/element-plus/ElTimePickerWithNow.ts')

    expect(datePickerSource).toContain("element-plus/es/components/date-picker/style/css")
    expect(timePickerSource).toContain("element-plus/es/components/time-picker/style/css")
  })
})
