import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common'
import { MessagesService } from './service'

@Controller('system/messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const userId = req.user?.id || req.user?.name
    return this.service.getUnreadCount(userId)
  }

  @Get('recent')
  async recent(@Req() req: any, @Query('limit') limit?: string) {
    const userId = req.user?.id || req.user?.name
    await this.service.ensureWorkflowTodoMessages()
    return this.service.getRecentMessages(userId, Number(limit || 10))
  }

  @Post('read/:id')
  async markRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.name
    await this.service.markRead(id, userId)
    return true
  }

  @Post('rebuild-todo')
  async rebuildTodo() {
    await this.service.ensureWorkflowTodoMessages()
    return true
  }
}
