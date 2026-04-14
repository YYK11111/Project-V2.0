import { Injectable } from '@nestjs/common'
import { AiDto } from './dto'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Like, Repository, UpdateResult } from 'typeorm'
import { Ai } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { send as sendHunyuan } from './hunyuan'
import { CustomAiService } from './custom-ai'

@Injectable()
export class AiService extends BaseService<Ai, AiDto> {
  constructor(
    @InjectRepository(Ai) repository: Repository<Ai>,
    private readonly customAiService: CustomAiService,
  ) {
    super(Ai, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Ai>> {
    let { keywords, isCollect, sessionId, userId, question, answer } = query
    let queryOrm: FindManyOptions = {
      where: [
        {
          isCollect,
          sessionId,
          userId,
          question: this.sqlLike(question) || this.sqlLike(keywords),
          answer: this.sqlLike(answer),
        },
      ],
    }
    return this.listBy(queryOrm, query)
  }

  async create(dto) {
    return this.send(dto)
  }

  async send(dto) {
    const { provider = 'hunyuan', model, content } = dto

    if (provider === 'custom') {
      const selectedModel = model || this.customAiService.getDefaultModel()
      const response = await this.customAiService.chatNoStream({
        model: selectedModel,
        messages: [{ role: 'user', content }],
      })
      return response
    }

    // 默认使用腾讯混元
    return sendHunyuan(dto)
  }

  async collect(dto) {
    return this.send(dto)
  }

  getCustomModels() {
    return this.customAiService.getModels()
  }

  getDefaultModel() {
    return this.customAiService.getDefaultModel()
  }
}
