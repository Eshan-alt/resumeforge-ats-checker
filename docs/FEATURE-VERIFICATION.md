# ResumeForge verification

Verified on 2 November 2026 against the public Vercel deployment with two isolated Clerk development users. Test users and their resume, analysis, and ownership records were removed afterward.

## Live API checks

- Public health endpoint and signed-out access protection.
- Signed-in account access; regular users denied access to both administration endpoints.
- Resume creation, listing, retrieval, update, completeness review, and deletion.
- Invalid resume requests rejected.
- Resume access and deletion isolated between users.
- DOCX and text-based PDF upload, text extraction, scoring, analysis listing, and retrieval.
- Downloadable HTML report; analysis and report access isolated between users.
- Invalid file signatures and invented source bullets rejected.
- Unconfigured AI returns a readable unavailable response instead of fabricated output.
- Deleted resumes and analyses return not found.

The initial edit request timed out before reaching the API. A fresh run with separate connections completed all 15 feature groups.

## Source and build checks

TypeScript checks passed for frontend and API. The three administrator access and pagination unit tests passed. The Vercel production build passed. The public homepage and its JavaScript bundle served the revised wording and Eshan Garg copyright.

Reviewed all page components: landing, authentication routes, overview, resume checker, analysis details, history, resume library, resume editor, preview/export, account, administration, and not-found state. Corrected editable comma-separated lists, flat bullet arrays, hidden-tab validation, history loading errors, and deletion confirmation. The preview describes its score as completeness rather than universal ATS compatibility. PDF export accurately describes the browser print workflow.

## Upload limit

Files are limited to 4 MB in the interface and API, leaving room for multipart metadata and the job description under Vercel's 4.5 MB request limit. See [Vercel Functions limits](https://vercel.com/docs/functions/limitations#request-body-size).

## Repeat the checks

`VERIFY_BASE_URL=https://your-project.vercel.app node --env-file=.env.production.local scripts/verification/check-features.mjs`

Use an explicitly selected deployment with a Clerk development instance and its matching database. The script refuses a production Clerk secret, creates its own fixtures, and cleans up only their users and records. The selected URL must be publicly reachable; the script does not modify Vercel Deployment Protection.

## Verification boundaries

Browser interaction and visual checks were unavailable in this session. Real sign-up/recovery screens, browser printing, mobile layout, theme switching, and interactive charts need a browser pass. Administrator authorization is unit-tested and regular-user denial is live-tested; no real administrator was granted access for testing. Optional AI generation needs configured provider credentials. Clerk currently uses its development instance.
