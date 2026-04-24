import type { DocumentBlockDefinition, DocumentBlockType } from './blockTypes'

const blockRegistrySource: DocumentBlockDefinition[] = [
  {
    type: 'paragraph',
    title: '正文',
    aliases: ['text', 'p'],
    group: 'basic',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'heading1',
    title: '一级标题',
    aliases: ['h1', 'title 1'],
    group: 'heading',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: true,
  },
  {
    type: 'heading2',
    title: '二级标题',
    aliases: ['h2', 'title 2'],
    group: 'heading',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: true,
  },
  {
    type: 'heading3',
    title: '三级标题',
    aliases: ['h3', 'title 3'],
    group: 'heading',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: true,
  },
  {
    type: 'bulletList',
    title: '无序列表',
    aliases: ['ul', 'bullet'],
    group: 'list',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'orderedList',
    title: '有序列表',
    aliases: ['ol', 'numbered list'],
    group: 'list',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'taskList',
    title: '任务列表',
    aliases: ['todo', 'checklist'],
    group: 'list',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'blockquote',
    title: '引用',
    aliases: ['quote', 'citation'],
    group: 'basic',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'codeBlock',
    title: '代码块',
    aliases: ['code', 'pre'],
    group: 'basic',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'horizontalRule',
    title: '分割线',
    aliases: ['divider', 'hr'],
    group: 'structure',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'table',
    title: '表格',
    aliases: ['grid', 'sheet'],
    group: 'structure',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
  {
    type: 'image',
    title: '图片',
    aliases: ['photo', 'image'],
    group: 'media',
    showInSlashMenu: true,
    showInToolbar: true,
    showInBlockMenu: true,
    includeInToc: false,
  },
]

export const documentBlockRegistry: readonly Readonly<DocumentBlockDefinition>[] = blockRegistrySource.map((block) =>
  Object.freeze({
    ...block,
    aliases: Object.freeze([...block.aliases]),
  }),
)

function selectBlocks(predicate: (block: DocumentBlockDefinition) => boolean): DocumentBlockDefinition[] {
  return documentBlockRegistry.filter(predicate).map((block) => ({
    ...block,
    aliases: [...block.aliases],
  }))
}

export function getSlashBlocks(): DocumentBlockDefinition[] {
  return selectBlocks((block) => block.showInSlashMenu)
}

export function getToolbarBlocks(): DocumentBlockDefinition[] {
  return selectBlocks((block) => block.showInToolbar)
}

export function getTocBlockTypes(): DocumentBlockType[] {
  return selectBlocks((block) => block.includeInToc).map((block) => block.type)
}
