import { describe, expect, it } from 'vitest'

import { sanitizePastedHtml } from './contentSanitizer'

describe('sanitizePastedHtml', () => {
  it('office html 去掉 class 和 style，但保留标题与列表结构', () => {
    const input = [
      '<html><body><!--StartFragment-->',
      '<h1 class="MsoTitle" style="color:red">标题</h1>',
      '<ul class="list-paddingleft-2" style="margin-left:36px">',
      '<li class="MsoListParagraph" style="font-weight:bold"><span style="color:blue">列表项</span></li>',
      '</ul>',
      '<!--EndFragment--></body></html>',
    ].join('')

    expect(sanitizePastedHtml('office_html', input)).toBe('<h1>标题</h1><ul><li>列表项</li></ul>')
  })

  it('generic html 去掉空段落和冗余 span/font 包裹', () => {
    const input = '<div><p><span>正文</span></p><p><span style="color:red"></span></p><p> </p><font><span>尾部</span></font></div>'

    expect(sanitizePastedHtml('html', input)).toBe('<div><p>正文</p>尾部</div>')
  })

  it('清理仅包含 br 的空段落', () => {
    const input = '<div><p>正文</p><p><br></p><p>尾部</p></div>'

    expect(sanitizePastedHtml('html', input)).toBe('<div><p>正文</p><p>尾部</p></div>')
  })
})
