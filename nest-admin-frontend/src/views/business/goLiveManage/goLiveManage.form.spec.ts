import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readGoLiveFormSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('goLiveManage 表单治理守卫', () => {
  it('检查项摘要和回退预案使用富文本并共用相关附件', () => {
    const source = readGoLiveFormSource()

    expect(source).toContain("import Editor from '@/components/Editor/index.vue'")
    expect(source).toContain("import Upload from '@/components/Upload.vue'")
    expect(source).toContain("import ViewRichText from '@/components/view/ViewRichText.vue'")
    expect(source).toContain("import ViewFileList from '@/components/view/ViewFileList.vue'")
    expect(source).toContain('v-model="form.checklistSummary"')
    expect(source).toContain('v-model="form.rollbackPlan"')
    expect(source).toContain('label="相关附件"')
    expect(source).toContain('v-model:fileList="form.relatedAttachments"')
    expect(source).toContain(':html="form.checklistSummary"')
    expect(source).toContain(':html="form.rollbackPlan"')
    expect(source).toContain(':files="form.relatedAttachments || []"')
    expect(source).not.toContain('checklistAttachments')
    expect(source).not.toContain('rollbackAttachments')
  })

  it('状态字段新建不展示且任何编辑态都不可改', () => {
    const source = readGoLiveFormSource()

    expect(source).toContain('v-if="isEdit || isReadonly"')
    expect(source).toContain(':value="statusMap[form.status] || \'-\'"')
    expect(source).not.toContain('v-model="form.status"')
    expect(source).not.toContain('<el-select v-else')
    expect(source).toContain('delete payload.status')
  })

  it('实际上线日期由系统动作维护，草稿编辑时不展示', () => {
    const source = readGoLiveFormSource()

    expect(source).toContain('const canShowActualGoLiveTime')
    expect(source).toContain("String(form.value.status || '') !== '1'")
    expect(source).toContain('v-if="canShowActualGoLiveTime"')
    expect(source).not.toContain('v-model="form.actualGoLiveTime"')
    expect(source).toContain('delete payload.actualGoLiveTime')
    expect(source).toContain('handleStartGoLive')
    expect(source).toContain('handleConfirmSuccess')
    expect(source).toContain('handleConfirmRollback')
  })
})
