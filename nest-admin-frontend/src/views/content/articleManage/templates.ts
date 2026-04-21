export const articleTemplateMap = {
  implementationGuide: {
    label: '实施说明',
    knowledgeType: 'guide',
    title: '项目实施说明',
    summary: '用于沉淀实施范围、环境信息、关键步骤和交付说明。',
    content: `## 背景说明
请说明本次实施的背景、目标和适用范围。

## 前置准备
- 环境准备：
- 账号准备：
- 数据准备：

## 实施步骤
1. 
2. 
3. 

## 关键检查项
- 
- 
- 

## 交付说明
- 交付物：
- 交接方式：
- 注意事项：
`,
  },
  faq: {
    label: 'FAQ',
    knowledgeType: 'faq',
    title: '常见问题 FAQ',
    summary: '用于沉淀高频问题、原因定位和标准处理方法。',
    content: `## 问题现象
请描述用户最常见的问题表现。

## 适用场景
- 
- 

## 原因分析
1. 
2. 

## 处理步骤
1. 
2. 
3. 

## 验证方式
- 
- 

## 相关说明
- 
`,
  },
  launchChecklist: {
    label: '上线手册',
    knowledgeType: 'delivery',
    title: '上线手册',
    summary: '用于整理上线准备、执行步骤、验证项和回退方案。',
    content: `## 上线目标
请说明本次上线目标和范围。

## 上线前检查
- 环境检查：
- 数据检查：
- 权限检查：

## 上线步骤
1. 
2. 
3. 

## 验证项
- 
- 

## 回退方案
- 回退条件：
- 回退步骤：

## 上线结果记录
- 
`,
  },
  review: {
    label: '项目复盘',
    knowledgeType: 'experience',
    title: '项目复盘',
    summary: '用于沉淀项目阶段总结、问题原因、经验和改进建议。',
    content: `## 项目结果概述
请概述本阶段或本项目的整体结果。

## 做得好的地方
1. 
2. 

## 暴露的问题
1. 
2. 

## 原因分析
1. 
2. 

## 改进建议
1. 
2. 

## 可复用经验
- 
- 
`,
  },
}

export function getArticleTemplate(key?: string) {
  return key ? articleTemplateMap[key] || null : null
}

export function getArticleTemplateOptions() {
  return Object.entries(articleTemplateMap).map(([key, item]) => ({
    key,
    ...item,
  }))
}
