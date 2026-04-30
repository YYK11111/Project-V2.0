import { Column } from "typeorm";
import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

export enum ArticleChunkEmbeddingStatus {
  pending = "pending",
  ready = "ready",
  failed = "failed",
}

@MyEntity("busiArticleChunkEmbedding")
export class ArticleChunkEmbedding extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "articleId", comment: "知识ID" })
  articleId: string;

  @BaseColumn({ name: "chunkId", comment: "切片ID" })
  chunkId: string;

  @BaseColumn({ type: "int", name: "chunkOrder", comment: "切片序号" })
  chunkOrder: number;

  @BaseColumn({ name: "chunkTitle", comment: "切片标题" })
  chunkTitle: string;

  @Column({ type: "json", nullable: true, comment: "标题路径" })
  headingPath: string[];

  @BaseColumn({ type: "longtext", name: "chunkText", comment: "切片正文" })
  chunkText: string;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "tokenEstimate",
    comment: "长度估算",
  })
  tokenEstimate: number;

  @BaseColumn({
    default: "mock",
    name: "embeddingProvider",
    comment: "向量服务提供方",
  })
  embeddingProvider: string;

  @BaseColumn({
    default: "mock-hash-16",
    name: "embeddingModel",
    comment: "向量模型",
  })
  embeddingModel: string;

  @Column({ type: "json", nullable: true, comment: "mock 向量" })
  embeddingVector: number[];

  @BaseColumn({
    type: "int",
    default: 1,
    name: "embeddingVersion",
    comment: "向量版本",
  })
  embeddingVersion: number;

  @BaseColumn({
    default: ArticleChunkEmbeddingStatus.pending,
    comment: "向量状态",
  })
  status: ArticleChunkEmbeddingStatus;

  @BaseColumn({
    type: "longtext",
    nullable: true,
    name: "errorMessage",
    comment: "失败原因",
  })
  errorMessage: string;
}
