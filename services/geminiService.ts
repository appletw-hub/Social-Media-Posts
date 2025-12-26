
import { GoogleGenAI } from "@google/genai";
import { PlatformType, Resolution } from "../types";

export const generateSocialImages = async (
  prompt: string,
  platform: PlatformType,
  resolution: Resolution,
  style: string,
  count: number
): Promise<string[]> => {
  // Always create a new instance to ensure we pick up the latest selected key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fullPrompt = `Create a high-quality social media visual. 
    Subject: ${prompt}. 
    Style: ${style}. 
    The image should be aesthetic, modern, and suitable for social media sharing. 
    Avoid cluttered text in the image.`;

  const results: string[] = [];

  // Currently, Gemini image models typically generate one at a time via generateContent
  // We loop for the requested count
  for (let i = 0; i < count; i++) {
    // Using gemini-3-pro-image-preview for high-quality images and real-time info tools
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: platform,
          imageSize: resolution
        },
        // For gemini-3-pro-image-preview, the search tool is named google_search as per guidelines
        tools: [{ google_search: {} }] 
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      // Find the image part, do not assume it is the first part.
      if (part.inlineData) {
        results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
  }

  return results;
};

export const generateCaption = async (topic: string, style: string): Promise<string> => {
  // Always create a new instance to ensure it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `請為這張主題為「${topic}」且風格為「${style}」的社群貼文撰寫一段吸引人的繁體中文文案。包含 3-5 個相關的 Hashtags。`,
  });
  // Use .text property directly to extract content as per guidelines
  return response.text || "";
};
