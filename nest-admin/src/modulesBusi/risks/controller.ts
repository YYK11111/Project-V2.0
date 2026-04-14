import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { RisksService } from './service'
import { QueryRiskDto } from './dto'
import { Risk, riskStatusMap, riskLevelMap, riskCategoryMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/risks')
export class RisksController extends BaseController<Risk, RisksService> {
  constructor(readonly service: RisksService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return riskStatusMap
  }

  @Get('getLevel')
  getLevel() {
    return riskLevelMap
  }

  @Get('getCategory')
  getCategory() {
    return riskCategoryMap
  }

  @Post('resolve/:id')
  resolve(@Param('id') id: string) {
    return this.service.resolve(id)
  }
}