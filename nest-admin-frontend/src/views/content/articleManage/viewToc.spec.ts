// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { extractTocItems } from './viewToc'

describe('extractTocItems', () => {
  it('提取 h1-h6 标题并补齐缺失锚点', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <h1>一级标题</h1>
      <p>正文段落</p>
      <h2 id="section-a">二级标题</h2>
      <h4>四级标题</h4>
      <h6>六级标题</h6>
    `

    expect(extractTocItems(container)).toEqual([
      { id: 'heading-1', text: '一级标题', level: 1 },
      { id: 'section-a', text: '二级标题', level: 2 },
      { id: 'heading-2', text: '四级标题', level: 4 },
      { id: 'heading-3', text: '六级标题', level: 6 },
    ])
  })

  it('忽略空标题并在没有标题时返回空数组', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <h2>   </h2>
      <p>只有正文</p>
    `

    expect(extractTocItems(container)).toEqual([])
  })

  it('已有同名锚点时为缺失标题生成唯一 id', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <h1 id="heading-1">一级标题</h1>
      <h2>二级标题</h2>
      <h2>二级标题补充</h2>
    `

    expect(extractTocItems(container)).toEqual([
      { id: 'heading-1', text: '一级标题', level: 1 },
      { id: 'heading-2', text: '二级标题', level: 2 },
      { id: 'heading-3', text: '二级标题补充', level: 2 },
    ])
  })

  it('正文中非标题元素占用候选 id 时仍生成唯一锚点', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <div id="heading-1">已存在锚点</div>
      <h2>二级标题</h2>
      <p id="heading-2">占位段落</p>
      <h3>三级标题</h3>
    `

    expect(extractTocItems(container)).toEqual([
      { id: 'heading-3', text: '二级标题', level: 2 },
      { id: 'heading-4', text: '三级标题', level: 3 },
    ])
  })

  it('已有重复 id 时会重写后续冲突标题的锚点', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <h2 id="same-id">第一个标题</h2>
      <p id="same-id">重复段落</p>
      <h3 id="same-id">第二个标题</h3>
      <h4>第三个标题</h4>
    `

    expect(extractTocItems(container)).toEqual([
      { id: 'same-id', text: '第一个标题', level: 2 },
      { id: 'heading-1', text: '第二个标题', level: 3 },
      { id: 'heading-2', text: '第三个标题', level: 4 },
    ])
  })
})
