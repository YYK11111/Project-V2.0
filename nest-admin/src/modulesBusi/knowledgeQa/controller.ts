import { Body, Controller, Post, Query, Req } from "@nestjs/common";
import { KnowledgeQaService } from "./service";
import { KnowledgeQaAskDto, KnowledgeQaEmbedPreviewDto } from "./dto";

@Controller("business/knowledge-qa")
export class KnowledgeQaController {
  constructor(private readonly service: KnowledgeQaService) {}

  @Post("ask")
  ask(@Body() body: KnowledgeQaAskDto, @Req() req) {
    return this.service.ask(body, req.user);
  }

  @Post("embed-preview")
  embedPreview(@Body() body: KnowledgeQaEmbedPreviewDto) {
    return this.service.embedPreview(body);
  }
}
