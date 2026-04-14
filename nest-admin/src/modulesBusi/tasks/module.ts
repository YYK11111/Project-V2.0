import { Module } from '@nestjs/common'
import { TasksService } from './service'
import { TasksController } from './controller'
import { Task } from './entity'
import { TaskDependency } from './entities/task-dependency.entity'
import { TaskTimeLog } from './entities/task-time-log.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from 'src/modules/users/users.module'
import { ProjectsModule } from '../projects/module'
import { SysFileModule } from 'src/modules/sys/file/module'

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskDependency, TaskTimeLog]), UsersModule, ProjectsModule, SysFileModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksBusiModule {}
