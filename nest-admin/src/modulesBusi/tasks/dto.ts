import { PartialType } from '@nestjs/mapped-types'
import { Task } from './entity'

export class TaskDto extends PartialType(Task) {}
