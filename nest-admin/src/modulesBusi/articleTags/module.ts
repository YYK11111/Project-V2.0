import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleTag } from './entity'
import { ArticleTagsController } from './controller'
import { ArticleTagsService } from './service'

@Module({
  imports: [TypeOrmModule.forFeature([ArticleTag])],
  controllers: [ArticleTagsController],
  providers: [ArticleTagsService],
  exports: [ArticleTagsService],
})
export class ArticleTagsModule {}
