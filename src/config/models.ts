export interface ModelConfig {
  id: string
  name: string
  provider: string
  apiKeyLabel: string
}

export const models: ModelConfig[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    apiKeyLabel: 'VITE_GEMINI_API_KEY',
  },
]
