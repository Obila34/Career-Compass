import { GoogleGenAI } from "@google/genai";
import { User, Job } from "../../types";

export async function analyseJobMatch(user: User, job: Job) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are an honest career advisor for African diaspora professionals. Do not sugarcoat.

<candidate>
Role: ${user.currentRole} | Seniority: ${user.seniority} | YOE: ${user.yearsOfExperience}
Skills: ${(user.skills || []).join(", ")}
Industries: ${(user.industries || []).join(", ")}
Education: ${(user.education || []).map((e: any) => e.degree + ' - ' + e.institution).join("; ")}
Current city: ${user.currentCity} | Origin: ${user.originCity}
Salary expectation: ${user.salaryExpectationUSD ? '$' + user.salaryExpectationUSD : "not specified"}
</candidate>

<job>
Title: ${job.title} at ${job.company}
Location: ${job.location} (${job.locationType})
Salary: ${job.salaryMin ? job.salaryCurrency + ' ' + job.salaryMin + '-' + job.salaryMax : "not specified"}
Requirements: ${(job.requirements || []).join(", ")}
</job>

Be specific. Be honest. Reference exact skills and requirements by name.
Return ONLY valid JSON. No preamble.

{
  "matchScore": number (0-100),
  "matchLabel": "weak match" | "fair match" | "good match" | "strong match" | "excellent match",
  "whyApply": string[] (3 specific reasons this role fits this candidate),
  "honestGaps": string[] (2-3 honest gaps — name specific skills or requirements they lack),
  "salaryFit": "below expectations" | "within range" | "above expectations" | "unknown",
  "applicationAdvice": string (one sentence of specific, actionable advice for this application),
  "keywordsToInclude": string[] (5-7 keywords from the JD the candidate should use in their cover letter)
}
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
