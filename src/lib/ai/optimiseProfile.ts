import { GoogleGenAI } from "@google/genai";
import { User } from "../../types";

export async function optimiseProfile(rawProfile: Partial<User>) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are a professional career coach specialising in African and diaspora professionals navigating global job markets.

A job seeker has just filled in their profile. Your job is to optimise it so it:
1. Passes ATS keyword filters for their target roles
2. Positions their diaspora background as an asset, not a liability
3. Uses strong, active language that hiring managers respond to
4. Surfaces skills and experience that may be undersold

<raw_profile>
Name: ${rawProfile.displayName}
Current role: ${rawProfile.currentRole}
Current company: ${rawProfile.currentCompany}
Years of experience: ${rawProfile.yearsOfExperience}
Skills: ${(rawProfile.skills || []).join(", ")}
Bio: ${rawProfile.bio}
Industries: ${(rawProfile.industries || []).join(", ")}
Education: ${(rawProfile.education || []).map((e: any) => e.degree + ' at ' + e.institution).join("; ")}
Origin: ${rawProfile.originCity} → Current: ${rawProfile.currentCity}
</raw_profile>

Produce an optimised version of each field. For each change, provide a one-line reason.
Return ONLY valid JSON. No preamble, no markdown fences.

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
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
