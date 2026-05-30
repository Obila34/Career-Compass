import { GoogleGenAI } from "@google/genai";

export async function enrichFromText(rawText: string) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are extracting structured career profile data for a job seeker platform serving African and diaspora professionals.

<raw_input>
${rawText}
</raw_input>

The input may be a CV, a LinkedIn "About" section, a bio, or any unstructured career text.
Extract ALL fields below. Use null for anything that cannot be determined.
Return ONLY valid JSON. No preamble, no markdown fences, no explanation.

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
      "isCurrent": boolean,
      "description": string | null
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
  "salaryExpectationUSD": number | null,
  "lookingFor": ("new-role" | "freelance" | "advisory" | "cofounder")[]
}
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function enrichFromFileBuffer(buffer: Buffer, mimeType: string) {
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are extracting structured career profile data for a job seeker platform serving African and diaspora professionals.

The input is a structured document (e.g. CV).
Extract ALL fields below. Use null for anything that cannot be determined.
Return ONLY valid JSON. No preamble, no markdown fences, no explanation.

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
      "isCurrent": boolean,
      "description": string | null
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
  "salaryExpectationUSD": number | null,
  "lookingFor": ("new-role" | "freelance" | "advisory" | "cofounder")[]
}
  `.trim();

  const result = await ai.models.generateContent({ 
    model: modelId, 
    contents: [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType
        }
      },
      prompt
    ] 
  });
  const text = result.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
