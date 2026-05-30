// src/lib/ai/enrichProfile.ts
import { GoogleGenAI } from "@google/genai";

export async function enrichProfile(rawText: string) {
  // If GOOGLE_CLOUD_PROJECT is absent, we can fall back to standard Gemini genai SDK 
  // if you want to use the free tier key from AI Studio, but instructions state Vertex AI strictly.
  // We'll initialize Vertex AI properly. 
  // NOTE: This usually requires Google Cloud Application Default Credentials on your server environment.
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash"; // Use the 2.5 pro version

  const systemPrompt = `You are a career profile extraction assistant for an African diaspora founders and professionals platform.
Your task is to extract structured profile data from user-provided text.

Follow these rules:
1. Extract ALL fields listed in the JSON schema.
2. If a field cannot be determined, use null (or an empty array for lists).
3. Do NOT include any preamble, markdown fences (\`\`\`json), or explanations.
4. Respond ONLY with valid JSON matching exactly this schema:

{
  "displayName": string | null,
  "headline": string | null,
  "startupName": string | null,
  "startupStage": string | null,
  "sector": string[],
  "originCity": string | null,
  "currentCity": string | null,
  "currentCountry": string | null,
  "accelerators": string[],
  "lookingFor": string[]
}`;

  const prompt = `<document>
${rawText}
</document>

Extract the profile data from the document above as a JSON object according to the system instructions.`;

  const result = await ai.models.generateContent({ 
    model: modelId, 
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: systemPrompt
    }
  });

  const text = result.text || '{}';
  const cleanJson = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
}
