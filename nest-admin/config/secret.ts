export const secret = {
  hunyuan: {
    appid: '',
    secretId: '',
    secretKey: '',
  },

  // 自定义模型商 (OpenAI 兼容)
  customAi: {
    baseUrl: 'https://sub.gpt.sulme.xx.kg/v1',
    apiKey: 'sk-2254d0733ade2d76b43b4095e24bde3af7b92ed4cd6be6399b6f6bf0851a67e1',
    models: [
      { id: 'gpt-5.1', name: 'GPT-5.1' },
      { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
      { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max' },
      { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex' },
      { id: 'gpt-5.3', name: 'GPT-5.3' },
      { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex' },
      { id: 'gpt-5.4', name: 'GPT-5.4' },
    ],
    defaultModel: 'gpt-5.1',
  },

  prod: {
    database: {
      password: '',
    },
  },
}
