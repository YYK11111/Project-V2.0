import { Module } from '@nestjs/common'
import { SysFileService } from './service'
import { SysFileController } from './controller'
import { SysFile } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([SysFile])],
  controllers: [SysFileController],
  providers: [SysFileService],
  exports: [SysFileService],
})
export class SysFileModule {}