import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'
import { AuthGuard } from './auth.guard'
import { AuthService, Public } from './auth.service'
import { UsersService } from '../users/users.service'
import { QueryListDto } from 'src/common/dto'
import { hashPassword } from 'src/common/utils/password'
import { CaptchaService } from '../common/captcha.service'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private captchaService: CaptchaService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req, res)
  }

  @Public()
  @Post('register')
  async register(@Body() body: { name; password; uuid; code; email? }) {
    let result = this.captchaService.validateCaptcha(body.uuid, body.code)
    if (result !== 'true') {
      throw new Error(result)
    }

    let { name, password, email } = body
    password = await hashPassword(password)

    return this.usersService.add({ name, password, email, passwordVersion: 2 })
  }

  @Post('logout')
  async logout(@Request() req: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, false, res)
  }

  @Get('getLoginUser')
  async getLoginUser(@Request() req: Record<string, any>) {
    try {
      const user = await this.usersService.getOne({ id: req.user.id })
      const userWithPermissions = Object.assign(user, {
        permissions: req.user.permissions || [],
      })
      let { password, ...userInfo } = userWithPermissions
      return userInfo
    } catch (error) {
      throw new UnauthorizedException()
    }
  }

  @Get('getOnlineUsers')
  async getOnlineUsers(@Request() req: Record<string, any>, @Query() query: QueryListDto) {
    this.authService.ensureAdmin(req.user)
    return await this.authService.getOnlineUsers(query)
  }

  @Post('quit')
  async quit(@Request() req: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, true, res)
  }
}
