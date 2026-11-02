import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

// Run with Node's --env-file against the linked Clerk DEVELOPMENT instance only.
// Creates isolated test users and records, then removes only those fixtures.
const apiRequire = createRequire(
  new URL("../../artifacts/api-server/package.json", import.meta.url),
);
const dbRequire = createRequire(
  new URL("../../lib/db/package.json", import.meta.url),
);
const { createClerkClient } = apiRequire("@clerk/express");
const { Client } = dbRequire("pg");
if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_"))
  throw new Error("A Clerk development instance is required.");
const base = process.env.VERIFY_BASE_URL;
if (!base || !/^https:\/\/[a-z0-9.-]+\.vercel\.app$/.test(base))
  throw new Error(
    "Set VERIFY_BASE_URL to the exact Vercel deployment being tested.",
  );
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const users = [],
  records = [];
let token;
const passed = [];
async function request(path, expected, init = {}, jwt = token) {
  const bearer = jwt
    ? (await clerk.sessions.getToken(jwt.sessionId)).jwt
    : null;
  console.log("CHECK", init.method ?? "GET", path);
  const response = await fetch(base + "/api" + path, {
    ...init,
    headers: {
      Connection: "close",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(60000),
  });
  const body = await response.text();
  assert.equal(
    response.status,
    expected,
    `${path}: expected ${expected}, got ${response.status}; ${body.slice(0, 250)}`,
  );
  return response.headers.get("content-type")?.includes("application/json")
    ? JSON.parse(body)
    : body;
}
function pass(name) {
  passed.push(name);
  console.log("PASS", name);
}
const json = (data) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const jobDescription =
  "Software engineer experienced with TypeScript, React, Node.js, PostgreSQL, testing, and accessible web applications. Build reliable APIs and collaborate with product and design teams.";
const resumeData = {
  title: "Verification fixture — delete after test",
  data: {
    personalInfo: {
      fullName: "Verification Fixture",
      email: "fixture@example.com",
      phone: "0000000000",
      location: "Test environment",
      summary:
        "Software engineer building accessible React applications and reliable TypeScript APIs.",
      linkedIn: "",
      website: "",
    },
    workExperience: [
      {
        company: "Fixture Company",
        title: "Software Engineer",
        location: "Remote",
        startDate: "Jan 2024",
        endDate: "",
        isCurrent: true,
        bullets: [
          "Built accessible React applications.",
          "Developed TypeScript APIs with PostgreSQL.",
          "Created automated tests.",
        ],
      },
    ],
    education: [
      {
        school: "Fixture University",
        degree: "BSc",
        field: "Computer Science",
        startDate: "2020",
        endDate: "2024",
      },
    ],
    skills: [
      {
        category: "Engineering",
        items: ["TypeScript", "React", "Node.js", "PostgreSQL", "Testing"],
      },
    ],
    projects: [
      {
        name: "Fixture Project",
        description: "An accessible web application.",
        technologies: ["React", "TypeScript"],
        bullets: ["Built reusable components."],
      },
    ],
    certifications: [],
  },
};
async function newToken(suffix) {
  const user = await clerk.users.createUser({
    emailAddress: [
      `resumeforge-qa-${Date.now()}-${suffix}+clerk_test@example.com`,
    ],
    password: randomBytes(24).toString("base64url"),
    firstName: "Verification",
    lastName: "Fixture",
  });
  users.push(user.id);
  const session = await clerk.sessions.createSession({ userId: user.id });
  return { sessionId: session.id };
}
try {
  await request("/healthz", 200, {}, null);
  pass("Public API health");
  await request("/resumes", 401, {}, null);
  pass("Anonymous access rejected");
  token = await newToken("owner");
  await request("/me", 200);
  pass("Signed-in account access");
  await request("/admin/overview", 403);
  await request("/admin/users", 403);
  pass("Regular user cannot access administration");
  const resume = await request("/resumes", 201, {
    method: "POST",
    ...json(resumeData),
  });
  records.push(["resumes", resume.id]);
  const list = await request("/resumes", 200);
  assert(list.some((x) => x.id === resume.id));
  const detail = await request(`/resumes/${resume.id}`, 200);
  assert.equal(detail.data.workExperience[0].bullets.length, 3);
  await request(`/resumes/${resume.id}`, 200, {
    method: "PUT",
    ...json({ ...resumeData, title: "Updated verification fixture" }),
  });
  const score = await request(`/resumes/${resume.id}/score`, 200);
  assert(score.score >= 0 && score.score <= 100);
  pass("Resume create, list, read, edit, and completeness review");
  await request("/resumes", 400, { method: "POST", ...json({}) });
  pass("Invalid resume input rejected");
  const otherToken = await newToken("other");
  await request(`/resumes/${resume.id}`, 404, {}, otherToken);
  await request(`/resumes/${resume.id}`, 404, { method: "DELETE" }, otherToken);
  pass("Resume ownership isolation");
  const doc = Buffer.from(
    "UEsDBBQAAAAAAPSoYl1Rl+gEFAEAABQBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbDxUeXBlcyB4bWxucz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3BhY2thZ2UvMjAwNi9jb250ZW50LXR5cGVzIj48RGVmYXVsdCBFeHRlbnNpb249InhtbCIgQ29udGVudFR5cGU9ImFwcGxpY2F0aW9uL3htbCIvPjxPdmVycmlkZSBQYXJ0TmFtZT0iL3dvcmQvZG9jdW1lbnQueG1sIiBDb250ZW50VHlwZT0iYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQubWFpbit4bWwiLz48L1R5cGVzPlBLAwQUAAAAAAD0qGJdOrF33lIDAABSAwAAEQAAAHdvcmQvZG9jdW1lbnQueG1sPHc6ZG9jdW1lbnQgeG1sbnM6dz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3dvcmRwcm9jZXNzaW5nbWwvMjAwNi9tYWluIj48dzpib2R5Pjx3OnA+PHc6cj48dzp0PlZlcmlmaWNhdGlvbiBGaXh0dXJlPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+U1VNTUFSWTwvdzp0PjwvdzpyPjwvdzpwPjx3OnA+PHc6cj48dzp0PlNvZnR3YXJlIGVuZ2luZWVyIGJ1aWxkaW5nIFJlYWN0IGFwcGxpY2F0aW9ucyBhbmQgVHlwZVNjcmlwdCBBUElzLjwvdzp0PjwvdzpyPjwvdzpwPjx3OnA+PHc6cj48dzp0PkVYUEVSSUVOQ0U8L3c6dD48L3c6cj48L3c6cD48dzpwPjx3OnI+PHc6dD5Tb2Z0d2FyZSBFbmdpbmVlciwgRml4dHVyZSBDb21wYW55PC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+QnVpbHQgYWNjZXNzaWJsZSBSZWFjdCBhcHBsaWNhdGlvbnMuPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+RGV2ZWxvcGVkIFR5cGVTY3JpcHQgQVBJcyB3aXRoIFBvc3RncmVTUUwuPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+Q3JlYXRlZCBhdXRvbWF0ZWQgdGVzdHMuPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+RURVQ0FUSU9OPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+QlNjIENvbXB1dGVyIFNjaWVuY2UsIEZpeHR1cmUgVW5pdmVyc2l0eTwvdzp0PjwvdzpyPjwvdzpwPjx3OnA+PHc6cj48dzp0PlNLSUxMUzwvdzp0PjwvdzpyPjwvdzpwPjx3OnA+PHc6cj48dzp0PlR5cGVTY3JpcHQsIFJlYWN0LCBOb2RlLmpzLCBQb3N0Z3JlU1FMLCBUZXN0aW5nPC93OnQ+PC93OnI+PC93OnA+PC93OmJvZHk+PC93OmRvY3VtZW50PlBLAQIUAxQAAAAAAPSoYl1Rl+gEFAEAABQBAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAAA9KhiXTqxd95SAwAAUgMAABEAAAAAAAAAAAAAAIABRQEAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAACAAIAgAAAAMYEAAAAAA==",
    "base64",
  );
  const form = new FormData();
  form.append(
    "file",
    new Blob([doc], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "verification-only.docx",
  );
  form.append("jobDescription", jobDescription);
  const analysis = await request("/analyses", 201, {
    method: "POST",
    body: form,
  });
  records.push(["analyses", analysis.id]);
  assert(analysis.extractedText.includes("TypeScript"));
  assert(analysis.overallScore >= 0 && analysis.overallScore <= 100);
  assert((await request("/analyses", 200)).some((x) => x.id === analysis.id));
  await request(`/analyses/${analysis.id}`, 200);
  pass(
    "DOCX upload, extraction, scoring, analysis history, and report retrieval",
  );
  const report = await request(`/analyses/${analysis.id}/report`, 200);
  assert(report.includes("<!doctype html>"));
  pass("Downloadable HTML analysis report");
  await request(`/analyses/${analysis.id}`, 404, {}, otherToken);
  await request(`/analyses/${analysis.id}/report`, 404, {}, otherToken);
  pass("Analysis and download ownership isolation");
  await request(`/analyses/${analysis.id}/rewrite-bullet`, 400, {
    method: "POST",
    ...json({ bullet: "Invented a skill never present in this resume." }),
  });
  pass("Unsupported rewrite source rejected");
  const content =
    "BT /F1 12 Tf 50 750 Td (Software engineer with TypeScript React Node.js and PostgreSQL experience.) Tj 0 -20 Td (Built accessible React applications.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((x) => `${String(x).padStart(10, "0")} 00000 n \n`)
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const pdfForm = new FormData();
  pdfForm.append(
    "file",
    new Blob([pdf], { type: "application/pdf" }),
    "verification-only.pdf",
  );
  pdfForm.append("jobDescription", jobDescription);
  const pdfAnalysis = await request("/analyses", 201, {
    method: "POST",
    body: pdfForm,
  });
  records.push(["analyses", pdfAnalysis.id]);
  assert(pdfAnalysis.extractedText.includes("TypeScript"));
  pass("Text-based PDF upload and extraction");
  const bad = new FormData();
  bad.append(
    "file",
    new Blob(["not a PDF"], { type: "application/pdf" }),
    "invalid.pdf",
  );
  bad.append("jobDescription", jobDescription);
  await request("/analyses", 400, { method: "POST", body: bad });
  pass("Invalid file signature rejected");
  const oversized = new FormData();
  oversized.append(
    "file",
    new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], {
      type: "application/pdf",
    }),
    "oversized.pdf",
  );
  oversized.append("jobDescription", jobDescription);
  await request("/analyses", 400, { method: "POST", body: oversized });
  pass("Files above the advertised 4 MB limit are rejected");
  await request(`/analyses/${analysis.id}/ai-suggestions`, 502, {
    method: "POST",
  });
  pass("Unconfigured AI returns an explicit unavailable response");
  for (const [kind, id] of records) {
    await request(`/${kind}/${id}`, 204, { method: "DELETE" });
    await request(`/${kind}/${id}`, 404);
  }
  pass("Resume and analysis deletion");
  console.log(`Verified ${passed.length} feature groups.`);
} finally {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  for (const id of users) {
    await db.query("DELETE FROM analyses WHERE owner_id = $1", [id]);
    await db.query("DELETE FROM resumes WHERE owner_id = $1", [id]);
    await db.query("DELETE FROM app_users WHERE clerk_user_id = $1", [id]);
    await clerk.users.deleteUser(id);
  }
  await db.end();
  console.log("Removed isolated verification users and data.");
}
