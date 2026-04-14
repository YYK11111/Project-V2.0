import { Module } from '@nestjs/common'
import { SprintsService } from './service'
import { SprintsController } from './controller'
import { Sprint } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsModule } from '../projects/module'
import { Task } from '../tasks/entity'

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Task]), ProjectsModule],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}