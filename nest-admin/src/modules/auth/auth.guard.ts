import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import { RedisService } from '../global/redis.service'
import { config } from 'config'
import { PERMISSION_KEY } from './permission.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(config.isPublicKey, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      // 💡 See this condition
      return true
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException()
    }
    let payload
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: config.jwtSecret,
      })
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      payload.session = token.split('.').at(-1)
      request['user'] = payload
    } catch {
      throw new UnauthorizedException()
    }

    const requiredPermission =
      this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [context.getHandler(), context.getClass()]) ||
      this.resolvePermissionByRequest(request)

    // 按钮/接口权限校验
    let permissions = await this.redisService.getPermissions()
    let api = request.path.replace(config.apiBase, '').replace(/^\//g, '')
    const isSuper = payload.permissions?.[0] === '*'
    if (!isSuper && requiredPermission && permissions.includes(requiredPermission) && !payload.permissions?.includes(requiredPermission)) {
      throw new HttpException('接口无权限', 403)
    }

    if (!isSuper && !requiredPermission && permissions.includes(api) && !payload.permissions?.includes(api)) {
      throw new HttpException('接口无权限', 403)
    }
    await this.redisService.setRedisOnlineUser(request, payload)

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }

  private resolvePermissionByRequest(request: Request): string | undefined {
    const method = request.method.toUpperCase()
    const api = request.path.replace(config.apiBase, '').replace(/^\//g, '')

    const map: Array<[string, RegExp, string | ((req: Request) => string)]> = [
      ['GET', /^system\/users\/list$/, 'system/users/list'],
      ['GET', /^system\/users\/getOne\/[^/]+$/, 'system/users/getOne'],
      ['POST', /^system\/users\/add$/, 'system/users/add'],
      ['POST', /^system\/users\/save$/, (req) => (req.body?.id ? 'system/users/update' : 'system/users/add')],
      ['PUT', /^system\/users\/update$/, 'system/users/update'],
      ['DELETE', /^system\/users\/del\/[^/]+$/, 'system/users/delete'],
      ['PUT', /^system\/users\/resetPassword$/, 'system/users/resetPassword'],

      ['GET', /^system\/dept\/getTrees$/, 'system/dept/tree'],
      ['GET', /^system\/dept\/getOne\/[^/]+$/, 'system/dept/getOne'],
      ['POST', /^system\/dept\/add$/, 'system/dept/add'],
      ['POST', /^system\/dept\/save$/, (req) => (req.body?.id ? 'system/dept/update' : 'system/dept/add')],
      ['PUT', /^system\/dept\/update$/, 'system/dept/update'],
      ['DELETE', /^system\/dept\/del\/[^/]+$/, 'system/dept/delete'],

      ['GET', /^system\/roles\/list$/, 'system/roles/list'],
      ['GET', /^system\/roles\/getOne\/[^/]+$/, 'system/roles/getOne'],
      ['POST', /^system\/roles\/add$/, 'system/roles/add'],
      ['POST', /^system\/roles\/save$/, (req) => (req.body?.id ? 'system/roles/update' : 'system/roles/add')],
      ['PUT', /^system\/roles\/update$/, 'system/roles/update'],
      ['DELETE', /^system\/roles\/del\/[^/]+$/, 'system/roles/delete'],
      ['GET', /^system\/roles\/menuTreeselect$/, 'system/roles/menuTree'],
      ['GET', /^system\/roles\/roleMenuTreeselect\/[^/]+$/, 'system/roles/menuAssign'],
      ['GET', /^system\/roles\/authUser\/allocatedList$/, 'system/roles/authUser/list'],
      ['GET', /^system\/roles\/authUser\/unallocatedList$/, 'system/roles/authUser/unallocatedList'],
      ['PUT', /^system\/roles\/authUser\/selectAll$/, 'system/roles/authUser/select'],
      ['PUT', /^system\/roles\/authUser\/cancel$/, 'system/roles/authUser/cancel'],
      ['PUT', /^system\/roles\/authUser\/cancelAll$/, 'system/roles/authUser/cancelAll'],

      ['GET', /^system\/menus\/list$/, 'system/menus/list'],
      ['GET', /^system\/menus\/getOne\/[^/]+$/, 'system/menus/getOne'],
      ['GET', /^system\/menus\/getTrees$/, 'system/menus/tree'],
      ['GET', /^system\/menus\/getTypes$/, 'system/menus/getTypes'],
      ['POST', /^system\/menus\/add$/, 'system/menus/add'],
      ['POST', /^system\/menus\/save$/, (req) => (req.body?.id ? 'system/menus/update' : 'system/menus/add')],
      ['PUT', /^system\/menus\/update$/, 'system/menus/update'],
      ['DELETE', /^system\/menus\/del\/[^/]+$/, 'system/menus/delete'],

      ['GET', /^system\/notices\/list$/, 'system/notices/list'],
      ['GET', /^system\/notices\/getOne\/[^/]+$/, 'system/notices/getOne'],
      ['POST', /^system\/notices\/add$/, 'system/notices/add'],
      ['POST', /^system\/notices\/save$/, (req) => (req.body?.id ? 'system/notices/update' : 'system/notices/add')],
      ['PUT', /^system\/notices\/update$/, 'system/notices/update'],
      ['DELETE', /^system\/notices\/del\/[^/]+$/, 'system/notices/delete'],

      ['GET', /^system\/configs\/list$/, 'system/configs/list'],
      ['POST', /^system\/configs\/save$/, 'system/configs/update'],
      ['PUT', /^system\/configs\/update$/, 'system/configs/update'],

      ['GET', /^business\/projects\/list$/, 'business/projects/list'],
      ['GET', /^business\/projects\/getOne\/[^/]+$/, 'business/projects/getOne'],
      ['POST', /^business\/projects\/add$/, 'business/projects/add'],
      ['POST', /^business\/projects\/save$/, (req) => (req.body?.id ? 'business/projects/update' : 'business/projects/add')],
      ['PUT', /^business\/projects\/update$/, 'business/projects/update'],
      ['DELETE', /^business\/projects\/del\/[^/]+$/, 'business/projects/delete'],
      ['POST', /^business\/projects\/archive\/[^/]+$/, 'business/projects/archive'],
      ['GET', /^business\/projects\/statistics\/[^/]+$/, 'business/projects/statistics'],
      ['POST', /^business\/projects\/[^/]+\/submit-approval$/, 'business/projects/submitApproval'],
      ['POST', /^business\/projects\/[^/]+\/submit-close$/, 'business/projects/submitClose'],

      ['GET', /^business\/tasks\/list$/, 'business/tasks/list'],
      ['GET', /^business\/tasks\/getOne\/[^/]+$/, 'business/tasks/getOne'],
      ['POST', /^business\/tasks\/add$/, 'business/tasks/add'],
      ['POST', /^business\/tasks\/save$/, (req) => (req.body?.id ? 'business/tasks/update' : 'business/tasks/add')],
      ['PUT', /^business\/tasks\/update$/, 'business/tasks/update'],
      ['DELETE', /^business\/tasks\/del\/[^/]+$/, 'business/tasks/delete'],
      ['POST', /^business\/tasks\/progress\/[^/]+$/, 'business/tasks/updateProgress'],
      ['GET', /^business\/tasks\/kanban\/[^/]+$/, 'business/tasks/kanban'],
      ['GET', /^business\/tasks\/[^/]+\/dependencies$/, 'business/tasks/dependency/list'],
      ['POST', /^business\/tasks\/[^/]+\/dependencies$/, 'business/tasks/dependency/add'],
      ['DELETE', /^business\/tasks\/[^/]+\/dependencies\/[^/]+$/, 'business/tasks/dependency/delete'],
      ['GET', /^business\/tasks\/[^/]+\/timelogs$/, 'business/tasks/timelog/list'],
      ['POST', /^business\/tasks\/[^/]+\/timelogs$/, 'business/tasks/timelog/add'],
      ['DELETE', /^business\/tasks\/timelogs\/[^/]+$/, 'business/tasks/timelog/delete'],

      ['GET', /^business\/tickets\/list$/, 'business/tickets/list'],
      ['GET', /^business\/tickets\/getOne\/[^/]+$/, 'business/tickets/getOne'],
      ['POST', /^business\/tickets\/add$/, 'business/tickets/add'],
      ['POST', /^business\/tickets\/save$/, (req) => (req.body?.id ? 'business/tickets/update' : 'business/tickets/add')],
      ['PUT', /^business\/tickets\/update$/, 'business/tickets/update'],
      ['DELETE', /^business\/tickets\/del\/[^/]+$/, 'business/tickets/delete'],

      ['GET', /^business\/stories\/list$/, 'business/stories/list'],
      ['GET', /^business\/stories\/getOne\/[^/]+$/, 'business/stories/getOne'],
      ['POST', /^business\/stories\/add$/, 'business/stories/add'],
      ['POST', /^business\/stories\/save$/, (req) => (req.body?.id ? 'business/stories/update' : 'business/stories/add')],
      ['PUT', /^business\/stories\/update$/, 'business/stories/update'],
      ['DELETE', /^business\/stories\/del\/[^/]+$/, 'business/stories/delete'],
      ['GET', /^business\/stories\/backlog$/, 'business/stories/backlog'],
      ['GET', /^business\/stories\/[^/]+\/children$/, 'business/stories/children'],
      ['PUT', /^business\/stories\/[^/]+\/status$/, 'business/stories/update'],
      ['POST', /^business\/stories\/[^/]+\/assign-to-sprint$/, 'business/stories/update'],
      ['POST', /^business\/stories\/[^/]+\/remove-from-sprint$/, 'business/stories/update'],

      ['GET', /^business\/sprints\/list$/, 'business/sprints/list'],
      ['GET', /^business\/sprints\/getOne\/[^/]+$/, 'business/sprints/getOne'],
      ['POST', /^business\/sprints\/add$/, 'business/sprints/add'],
      ['POST', /^business\/sprints\/save$/, (req) => (req.body?.id ? 'business/sprints/update' : 'business/sprints/add')],
      ['PUT', /^business\/sprints\/update$/, 'business/sprints/update'],
      ['DELETE', /^business\/sprints\/del\/[^/]+$/, 'business/sprints/delete'],
      ['GET', /^business\/sprints\/[^/]+\/burndown$/, 'business/sprints/getOne'],
      ['GET', /^business\/sprints\/[^/]+\/velocity$/, 'business/sprints/getOne'],
      ['POST', /^business\/sprints\/[^/]+\/start$/, 'business/sprints/update'],
      ['POST', /^business\/sprints\/[^/]+\/complete$/, 'business/sprints/update'],

      ['GET', /^business\/milestones\/list$/, 'business/milestones/list'],
      ['GET', /^business\/milestones\/getOne\/[^/]+$/, 'business/milestones/getOne'],
      ['POST', /^business\/milestones\/add$/, 'business/milestones/add'],
      ['POST', /^business\/milestones\/save$/, (req) => (req.body?.id ? 'business/milestones/update' : 'business/milestones/add')],
      ['PUT', /^business\/milestones\/update$/, 'business/milestones/update'],
      ['DELETE', /^business\/milestones\/del\/[^/]+$/, 'business/milestones/delete'],
      ['POST', /^business\/milestones\/status\/[^/]+$/, 'business/milestones/update'],

      ['GET', /^business\/risks\/list$/, 'business/risks/list'],
      ['GET', /^business\/risks\/getOne\/[^/]+$/, 'business/risks/getOne'],
      ['POST', /^business\/risks\/add$/, 'business/risks/add'],
      ['POST', /^business\/risks\/save$/, (req) => (req.body?.id ? 'business/risks/update' : 'business/risks/add')],
      ['PUT', /^business\/risks\/update$/, 'business/risks/update'],
      ['DELETE', /^business\/risks\/del\/[^/]+$/, 'business/risks/delete'],
      ['POST', /^business\/risks\/resolve\/[^/]+$/, 'business/risks/update'],

      ['GET', /^business\/changes\/list$/, 'business/changes/list'],
      ['GET', /^business\/changes\/getOne\/[^/]+$/, 'business/changes/getOne'],
      ['POST', /^business\/changes\/add$/, 'business/changes/add'],
      ['POST', /^business\/changes\/save$/, (req) => (req.body?.id ? 'business/changes/update' : 'business/changes/add')],
      ['PUT', /^business\/changes\/update$/, 'business/changes/update'],
      ['DELETE', /^business\/changes\/del\/[^/]+$/, 'business/changes/delete'],
      ['POST', /^business\/changes\/approve\/[^/]+$/, 'business/changes/update'],
      ['POST', /^business\/changes\/reject\/[^/]+$/, 'business/changes/update'],

      ['GET', /^business\/documents\/list$/, 'business/documents/list'],
      ['GET', /^business\/documents\/getOne\/[^/]+$/, 'business/documents/getOne'],
      ['POST', /^business\/documents\/add$/, 'business/documents/add'],
      ['POST', /^business\/documents\/save$/, (req) => (req.body?.id ? 'business/documents/update' : 'business/documents/add')],
      ['PUT', /^business\/documents\/update$/, 'business/documents/update'],
      ['DELETE', /^business\/documents\/del\/[^/]+$/, 'business/documents/delete'],
      ['POST', /^business\/documents\/version\/[^/]+$/, 'business/documents/update'],

      ['GET', /^business\/project-members\/list$/, 'business/projectMembers/list'],
      ['GET', /^business\/project-members\/project\/[^/]+$/, 'business/projectMembers/list'],
      ['POST', /^business\/project-members$/, 'business/projectMembers/add'],
      ['PUT', /^business\/project-members\/[^/]+$/, 'business/projectMembers/update'],
      ['DELETE', /^business\/project-members\/[^/]+$/, 'business/projectMembers/delete'],

      ['GET', /^business\/task-comments\/list$/, 'business/taskComments/list'],
      ['GET', /^business\/task-comments\/task\/[^/]+$/, 'business/taskComments/list'],
      ['POST', /^business\/task-comments$/, 'business/taskComments/add'],
      ['PUT', /^business\/task-comments\/[^/]+$/, 'business/taskComments/update'],
      ['DELETE', /^business\/task-comments\/[^/]+$/, 'business/taskComments/delete'],

      ['GET', /^business\/crm\/customers\/list$/, 'business/crm/customers/list'],
      ['GET', /^business\/crm\/customers\/getOne\/[^/]+$/, 'business/crm/customers/getOne'],
      ['GET', /^business\/crm\/customers\/detail\/[^/]+$/, 'business/crm/customers/getOne'],
      ['POST', /^business\/crm\/customers\/add$/, 'business/crm/customers/add'],
      ['POST', /^business\/crm\/customers\/save$/, (req) => (req.body?.id ? 'business/crm/customers/update' : 'business/crm/customers/add')],
      ['PUT', /^business\/crm\/customers\/update$/, 'business/crm/customers/update'],
      ['DELETE', /^business\/crm\/customers\/del\/[^/]+$/, 'business/crm/customers/delete'],

      ['GET', /^business\/crm\/opportunities\/list$/, 'business/crm/opportunities/list'],
      ['GET', /^business\/crm\/opportunities\/getOne\/[^/]+$/, 'business/crm/opportunities/getOne'],
      ['POST', /^business\/crm\/opportunities\/add$/, 'business/crm/opportunities/add'],
      ['POST', /^business\/crm\/opportunities\/save$/, (req) => (req.body?.id ? 'business/crm/opportunities/update' : 'business/crm/opportunities/add')],
      ['PUT', /^business\/crm\/opportunities\/update$/, 'business/crm/opportunities/update'],
      ['DELETE', /^business\/crm\/opportunities\/del\/[^/]+$/, 'business/crm/opportunities/delete'],

      ['GET', /^business\/crm\/contracts\/list$/, 'business/crm/contracts/list'],
      ['GET', /^business\/crm\/contracts\/getOne\/[^/]+$/, 'business/crm/contracts/getOne'],
      ['POST', /^business\/crm\/contracts\/add$/, 'business/crm/contracts/add'],
      ['POST', /^business\/crm\/contracts\/save$/, (req) => (req.body?.id ? 'business/crm/contracts/update' : 'business/crm/contracts/add')],
      ['PUT', /^business\/crm\/contracts\/update$/, 'business/crm/contracts/update'],
      ['DELETE', /^business\/crm\/contracts\/del\/[^/]+$/, 'business/crm/contracts/delete'],

      ['GET', /^business\/crm\/interactions\/list$/, 'business/crm/interactions/list'],
      ['GET', /^business\/crm\/interactions\/getOne\/[^/]+$/, 'business/crm/interactions/getOne'],
      ['GET', /^business\/crm\/interactions\/customer\/[^/]+$/, 'business/crm/interactions/list'],
      ['POST', /^business\/crm\/interactions\/add$/, 'business/crm/interactions/add'],
      ['POST', /^business\/crm\/interactions\/save$/, (req) => (req.body?.id ? 'business/crm/interactions/update' : 'business/crm/interactions/add')],
      ['PUT', /^business\/crm\/interactions\/update$/, 'business/crm/interactions/update'],
      ['DELETE', /^business\/crm\/interactions\/del\/[^/]+$/, 'business/crm/interactions/delete'],

      ['GET', /^workflow\/definitions$/, 'business/workflow/definitions/list'],
      ['GET', /^workflow\/definitions\/[^/]+$/, 'business/workflow/definitions/getOne'],
      ['POST', /^workflow\/definitions\/save$/, (req) => (req.body?.id ? 'business/workflow/definitions/update' : 'business/workflow/definitions/add')],
      ['PUT', /^workflow\/definitions\/[^/]+$/, 'business/workflow/definitions/update'],
      ['DELETE', /^workflow\/definitions\/[^/]+$/, 'business/workflow/definitions/delete'],
      ['POST', /^workflow\/definitions\/[^/]+\/publish$/, 'business/workflow/definitions/publish'],
      ['POST', /^workflow\/definitions\/[^/]+\/unpublish$/, 'business/workflow/definitions/publish'],
      ['POST', /^workflow\/definitions\/[^/]+\/copy$/, 'business/workflow/definitions/copy'],
      ['GET', /^workflow\/instances$/, 'business/workflow/instances/list'],
      ['POST', /^workflow\/instances\/start$/, 'business/workflow/definitions/start'],
      ['GET', /^workflow\/instances\/[^/]+$/, 'business/workflow/instances/getOne'],
      ['POST', /^workflow\/instances\/[^/]+\/withdraw$/, 'business/workflow/instances/withdraw'],
      ['POST', /^workflow\/instances\/[^/]+\/cancel$/, 'business/workflow/instances/cancel'],
      ['GET', /^workflow\/instances\/[^/]+\/history$/, 'business/workflow/instances/history'],
      ['GET', /^workflow\/instances\/[^/]+\/tasks$/, 'business/workflow/instances/tasks'],
      ['GET', /^workflow\/tasks\/my$/, 'business/workflow/tasks/list'],
      ['POST', /^workflow\/tasks\/[^/]+\/complete$/, 'business/workflow/tasks/complete'],
      ['POST', /^workflow\/tasks\/[^/]+\/transfer$/, 'business/workflow/tasks/transfer'],
      ['POST', /^workflow\/tasks\/[^/]+\/add-sign$/, 'business/workflow/tasks/addSign'],
      ['GET', /^workflow\/business-configs$/, 'business/workflow/configs/list'],
      ['GET', /^workflow\/business-configs\/[^/]+$/, 'business/workflow/configs/getOne'],
      ['POST', /^workflow\/business-configs\/save$/, (req) => (req.body?.id ? 'business/workflow/configs/update' : 'business/workflow/configs/add')],
      ['DELETE', /^workflow\/business-configs\/[^/]+$/, 'business/workflow/configs/delete'],
      ['GET', /^workflow\/business-fields$/, 'business/workflow/fields/list'],
      ['GET', /^workflow\/business-fields\/[^/]+$/, 'business/workflow/fields/list'],
      ['POST', /^workflow\/business-fields\/generate$/, 'business/workflow/fields/generate'],
      ['PUT', /^workflow\/business-fields\/[^/]+$/, 'business/workflow/fields/update'],
      ['DELETE', /^workflow\/business-fields\/[^/]+$/, 'business/workflow/fields/delete'],
    ]

    for (const [m, reg, permission] of map) {
      if (m === method && reg.test(api)) {
        return typeof permission === 'function' ? permission(request) : permission
      }
    }
    return undefined
  }
}
