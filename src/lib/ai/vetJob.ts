// src/lib/ai/vetJob.ts
import { VertexAI } from "@google-cloud/vertexai";
import { Job } from "../../types/index";

export async function vetJob(job: Partial<Job>) {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT env var is missing");
  }

  const vertexai = new VertexAI({ project, location });
  const model = vertexai.getGenerativeModel({ model: "gemini-2.5-pro-preview-0409" });

  const prompt = `
You are a job listing safety system for African and diaspora job seekers. Your job is to detect scam listings, vague postings, and illegitimate opportunities before they reach vulnerable users.

<job_listing>
Title: ${job.title}
Company: ${job.company}
Company website: ${job.companyWebsite || "not provided"}
Location: ${job.location} (${job.locationType})
Salary: ${job.salaryMin ? `${job.salaryCurrency} ${job.salaryMin}–${job.salaryMax}` : "not specified"}
Apply URL: ${job.applyUrl}
Description excerpt: ${(job.description || "").slice(0, 800)}
</job_listing>

Score this listing and identify any red flags. Known scam signals include:
- No company website or the domain is very new
- Salary unrealistically high for the role/location
- Vague job description with no real responsibilities
- Apply URL redirects to a generic email or WhatsApp
- Company name is not searchable or verifiable
- Requires upfront payment or personal financial details
- Excessive personal information requested at application stage

Return ONLY valid JSON. No preamble.

{
  "legitimacyScore": number (0–100, where 100 = definitely legitimate),
  "verdict": "approve" | "review" | "reject",
  "flags": string[] (specific red flags found, empty array if none),
  "reasoning": string (one sentence summary of your assessment)
}
  `.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}
