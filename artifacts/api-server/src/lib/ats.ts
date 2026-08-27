const ACTION_VERBS = ["achieved", "built", "delivered", "designed", "developed", "improved", "increased", "led", "managed", "optimized", "reduced", "streamlined"];
const SKILLS = ["aws", "azure", "docker", "excel", "figma", "git", "java", "javascript", "kubernetes", "node.js", "postgresql", "python", "react", "sql", "typescript"];
const STOP_WORDS = new Set(["about", "after", "also", "and", "are", "for", "from", "have", "into", "job", "role", "that", "the", "this", "with", "you", "your"]);

export type ParsedSections = Record<"contact" | "summary" | "skills" | "experience" | "education" | "certifications" | "projects", string[] | string>;

function normalize(value: string): string { return value.toLowerCase().replace(/\s+/g, " ").trim(); }
function words(value: string): string[] {
  return [...new Set(normalize(value).match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [])].filter((word) => !STOP_WORDS.has(word));
}
function score(value: number): number { return Math.max(0, Math.min(100, Math.round(value))); }

export function parseResumeSections(text: string): ParsedSections {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections: ParsedSections = { contact: [], summary: "", skills: [], experience: [], education: [], certifications: [], projects: [] };
  const headings: Record<string, keyof ParsedSections> = {
    "professional summary": "summary", summary: "summary", profile: "summary", skills: "skills",
    "technical skills": "skills", experience: "experience", "work experience": "experience",
    employment: "experience", education: "education", certifications: "certifications",
    certificates: "certifications", projects: "projects",
  };
  let current: keyof ParsedSections = "contact";
  for (const line of lines) {
    const key = headings[normalize(line).replace(/:$/, "")];
    if (key) { current = key; continue; }
    if (current === "summary") sections.summary = `${sections.summary} ${line}`.trim();
    else (sections[current] as string[]).push(line);
  }
  return sections;
}

export function analyzeResume(text: string, jobDescription: string, sections: ParsedSections) {
  const resume = normalize(text);
  const jobWords = words(jobDescription).filter((word) => word.length > 3);
  const matchedKeywords = jobWords.filter((word) => resume.includes(word));
  const missingKeywords = jobWords.filter((word) => !resume.includes(word)).slice(0, 30);
  const jobSkills = SKILLS.filter((skill) => normalize(jobDescription).includes(skill));
  const matchedSkills = jobSkills.filter((skill) => resume.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resume.includes(skill));
  const sectionChecks = Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, Array.isArray(value) ? value.length > 0 : value.length > 0]));
  const textWords = text.match(/\b[\w+#.-]+\b/g)?.length ?? 0;
  const density = textWords ? (matchedKeywords.length / textWords) * 100 : 0;
  const verbHits = ACTION_VERBS.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(text));
  const formattingIssues: string[] = [];
  if (text.length < 250) formattingIssues.push("Extracted resume text is very short; verify the document contains selectable text.");
  if (!sectionChecks.contact) formattingIssues.push("No contact block was detected.");
  if (!sectionChecks.experience) formattingIssues.push("No work experience heading was detected.");
  if (text.length > 12000) formattingIssues.push("Resume text is unusually long; keep content concise for readability.");
  const categoryScores = {
    keywordMatch: score((matchedKeywords.length / Math.max(jobWords.length, 1)) * 100),
    skillsMatch: jobSkills.length ? score((matchedSkills.length / jobSkills.length) * 100) : 100,
    formatting: score(100 - formattingIssues.length * 25),
    sectionCompleteness: score((Object.values(sectionChecks).filter(Boolean).length / 7) * 100),
    keywordDensity: score(Math.min(density * 50, 100)),
    impactActionVerbs: score((verbHits.length / 5) * 100),
  };
  const overallScore = score(Object.values(categoryScores).reduce((total, value) => total + value, 0) / 6);
  return { overallScore, categoryScores, matchedKeywords, missingKeywords, matchedSkills, missingSkills, formattingIssues, sectionChecks, keywordDensity: Number(density.toFixed(2)), actionVerbObservations: verbHits.length ? [`Found action verbs: ${verbHits.join(", ")}.`] : ["No common impact/action verbs were found."] };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}