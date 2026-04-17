import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query, Req } from '@nestjs/common'
import { ArticlesService } from './service'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { UpdateResult } from 'typeorm'
import { Article, status } from './entity'
import { knowledgeTypeMap, visibilityTypeMap } from './constants'
import { BaseController } from 'src/common/BaseController'
import { ForbiddenException } from '@nestjs/common'

@Controller('business/articles')
export class ArticlesController extends BaseController<Article, ArticlesService> {
  constructor(readonly service: ArticlesService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return status
  }

  @Get('getKnowledgeTypes')
  getKnowledgeTypes() {
    return knowledgeTypeMap
  }

  @Get('getVisibilityTypes')
  getVisibilityTypes() {
    return visibilityTypeMap
  }

  @Post('rebuildChunks/:id')
  rebuildChunks(@Param('id') id: string, @Req() req) {
    return this.service.rebuildChunks(id, req.user)
  }

  @Get('retrieveForAi')
  async retrieveForAi(@Query() query: any, @Req() req) {
    return this.service.retrieveForAi(query, req.user)
  }

  @Get('list')
  async list(@Query() query: QueryListDto, @Req() req) {
    return this.service.list(query, req.user)
  }

  @Get('getOne/:id')
  async getProtectedOne(@Param('id') id: string, @Req() req) {
    try {
      return await this.service.getOneForAccess(id, req.user)
    } catch (error) {
      if (error?.status === 403) {
        throw new ForbiddenException({
          message: error.message,
          code: error.code,
          canBorrow: error.canBorrow,
          catalogId: error.catalogId,
          articleId: error.articleId,
        })
      }
      throw error
    }
  }
}
