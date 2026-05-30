// src/lib/ai/vetJob.ts
import { GoogleGenAI } from "@google/genai";
import { Job } from "../../types/index";

export async function vetJobWithGemini(job: Partial<Job>) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are a job listing safety system protecting African and diaspora job seekers from employment scams.

African job seekers face specific scam patterns. Known red flags:
- Company has no verifiable web presence or domain is less than 6 months old
- Salary is unrealistically high for the role, seniority level, and location
- Job description is vague — no specific responsibilities, just buzzwords
- Apply URL goes to a personal Gmail, Yahoo, or WhatsApp number
- Application asks for passport, national ID, or bank details upfront
- Requires the applicant to pay for "training materials", "background check", or "visa processing"
- Company name is very similar to a well-known company but slightly misspelled
- Asks for photo, marital status, religion, or other discriminatory information upfront
- No physical address, registered company number, or verifiable contact

<job_listing>
Title: ${job.title}
Company: ${job.company}
Company website: ${job.companyWebsite || "NOT PROVIDED"}
Location: ${job.location} (${job.locationType})
Salary: ${job.salaryMin ? `${job.salaryCurrency} ${job.salaryMin}–${job.salaryMax}` : "NOT SPECIFIED"}
Apply URL: ${job.applyUrl}
Source platform: ${job.source}
Description (first 1000 chars): ${job.description?.slice(0, 1000)}
</job_listing>

Analyse this listing thoroughly.

Return ONLY valid JSON. No preamble, no markdown fences.

{
  "legitimacyScore": number (0–100, where 100 = definitely legitimate, 0 = definite scam),
  "verdict": "approve" | "review" | "reject",
  "flags": string[] (specific red flags found — be precise, e.g. "No company website provided", "Salary 3x above market rate for role and location"),
  "reasoning": string (one clear sentence explaining your overall assessment),
  "riskLevel": "low" | "medium" | "high" | "critical"
}
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || '{}';
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}

