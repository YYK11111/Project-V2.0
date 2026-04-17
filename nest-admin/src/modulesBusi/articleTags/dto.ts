import { PartialType } from '@nestjs/mapped-types'
import { ArticleTag } from './entity'

export class ArticleTagDto extends PartialType(ArticleTag) {}
