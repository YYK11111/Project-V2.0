import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const unifiedForms = [
  'acceptanceManage/form.vue',
  'changeManage/form.vue',
  'goLiveManage/form.vue',
  'handoverManage/form.vue',
  'milestoneManage/form.vue',
  'riskManage/form.vue',
  'sprintManage/form.vue',
  'ticketManage/form.vue',
  'crm/contractManage/form.vue',
  'crm/customerManage/form.vue',
  'crm/interactionManage/form.vue',
  'crm/opportunityManage/form.vue',
]

const responsiveShellForms = [
  ...unifiedForms,
  'taskManage/form.vue',
  'userStoryManage/form.vue',
]

function readSource(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('business 表单统一样式守卫', () => {
  for (const relativePath of responsiveShellForms) {
    it(`${relativePath} 应接入统一表单响应式壳层`, () => {
      const source = readSource(relativePath)

      expect(source).toContain('class="business-form-page')
      expect(source).toContain('business-form')
      if (source.includes('class="Gcard')) {
        expect(source).toContain('business-form-shell')
      }
    })
  }

  for (const relativePath of unifiedForms) {
    it(`${relativePath} 应接入统一业务表单结构`, () => {
      const source = readSource(relativePath)

      expect(source).toContain('class="business-form-page')
      expect(source).toContain('class="business-form-header"')
      expect(source).toContain('class="business-form-sections"')
      expect(source).toContain('class="business-form-section"')
      expect(source).toContain('class="business-form-fields"')
      expect(source).not.toContain('class="section-card"')
    })
  }
})
