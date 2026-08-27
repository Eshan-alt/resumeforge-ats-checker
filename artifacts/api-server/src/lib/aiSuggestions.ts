import { z } from "zod/v4";
import { openai } from "@workspace/integrations-openai-ai-server";

const SuggestionsSchema = z.object({
  improvements: z.array(z.string()).max(10),
  strongerActionVerbs: z.array(z.string()).max(12),
  optimizedSummary: z.string(),
  missingKeywordRecommendations: z.array(z.string()).max(20),
  rewrittenWeakBullets: z.array(z.string()).max(10),
});
export type Suggestions = z.infer<typeof SuggestionsSchema>;
const SAFE_REWRITE_WORDS = new Set([
  "achieved", "built", "collaborated", "created", "delivered", "designed", "developed",
  "drove", "enabled", "enhanced", "experienced", "expertise", "focused", "improved",
  "increased", "launched", "leading", "managed", "optimized", "professional", "proven",
  "reduced", "results", "skilled", "spearheaded", "streamlined", "strong", "using",
]);

function parseJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? content;
  return JSON.parse(fenced.trim());
}

function assertNoUnsupportedNumbers(output: string, source: string): void {
  const sourceNumbers = new Set(source.match(/\b\d[\d,.]*%?\b/g) ?? []);
  const unsupported = (output.match(/\b\d[\d,.]*%?\b/g) ?? []).filter((value) => !sourceNumbers.has(value));
  if (unsupported.length > 0) {
    throw new Error("AI output introduced unsupported numeric claims");
  }
}

function meaningfulWords(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []);
}

function assertGroundedVocabulary(output: string, source: string): void {
  assertNoUnsupportedNumbers(output, source);
  const sourceWords = meaningfulWords(source);
  const unsupported = [...meaningfulWords(output)].filter(
    (word) => !sourceWords.has(word) && !SAFE_REWRITE_WORDS.has(word),
  );
  if (unsupported.length > 0) {
    throw new Error(`AI output introduced unsupported claim vocabulary: ${unsupported.slice(0, 5).join(", ")}`);
  }
}

function isGroundedVocabulary(output: string, source: string): boolean {
  try {
    assertGroundedVocabulary(output, source);
    return true;
  } catch {
    return false;
  }
}

function existingSummary(resume: string): string {
  const lines = resume.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const summaryIndex = lines.findIndex((line) => /^(professional\s+)?(summary|profile):?$/i.test(line));
  if (summaryIndex >= 0) {
    const content = lines.slice(summaryIndex + 1).find((line) => !/^[A-Z][A-Z &/]{2,}:?$/.test(line));
    if (content) return content;
  }
  return lines.find((line) => line.length >= 40 && !line.includes("@")) ?? "Review the source resume summary before using AI-generated wording.";
}

export async function createSuggestions(resume: string, job: string): Promise<Suggestions> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.6-luna", max_completion_tokens: 8192,
    messages: [{ role: "system", content: "Return only JSON. Never invent qualifications, metrics, employers, tools, dates, or claims. Recommendations may reference the job description, but optimizedSummary and rewrittenWeakBullets must make claims only from the resume. For those rewrites, reuse the resume's meaningful vocabulary; only generic connective language and stronger action verbs may be added." },
      { role: "user", content: `Resume:\n${resume}\n\nJob description:\n${job}\n\nReturn {improvements:string[],strongerActionVerbs:string[],optimizedSummary:string,missingKeywordRecommendations:string[],rewrittenWeakBullets:string[]}. Rewrites must preserve only stated facts. If a safe rewrite is not possible, return the original source wording instead.` }],
  });
  const suggestions = SuggestionsSchema.parse(parseJson(response.choices[0]?.message?.content ?? ""));
  return {
    ...suggestions,
    optimizedSummary: isGroundedVocabulary(suggestions.optimizedSummary, resume)
      ? suggestions.optimizedSummary
      : existingSummary(resume),
    rewrittenWeakBullets: suggestions.rewrittenWeakBullets.filter((bullet) => isGroundedVocabulary(bullet, resume)),
  };
}

export async function rewriteBullet(bullet: string, resume: string, job: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.6-luna", max_completion_tokens: 8192,
    messages: [{ role: "system", content: "Return only a rewritten resume bullet. Preserve only facts in the supplied bullet; do not invent metrics or claims. Reuse the bullet's meaningful vocabulary; only generic connective language and stronger action verbs may be added. If a safe rewrite is not possible, return the original bullet." },
      { role: "user", content: `Bullet: ${bullet}\nResume context: ${resume}\nJob description: ${job}` }],
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("AI returned no rewritten bullet");
  const rewritten = content.replace(/^[-•]\s*/, "");
  return isGroundedVocabulary(rewritten, bullet) ? rewritten : bullet;
}