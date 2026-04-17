import { IsNotEmpty, MaxLength } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, boolNumColumn, DbUnique } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm'
import { BoolNum } from 'src/common/type/base'
import { ArticleCatalog } from '../articleCatalogs/entity'
import dayjs from 'dayjs'
import { User } from 'src/modules/users/entities/user.entity'
import { ArticleTag } from '../articleTags/entity'
import { KnowledgeType, VisibilityType, knowledgeTypeMap, visibilityTypeMap } from './constants'

export enum Status {
  draft = '0',
  wait = '1',
  published = '2',
  outdate = '3',
}
export const status = {
  [Status.draft]: '草稿',
  [Status.wait]: '待发布',
  [Status.published]: '已发布',
  [Status.outdate]: '下架',
}

@MyEntity('busiArticle', {
  orderBy: {
    order: 'ASC',
    createTime: 'DESC',
  },
})
export class Article extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @DbUnique
  @BaseColumn()
  @IsNotEmpty()
  @MaxLength(30)
  title: string

  @BaseColumn({})
  desc: string

  @BaseColumn({ nullable: true, comment: '摘要' })
  summary: string

  @ManyToOne((type) => ArticleCatalog, (catalog) => catalog.article)
  @JoinColumn({ name: 'catalog_id' })
  catalog: ArticleCatalog

  @BaseColumn({ nullable: true, name: 'catalogId', comment: '目录id' })
  catalogId: string

  @BaseColumn({})
  thumb: string

  @BaseColumn({})
  content: string

  @BaseColumn({ type: 'longtext', nullable: true, name: 'contentText', comment: '纯文本内容' })
  contentText: string

  @Column({ type: 'json', nullable: true, comment: '内容切片' })
  contentChunks: Array<{
    order: number
    title: string
    text: string
    summary: string
  }>

  @BaseColumn({ type: 'enum', enum: KnowledgeType, default: KnowledgeType.guide, comment: '知识类型' })
  knowledgeType: KnowledgeType

  @BaseColumn({ nullable: true, name: 'keywords', comment: '关键词' })
  keywords: string

  @BaseColumn({ type: 'int', default: 1, comment: '检索权重' })
  retrievalWeight: number

  @BaseColumn({ default: '0', comment: '是否优先用于AI：1是 0否' })
  aiPreferred: string

  @BaseColumn({ default: '0', comment: '是否权威知识：1是 0否' })
  authorityLevel: string

  @BaseColumn({ default: 'pending', comment: '向量化状态' })
  embeddingStatus: string

  @BaseColumn({ type: 'int', default: 1, comment: '向量版本号' })
  embeddingVersion: number

  @BaseColumn({ nullable: true, name: 'authorId', comment: '作者ID' })
  authorId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User

  @BaseColumn({ nullable: true, name: 'maintainerId', comment: '维护人ID' })
  maintainerId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'maintainerId' })
  maintainer: User

  @BaseColumn({ type: 'enum', enum: VisibilityType, default: VisibilityType.public, comment: '可见范围' })
  visibilityType: VisibilityType

  @BaseColumn({ type: 'simple-array', nullable: true, name: 'visibleRoleIds', comment: '可见角色ID列表' })
  visibleRoleIds: string[]

  @BaseColumn({ type: 'simple-array', nullable: true, name: 'visibleUserIds', comment: '可见用户ID列表' })
  visibleUserIds: string[]

  @BaseColumn({ default: 1, comment: '版本号' })
  versionNo: number

  @ManyToMany(() => ArticleTag, (tag) => tag.articles, { cascade: true })
  @JoinTable({
    name: 'busi_article_tag_relation',
    joinColumn: { name: 'articleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: ArticleTag[]

  @BaseColumn({ length: 8, default: '1', comment: '排序' })
  order: string

  @BaseColumn({ type: 'enum', enum: Status, default: Status.published, name: 'status', comment: '文章状态，默认已发布' })
  status: Status

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      to: (value: string) => value,
    },
    nullable: true,
    name: 'publishTime',
    comment: '定时发布时间',
  })
  publishTime: string
}
