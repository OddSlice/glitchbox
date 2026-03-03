import OpenAI from 'openai'

export interface OpenAIEditResult {
  imageBase64: string
  mimeType: string
}

export async function editImageWithOpenAI(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  apiKey: string,
  modelId: string,
): Promise<OpenAIEditResult> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  // Convert base64 to a File object for the SDK
  const binaryStr = atob(imageBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  const file = new File([blob], 'image.png', { type: mimeType })

  const response = await client.images.edit({
    model: modelId,
    image: file,
    prompt,
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('OpenAI did not return an edited image. Try a different prompt.')
  }

  return {
    imageBase64: b64,
    mimeType: 'image/png',
  }
}
