import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import dayjs from 'dayjs'
import { ResponseListDto, QueryListDto } from 'src/common/dto'
import { ArticleBorrow, KnowledgeBorrowStatus } from './entity'
import { ApplyBorrowDto, ApproveBorrowDto, RejectBorrowDto } from './dto'
import { Article } from '../articles/entity'
import { TasksService } from 'src/common/tasks/tasks.service'
import { UsersService } from 'src/modules/users/users.service'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class ArticleBorrowsService {
  constructor(
    @InjectRepository(ArticleBorrow) private borrowRepo: Repository<ArticleBorrow>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private tasksService: TasksService,
    private usersService: UsersService,
  ) {}

  async hasActiveBorrow(articleId: string, userId: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const row = await this.borrowRepo
      .createQueryBuilder('borrow')
      .where('borrow.articleId = :articleId', { articleId })
      .andWhere('borrow.userId = :userId', { userId })
      .andWhere('borrow.status = :status', { status: KnowledgeBorrowStatus.approved })
      .andWhere('borrow.borrowEndTime >= :now', { now })
      .getOne()
    return !!row
  }

  async apply(dto: ApplyBorrowDto, currentUser: Record<string, any>) {
    const article = await this.articleRepo.findOne({ where: { id: dto.articleId as any }, relations: ['catalog'] })
    if (!article) {
      throw new Error('知识不存在')
    }
    if (article.catalog?.allowBorrow !== '1') {
      throw new ForbiddenException('当前知识不支持借阅')
    }
    const requestedDays = Number(dto.requestedDays || 1)
    if (!requestedDays || requestedDays <= 0) {
      throw new Error('借阅时长不正确')
    }
    if (requestedDays > Number(article.catalog?.maxBorrowDays || 7)) {
      throw new Error(`借阅时长不能超过 ${article.catalog?.maxBorrowDays || 7} 天`)
    }
    if (article.catalog?.needBorrowReason === '1' && !String(dto.applyReason || '').trim()) {
      throw new Error('请填写借阅理由')
    }
    const existing = await this.borrowRepo.findOne({
      where: {
        articleId: dto.articleId as any,
        userId: String(currentUser.id) as any,
        status: KnowledgeBorrowStatus.pending as any,
      },
    })
    if (existing) {
      throw new Error('当前知识已有待审批借阅申请')
    }
    if (await this.hasActiveBorrow(String(dto.articleId), String(currentUser.id))) {
      throw new Error('当前知识已存在有效借阅授权')
    }
    return this.borrowRepo.save(
      new ArticleBorrow({
        articleId: dto.articleId,
        catalogId: article.catalogId,
        userId: String(currentUser.id),
        applyReason: dto.applyReason,
        requestedDays,
        status: KnowledgeBorrowStatus.pending,
        sourceType: 'manualApply',
        createUser: currentUser.name,
        updateUser: currentUser.name,
      }),
    )
  }

  async listMine(query: QueryListDto, currentUser: Record<string, any>): Promise<ResponseListDto<ArticleBorrow>> {
    const qb = this.borrowRepo
      .createQueryBuilder('borrow')
      .leftJoinAndSelect('borrow.article', 'article')
      .leftJoinAndSelect('article.catalog', 'catalog')
      .leftJoinAndSelect('borrow.approver', 'approver')
      .where('borrow.userId = :userId', { userId: String(currentUser.id) })
      .andWhere('borrow.is_delete IS NULL')

    this.applyCommonFilters(qb, query)
    return this.listByQuery(qb, query)
  }

  async listPending(query: QueryListDto, currentUser: Record<string, any>): Promise<ResponseListDto<ArticleBorrow>> {
    const rows = await this.borrowRepo.find({
      where: { status: KnowledgeBorrowStatus.pending as any },
      relations: ['article', 'article.catalog', 'applicant'],
      order: { createTime: 'DESC' as any },
    })
    const canViewAll = this.hasGlobalAccess(currentUser)
    const keyword = String(query.keyword || '').trim()
    const status = String((query as any).status || '').trim()
    const data = rows.filter((item) => {
      const managerUserIds = item.article?.catalog?.managerUserIds || []
      const canApprove = canViewAll || managerUserIds.includes(String(currentUser.id))
      if (!canApprove) return false
      if (status && item.status !== status) return false
      if (keyword) {
        const text = [item.article?.title, item.article?.catalog?.name, item.applicant?.name, item.applicant?.nickname, item.applyReason]
          .filter(Boolean)
          .join(' ')
        if (!text.includes(keyword)) {
          return false
        }
      }
      return true
    })
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const list = data.slice((pageNum - 1) * pageSize, pageNum * pageSize)
    return { total: data.length, data: list, list, rows: list, pageNum, pageSize } as any
  }

  async approve(id: string, dto: ApproveBorrowDto, currentUser: Record<string, any>) {
    const row = await this.borrowRepo.findOne({ where: { id: id as any }, relations: ['article', 'article.catalog'] })
    if (!row) throw new Error('借阅记录不存在')
    this.ensureCanApprove(row, currentUser)
    const approvedDays = Number(dto.approvedDays || row.requestedDays || 1)
    const start = dayjs()
    const end = start.add(approvedDays, 'day')
    row.status = KnowledgeBorrowStatus.approved
    row.approvedBy = String(currentUser.id)
    row.approvedAt = start.format('YYYY-MM-DD HH:mm:ss')
    row.borrowStartTime = start.format('YYYY-MM-DD HH:mm:ss')
    row.borrowEndTime = end.format('YYYY-MM-DD HH:mm:ss')
    row.updateUser = currentUser.name
    row.rejectReason = dto.remark || ''
    const saved = await this.borrowRepo.save(row)
    this.scheduleExpire(saved.id, saved.borrowEndTime)
    return saved
  }

  async reject(id: string, dto: RejectBorrowDto, currentUser: Record<string, any>) {
    const row = await this.borrowRepo.findOne({ where: { id: id as any }, relations: ['article', 'article.catalog'] })
    if (!row) throw new Error('借阅记录不存在')
    this.ensureCanApprove(row, currentUser)
    row.status = KnowledgeBorrowStatus.rejected
    row.approvedBy = String(currentUser.id)
    row.approvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    row.rejectReason = dto.reason || ''
    row.updateUser = currentUser.name
    return this.borrowRepo.save(row)
  }

  async revoke(id: string, currentUser: Record<string, any>) {
    const row = await this.borrowRepo.findOne({ where: { id: id as any }, relations: ['article', 'article.catalog'] })
    if (!row) throw new Error('借阅记录不存在')
    this.ensureCanApprove(row, currentUser)
    row.status = KnowledgeBorrowStatus.revoked
    row.updateUser = currentUser.name
    this.tasksService.deleteTimeout(this.getExpireTaskName(row.id))
    return this.borrowRepo.save(row)
  }

  private hasGlobalAccess(currentUser?: Record<string, any>) {
    const permissions = currentUser?.permissions || []
    return permissions.includes('*') || permissions.includes('content/articles/viewAll')
  }

  private ensureCanApprove(row: ArticleBorrow, currentUser: Record<string, any>) {
    const managerUserIds = row.article?.catalog?.managerUserIds || []
    if (!this.hasGlobalAccess(currentUser) && !managerUserIds.includes(String(currentUser.id))) {
      throw new ForbiddenException('当前无审批权限')
    }
  }

  private scheduleExpire(id: string, borrowEndTime: string) {
    this.tasksService.deleteTimeout(this.getExpireTaskName(id))
    this.tasksService.addTimeout(this.getExpireTaskName(id), borrowEndTime, async () => {
      const row = await this.borrowRepo.findOne({ where: { id: id as any } })
      if (!row || row.status !== KnowledgeBorrowStatus.approved) return
      row.status = KnowledgeBorrowStatus.expired
      await this.borrowRepo.save(row)
    })
  }

  private getExpireTaskName(id: string | number) {
    return `articleBorrow:${id}`
  }

  @Cron('0 */5 * * * *')
  async syncExpiredBorrows() {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const rows = await this.borrowRepo
      .createQueryBuilder('borrow')
      .where('borrow.status = :status', { status: KnowledgeBorrowStatus.approved })
      .andWhere('borrow.borrowEndTime IS NOT NULL')
      .andWhere('borrow.borrowEndTime < :now', { now })
      .getMany()

    for (const row of rows) {
      row.status = KnowledgeBorrowStatus.expired
      await this.borrowRepo.save(row)
    }
  }

  private applyCommonFilters(qb, query: QueryListDto) {
    const keyword = String(query.keyword || '').trim()
    const status = String((query as any).status || '').trim()
    if (status) {
      qb.andWhere('borrow.status = :status', { status })
    }
    if (keyword) {
      qb.andWhere('(article.title LIKE :keyword OR catalog.name LIKE :keyword OR borrow.applyReason LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
    }
  }

  private async listByQuery(qb, query: QueryListDto): Promise<ResponseListDto<ArticleBorrow>> {
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount()
    return { total, data: list, list, rows: list, pageNum, pageSize } as any
  }
}
