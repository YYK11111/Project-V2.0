import { Module } from '@nestjs/common'
import { TaskCommentsService } from './service'
import { TaskCommentsController } from './controller'
import { TaskComment } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from 'src/modules/users/users.module'
import { TasksBusiModule } from '../tasks/module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment]), 
    UsersModule,
    TasksBusiModule
  ],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}