import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("busiArticleSearchRecord")
export class ArticleSearchRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ comment: "搜索词" })
  keyword: string;

  @BaseColumn({ type: "int", default: 1, comment: "搜索次数" })
  count: number;

  @BaseColumn({ nullable: true, name: "userId", comment: "最近搜索用户ID" })
  userId: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "lastSearchTime",
    comment: "最近搜索时间",
  })
  lastSearchTime: string;
}
