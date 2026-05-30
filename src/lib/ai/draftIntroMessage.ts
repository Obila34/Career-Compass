// src/lib/ai/draftIntroMessage.ts
import { GoogleGenAI } from "@google/genai";
import { User } from "../../types/index";

export async function draftIntroMessage(
  requester: Partial<User>,
  target: Partial<User>,
  connector: Partial<User>,
  sharedContext: string[],
  requesterIntent: string
) {
      
  
  const ai = new GoogleGenAI({});
  const modelId = "gemini-2.5-flash";

  const prompt = `
You are writing a warm introduction message for an African diaspora founders platform.

Context:
- ${requester.displayName} wants an intro to ${target.displayName}
- The intro will be sent by their mutual connection ${connector.displayName}
- Shared context: ${sharedContext.join("; ")}
- What ${requester.displayName} wants from this intro: ${requesterIntent}

Write a short, warm, direct introduction message that ${connector.displayName} can forward to ${target.displayName}.

Rules:
- Maximum 4 sentences
- Sound like a real person, not a bot or corporate email
- Reference at least one piece of shared context naturally
- End with a clear, low-friction ask (a 20-minute call, not a long meeting)
- Do NOT start with "I hope this email finds you well" or any filler opener
- Do NOT include a subject line

Return ONLY the message text. No labels, no JSON, no explanation.
  `.trim();

  const result = await ai.models.generateContent({ model: modelId, contents: prompt });
  return result.text?.trim() || '';
}
