import { Injectable } from "@nestjs/common";
import { config } from "config";
import axios from "axios";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface EmbeddingRequest {
  model: string;
  input: string[];
}

export interface EmbeddingResponse {
  model: string;
  vectors: number[][];
}

@Injectable()
export class CustomAiService {
  private baseUrl: string;
  private apiKey: string;
  private defaultChatModel: string;
  private defaultEmbeddingModel: string;

  constructor() {
    this.baseUrl = config.customAi?.baseUrl || "";
    this.apiKey = config.customAi?.apiKey || "";
    this.defaultChatModel =
      config.customAi?.defaultChatModel ||
      config.customAi?.defaultModel ||
      "gpt-5.1";
    this.defaultEmbeddingModel =
      config.customAi?.defaultEmbeddingModel || "text-embedding-3-small";
  }

  getModels() {
    return config.customAi?.models || [];
  }

  getDefaultModel() {
    return this.getDefaultChatModel();
  }

  getDefaultChatModel() {
    return this.defaultChatModel;
  }

  getDefaultEmbeddingModel() {
    return this.defaultEmbeddingModel;
  }

  async chat(request: ChatCompletionRequest) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("Custom AI not configured");
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        responseType: "stream",
      },
    );

    return response;
  }

  async chatNoStream(request: ChatCompletionRequest) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("Custom AI not configured");
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        ...request,
        stream: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return response.data;
  }

  async embed(request: EmbeddingRequest) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("Custom AI not configured");
    }

    const response = await axios.post(
      `${this.baseUrl}/embeddings`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return response.data;
  }

  async embedTexts(texts: string[], model?: string) {
    const response = await this.embed({
      model: model || this.getDefaultEmbeddingModel(),
      input: texts,
    });
    const embeddings = Array.isArray(response?.data) ? response.data : [];
    return {
      model: response?.model || model || this.getDefaultEmbeddingModel(),
      vectors: embeddings.map((item) => item.embedding || []),
    } as EmbeddingResponse;
  }
}
