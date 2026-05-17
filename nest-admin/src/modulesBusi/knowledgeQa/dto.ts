export class KnowledgeQaAskDto {
  question: string;
  limit?: number;
  catalogId?: string;
  knowledgeType?: string;
}

export class KnowledgeQaEmbedPreviewDto {
  text: string;
  model?: string;
}
