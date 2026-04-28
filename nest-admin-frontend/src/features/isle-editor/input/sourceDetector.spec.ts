import { describe, expect, it } from 'vitest'

import { detectPasteSource } from './sourceDetector'

describe('detectPasteSource', () => {
  it('识别 markdown 输入', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '# 标题\n\n- 列表项',
      }),
    ).toBe('markdown')
  })

  it('识别 markdown fenced code block 输入', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '```ts\nconst value = 1\n```',
      }),
    ).toBe('markdown')
  })

  it('识别 markdown table 输入', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '| 列一 | 列二 |\n| --- | --- |\n| 值一 | 值二 |',
      }),
    ).toBe('markdown')
  })

  it('单行竖线文本没有分隔行时仍识别为 plain_text', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '| 普通文本 | 不是表格 |',
      }),
    ).toBe('plain_text')
  })

  it('识别 markdown image 输入', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '![示意图](https://example.com/image.png "图片标题")',
      }),
    ).toBe('markdown')
  })

  it('识别 office_html 输入', () => {
    expect(
      detectPasteSource({
        html: '<html><body><!--StartFragment--><p class="MsoNormal">正文</p><!--EndFragment--></body></html>',
        text: '正文',
      }),
    ).toBe('office_html')
  })

  it('识别普通 html 输入', () => {
    expect(
      detectPasteSource({
        html: '<p>普通 HTML</p>',
        text: '普通 HTML',
      }),
    ).toBe('html')
  })

  it('识别 plain_text 输入', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '普通文本内容',
      }),
    ).toBe('plain_text')
  })
})
