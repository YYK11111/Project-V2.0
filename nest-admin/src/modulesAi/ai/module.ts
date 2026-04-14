import { Module } from '@nestjs/common'
import { AiService } from './service'
import { AiController } from './controller'
import { Ai } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from 'src/common/http/module'
import { CustomAiService } from './custom-ai'

@Module({
  imports: [TypeOrmModule.forFeature([Ai]), HttpModule],
  controllers: [AiController],
  providers: [AiService, CustomAiService],
})
export class AiModule {}
