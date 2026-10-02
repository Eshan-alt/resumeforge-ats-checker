import OpenAI from "openai";

let client: OpenAI | undefined;
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI suggestions are not configured. Set OPENAI_API_KEY.");
  return client ??= new OpenAI({ apiKey, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined });
}
