import { GoogleGenAI } from "@google/genai";

export async function enrichFromText(rawText: string) {
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const systemPrompt = `You are a career profile extraction assistant for a job seeker platform serving African and diaspora professionals.
Your task is to extract structured career profile data from user-provided text (CVs, LinkedIn About sections, or unstructured bios).

Follow these rules:
1. Extract ALL fields listed in the JSON schema.
2. If a field cannot be determined from the text, use null (or an empty array for lists).
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

  const text = result.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function enrichFromFileBuffer(buffer: Buffer, mimeType: string) {
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const systemPrompt = `You are a career profile extraction assistant for a job seeker platform serving African and diaspora professionals.
Your task is to extract structured career profile data from user-provided documents (CVs, resumes).

Follow these rules:
1. Extract ALL fields listed in the JSON schema.
2. If a field cannot be determined from the text, use null (or an empty array for lists).
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
  "lookingFor": string[]
}`;

  const prompt = `Extract the profile data from the attached document as a JSON object according to the system instructions.`;

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
    ],
    config: {
      systemInstruction: systemPrompt
    }
  });
  const text = result.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
