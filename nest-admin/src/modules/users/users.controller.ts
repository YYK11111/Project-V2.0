import { Request } from 'express'
import { Body, Controller, Get, Post, Query, Put, Req, UploadedFile, HttpCode } from '@nestjs/common'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { HttpExceptionFilter } from '../../common/filters/httpException.filter'
import { UseFilters } from '@nestjs/common'
import { UpdateResult } from 'typeorm'

import { QueryListDto, ResponseListDto } from '../../common/dto/index'
import { BaseController } from 'src/common/BaseController'
import { MulterFileInterceptor } from 'src/common/interceptor/file.interceptor'
import { CaptchaService } from '../common/captcha.service'
import { Public } from '../auth/auth.service'
import { SysFileService } from '../sys/file/service'
import { BusinessType, FileStatus } from '../sys/file/entity'

@Controller('system/users')
// @UseFilters(new HttpExceptionFilter())
export class UsersController extends BaseController<User, UsersService> {
  constructor(
    readonly usersService: UsersService,
    private captchaService: CaptchaService,
    private sysFileService: SysFileService,
  ) {
    super(usersService)
  }

  // 重置密码
  @Public()
  @Put('resetPassword')
  async resetPassword(@Body() body) {
    let result = this.captchaService.validateCaptcha(body.uuid, body.code)
    if (result !== 'true') {
      throw new Error(result)
    }
    return this.usersService.resetPassword(body)
  }

  @Post('uploadAvatar')
  @MulterFileInterceptor('avatar')
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    // 1. 创建 sys_file 记录
    await this.sysFileService.create({
      originalName: file.originalname,
      storedName: file.filename,
      storedPath: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      businessType: BusinessType.Avatar,
      businessId: req.user.id,
      uploaderId: req.user.id,
      status: FileStatus.Associated,
    })

    // 2. 查询旧头像并软删除
    const oldUser = await this.usersService.getOne({ id: req.user.id })
    if (oldUser?.avatar) {
      await this.sysFileService.softDeleteByPath(oldUser.avatar)
    }

    // 3. 更新用户头像
    await this.usersService.save({ id: req.user.id, avatar: file.filename })

    return { url: file.filename }
  }

  // 获取当前用户主题配置
  @Get('getTheme')
  async getTheme(@Req() req) {
    try {
      const user = await this.usersService.getOne({ id: req.user.id })
      return { themeHsl: user?.themeHsl || null }
    } catch (error) {
      return { themeHsl: null }
    }
  }

  // 更新当前用户主题配置
  @Put('updateTheme')
  async updateTheme(@Req() req, @Body() body: { themeHsl: string }) {
    await this.usersService.update({ id: req.user.id, themeHsl: body.themeHsl })
    return { success: true }
  }
}
