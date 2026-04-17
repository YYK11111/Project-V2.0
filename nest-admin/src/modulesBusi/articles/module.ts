import { Module } from '@nestjs/common'
import { ArticlesService } from './service'
import { ArticlesController } from './controller'
import { Article } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleCatalogsModule } from '../articleCatalogs/module'
import { TasksModule } from 'src/common/tasks/tasks.module'
import { ArticleTag } from '../articleTags/entity'
import { ArticleTagsModule } from '../articleTags/module'
import { UsersModule } from 'src/modules/users/users.module'
import { ArticleBorrowsModule } from '../articleBorrows/module'

@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleTag]), ArticleCatalogsModule, ArticleTagsModule, ArticleBorrowsModule, UsersModule, TasksModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
