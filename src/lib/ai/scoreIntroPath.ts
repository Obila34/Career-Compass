// src/lib/ai/scoreIntroPath.ts
import { VertexAI } from "@google-cloud/vertexai";
import { User } from "../../types/index";

export async function scoreIntroPath(
  requester: Partial<User>,
  target: Partial<User>,
  connectors: Partial<User>[]
) {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT env var is missing");
  }

  const vertexai = new VertexAI({ project, location });
  const model = vertexai.getGenerativeModel({ model: "gemini-2.5-pro-preview-0409" });

  const prompt = `
You are the AI engine for Introd, a platform that facilitates warm introductions between African diaspora founders.

<requester>
Name: ${requester.displayName}
City: ${requester.currentCity}, Origin: ${requester.originCity}
Startup: ${requester.startupName} (${requester.startupStage})
Sector: ${(requester.sector || []).join(", ")}
Accelerators: ${(requester.accelerators || []).join(", ") || "none"}
Looking for: ${(requester.lookingFor || []).join(", ")}
</requester>

<target>
Name: ${target.displayName}
City: ${target.currentCity}, Origin: ${target.originCity}
Startup: ${target.startupName} (${target.startupStage})
Sector: ${(target.sector || []).join(", ")}
Accelerators: ${(target.accelerators || []).join(", ") || "none"}
</target>

<connector_chain>
${connectors.map((c, i) => `Hop ${i + 1}: ${c.displayName} — ${c.currentCity}, ${c.startupName}, ${(c.accelerators || []).join(", ") || "no accelerators"}`).join("\n")}
</connector_chain>

Analyse the strength of this intro path. Consider: shared origin cities, shared accelerator batches, sector alignment, current city overlap, and connector relevance.

Return ONLY valid JSON. No preamble or explanation.

{
  "strengthScore": number (0–100),
  "strengthLabel": "weak" | "moderate" | "strong" | "very strong",
  "sharedContext": string[] (list of specific shared signals, e.g. "Both YC W22 alumni"),
  "explanation": string (2–3 sentences in warm, direct tone explaining why this path is strong and why the target is likely to accept),
  "suggestedApproach": string (one sentence on the best angle for the intro)
}
  `.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}
