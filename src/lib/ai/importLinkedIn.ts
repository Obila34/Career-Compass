import { GoogleGenAI } from "@google/genai";

export async function importFromLinkedInUrl(linkedinUrl: string) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
Visit this LinkedIn profile URL and extract the person's professional information: ${linkedinUrl}

Extract ALL of the following fields. If a field is not visible or cannot be determined, use null.
Return ONLY valid JSON. No preamble, no explanation, no markdown fences.

{
  "displayName": string | null,
  "headline": string | null,
  "currentRole": string | null,
  "currentCompany": string | null,
  "currentCity": string | null,
  "currentCountry": string | null,
  "originCity": string | null,
  "bio": string | null,
  "skills": string[],
  "experience": [
    {
      "title": string,
      "company": string,
      "startYear": number | null,
      "endYear": number | null,
      "isCurrent": boolean
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string | null,
      "graduationYear": number | null
    }
  ],
  "certifications": string[],
  "languages": string[],
  "yearsOfExperience": number | null,
  "seniority": "entry" | "mid" | "senior" | "lead" | "executive" | null,
  "industries": string[],
  "lookingFor": ("new-role" | "freelance" | "advisory" | "cofounder")[]
}
  `.trim();

  try {
    const result = await ai.models.generateContent({ 
      model: modelId, 
      contents: prompt,
      tools: [{ googleSearch: {} }] 
    });
    const text = result.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e: any) {
    throw new Error("Could not extract LinkedIn profile. Please use the manual text paste option.");
  }
}
