import { IsNotEmpty, MaxLength } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, boolNumColumn } from 'src/common/entity/BaseEntity'
import { BoolNum } from 'src/common/type/base'
import { JoinColumn, OneToMany, Tree, TreeChildren, TreeParent } from 'typeorm'
import { Article } from '../articles/entity'
import { VisibilityType } from '../articles/constants'

// 目录
@Tree('closure-table')
@MyEntity('busiArticleCatalog')
export class ArticleCatalog extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn()
  @IsNotEmpty()
  @MaxLength(30)
  name: string

  @TreeParent({})
  @JoinColumn({
    name: 'parent_id',
    // referencedColumnName: "name",
    // foreignKeyConstraintName: "fk_cat_id"
  })
  parent: ArticleCatalog

  @BaseColumn({
    nullable: true,
    default: null,
    name: 'parent_id',
    comment: '父级id',
    transformer: { from: (value) => value || '0', to: (value: string) => value },
  })
  parentId: string

  @TreeChildren()
  children: ArticleCatalog[]

  @OneToMany((type) => Article, (article) => article.catalog)
  article: Article[]

  @BaseColumn({ type: 'simple-array', nullable: true, name: 'managerUserIds', comment: '分类管理员用户ID列表' })
  managerUserIds: string[]

  @BaseColumn({ type: 'enum', enum: VisibilityType, default: VisibilityType.public, comment: '默认可见范围' })
  defaultVisibilityType: VisibilityType

  @BaseColumn({ type: 'simple-array', nullable: true, name: 'defaultVisibleRoleIds', comment: '默认可见角色ID列表' })
  defaultVisibleRoleIds: string[]

  @BaseColumn({ type: 'simple-array', nullable: true, name: 'defaultVisibleUserIds', comment: '默认可见用户ID列表' })
  defaultVisibleUserIds: string[]

  @BaseColumn({ default: '0', comment: '是否允许借阅：1是 0否' })
  allowBorrow: string

  @BaseColumn({ default: 'catalogManager', comment: '借阅审批方式' })
  borrowApprovalMode: string

  @BaseColumn({ type: 'int', default: 7, comment: '最大借阅天数' })
  maxBorrowDays: number

  @BaseColumn({ default: '1', comment: '是否必须填写借阅理由：1是 0否' })
  needBorrowReason: string
}
