import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ProjectMembersService } from './service'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { ProjectMember, projectMemberRoleMap } from './entity'
import { ProjectMemberDto, UpdateProjectMemberDto } from './dto'
import { BaseController } from 'src/common/BaseController'

@Controller('business/project-members')
export class ProjectMembersController extends BaseController<ProjectMember, ProjectMembersService> {
  constructor(readonly service: ProjectMembersService) {
    super(service)
  }

  @Get('getRoles')
  getRoles() {
    return projectMemberRoleMap
  }

  @Get('stats')
  getStats() {
    return this.service.getStats()
  }

  @Get('project-overview')
  getProjectOverview(@Query() query: QueryListDto) {
    return this.service.getProjectOverview(query)
  }

  @Post()
  addMember(@Body() data: ProjectMemberDto) {
    return this.service.addMember(data)
  }

  @Put(':id')
  updateMember(
    @Param('id') id: string,
    @Body() data: UpdateProjectMemberDto
  ) {
    return this.service.updateMember(id, data)
  }

  @Delete(':id')
  removeMember(@Param('id') id: string) {
    return this.service.removeMember(id)
  }

  @Get('project/:projectId')
  getProjectMembers(@Param('projectId') projectId: string) {
    return this.service.getProjectMembers(projectId)
  }

  @Get('user/:userId/projects')
  getUserProjects(@Param('userId') userId: string) {
    return this.service.getUserProjects(userId)
  }

  @Get('check/:projectId/:userId')
  checkMembership(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string
  ) {
    return this.service.isProjectMember(projectId, userId)
  }

  @Get('check-manager/:projectId/:userId')
  checkManagerRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string
  ) {
    return this.service.isProjectManager(projectId, userId)
  }
}
