import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleBorrow } from './entity'
import { Article } from '../articles/entity'
import { ArticleBorrowsService } from './service'
import { ArticleBorrowsController } from './controller'
import { TasksModule } from 'src/common/tasks/tasks.module'
import { UsersModule } from 'src/modules/users/users.module'

@Module({
  imports: [TypeOrmModule.forFeature([ArticleBorrow, Article]), TasksModule, UsersModule],
  providers: [ArticleBorrowsService],
  controllers: [ArticleBorrowsController],
  exports: [ArticleBorrowsService],
})
export class ArticleBorrowsModule {}
