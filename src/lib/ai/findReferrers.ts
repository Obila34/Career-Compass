import { GoogleGenAI } from "@google/genai";
import { User, Job } from "../../types";

export async function findAndRankReferrers(
  applicant: User,
  job: Job,
  allUsers: User[]
) {
  // Step 1: Find direct insiders (people who work at the company)
  const insiders = allUsers.filter(u =>
    u.currentCompany?.toLowerCase() === job.company.toLowerCase() &&
    u.uid !== applicant.uid
  );

  if (insiders.length === 0) return [];

  // Step 2: For each insider, calculate shared context
  const ranked = await Promise.all(insiders.map(async (insider) => {
    const sharedContext = computeSharedContext(applicant, insider);
    const message = await generateReferralAsk(applicant, insider, job, sharedContext);
    return {
      user: insider,
      sharedContext,
      referralMessage: message,
      connectionStrength: sharedContext.length * 20 + (insider.isVerified ? 10 : 0),
    };
  }));

  return ranked.sort((a, b) => b.connectionStrength - a.connectionStrength);
}

function computeSharedContext(a: User, b: User): string[] {
  const signals: string[] = [];
  if (a.originCity && b.originCity && a.originCity?.toLowerCase() === b.originCity?.toLowerCase())
    signals.push(`Both originally from ${a.originCity}`);
  if (a.currentCity && b.currentCity && a.currentCity?.toLowerCase() === b.currentCity?.toLowerCase())
    signals.push(`Both currently in ${a.currentCity}`);
  const sharedSkills = a.skills?.filter(s => b.skills?.includes(s)) || [];
  if (sharedSkills.length > 0)
    signals.push(`Shared skills: ${sharedSkills.slice(0, 2).join(", ")}`);
  const sharedIndustries = a.industries?.filter(i => b.industries?.includes(i)) || [];
  if (sharedIndustries.length > 0)
    signals.push(`Both work in ${sharedIndustries[0]}`);
  return signals;
}

export async function generateReferralAsk(
  applicant: User,
  referrer: User,
  job: Job,
  sharedContext: string[]
) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
Write a short, warm message from ${applicant.displayName} to ${referrer.displayName} asking for a job referral.

Context:
- ${applicant.displayName} is applying for: ${job.title} at ${job.company}
- ${referrer.displayName} works at ${referrer.currentCompany} (${job.company})
- Shared context between them: ${sharedContext.join("; ")}

Message rules:
- Maximum 4 sentences
- Sound like a genuine human reaching out, not a template
- Reference one piece of shared context naturally
- Make a specific, easy ask: "Would you be willing to put my name forward?"
- Do NOT start with "I hope this finds you well" or any filler
- Warm, peer-to-peer tone — they are from the same community

Return ONLY the message text. Nothing else.
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  return result.text?.trim() || "";
}
