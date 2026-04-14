import { PartialType } from '@nestjs/mapped-types'
import { Document } from './entity'

export class DocumentDto extends PartialType(Document) {}
