import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ArticleBorrow,
  knowledgeBorrowStatusMap,
} from "../../articleBorrows/entity";
import {
  BusinessData,
  BusinessDataLoader,
  FieldDefinition,
} from "./business-data-loader.interface";

@Injectable()
export class ArticleBorrowLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(ArticleBorrow)
    private borrowRepo: Repository<ArticleBorrow>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace("articleBorrow_", "");
    const borrow = await this.borrowRepo.findOne({
      where: { id },
      relations: ["article", "article.catalog", "applicant"],
    });

    if (!borrow) {
      throw new Error(`Article borrow not found: ${id}`);
    }

    return {
      id: borrow.id,
      type: "articleBorrow",
      data: {
        id: borrow.id,
        articleId: borrow.articleId,
        catalogId: borrow.catalogId,
        userId: borrow.userId,
        applyReason: borrow.applyReason,
        requestedDays: borrow.requestedDays,
        requestedStartTime: borrow.requestedStartTime,
        status: borrow.status,
        articleTitle: borrow.article?.title || "",
        article: borrow.article
          ? {
              id: borrow.article.id,
              title: borrow.article.title,
            }
          : null,
        catalog: borrow.article?.catalog
          ? {
              id: borrow.article.catalog.id,
              name: borrow.article.catalog.name,
              managerUserIds: borrow.article.catalog.managerUserIds || [],
            }
          : null,
        applicant: borrow.applicant
          ? {
              id: borrow.applicant.id,
              name: borrow.applicant.name,
              nickname: borrow.applicant.nickname,
              deptId: borrow.applicant.deptId,
            }
          : null,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: "id", label: "借阅申请ID", type: "string" },
      { name: "articleTitle", label: "知识标题", type: "string" },
      { name: "applyReason", label: "借阅理由", type: "string" },
      { name: "requestedDays", label: "申请借阅天数", type: "number" },
      { name: "requestedStartTime", label: "申请开始时间", type: "date" },
      {
        name: "status",
        label: "借阅状态",
        type: "enum",
        enumValues: Object.entries(knowledgeBorrowStatusMap).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      { name: "applicant.id", label: "申请人", type: "string" },
      { name: "applicant.deptId", label: "申请人部门", type: "string" },
      { name: "catalog.id", label: "知识分类", type: "string" },
      { name: "catalog.managerUserIds", label: "分类管理员", type: "array" },
    ];
  }
}
