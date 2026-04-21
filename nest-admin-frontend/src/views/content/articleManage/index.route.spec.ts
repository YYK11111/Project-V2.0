import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/index.vue'), 'utf-8')
}

describe('knowledge manage route semantics', () => {
  it('标题点击进入查看页，操作列详情进入详情页', () => {
    const source = readSource()

    expect(source).toContain("@click=\"$router.push({ path: '/content/articleManage/view', query: { id: row.id } })\"")
    expect(source).toContain("<TbOpBtn icon=\"view\" @click=\"$router.push({ path: '/content/articleManage/detail', query: { id: row.id } })\">详情</TbOpBtn>")
  })
})
