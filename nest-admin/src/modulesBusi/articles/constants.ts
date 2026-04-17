export enum VisibilityType {
  public = 'public',
  role = 'role',
  specified = 'specified',
}

export const visibilityTypeMap = {
  [VisibilityType.public]: '公开',
  [VisibilityType.role]: '角色可见',
  [VisibilityType.specified]: '指定人员可见',
}

export enum KnowledgeType {
  guide = 'guide',
  faq = 'faq',
  troubleshooting = 'troubleshooting',
  spec = 'spec',
  experience = 'experience',
  template = 'template',
  product = 'product',
  delivery = 'delivery',
}

export const knowledgeTypeMap = {
  [KnowledgeType.guide]: '操作手册',
  [KnowledgeType.faq]: '常见问题',
  [KnowledgeType.troubleshooting]: '排障案例',
  [KnowledgeType.spec]: '制度规范',
  [KnowledgeType.experience]: '项目经验',
  [KnowledgeType.template]: '方案模板',
  [KnowledgeType.product]: '产品说明',
  [KnowledgeType.delivery]: '交付文档',
}
