import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from 'src/common/BaseService'
import { ArticleTag } from './entity'
import { ArticleTagDto } from './dto'

@Injectable()
export class ArticleTagsService extends BaseService<ArticleTag, ArticleTagDto> {
  constructor(@InjectRepository(ArticleTag) repository: Repository<ArticleTag>) {
    super(ArticleTag, repository)
  }
}
