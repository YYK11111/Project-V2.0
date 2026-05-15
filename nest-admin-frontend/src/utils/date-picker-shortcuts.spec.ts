import { describe, expect, it, vi } from 'vitest'
import { getDatePickerProps, getDatePickerShortcuts, getTimePickerProps } from './common'

describe('date picker shortcuts', () => {
  it('普通日期选择器提供此刻快捷项', () => {
    const now = new Date('2026-05-15T10:30:45')
    vi.useFakeTimers()
    try {
      vi.setSystemTime(now)

      const shortcuts = getDatePickerShortcuts('date')
      const currentShortcut = shortcuts.find((item) => item.text === '此刻')

      expect(currentShortcut).toBeTruthy()
      expect(currentShortcut?.value()).toEqual(now)
    } finally {
      vi.useRealTimers()
    }
  })

  it('日期时间选择器使用 Element Plus 原生此刻按钮', () => {
    const shortcuts = getDatePickerShortcuts('datetime')
    const props = getDatePickerProps('datetime')

    expect(shortcuts).toEqual([])
    expect(props).toMatchObject({
      shortcuts: [],
      showNow: true,
    })
  })

  it('时间选择器启用 Element Plus 原生此刻按钮', () => {
    expect(getTimePickerProps()).toMatchObject({
      showNow: true,
    })
  })
})
