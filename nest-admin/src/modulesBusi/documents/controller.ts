import { Controller, Get, Post, Param } from '@nestjs/common'
import { DocumentsService } from './service'
import { Document, documentTypeMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/documents')
export class DocumentsController extends BaseController<Document, DocumentsService> {
  constructor(readonly service: DocumentsService) {
    super(service)
  }

  @Get('getType')
  getType() {
    return documentTypeMap
  }

  @Post('version/:id')
  upgradeVersion(@Param('id') id: string) {
    return this.service.upgradeVersion(id)
  }
}
