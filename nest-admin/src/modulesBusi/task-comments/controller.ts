import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { TaskCommentsService } from './service'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { TaskComment } from './entity'
import { TaskCommentDto, UpdateTaskCommentDto } from './dto'
import { BaseController } from 'src/common/BaseController'

@Controller('business/task-comments')
export class TaskCommentsController extends BaseController<TaskComment, TaskCommentsService> {
  constructor(readonly service: TaskCommentsService) {
    super(service)
  }

  @Post()
  addComment(
    @Body() data: TaskCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name
    return this.service.addComment(data, userId)
  }

  @Put(':id')
  updateComment(
    @Param('id') id: string,
    @Body() data: UpdateTaskCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name
    return this.service.updateComment(id, data, userId)
  }

  @Delete(':id')
  deleteComment(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name
    return this.service.deleteComment(id, userId)
  }

  @Get('task/:taskId')
  getTaskComments(@Param('taskId') taskId: string) {
    return this.service.getTaskComments(taskId)
  }

  @Get('user/:userId')
  getUserComments(@Param('userId') userId: string) {
    return this.service.getUserComments(userId)
  }
}
