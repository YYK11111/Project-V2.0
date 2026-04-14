import { Module } from '@nestjs/common'
import { DocumentsService } from './service'
import { DocumentsController } from './controller'
import { Document } from './entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from 'src/modules/users/users.module'
import { ProjectsModule } from '../projects/module'

@Module({
  imports: [TypeOrmModule.forFeature([Document]), UsersModule, ProjectsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
