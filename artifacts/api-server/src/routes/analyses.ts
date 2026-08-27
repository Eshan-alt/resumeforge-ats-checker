import { Router, type IRouter } from "express";
import multer from "multer";
import mammoth from "mammoth";
import { and, desc, eq } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  CreateAnalysisResponse, DeleteAnalysisParams, GenerateAnalysisAiSuggestionsParams,
  GenerateAnalysisAiSuggestionsResponse, GetAnalysisParams, GetAnalysisResponse,
  ListAnalysesResponse, RewriteAnalysisBulletBody, RewriteAnalysisBulletParams,
  RewriteAnalysisBulletResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { analyzeResume, escapeHtml, parseResumeSections } from "../lib/ats";
import { createSuggestions, rewriteBullet } from "../lib/aiSuggestions";

const router: IRouter = Router();
const MAX_EXTRACTED_TEXT_LENGTH = 100_000;
const MAX_JOB_DESCRIPTION_LENGTH = 50_000;
const MAX_DOCX_ENTRIES = 2_000;
const MAX_DOCX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype)),
});

function serialize(row: typeof analysesTable.$inferSelect) {
  const deterministicResults = row.deterministicResults as ReturnType<typeof analyzeResume>;
  return {
    id: row.id, filename: row.filename, mimeType: row.mimeType, status: row.status,
    overallScore: deterministicResults.overallScore, extractedText: row.extractedText,
    jobDescription: row.jobDescription, parsedSections: row.parsedSections,
    deterministicResults, aiSuggestions: row.aiSuggestions,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function validateDocxContainer(buffer: Buffer): void {
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) throw new Error("Invalid DOCX signature");
  let cursor = 0;
  let entries = 0;
  let uncompressedBytes = 0;
  let hasContentTypes = false;
  let hasDocument = false;

  while (cursor <= buffer.length - 46) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      cursor += 1;
      continue;
    }
    entries += 1;
    if (entries > MAX_DOCX_ENTRIES) throw new Error("DOCX contains too many entries");
    uncompressedBytes += buffer.readUInt32LE(cursor + 24);
    if (uncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) throw new Error("DOCX expands beyond the safe limit");
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (name === "[Content_Types].xml") hasContentTypes = true;
    if (name === "word/document.xml") hasDocument = true;
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  if (!hasContentTypes || !hasDocument) throw new Error("DOCX structure is incomplete");
}

function validateFileSignature(file: Express.Multer.File): void {
  if (file.mimetype === "application/pdf") {
    const header = file.buffer.subarray(0, Math.min(file.buffer.length, 1024)).toString("latin1");
    if (!header.includes("%PDF-")) throw new Error("Invalid PDF signature");
    return;
  }
  validateDocxContainer(file.buffer);
}

async function extractText(file: Express.Multer.File): Promise<string> {
  validateFileSignature(file);
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value;
  }
  const { extractText: getPdfText } = await import("unpdf");
  const extracted = await getPdfText(new Uint8Array(file.buffer), { mergePages: true });
  return Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text;
}
async function owned(id: number, ownerId: string) {
  const [row] = await db.select().from(analysesTable).where(and(eq(analysesTable.id, id), eq(analysesTable.ownerId, ownerId)));
  return row;
}

router.use(requireAuth);
router.get("/analyses", async (req, res): Promise<void> => {
  const rows = await db.select().from(analysesTable).where(eq(analysesTable.ownerId, req.userId!)).orderBy(desc(analysesTable.updatedAt));
  res.json(ListAnalysesResponse.parse(rows.map((row) => {
    const item = serialize(row);
    return { id: item.id, filename: item.filename, mimeType: item.mimeType, status: item.status, overallScore: item.overallScore, createdAt: item.createdAt, updatedAt: item.updatedAt };
  })));
});
router.post("/analyses", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "Upload one PDF or DOCX file (maximum 10 MB)." }); return; }
  const jobDescription = typeof req.body.jobDescription === "string" ? req.body.jobDescription.trim() : "";
  if (!jobDescription) { res.status(400).json({ error: "jobDescription is required." }); return; }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) { res.status(400).json({ error: "Job description exceeds the 50,000 character limit." }); return; }
  let text: string;
  try { text = (await extractText(req.file)).replace(/\u0000/g, "").trim(); }
  catch (err) { req.log.warn({ err, mimeType: req.file.mimetype }, "Resume extraction failed"); res.status(400).json({ error: "The uploaded document could not be read safely." }); return; }
  if (!text) { res.status(400).json({ error: "The uploaded document contains no extractable text." }); return; }
  if (text.length > MAX_EXTRACTED_TEXT_LENGTH) { res.status(400).json({ error: "Extracted resume text exceeds the 100,000 character limit." }); return; }
  const parsedSections = parseResumeSections(text);
  const deterministicResults = analyzeResume(text, jobDescription, parsedSections);
  const [row] = await db.insert(analysesTable).values({ ownerId: req.userId!, filename: req.file.originalname, mimeType: req.file.mimetype, extractedText: text, jobDescription, parsedSections, deterministicResults, status: "complete" }).returning();
  res.status(201).json(CreateAnalysisResponse.parse(serialize(row)));
});
router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const row = await owned(params.data.id, req.userId!);
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  res.json(GetAnalysisResponse.parse(serialize(row)));
});
router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(analysesTable).where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.ownerId, req.userId!))).returning();
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  res.sendStatus(204);
});
router.post("/analyses/:id/ai-suggestions", async (req, res): Promise<void> => {
  const params = GenerateAnalysisAiSuggestionsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const row = await owned(params.data.id, req.userId!);
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  try {
    const suggestions = await createSuggestions(row.extractedText, row.jobDescription);
    const [updated] = await db.update(analysesTable).set({ aiSuggestions: suggestions }).where(eq(analysesTable.id, row.id)).returning();
    res.json(GenerateAnalysisAiSuggestionsResponse.parse(updated.aiSuggestions));
  } catch (err) { req.log.error({ err, analysisId: row.id }, "AI suggestions failed"); res.status(502).json({ error: "AI suggestions are temporarily unavailable. Please try again." }); }
});
router.post("/analyses/:id/rewrite-bullet", async (req, res): Promise<void> => {
  const params = RewriteAnalysisBulletParams.safeParse(req.params);
  const body = RewriteAnalysisBulletBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const row = await owned(params.data.id, req.userId!);
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  if (!row.extractedText.toLowerCase().replace(/\s+/g, " ").includes(body.data.bullet.toLowerCase().replace(/\s+/g, " "))) {
    res.status(400).json({ error: "The bullet must come from this resume." });
    return;
  }
  try { res.json(RewriteAnalysisBulletResponse.parse({ rewrittenBullet: await rewriteBullet(body.data.bullet, row.extractedText, row.jobDescription) })); }
  catch (err) { req.log.error({ err, analysisId: row.id }, "Bullet rewrite failed"); res.status(502).json({ error: "Bullet rewrite is temporarily unavailable. Please try again." }); }
});
router.get("/analyses/:id/report", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const row = await owned(params.data.id, req.userId!);
  if (!row) { res.status(404).json({ error: "Analysis not found" }); return; }
  const analysis = serialize(row);
  const report = `<!doctype html><html><head><meta charset="utf-8"><title>ATS report</title><style>body{font-family:Arial;max-width:850px;margin:36px auto;color:#172033}h1{color:#164e63}.score{font-size:48px;font-weight:bold}pre{white-space:pre-wrap;background:#f1f5f9;padding:16px}</style></head><body><h1>ATS Resume Report</h1><p>${escapeHtml(analysis.filename)}</p><div class="score">${analysis.overallScore}/100</div><h2>Deterministic analysis</h2><pre>${escapeHtml(JSON.stringify(analysis.deterministicResults, null, 2))}</pre>${analysis.aiSuggestions ? `<h2>AI suggestions</h2><pre>${escapeHtml(JSON.stringify(analysis.aiSuggestions, null, 2))}</pre>` : ""}</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="ats-report-${row.id}.html"`); res.send(report);
});
export default router;