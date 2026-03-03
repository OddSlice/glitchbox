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

const STYLE_TRANSFER_SYSTEM_PROMPT = `You are an expert image style analyst and creative director with deep knowledge of visual art, photography, graphic design, and digital art. Your task is to perform a precise two-step operation.
STEP 1 — STYLE ANALYSIS: Analyse the style reference image in exhaustive detail. Extract and describe every visual characteristic including: color palette (dominant colors, accent colors, shadow tones, highlight tones, exact mood of the palette), texture and grain (film grain, noise, smoothness, grit level), lighting style (hard/soft, directional, ambient, dramatic, flat), contrast and tonal range (high contrast, low contrast, crushed blacks, blown highlights, matte finish), color grading style (warm/cool bias, color shifts in shadows vs highlights, any cross-processing), artistic style (photographic realism, illustration, graphic design, painterly, retro, futuristic, cinematic), edge treatment (sharp, soft, halftone, dithered, glitchy), any special effects present (lens flare, chromatic aberration, scan lines, vignette, bloom, dither patterns, glitch artifacts), and overall mood and atmosphere.
STEP 2 — STYLE APPLICATION: Apply every characteristic you identified in Step 1 to the source image with precision. Preserve the content, composition, and subjects of the source image exactly — do not alter what is in the image, only how it looks. Transform the source image so it looks as if it was created in the exact same visual style, color world, and aesthetic as the style reference. Be aggressive and thorough — a subtle result is a failure. The output should make someone immediately say 'these two images share the same visual DNA'.
Return only the transformed image. No text, no explanation, no markdown.`

export async function styleTransferWithGemini(
  sourceBase64: string,
  sourceMimeType: string,
  styleBase64: string,
  styleMimeType: string,
  apiKey: string,
  modelId: string,
): Promise<GeminiEditResult> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: modelId,
    config: {
      systemInstruction: STYLE_TRANSFER_SYSTEM_PROMPT,
    },
    contents: [
      { text: 'The first image is the source image. The second image is the style reference. Apply the style of the second image to the first image.' },
      {
        inlineData: {
          data: sourceBase64,
          mimeType: sourceMimeType,
        },
      },
      {
        inlineData: {
          data: styleBase64,
          mimeType: styleMimeType,
        },
      },
    ],
  })

  const parts = response.candidates?.[0]?.content?.parts

  if (!parts || parts.length === 0) {
    throw new Error('No response received from Gemini')
  }

  const imagePart = parts.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/'),
  )

  if (imagePart?.inlineData) {
    return {
      imageBase64: imagePart.inlineData.data!,
      mimeType: imagePart.inlineData.mimeType!,
    }
  }

  const textPart = parts.find((part: any) => part.text)
  throw new Error(
    textPart?.text || 'Style transfer failed. Gemini did not return an image.',
  )
}
