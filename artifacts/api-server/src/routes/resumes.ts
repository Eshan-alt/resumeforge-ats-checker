import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import {
  ListResumesResponse,
  CreateResumeBody,
  CreateResumeResponse,
  GetResumeParams,
  GetResumeResponse,
  UpdateResumeParams,
  UpdateResumeBody,
  UpdateResumeResponse,
  DeleteResumeParams,
  GetResumeScoreParams,
  GetResumeScoreResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serializeRow<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /resumes — list all resumes (summary only)
router.use(requireAuth);
router.get("/resumes", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: resumesTable.id,
      title: resumesTable.title,
      createdAt: resumesTable.createdAt,
      updatedAt: resumesTable.updatedAt,
    })
    .from(resumesTable)
    .where(eq(resumesTable.ownerId, req.userId!))
    .orderBy(desc(resumesTable.updatedAt));

  res.json(ListResumesResponse.parse(rows.map(serializeRow)));
});

// POST /resumes — create a new resume
router.post("/resumes", async (req, res): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(resumesTable)
    .values({
      title: parsed.data.title,
      data: parsed.data.data as Record<string, unknown>,
      ownerId: req.userId!,
    })
    .returning();

  res.status(201).json(CreateResumeResponse.parse(serializeRow(row)));
});

// GET /resumes/:id — get a resume
router.get("/resumes/:id", async (req, res): Promise<void> => {
  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.ownerId, req.userId!)));

  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(GetResumeResponse.parse(serializeRow(row)));
});

// PUT /resumes/:id — update a resume
router.put("/resumes/:id", async (req, res): Promise<void> => {
  const params = UpdateResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(resumesTable)
    .set({
      title: parsed.data.title,
      data: parsed.data.data as Record<string, unknown>,
    })
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.ownerId, req.userId!)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(UpdateResumeResponse.parse(serializeRow(row)));
});

// DELETE /resumes/:id — delete a resume
router.delete("/resumes/:id", async (req, res): Promise<void> => {
  const params = DeleteResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.ownerId, req.userId!)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /resumes/:id/score — compute ATS score
router.get("/resumes/:id/score", async (req, res): Promise<void> => {
  const params = GetResumeScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.ownerId, req.userId!)));

  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const data = row.data as {
    personalInfo?: {
      fullName?: string;
      email?: string;
      phone?: string;
      summary?: string;
      linkedIn?: string;
    };
    workExperience?: Array<{ bullets?: string[]; company?: string; title?: string }>;
    education?: unknown[];
    skills?: Array<{ items?: string[] }>;
    projects?: unknown[];
    certifications?: unknown[];
  };

  type ScoreTip = { section: string; message: string; severity: "info" | "warning" | "error" };
  const tips: ScoreTip[] = [];
  let score = 0;
  const maxScore = 100;

  // Personal info checks (20 pts)
  const pi = data.personalInfo;
  if (pi?.fullName) score += 4;
  if (pi?.email) score += 4;
  if (pi?.phone) score += 4;
  if (pi?.summary && pi.summary.length >= 50) {
    score += 8;
  } else if (pi?.summary) {
    score += 4;
    tips.push({ section: "Summary", message: "Expand your professional summary to at least 50 characters for better ATS visibility.", severity: "warning" });
  } else {
    tips.push({ section: "Summary", message: "Add a professional summary to help ATS systems categorize your profile.", severity: "error" });
  }
  if (!pi?.linkedIn) {
    tips.push({ section: "Personal Info", message: "Adding a LinkedIn URL increases recruiter confidence and ATS profile completeness.", severity: "info" });
  }

  // Work experience checks (30 pts)
  const work = data.workExperience ?? [];
  if (work.length === 0) {
    tips.push({ section: "Work Experience", message: "Add at least one work experience entry.", severity: "error" });
  } else {
    score += 10;
    let bulletCount = 0;
    for (const job of work) {
      bulletCount += (job.bullets ?? []).length;
    }
    if (bulletCount >= work.length * 3) {
      score += 20;
    } else if (bulletCount > 0) {
      score += 10;
      tips.push({ section: "Work Experience", message: "Aim for 3–5 bullet points per role to fully describe your impact.", severity: "warning" });
    } else {
      tips.push({ section: "Work Experience", message: "Add bullet points to each role describing your achievements and responsibilities.", severity: "error" });
    }
  }

  // Education checks (15 pts)
  const edu = data.education ?? [];
  if (edu.length === 0) {
    tips.push({ section: "Education", message: "Add your educational background.", severity: "warning" });
  } else {
    score += 15;
  }

  // Skills checks (20 pts)
  const skills = data.skills ?? [];
  const totalSkills = skills.reduce((acc, g) => acc + (g.items ?? []).length, 0);
  if (totalSkills === 0) {
    tips.push({ section: "Skills", message: "Add skills to help ATS keyword matching.", severity: "error" });
  } else if (totalSkills < 5) {
    score += 10;
    tips.push({ section: "Skills", message: "Add more skills — aim for at least 5 to improve keyword matching.", severity: "warning" });
  } else {
    score += 20;
  }

  // Projects (10 pts)
  const projects = data.projects ?? [];
  if (projects.length > 0) {
    score += 10;
  } else {
    tips.push({ section: "Projects", message: "Adding projects demonstrates hands-on experience that ATS and recruiters look for.", severity: "info" });
  }

  // Certifications (5 pts)
  const certs = data.certifications ?? [];
  if (certs.length > 0) {
    score += 5;
  } else {
    tips.push({ section: "Certifications", message: "Certifications can boost your score for technical roles.", severity: "info" });
  }

  let label = "Needs Work";
  if (score >= 85) label = "Excellent";
  else if (score >= 70) label = "Good";
  else if (score >= 50) label = "Fair";

  res.json(
    GetResumeScoreResponse.parse({ score, maxScore, label, tips })
  );
});

export default router;
