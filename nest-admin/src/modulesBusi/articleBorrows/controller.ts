import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common'
import { ArticleBorrowsService } from './service'
import { ApplyBorrowDto, ApproveBorrowDto, RejectBorrowDto } from './dto'
import { QueryListDto } from 'src/common/dto'

@Controller('business/article-borrows')
export class ArticleBorrowsController {
  constructor(private readonly service: ArticleBorrowsService) {}

  @Post('apply')
  apply(@Body() dto: ApplyBorrowDto, @Req() req) {
    return this.service.apply(dto, req.user)
  }

  @Get('my')
  my(@Query() query: QueryListDto, @Req() req) {
    return this.service.listMine(query, req.user)
  }

  @Get('pending')
  pending(@Query() query: QueryListDto, @Req() req) {
    return this.service.listPending(query, req.user)
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveBorrowDto, @Req() req) {
    return this.service.approve(id, dto, req.user)
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectBorrowDto, @Req() req) {
    return this.service.reject(id, dto, req.user)
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string, @Req() req) {
    return this.service.revoke(id, req.user)
  }
}
