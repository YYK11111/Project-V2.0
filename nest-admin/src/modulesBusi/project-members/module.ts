import { Module } from '@nestjs/common'
import { ProjectMembersService } from './service'
import { ProjectMembersController } from './controller'
import { ProjectMember } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from 'src/modules/users/users.module'
import { ProjectsModule } from '../projects/module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember]), 
    UsersModule,
    ProjectsModule
  ],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService],
  exports: [ProjectMembersService],
})
export class ProjectMembersModule {}