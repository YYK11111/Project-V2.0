import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  Req,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFiles,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CommonService } from './common.service'
import { MulterFileInterceptor } from 'src/common/interceptor/file.interceptor'
import { CaptchaService } from './captcha.service'
import { Public } from '../auth/auth.service'
import { SysFileService } from '../sys/file/service'
import { FileStatus } from '../sys/file/entity'
import { config } from 'config'

@Controller('system/common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    private readonly captchaService: CaptchaService,
    private readonly sysFileService: SysFileService,
  ) {}

  /**
   * 通用文件上传
   * @param module 文件所属模块，用于创建模块文件夹
   * @param file 文件字段
   * @returns
   */
  @Post('upload')
  @MulterFileInterceptor()
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // 创建 sys_file 记录（状态为待关联）
    await this.sysFileService.create({
      originalName: file.originalname,
      storedName: file.filename,
      storedPath: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: FileStatus.Pending,
    })
    
    return { url: file.filename }
  }

  @Get('getOsInfo')
  async getOsInfo() {
    return await this.commonService.getOsInfo()
  }

  @Public()
  @Get('getCaptchaImage')
  async getCaptchaImage() {
    return this.captchaService.getCaptchaImage()
  }

  @Public()
  @Get('getCaptchaDebug')
  async getCaptchaDebug(@Query('uuid') uuid: string) {
    const isDev = process.argv.some((arg) => arg.includes('env=dev'))
    if (!isDev) {
      return { code: 403, msg: 'forbidden' }
    }
    return {
      uuid,
      text: this.captchaService.getCaptchaText(uuid),
    }
  }

  // 首页指标数据
  @Public()
  @Get('getIndexCountData')
  async getIndexCountData() {
    return this.commonService.getIndexCountData()
  }

  /**
   * 删除上传的文件
   */
  @Delete('upload/:filename')
  async deleteFile(@Param('filename') filename: string) {
    return this.commonService.deleteFile(filename)
  }

  /**
   * 文件预览（预留）
   */
  @Get('preview')
  async previewFile(@Query('url') url: string, @Query('name') name: string) {
    return this.commonService.previewFile(url)
  }

  /**
   * 文件下载（预留）
   */
  @Get('download/url')
  async downloadFile(@Query('url') url: string, @Query('name') name: string) {
    return this.commonService.downloadFile(url)
  }
}
