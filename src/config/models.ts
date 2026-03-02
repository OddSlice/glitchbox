export interface ModelConfig {
  id: string
  name: string
  provider: string
  apiKeyLabel: string
}

export const models: ModelConfig[] = [
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash',
    provider: 'google',
    apiKeyLabel: 'VITE_GEMINI_API_KEY',
  },
]
