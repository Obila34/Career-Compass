import { GoogleGenAI } from "@google/genai";

export async function importFromLinkedInUrl(linkedinUrl: string) {
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const systemPrompt = `You are a career profile extraction assistant. Your task is to extract structured career data from a LinkedIn profile.

Follow these rules:
1. Extract ALL fields listed in the JSON schema.
2. If a field cannot be determined, use null (or an empty array for lists).
3. Do NOT include any preamble, markdown fences (\`\`\`json), or explanations.
4. Respond ONLY with valid JSON matching exactly this schema:

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
  "lookingFor": string[]
}`;

  const prompt = `Visit this LinkedIn profile URL using Google Search and extract the person's professional information:
<linkedin_url>${linkedinUrl}</linkedin_url>

Extract the profile data as a JSON object according to the system instructions.`;

  try {
    const result = await ai.models.generateContent({ 
      model: modelId, 
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }]
      }
    });
    const text = result.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e: any) {
    throw new Error("Could not extract LinkedIn profile. Please use the manual text paste option.");
  }
}
