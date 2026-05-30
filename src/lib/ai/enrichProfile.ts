// src/lib/ai/enrichProfile.ts
import { GoogleGenAI } from "@google/genai";

export async function enrichProfile(rawText: string) {
  // If GOOGLE_CLOUD_PROJECT is absent, we can fall back to standard Gemini genai SDK 
  // if you want to use the free tier key from AI Studio, but instructions state Vertex AI strictly.
  // We'll initialize Vertex AI properly. 
  // NOTE: This usually requires Google Cloud Application Default Credentials on your server environment.
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash"; // Use the 2.5 pro version

  const prompt = `
You are extracting structured profile data for an African diaspora founders platform.

<raw_input>
${rawText}
</raw_input>

Extract the following fields. If a field cannot be determined, use null.
Return ONLY valid JSON. No preamble, no explanation, no markdown fences.

{
  "displayName": string | null,
  "headline": string | null,
  "startupName": string | null,
  "startupStage": "idea" | "pre-seed" | "seed" | "series-a" | "growth" | null,
  "sector": string[],
  "originCity": string | null,
  "currentCity": string | null,
  "currentCountry": string | null,
  "accelerators": string[],
  "lookingFor": ("investor" | "cofounder" | "customer" | "advisor" | "talent")[]
}
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || '{}';
  // Strip potential markdown JSON fences if Gemini disobeyed
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}
