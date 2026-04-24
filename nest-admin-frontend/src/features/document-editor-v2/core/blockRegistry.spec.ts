import { describe, expect, it } from 'vitest'

import {
  documentBlockRegistry,
  getSlashBlocks,
  getTocBlockTypes,
  getToolbarBlocks,
} from './blockRegistry'
import { blockCommandKeys } from './blockCommands'

describe('document-editor-v2 block registry', () => {
  it('包含第一阶段完整块类型', () => {
    expect(documentBlockRegistry.map((block) => block.type)).toEqual([
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'table',
      'image',
    ])
  })

  it('slash 菜单暴露正确块类型', () => {
    expect(getSlashBlocks().map((block) => block.type)).toEqual([
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'table',
      'image',
    ])

    expect(getSlashBlocks().every((block) => block.showInSlashMenu)).toBe(true)
  })

  it('toolbar 暴露正确块类型', () => {
    expect(getToolbarBlocks().map((block) => block.type)).toEqual([
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'table',
      'image',
    ])

    expect(getToolbarBlocks().every((block) => block.showInToolbar)).toBe(true)
  })

  it('TOC 只包含标题块', () => {
    expect(getTocBlockTypes()).toEqual(['heading1', 'heading2', 'heading3'])
  })

  it('块定义包含第一阶段协议字段，且 registry 不暴露可变引用', () => {
    const [firstBlock] = getSlashBlocks()
    const originalRegistryAliases = documentBlockRegistry[0]?.aliases ?? []
    const registryBlock = documentBlockRegistry[0]

    expect(firstBlock).toMatchObject({
      type: 'paragraph',
      title: expect.any(String),
      aliases: expect.any(Array),
      group: expect.any(String),
      showInSlashMenu: expect.any(Boolean),
      showInToolbar: expect.any(Boolean),
      showInBlockMenu: expect.any(Boolean),
      includeInToc: expect.any(Boolean),
    })

    expect(firstBlock.aliases).not.toBe(originalRegistryAliases)
    expect(firstBlock.aliases).toEqual(originalRegistryAliases)
    expect(Object.isFrozen(registryBlock)).toBe(true)
    expect(Object.isFrozen(originalRegistryAliases)).toBe(true)
  })

  it('命令键集合正确', () => {
    expect(blockCommandKeys).toEqual([
      'insertBlockBefore',
      'insertBlockAfter',
      'convertBlock',
      'deleteBlock',
      'duplicateBlock',
      'moveBlock',
      'focusBlock',
    ])
  })
})
