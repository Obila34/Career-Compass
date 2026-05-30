// src/lib/ai/scoreIntroPath.ts
import { GoogleGenAI } from "@google/genai";
import { User } from "../../types/index";

export async function scoreIntroPath(
  requester: Partial<User>,
  target: Partial<User>,
  connectors: Partial<User>[]
) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are the AI engine for Introd, a platform that facilitates warm introductions between African diaspora founders.

<requester>
Name: ${requester.displayName}
City: ${requester.currentCity}, Origin: ${requester.originCity}
Startup: ${requester.startupName} (${requester.startupStage})
Sector: ${requester.sector || "none"}
Accelerators: ${(requester.accelerators || []).join(", ") || "none"}
Looking for: ${(requester.lookingFor || []).join(", ")}
</requester>

<target>
Name: ${target.displayName}
City: ${target.currentCity}, Origin: ${target.originCity}
Startup: ${target.startupName} (${target.startupStage})
Sector: ${target.sector || "none"}
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

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  const text = result.text || '{}';
  const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}
