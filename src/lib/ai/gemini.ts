import { GoogleGenAI } from '@google/genai'

export interface GeminiEditResult {
  imageBase64: string
  mimeType: string
}

export async function editImageWithGemini(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  apiKey: string,
  modelId: string,
): Promise<GeminiEditResult> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [
      { text: `Edit this image: ${prompt}` },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ],
  })

  const parts = response.candidates?.[0]?.content?.parts

  if (!parts || parts.length === 0) {
    throw new Error('No response received from Gemini')
  }

  // Find the image part in the response
  const imagePart = parts.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/'),
  )

  if (imagePart?.inlineData) {
    return {
      imageBase64: imagePart.inlineData.data!,
      mimeType: imagePart.inlineData.mimeType!,
    }
  }

  // No image returned — extract text as error message
  const textPart = parts.find((part: any) => part.text)
  throw new Error(
    textPart?.text || 'Gemini did not return an edited image. Try a different prompt.',
  )
}
