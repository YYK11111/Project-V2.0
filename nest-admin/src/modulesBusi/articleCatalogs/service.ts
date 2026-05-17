import { Injectable } from "@nestjs/common";
import { ArticleCatalogDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FindManyOptions,
  In,
  Like,
  Repository,
  TreeRepository,
  UpdateResult,
} from "typeorm";
import { ArticleCatalog } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { Article } from "../articles/entity";
import { ArticleCatalogManager } from "../articleCatalogManagers/entity";

@Injectable()
export class ArticleCatalogsService extends BaseService<
  ArticleCatalog,
  ArticleCatalogDto
> {
  constructor(
    @InjectRepository(ArticleCatalog)
    repository: TreeRepository<ArticleCatalog>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(ArticleCatalogManager)
    private catalogManagerRepository: Repository<ArticleCatalogManager>,
  ) {
    super(ArticleCatalog, repository);
  }

  async save(data) {
    this.validateCatalogGovernance(data);
    if (data.parentId && data.parentId != "0") {
      data.parent = Object.assign(new ArticleCatalog(), { id: data.parentId });
    } else {
      data.parentId = null;
    }
    const saved = await super.save(data);
    await this.syncCatalogManagers(
      saved.id,
      this.normalizeIdList(data.managerUserIds),
    );
    return saved;
  }

  async list(query: QueryListDto): Promise<ResponseListDto<ArticleCatalog>> {
    let { title, isActive } = query;
    let queryOrm: FindManyOptions = {
      where: [{ isActive, title: this.sqlLike(title) }],
    };
    return this.listBy(queryOrm, query);
  }

  async getTrees(query): Promise<ArticleCatalog | ArticleCatalog[]> {
    return await (query?.id
      ? query?.id == 0
        ? this.repository.findRoots() // 获取所有根节点
        : (
            await this.repository.findDescendantsTree(
              new ArticleCatalog(query),
              { depth: 2 },
            )
          ).children // 获取指定id节点的子节点
      : this.repository.findTrees()); // 获取所有节点树
  }

  async getChildren(query): Promise<ArticleCatalog[]> {
    return this.repository.findDescendants(new ArticleCatalog(query));
  }

  async del(
    ids: string[] | string,
    updateUser?: string,
    permissions: string[] = [],
    operatorName?: string,
    operatorId?: string,
  ): Promise<UpdateResult> {
    const idList = Array.isArray(ids)
      ? ids.map((item) => String(item)).filter(Boolean)
      : String(ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    for (const id of idList) {
      const descendants = await this.repository.findDescendants(
        new ArticleCatalog({ id }),
      );
      const childCatalogs = (descendants || []).filter(
        (item) => String(item.id) !== String(id),
      );
      if (childCatalogs.length) {
        throw new Error("当前分类存在子分类，不能删除");
      }
    }

    const articleCount = await this.articleRepository.count({
      where: {
        catalogId: In(idList) as any,
        isDelete: null as any,
      } as any,
    });
    if (articleCount > 0) {
      throw new Error("当前分类下存在知识，不能删除");
    }

    return super.del(idList, updateUser, permissions, operatorName, operatorId);
  }

  private validateCatalogGovernance(data: Record<string, any>) {
    const defaultVisibilityType = String(
      data.defaultVisibilityType || "public",
    );
    if (
      defaultVisibilityType === "role" &&
      !this.normalizeIdList(data.defaultVisibleRoleIds).length
    ) {
      throw new Error("角色可见分类必须配置默认可见角色");
    }
    if (
      defaultVisibilityType === "specified" &&
      !this.normalizeIdList(data.defaultVisibleUserIds).length
    ) {
      throw new Error("指定人员可见分类必须配置默认可见人员");
    }

    if (String(data.allowBorrow || "0") !== "1") return;
    if (Number(data.maxBorrowDays || 0) <= 0) {
      throw new Error("允许借阅时最大借阅天数必须大于 0");
    }
    const approvalModes = new Set(["catalogManager"]);
    if (
      data.borrowApprovalMode &&
      !approvalModes.has(String(data.borrowApprovalMode))
    ) {
      throw new Error("借阅审批方式不正确");
    }
  }

  private normalizeIdList(value: string[] | string) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async syncCatalogManagers(
    catalogId: string,
    managerUserIds: string[] = [],
  ) {
    await this.catalogManagerRepository.delete({ catalogId } as any);
    if (!managerUserIds.length) return;
    await this.catalogManagerRepository.save(
      managerUserIds.map(
        (userId) =>
          new ArticleCatalogManager({
            catalogId,
            userId,
          }),
      ),
    );
  }
}
