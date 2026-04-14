import { PartialType } from '@nestjs/mapped-types'
import { Project } from './entity'

export class ProjectDto extends PartialType(Project) {}
