import { Module } from '@nestjs/common'
import { TicketsService } from './service'
import { TicketsController } from './controller'
import { Ticket } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from 'src/modules/users/users.module'
import { ProjectsModule } from '../projects/module'
import { TasksBusiModule } from '../tasks/module'
import { SysFileModule } from 'src/modules/sys/file/module'

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), UsersModule, ProjectsModule, TasksBusiModule, SysFileModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
