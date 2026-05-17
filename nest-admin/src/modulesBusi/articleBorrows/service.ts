import { ForbiddenException, Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import dayjs from "dayjs";
import { ResponseListDto, QueryListDto } from "src/common/dto";
import { ArticleBorrow, KnowledgeBorrowStatus } from "./entity";
import { ApplyBorrowDto, ApproveBorrowDto, RejectBorrowDto } from "./dto";
import { Article } from "../articles/entity";
import { TasksService } from "src/common/tasks/tasks.service";
import { UsersService } from "src/modules/users/users.service";
import { Cron } from "@nestjs/schedule";
import { SystemScheduledJobsService } from "src/modules/systemScheduledJobs/service";
import { WorkflowService } from "../workflow/service";
import { BusinessApprovalContextService } from "../approval-contexts/service";

@Injectable()
export class ArticleBorrowsService {
  constructor(
    @InjectRepository(ArticleBorrow)
    private borrowRepo: Repository<ArticleBorrow>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private tasksService: TasksService,
    private usersService: UsersService,
    private readonly systemScheduledJobsService: SystemScheduledJobsService,
    @Optional()
    private readonly workflowService?: WorkflowService,
    @Optional()
    private readonly businessApprovalContextService?: BusinessApprovalContextService,
  ) {}

  async hasActiveBorrow(articleId: string, userId: string) {
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const row = await this.borrowRepo
      .createQueryBuilder("borrow")
      .where("borrow.articleId = :articleId", { articleId })
      .andWhere("borrow.userId = :userId", { userId })
      .andWhere("borrow.status = :status", {
        status: KnowledgeBorrowStatus.active,
      })
      .andWhere(
        "(borrow.borrowStartTime IS NULL OR borrow.borrowStartTime <= :now)",
        { now },
      )
      .andWhere("borrow.borrowEndTime >= :now", { now })
      .getOne();
    return !!row;
  }

  async apply(dto: ApplyBorrowDto, currentUser: Record<string, any>) {
    const article = await this.articleRepo.findOne({
      where: { id: dto.articleId as any },
      relations: ["catalog"],
    });
    if (!article) {
      throw new Error("知识不存在");
    }
    if (article.catalog?.allowBorrow !== "1") {
      throw new ForbiddenException("当前知识不支持借阅");
    }
    const requestedDays = Number(dto.requestedDays || 1);
    if (!requestedDays || requestedDays <= 0) {
      throw new Error("借阅时长不正确");
    }
    if (requestedDays > Number(article.catalog?.maxBorrowDays || 7)) {
      throw new Error(
        `借阅时长不能超过 ${article.catalog?.maxBorrowDays || 7} 天`,
      );
    }
    if (
      article.catalog?.needBorrowReason === "1" &&
      !String(dto.applyReason || "").trim()
    ) {
      throw new Error("请填写借阅理由");
    }
    const existing = await this.borrowRepo.findOne({
      where: {
        articleId: dto.articleId as any,
        userId: String(currentUser.id) as any,
        status: In([
          KnowledgeBorrowStatus.pending,
          KnowledgeBorrowStatus.waitingStart,
        ]) as any,
      },
    });
    if (existing) {
      throw new Error("当前知识已有待审批或待生效借阅申请");
    }
    if (
      await this.hasActiveBorrow(String(dto.articleId), String(currentUser.id))
    ) {
      throw new Error("当前知识已存在有效借阅授权");
    }
    const borrow = await this.borrowRepo.save(
      new ArticleBorrow({
        articleId: dto.articleId,
        catalogId: article.catalogId,
        userId: String(currentUser.id),
        applyReason: dto.applyReason,
        requestedDays,
        requestedStartTime: dto.requestedStartTime || "",
        status: KnowledgeBorrowStatus.pending,
        approvalStatus: "0",
        currentNodeName: "待提交审批",
        sourceType: "workflowApply",
        createUser: currentUser.name,
        updateUser: currentUser.name,
      }),
    );
    return this.startBorrowWorkflow(borrow, currentUser);
  }

  async listMine(
    query: QueryListDto,
    currentUser: Record<string, any>,
  ): Promise<ResponseListDto<ArticleBorrow>> {
    const qb = this.borrowRepo
      .createQueryBuilder("borrow")
      .leftJoinAndSelect("borrow.article", "article")
      .leftJoinAndSelect("article.catalog", "catalog")
      .leftJoinAndSelect("borrow.approver", "approver")
      .where("borrow.userId = :userId", { userId: String(currentUser.id) })
      .andWhere("borrow.is_delete IS NULL");

    this.applyCommonFilters(qb, query);
    return this.listByQuery(qb, query);
  }

  async listPending(
    query: QueryListDto,
    currentUser: Record<string, any>,
  ): Promise<ResponseListDto<ArticleBorrow>> {
    const qb = this.borrowRepo
      .createQueryBuilder("borrow")
      .leftJoinAndSelect("borrow.article", "article")
      .leftJoinAndSelect("article.catalog", "catalog")
      .leftJoinAndSelect("catalog.managers", "catalogManager")
      .leftJoinAndSelect("borrow.applicant", "applicant")
      .where("borrow.is_delete IS NULL");
    const canViewAll = this.hasGlobalAccess(currentUser);
    const keyword = String(query.keyword || "").trim();
    const status = String((query as any).status || "").trim();

    if (!canViewAll) {
      qb.andWhere("catalogManager.userId = :managerUserId", {
        managerUserId: String(currentUser.id),
      });
    }
    if (status) {
      qb.andWhere("borrow.status = :status", { status });
    }
    if (keyword) {
      qb.andWhere(
        "(article.title LIKE :keyword OR catalog.name LIKE :keyword OR applicant.name LIKE :keyword OR applicant.nickname LIKE :keyword OR borrow.applyReason LIKE :keyword)",
        { keyword: `%${keyword}%` },
      );
    }

    qb.distinct(true);
    qb.orderBy("borrow.createTime", "DESC");
    return this.listByQuery(qb, query);
  }

  async approve(
    id: string,
    dto: ApproveBorrowDto,
    currentUser: Record<string, any>,
  ) {
    const row = await this.borrowRepo.findOne({
      where: { id: id as any },
      relations: ["article", "article.catalog", "article.catalog.managers"],
    });
    if (!row) throw new Error("借阅记录不存在");
    this.ensureCanApprove(row, currentUser);
    const saved = await this.applyApprovalResult(
      row,
      Number(dto.approvedDays || row.requestedDays || 1),
      currentUser,
      dto.remark || "",
    );
    return saved;
  }

  private async applyApprovalResult(
    row: ArticleBorrow,
    approvedDays: number,
    currentUser: Record<string, any>,
    remark = "",
  ) {
    const now = dayjs();
    const requestedStart = row.requestedStartTime
      ? dayjs(row.requestedStartTime)
      : null;
    const shouldWait = requestedStart?.isValid() && requestedStart.isAfter(now);
    const start = shouldWait ? requestedStart : now;
    const end = start.add(
      approvedDays || Number(row.requestedDays || 1),
      "day",
    );
    row.status = shouldWait
      ? KnowledgeBorrowStatus.waitingStart
      : KnowledgeBorrowStatus.active;
    row.approvedBy = String(currentUser.id);
    row.approvedAt = now.format("YYYY-MM-DD HH:mm:ss");
    row.borrowStartTime = start.format("YYYY-MM-DD HH:mm:ss");
    row.borrowEndTime = end.format("YYYY-MM-DD HH:mm:ss");
    row.approvalStatus = "2";
    row.currentNodeName = shouldWait
      ? "借阅审批已通过，等待开始借阅"
      : "借阅审批已通过，已开始借阅";
    row.updateUser = currentUser.name;
    row.rejectReason = remark;
    const saved = await this.borrowRepo.save(row);
    if (shouldWait) {
      this.scheduleStart(saved.id, saved.borrowStartTime, saved.borrowEndTime);
    } else {
      this.scheduleExpire(saved.id, saved.borrowEndTime);
    }
    return saved;
  }

  async reject(
    id: string,
    dto: RejectBorrowDto,
    currentUser: Record<string, any>,
  ) {
    const row = await this.borrowRepo.findOne({
      where: { id: id as any },
      relations: ["article", "article.catalog", "article.catalog.managers"],
    });
    if (!row) throw new Error("借阅记录不存在");
    this.ensureCanApprove(row, currentUser);
    row.status = KnowledgeBorrowStatus.rejected;
    row.approvedBy = String(currentUser.id);
    row.approvedAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
    row.approvalStatus = "3";
    row.currentNodeName = "借阅审批已驳回";
    row.rejectReason = dto.reason || "";
    row.updateUser = currentUser.name;
    return this.borrowRepo.save(row);
  }

  async revoke(id: string, currentUser: Record<string, any>) {
    const row = await this.borrowRepo.findOne({
      where: { id: id as any },
      relations: ["article", "article.catalog", "article.catalog.managers"],
    });
    if (!row) throw new Error("借阅记录不存在");
    this.ensureCanApprove(row, currentUser);
    row.status = KnowledgeBorrowStatus.revoked;
    row.updateUser = currentUser.name;
    this.tasksService.deleteTimeout(this.getExpireTaskName(row.id));
    this.tasksService.deleteTimeout(this.getStartTaskName(row.id));
    return this.borrowRepo.save(row);
  }

  private async startBorrowWorkflow(
    row: ArticleBorrow,
    currentUser: Record<string, any>,
  ) {
    if (!this.workflowService) return row;
    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "articleBorrow",
        businessScene: "approval",
        businessKey: `articleBorrow_${row.id}`,
        variables: {
          starterId: String(currentUser.id),
          businessType: "articleBorrow",
          workflowScene: "articleBorrowApproval",
          articleId: row.articleId,
          catalogId: row.catalogId,
        },
      },
      String(currentUser.id),
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "articleBorrow",
      businessId: row.id,
      businessScene: "approval",
      sceneTitle: "知识借阅审批",
      workflowInstance: instance,
      starterId: String(currentUser.id),
      starterName: currentUser.name || "",
      rootBusinessType: "articleBorrow",
      rootBusinessId: row.id,
    });
    await this.businessApprovalContextService?.syncParticipantsFromWorkflow(
      instance.id,
    );

    row.workflowInstanceId = instance.id;
    row.approvalStatus = "1";
    row.currentNodeName = "借阅审批中";
    row.updateUser = currentUser.name;
    return this.borrowRepo.save(row);
  }

  private hasGlobalAccess(currentUser?: Record<string, any>) {
    const permissions = currentUser?.permissions || [];
    return (
      permissions.includes("*") ||
      permissions.includes("content/articles/viewAll")
    );
  }

  private ensureCanApprove(
    row: ArticleBorrow,
    currentUser: Record<string, any>,
  ) {
    const managerUserIds = this.getCatalogManagerUserIds(row.article?.catalog);
    if (
      !this.hasGlobalAccess(currentUser) &&
      !managerUserIds.includes(String(currentUser.id))
    ) {
      throw new ForbiddenException("当前无审批权限");
    }
  }

  private getCatalogManagerUserIds(catalog?: Record<string, any>) {
    return [
      ...new Set([
        ...((catalog?.managers || []) as Array<{ userId?: string }>).map(
          (item) => String(item.userId || ""),
        ),
      ]),
    ];
  }

  private scheduleExpire(id: string, borrowEndTime: string) {
    this.tasksService.deleteTimeout(this.getExpireTaskName(id));
    this.tasksService.addTimeout(
      this.getExpireTaskName(id),
      borrowEndTime,
      async () => {
        const row = await this.borrowRepo.findOne({ where: { id: id as any } });
        if (!row || row.status !== KnowledgeBorrowStatus.active) return;
        row.status = KnowledgeBorrowStatus.expired;
        await this.borrowRepo.save(row);
      },
    );
  }

  private scheduleStart(
    id: string,
    borrowStartTime: string,
    borrowEndTime: string,
  ) {
    this.tasksService.deleteTimeout(this.getStartTaskName(id));
    this.tasksService.addTimeout(
      this.getStartTaskName(id),
      borrowStartTime,
      async () => {
        const row = await this.borrowRepo.findOne({ where: { id: id as any } });
        if (!row || row.status !== KnowledgeBorrowStatus.waitingStart) return;
        row.status = KnowledgeBorrowStatus.active;
        row.currentNodeName = "已开始借阅";
        await this.borrowRepo.save(row);
        this.scheduleExpire(row.id, row.borrowEndTime || borrowEndTime);
      },
    );
  }

  private getExpireTaskName(id: string | number) {
    return `articleBorrow:${id}`;
  }

  private getStartTaskName(id: string | number) {
    return `articleBorrowStart:${id}`;
  }

  @Cron("0 */5 * * * *")
  async syncExpiredBorrows() {
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "articleBorrows.syncExpired",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "articleBorrows.syncExpired",
      "scheduled",
      async () => {
        const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
        const waitingRows = await this.borrowRepo
          .createQueryBuilder("borrow")
          .where("borrow.status = :status", {
            status: KnowledgeBorrowStatus.waitingStart,
          })
          .andWhere("borrow.borrowStartTime IS NOT NULL")
          .andWhere("borrow.borrowStartTime <= :now", { now })
          .getMany();

        for (const row of waitingRows) {
          row.status = KnowledgeBorrowStatus.active;
          row.currentNodeName = "已开始借阅";
          await this.borrowRepo.save(row);
          if (row.borrowEndTime) {
            this.scheduleExpire(row.id, row.borrowEndTime);
          }
        }

        const rows = await this.borrowRepo
          .createQueryBuilder("borrow")
          .where("borrow.status = :status", {
            status: KnowledgeBorrowStatus.active,
          })
          .andWhere("borrow.borrowEndTime IS NOT NULL")
          .andWhere("borrow.borrowEndTime < :now", { now })
          .getMany();

        for (const row of rows) {
          row.status = KnowledgeBorrowStatus.expired;
          await this.borrowRepo.save(row);
        }

        return {
          summary: `生效 ${waitingRows.length} 条，过期 ${rows.length} 条借阅记录`,
          processedCount: waitingRows.length + rows.length,
          successCount: waitingRows.length + rows.length,
        };
      },
    );
  }

  private applyCommonFilters(qb, query: QueryListDto) {
    const keyword = String(query.keyword || "").trim();
    const status = String((query as any).status || "").trim();
    if (status) {
      qb.andWhere("borrow.status = :status", { status });
    }
    if (keyword) {
      qb.andWhere(
        "(article.title LIKE :keyword OR catalog.name LIKE :keyword OR borrow.applyReason LIKE :keyword)",
        {
          keyword: `%${keyword}%`,
        },
      );
    }
  }

  private async listByQuery(
    qb,
    query: QueryListDto,
  ): Promise<ResponseListDto<ArticleBorrow>> {
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [list, total] = await qb
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { total, data: list, list, rows: list, pageNum, pageSize } as any;
  }
}
