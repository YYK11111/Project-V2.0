import { Injectable } from '@nestjs/common'
import { ArticleDto } from './dto'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Article, Status, status } from './entity'
import { VisibilityType } from './constants'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ArticleCatalogsService } from '../articleCatalogs/service'
import { TasksService } from 'src/common/tasks/tasks.service'
import { ArticleTagsService } from '../articleTags/service'
import { ArticleTag } from '../articleTags/entity'
import { UsersService } from 'src/modules/users/users.service'

@Injectable()
export class ArticlesService extends BaseService<Article, ArticleDto> {
  constructor(
    @InjectRepository(Article) repository: Repository<Article>,
    private articleCatalogsService: ArticleCatalogsService,
    private articleTagsService: ArticleTagsService,
    private usersService: UsersService,
    private tasksService: TasksService,
  ) {
    super(Article, repository)
  }

  async save(dto) {
    dto.summary = dto.summary || dto.desc || ''
    dto.desc = dto.summary || dto.desc || ''
    dto.contentText = this.extractPlainTextFromHtml(dto.content)
    dto.contentChunks = this.buildContentChunks(dto.contentText)
    const operatorId = dto._operatorId ? String(dto._operatorId) : ''
    if (!dto.authorId && operatorId) {
      dto.authorId = operatorId
    }
    if (operatorId) {
      dto.maintainerId = operatorId
    }
    dto.versionNo = dto.id ? Number(dto.versionNo || 1) + 1 : Number(dto.versionNo || 1)
    dto.embeddingStatus = 'pending'
    dto.embeddingVersion = Number(dto.embeddingVersion || 1)
    dto.retrievalWeight = Number(dto.retrievalWeight || 1)
    dto.aiPreferred = dto.aiPreferred || '0'
    dto.authorityLevel = dto.authorityLevel || '0'
    dto.visibleRoleIds = Array.isArray(dto.visibleRoleIds) ? dto.visibleRoleIds : this.normalizeIdList(dto.visibleRoleIds)
    dto.visibleUserIds = Array.isArray(dto.visibleUserIds) ? dto.visibleUserIds : this.normalizeIdList(dto.visibleUserIds)

    if (dto.catalogId) {
      const catalog = await this.articleCatalogsService.getOne({ id: dto.catalogId }, false)
      if (catalog) {
        dto.visibilityType = dto.visibilityType || catalog.defaultVisibilityType || VisibilityType.public
        if (!dto.visibleRoleIds?.length) {
          dto.visibleRoleIds = this.normalizeIdList(catalog.defaultVisibleRoleIds)
        }
        if (!dto.visibleUserIds?.length) {
          dto.visibleUserIds = this.normalizeIdList(catalog.defaultVisibleUserIds)
        }
      }
    }

    const tagIds = this.normalizeIdList(dto.tagIds)
    const tags = tagIds.length ? await this.articleTagsService.repository.findBy({ id: In(tagIds) as any }) : []
    dto.tags = tags as ArticleTag[]
    delete dto.tagIds

    if (dto.publishTime) {
      dto.status = Status.wait
    }

    dto.id && this.tasksService.deleteTimeout('Timeout:articles:' + dto.id)

    let res = await super.save(dto)

    if (dto.status !== Status.draft && dto.publishTime) {
      let task = (id) => {
        this.update({ id, status: Status.published })
      }
      this.tasksService.addTimeout('Timeout:articles:' + res.id, res.publishTime, task.bind(this, res.id))
    }

    return res
  }

  async list(query: QueryListDto, currentUser?: Record<string, any>): Promise<ResponseListDto<Article>> {
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const keyword = String(query.keyword || query.title || '').trim()
    const { status, catalogId, knowledgeType, visibilityType, authorId, tagIds, sortBy } = query as any
    const catalogIds = catalogId ? (await this.articleCatalogsService.getChildren({ id: catalogId }))?.map((item) => item.id) : []

    const qb = this.repository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.catalog', 'catalog')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.maintainer', 'maintainer')
      .leftJoinAndSelect('article.tags', 'tag')
      .where('article.is_delete IS NULL')

    if (status !== undefined && status !== '') {
      qb.andWhere('article.status = :status', { status })
    }
    if (catalogIds?.length) {
      qb.andWhere('article.catalogId IN (:...catalogIds)', { catalogIds })
    }
    if (knowledgeType) {
      qb.andWhere('article.knowledgeType = :knowledgeType', { knowledgeType })
    }
    if (visibilityType) {
      qb.andWhere('article.visibilityType = :visibilityType', { visibilityType })
    }
    if (authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId })
    }
    if (keyword) {
      qb.andWhere('(article.title LIKE :keyword OR article.summary LIKE :keyword OR article.contentText LIKE :keyword OR article.keywords LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
    }
    if (tagIds) {
      const ids = String(tagIds)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (ids.length) {
        qb.andWhere('tag.id IN (:...tagIds)', { tagIds: ids })
      }
    }

    const sortMap = {
      latest: () => qb.orderBy('article.updateTime', 'DESC').addOrderBy('article.createTime', 'DESC'),
      weight: () => qb.orderBy('article.retrievalWeight', 'DESC').addOrderBy('article.updateTime', 'DESC'),
      authority: () => qb.orderBy('article.authorityLevel', 'DESC').addOrderBy('article.retrievalWeight', 'DESC').addOrderBy('article.updateTime', 'DESC'),
      aiPreferred: () => qb.orderBy('article.aiPreferred', 'DESC').addOrderBy('article.retrievalWeight', 'DESC').addOrderBy('article.updateTime', 'DESC'),
    }
    ;(sortMap[sortBy] || sortMap.latest)()

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount()
    const currentUserId = currentUser?.id ? String(currentUser.id) : ''
    const roleIds = currentUserId ? await this.getCurrentUserRoleIds(currentUserId) : []
    const canViewAll = this.hasGlobalAccess(currentUser)
    const data = list.map((article) => this.maskArticleForCurrentUser(article, currentUserId, roleIds, canViewAll))

    return {
      list: data,
      rows: data,
      data,
      total,
      pageNum,
      pageSize,
    } as ResponseListDto<Article>
  }

  async getOneForAccess(id: string, currentUser?: Record<string, any>) {
    const article = await this.getOne({ where: { id }, relations: ['catalog', 'author', 'maintainer', 'tags'] })
    const currentUserId = currentUser?.id ? String(currentUser.id) : ''
    const roleIds = currentUserId ? await this.getCurrentUserRoleIds(currentUserId) : []
    const access = this.checkArticleAccess(article, currentUserId, roleIds, this.hasGlobalAccess(currentUser))
    if (!access.hasAccess) {
      const error: any = new Error('当前知识无访问权限')
      error.status = 403
      error.code = 'KNOWLEDGE_FORBIDDEN'
      error.canBorrow = access.canBorrow
      error.catalogId = article.catalogId
      error.articleId = article.id
      throw error
    }
    return this.maskArticleForCurrentUser(article, currentUserId, roleIds, this.hasGlobalAccess(currentUser))
  }

  async retrieveForAi(query: { keyword?: string; knowledgeType?: string; catalogId?: string; limit?: number }, currentUser?: Record<string, any>) {
    const keyword = String(query.keyword || '').trim()
    const limit = Math.min(Number(query.limit || 10), 20)
    const currentUserId = currentUser?.id ? String(currentUser.id) : ''
    const roleIds = currentUserId ? await this.getCurrentUserRoleIds(currentUserId) : []
    const canViewAll = this.hasGlobalAccess(currentUser)

    const qb = this.repository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.catalog', 'catalog')
      .leftJoinAndSelect('article.tags', 'tag')
      .where('article.is_delete IS NULL')
      .andWhere('article.status = :status', { status: Status.published })

    if (query.knowledgeType) {
      qb.andWhere('article.knowledgeType = :knowledgeType', { knowledgeType: query.knowledgeType })
    }
    if (query.catalogId) {
      qb.andWhere('article.catalogId = :catalogId', { catalogId: query.catalogId })
    }
    if (keyword) {
      qb.andWhere('(article.title LIKE :keyword OR article.summary LIKE :keyword OR article.contentText LIKE :keyword OR article.keywords LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
    }

    const list = await qb.orderBy('article.retrievalWeight', 'DESC').addOrderBy('article.updateTime', 'DESC').take(limit * 3).getMany()
    const data = list
      .map((article) => this.maskArticleForCurrentUser(article, currentUserId, roleIds, canViewAll))
      .filter((article: any) => article.hasAccess)
      .flatMap((article: any) => this.buildAiRetrieveItems(article, keyword))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }
        if (Number(right.aiPreferred || 0) !== Number(left.aiPreferred || 0)) {
          return Number(right.aiPreferred || 0) - Number(left.aiPreferred || 0)
        }
        if (Number(right.authorityLevel || 0) !== Number(left.authorityLevel || 0)) {
          return Number(right.authorityLevel || 0) - Number(left.authorityLevel || 0)
        }
        return Number(right.retrievalWeight || 0) - Number(left.retrievalWeight || 0)
      })
      .slice(0, limit)

    return {
      total: data.length,
      data,
    }
  }

  private extractPlainTextFromHtml(content = '') {
    return String(content || '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private buildContentChunks(contentText = '') {
    const paragraphs = String(contentText || '')
      .split(/(?<=[。！？\.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean)

    return paragraphs.slice(0, 50).map((text, index) => ({
      order: index + 1,
      title: `片段 ${index + 1}`,
      text,
      summary: text.slice(0, 120),
    }))
  }

  private buildAiRetrieveItems(article: any, keyword: string) {
    const chunks = Array.isArray(article.contentChunks) ? article.contentChunks : []
    if (!chunks.length) {
      return [
        {
          articleId: article.id,
          articleTitle: article.title,
          articleSummary: article.summary || article.desc || '',
          catalog: article.catalog ? { id: article.catalog.id, name: article.catalog.name } : null,
          knowledgeType: article.knowledgeType,
          tags: (article.tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
          chunkOrder: 0,
          chunkTitle: '全文',
          chunkText: article.contentText || '',
          chunkSummary: (article.contentText || '').slice(0, 120),
          score: this.calculateChunkScore(article.title + ' ' + (article.summary || '') + ' ' + (article.contentText || ''), keyword),
          retrievalWeight: article.retrievalWeight,
          embeddingStatus: article.embeddingStatus,
          embeddingVersion: article.embeddingVersion,
          visibilityType: article.visibilityType,
          updateTime: article.updateTime,
        },
      ]
    }

    return chunks.map((chunk) => ({
      articleId: article.id,
      articleTitle: article.title,
      articleSummary: article.summary || article.desc || '',
      catalog: article.catalog ? { id: article.catalog.id, name: article.catalog.name } : null,
      knowledgeType: article.knowledgeType,
      tags: (article.tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
      chunkOrder: chunk.order,
      chunkTitle: chunk.title,
      chunkText: chunk.text,
      chunkSummary: chunk.summary,
      score: this.calculateChunkScore(`${article.title} ${article.summary || ''} ${chunk.title || ''} ${chunk.text || ''}`, keyword),
      retrievalWeight: article.retrievalWeight,
      aiPreferred: article.aiPreferred,
      authorityLevel: article.authorityLevel,
      embeddingStatus: article.embeddingStatus,
      embeddingVersion: article.embeddingVersion,
      visibilityType: article.visibilityType,
      updateTime: article.updateTime,
    }))
  }

  async rebuildChunks(id: string, currentUser?: Record<string, any>) {
    const article = await this.getOne({ where: { id }, relations: ['catalog', 'author', 'maintainer', 'tags'] })
    const currentUserId = currentUser?.id ? String(currentUser.id) : ''
    const roleIds = currentUserId ? await this.getCurrentUserRoleIds(currentUserId) : []
    const access = this.checkArticleAccess(article, currentUserId, roleIds, this.hasGlobalAccess(currentUser))
    if (!access.hasAccess) {
      throw new Error('当前无重建切片权限')
    }
    article.contentText = this.extractPlainTextFromHtml(article.content)
    article.contentChunks = this.buildContentChunks(article.contentText)
    article.embeddingStatus = 'pending'
    article.embeddingVersion = Number(article.embeddingVersion || 1) + 1
    article.updateUser = currentUser?.name || article.updateUser
    return this.repository.save(article)
  }

  private calculateChunkScore(text: string, keyword: string) {
    if (!keyword) {
      return 1
    }
    const normalizedText = String(text || '').toLowerCase()
    const terms = keyword
      .toLowerCase()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
    return terms.reduce((score, term) => (normalizedText.includes(term) ? score + 1 : score), 0)
  }

  private normalizeIdList(value: string[] | string) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean)
    }
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  private async getCurrentUserRoleIds(userId: string) {
    const user = await this.usersService.getOne({ id: userId }, false)
    return (user?.roles || []).map((role) => String(role.id))
  }

  private hasGlobalAccess(currentUser?: Record<string, any>) {
    const permissions = currentUser?.permissions || []
    return permissions.includes('*') || permissions.includes('content/articles/viewAll')
  }

  private checkArticleAccess(article: Article, currentUserId: string, roleIds: string[], canViewAll = false) {
    if (canViewAll) {
      return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'admin' }
    }
    if (article.authorId && String(article.authorId) === currentUserId) {
      return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'author' }
    }
    if (article.maintainerId && String(article.maintainerId) === currentUserId) {
      return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'maintainer' }
    }
    if (article.visibilityType === VisibilityType.public) {
      return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'public' }
    }
    if (article.visibilityType === VisibilityType.role) {
      const visibleRoles = this.normalizeIdList(article.visibleRoleIds)
      if (visibleRoles.some((id) => roleIds.includes(String(id)))) {
        return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'role' }
      }
    }
    if (article.visibilityType === VisibilityType.specified) {
      const visibleUsers = this.normalizeIdList(article.visibleUserIds)
      if (visibleUsers.includes(currentUserId)) {
        return { hasAccess: true, canBorrow: false, isRestricted: false, accessSource: 'specified' }
      }
    }

    const allowBorrow = article.catalog?.allowBorrow === '1'
    return { hasAccess: false, canBorrow: allowBorrow, isRestricted: true, accessSource: 'none' }
  }

  private maskArticleForCurrentUser(article: Article, currentUserId: string, roleIds: string[], canViewAll = false) {
    const access = this.checkArticleAccess(article, currentUserId, roleIds, canViewAll)
    if (access.hasAccess) {
      return Object.assign(article, access)
    }
    return Object.assign(article, {
      ...access,
      summary: '当前知识受限，暂无查看权限',
      desc: '当前知识受限，暂无查看权限',
      content: '',
      contentText: '',
    })
  }
}
