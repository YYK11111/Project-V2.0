import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { JoinColumn, ManyToOne } from "typeorm";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { User } from "src/modules/users/entities/user.entity";

@MyEntity("busiArticleCatalogManager")
export class ArticleCatalogManager extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "catalogId", comment: "分类ID" })
  catalogId: string;

  @ManyToOne(() => ArticleCatalog, (catalog) => catalog.managers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "catalogId" })
  catalog: ArticleCatalog;

  @BaseColumn({ name: "userId", comment: "用户ID" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
