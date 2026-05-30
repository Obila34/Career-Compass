import { GoogleGenAI } from "@google/genai";
import { User } from "../../types";

export async function optimiseProfile(rawProfile: Partial<User>) {
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const systemPrompt = `You are an expert professional career coach specialising in African and diaspora professionals navigating global tech and corporate job markets.
Your task is to optimise a job seeker's profile to improve ATS passing rates, surface undersold skills, use strong active language, and position their international background as a unique asset.

Follow these rules:
1. Provide concrete, highly professional rewrites for the headline and bio.
2. Ensure you extract and suggest realistic, in-demand skills based on their background.
3. Your output MUST be ONLY valid JSON matching exactly this schema:

{
  "optimisedHeadline": string,
  "headlineReason": string,
  "optimisedBio": string,
  "bioReason": string,
  "suggestedSkillsToAdd": string[],
  "skillsReason": string,
  "optimisedSummary": string,
  "summaryReason": string,
  "diasporaPositioning": string,
  "profileStrengthBefore": number,
  "profileStrengthAfter": number,
  "topThreeImprovements": string[]
}

Do NOT include any preamble, markdown fences (\`\`\`json), or explanations.`;

  const prompt = `Please optimise the following profile:

<raw_profile>
Name: ${rawProfile.displayName}
Current role: ${rawProfile.currentRole}
Current company: ${rawProfile.currentCompany}
Years of experience: ${rawProfile.yearsOfExperience}
Skills: ${(rawProfile.skills || []).join(", ")}
Bio: ${rawProfile.bio}
Industries: ${(rawProfile.industries || []).join(", ")}
Education: ${(rawProfile.education || []).map((e: any) => e.degree + ' at ' + e.institution).join("; ")}
Origin: ${rawProfile.originCity} -> Current: ${rawProfile.currentCity}
</raw_profile>

Return the response strictly as structured JSON applying the required optimisations.`;

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
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
