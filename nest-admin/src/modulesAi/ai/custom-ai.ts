import { Injectable } from '@nestjs/common'
import { config } from 'config'
import axios from 'axios'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

@Injectable()
export class CustomAiService {
  private baseUrl: string
  private apiKey: string
  private defaultModel: string

  constructor() {
    this.baseUrl = config.customAi?.baseUrl || ''
    this.apiKey = config.customAi?.apiKey || ''
    this.defaultModel = config.customAi?.defaultModel || 'gpt-5.1'
  }

  getModels() {
    return config.customAi?.models || []
  }

  getDefaultModel() {
    return this.defaultModel
  }

  async chat(request: ChatCompletionRequest) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Custom AI not configured')
    }

    const response = await axios.post(`${this.baseUrl}/chat/completions`, request, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      responseType: 'stream',
    })

    return response
  }

  async chatNoStream(request: ChatCompletionRequest) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Custom AI not configured')
    }

    const response = await axios.post(`${this.baseUrl}/chat/completions`, {
      ...request,
      stream: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    return response.data
  }
}