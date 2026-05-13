import { describe, expect, it } from 'vitest'
import { normalizePageData } from './pageData'

describe('normalizePageData', () => {
  it('兼容标准 ResponseListDto 的 data 数组结构', () => {
    const result = normalizePageData({
      data: {
        data: {
          data: [{ id: '1' }],
          total: 1,
        },
      },
    })

    expect(result.list).toEqual([{ id: '1' }])
    expect(result.rows).toEqual([{ id: '1' }])
    expect(result.total).toBe(1)
  })

  it('兼容历史 list/rows 结构', () => {
    const result = normalizePageData({
      data: {
        data: {
          list: [{ id: '2' }],
          total: 3,
        },
      },
    })

    expect(result.list).toEqual([{ id: '2' }])
    expect(result.total).toBe(3)
  })

  it('兼容直接返回数组结构', () => {
    const result = normalizePageData({
      data: [{ id: '3' }],
      total: 1,
    })

    expect(result.list).toEqual([{ id: '3' }])
    expect(result.total).toBe(1)
  })
})
