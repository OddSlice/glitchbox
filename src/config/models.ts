export interface ModelConfig {
  id: string
  name: string
  provider: string
  apiKeyLabel: string
  available: boolean
}

export const models: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    apiKeyLabel: 'VITE_GEMINI_API_KEY',
    available: true,
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash (Preview)',
    provider: 'google',
    apiKeyLabel: 'VITE_GEMINI_API_KEY',
    available: true,
  },
  {
    id: 'gpt-image-1.5',
    name: 'GPT Image 1.5',
    provider: 'openai',
    apiKeyLabel: 'VITE_OPENAI_API_KEY',
    available: false,
  },
  {
    id: 'seedream',
    name: 'Seedream',
    provider: 'seedream',
    apiKeyLabel: 'VITE_SEEDREAM_API_KEY',
    available: false,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    provider: 'qwen',
    apiKeyLabel: 'VITE_QWEN_API_KEY',
    available: false,
  },
]
