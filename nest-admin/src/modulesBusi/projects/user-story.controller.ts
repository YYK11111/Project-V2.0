import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common'
import { UserStoryService } from './user-story.service'
import { UserStory, userStoryStatusMap, userStoryTypeMap } from './entities/user-story.entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/stories')
export class UserStoryController extends BaseController<UserStory, UserStoryService> {
  constructor(readonly service: UserStoryService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return userStoryStatusMap
  }

  @Get('getType')
  getType() {
    return userStoryTypeMap
  }

  @Get('backlog')
  async getBacklog(@Query('projectIds') projectIds: string) {
    const ids = projectIds ? projectIds.split(',').filter(id => id) : []
    return this.service.getBacklog(ids)
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.service.updateStatus(id, body.status as any)
  }

  @Post(':id/assign-to-sprint')
  async assignToSprint(
    @Param('id') id: string,
    @Body() body: { sprintId: string },
  ) {
    return this.service.assignToSprint(id, body.sprintId)
  }

  @Post(':id/remove-from-sprint')
  async removeFromSprint(@Param('id') id: string) {
    return this.service.removeFromSprint(id)
  }

  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    return this.service.getChildren(id)
  }
}