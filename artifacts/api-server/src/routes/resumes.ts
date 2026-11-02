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
    tips.push({ section: "Summary", message: "Expand your summary with relevant experience and skills. Aim for at least 50 characters so it gives readers useful context.", severity: "warning" });
  } else {
    tips.push({ section: "Summary", message: "Add a short summary of your experience, relevant skills, and professional focus.", severity: "error" });
  }
  if (!pi?.linkedIn) {
    tips.push({ section: "Personal Info", message: "If you use LinkedIn, add your profile URL so readers can learn more about your experience.", severity: "info" });
  }

  // Work experience checks (30 pts)
  const work = data.workExperience ?? [];
  if (work.length === 0) {
    tips.push({ section: "Work Experience", message: "Include relevant work, internship, volunteer, or project experience. Do not invent a role to increase this score.", severity: "error" });
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
      tips.push({ section: "Work Experience", message: "Use a few specific bullet points for each role to explain your contributions and results.", severity: "warning" });
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
    tips.push({ section: "Skills", message: "List relevant skills you can demonstrate through your work, projects, or education.", severity: "error" });
  } else if (totalSkills < 5) {
    score += 10;
    tips.push({ section: "Skills", message: "Review whether you have other relevant skills to include. Add only skills you can support with experience.", severity: "warning" });
  } else {
    score += 20;
  }

  // Projects (10 pts)
  const projects = data.projects ?? [];
  if (projects.length > 0) {
    score += 10;
  } else {
    tips.push({ section: "Projects", message: "Include a relevant project if it helps demonstrate your practical skills and contributions.", severity: "info" });
  }

  // Certifications (5 pts)
  const certs = data.certifications ?? [];
  if (certs.length > 0) {
    score += 5;
  } else {
    tips.push({ section: "Certifications", message: "Include relevant certifications you have earned. Leave this section out if it does not apply.", severity: "info" });
  }

  let label = "Add more detail";
  if (score >= 85) label = "Most sections covered";
  else if (score >= 70) label = "Good section coverage";
  else if (score >= 50) label = "Some sections need detail";

  res.json(
    GetResumeScoreResponse.parse({ score, maxScore, label, tips })
  );
});

export default router;
