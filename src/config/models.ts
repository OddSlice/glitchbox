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
    id: 'gpt-4o-vision',
    name: 'GPT-4o Vision',
    provider: 'openai',
    apiKeyLabel: 'VITE_OPENAI_API_KEY',
    available: false,
  },
  {
    id: 'stability-sd3',
    name: 'Stability AI',
    provider: 'stability',
    apiKeyLabel: 'VITE_STABILITY_API_KEY',
    available: false,
  },
]
