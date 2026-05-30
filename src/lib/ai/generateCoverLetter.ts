import { GoogleGenAI } from "@google/genai";
import { User, Job } from "../../types";

export async function generateCoverLetter(
  user: User,
  job: Job,
  matchAnalysis: any,
  userNote?: string
) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are writing a cover letter for an African diaspora professional applying to a global role.

Rules for this cover letter:
- Maximum 3 paragraphs, each 2-3 sentences
- Paragraph 1: Why this role at this specific company excites them (NOT generic)
- Paragraph 2: Their most relevant experience with a specific metric or outcome if possible
- Paragraph 3: Why their diaspora background and cross-cultural experience is an asset for this role
- Tone: confident, warm, direct — like a sharp professional, not a grovelling applicant
- Never start with "I am writing to apply for" or "I am excited to apply"
- Never use phrases like "I believe I would be a great fit" — show, don't tell
- Include these keywords naturally: ${(matchAnalysis.keywordsToInclude || []).join(", ")}
- If the candidate provided a note about what to emphasise, use it: ${userNote || "none"}

<candidate>
Name: ${user.displayName}
Current role: ${user.currentRole} at ${user.currentCompany}
Top skills: ${(user.skills || []).slice(0, 5).join(", ")}
Origin → Current: ${user.originCity} → ${user.currentCity}
Bio highlights: ${user.bio}
</candidate>

<job>
Title: ${job.title} at ${job.company}
Key requirements: ${(job.requirements || []).slice(0, 4).join(", ")}
</job>

Return ONLY the cover letter text. No header, no date, no "Dear Hiring Manager", no sign-off.
The calling code will add those. Just the three paragraphs.
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  return result.text?.trim() || "";
}
