import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'business-list.scss'), 'utf-8')
}

describe('business list styles', () => {
  it('筛选区最多 4 列，容器不足时自动降到 3/2/1 列', () => {
    const source = readSource()

    expect(source).toContain('grid-template-columns: repeat(auto-fit, minmax(220px, calc((100% - 60px) / 4)))')
    expect(source).not.toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(source).not.toContain('@media (max-width: 1200px)')
  })
})
