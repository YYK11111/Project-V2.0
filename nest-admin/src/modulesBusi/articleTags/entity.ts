import { IsNotEmpty, MaxLength } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { ManyToMany } from 'typeorm'
import { Article } from '../articles/entity'

@MyEntity('busiArticleTag')
export class ArticleTag extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn()
  @IsNotEmpty()
  @MaxLength(30)
  name: string

  @BaseColumn({ nullable: true, comment: '标签颜色' })
  color: string

  @BaseColumn({ type: 'int', default: 0, comment: '排序' })
  sort: number

  @BaseColumn({ nullable: true, comment: '备注' })
  remark: string

  @ManyToMany(() => Article, (article) => article.tags)
  articles: Article[]
}
