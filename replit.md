# ATS Resume Checker

Secure resume building and ATS analysis for authenticated users, including PDF/DOCX extraction, deterministic job matching, and optional AI writing suggestions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Environment is managed automatically: `DATABASE_URL`, Clerk keys, and Replit OpenAI Integration values. See `.env.example` for variable names only.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, Clerk Express middleware, pino structured logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- AI: Replit AI Integrations OpenAI proxy (`gpt-5.6-luna`)
- Build: esbuild

## Where things live

- API contract: `lib/api-spec/openapi.yaml` (run codegen after changes).
- API routes and ATS services: `artifacts/api-server/src/routes/analyses.ts`, `src/lib/ats.ts`, and `src/lib/aiSuggestions.ts`.
- Auth/proxy middleware: `artifacts/api-server/src/middlewares/`.
- Database source of truth: `lib/db/src/schema/`; push development schema changes with the DB command above.
- Browser multipart client helper: `artifacts/ats-resume/src/lib/analyses.ts`.

## Architecture decisions

- Clerk proxy is mounted before body parsers; Clerk middleware runs before API routes.
- Local users are JIT-provisioned using Clerk user IDs, and resume/analysis queries are owner-scoped.
- Seed resumes have a null owner and are not exposed by authenticated resume APIs.
- ATS scoring is deterministic and only considers the uploaded resume and provided job description. AI content is optional and persisted only after a successful request.
- Multipart upload is documented in OpenAPI but uses a small FormData helper because Node-side generated Zod cannot represent browser `File`.

## Product

Users can build private resumes, upload PDF or DOCX resumes up to 10 MB, compare them to a job description, review explainable ATS scores, request AI suggestions or bullet rewrites, and download a self-contained HTML report.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Only PDF and DOCX uploads are accepted; scanned/image-only PDFs have no extractable text and are rejected.
- Run API codegen after changing `openapi.yaml`, then push DB schema changes before exercising new routes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
