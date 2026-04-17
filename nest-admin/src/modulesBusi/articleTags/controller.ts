import { Controller } from '@nestjs/common'
import { BaseController } from 'src/common/BaseController'
import { ArticleTag } from './entity'
import { ArticleTagsService } from './service'

@Controller('business/article-tags')
export class ArticleTagsController extends BaseController<ArticleTag, ArticleTagsService> {
  constructor(readonly service: ArticleTagsService) {
    super(service)
  }
}
