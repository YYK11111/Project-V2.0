import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { SysFileService } from './service'
import { CreateFileDto, QueryFileDto, AssociateFileDto } from './dto'
import { SysFile, fileStatusMap, businessTypeMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('system/file')
export class SysFileController extends BaseController<SysFile, SysFileService> {
  constructor(readonly service: SysFileService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return fileStatusMap
  }

  @Get('getBusinessType')
  getBusinessType() {
    return businessTypeMap
  }

  @Post()
  async create(@Body() dto: CreateFileDto) {
    return this.service.create(dto)
  }

  @Put('associate')
  async associate(@Body() dto: AssociateFileDto) {
    await this.service.associateFiles(dto)
    return { success: true }
  }

  @Post('restore/:id')
  async restore(@Param('id') id: string) {
    await this.service.restore(id)
    return { success: true }
  }

  @Post('cleanup')
  async cleanup(@Body('hours') hours?: number) {
    return this.service.cleanupOrphanFiles(hours || 24)
  }
}