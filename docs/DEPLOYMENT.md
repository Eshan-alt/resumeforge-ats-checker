# Deploy ResumeForge

The frontend and API now run on one origin. This preserves Clerk session cookies and avoids cross-origin authentication setup. A Node/Docker web host and PostgreSQL are required; GitHub Pages alone cannot run this application.

## 1. Configure authentication and storage

Create a Clerk application (or reuse your existing one) and a PostgreSQL database. Configure sign-up and the desired login methods in Clerk. For a public launch, configure your production domain and production Clerk instance using [Clerk's production guide](https://clerk.com/docs/guides/development/deployment/production).

Set `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` on the server. Set `VITE_CLERK_PUBLISHABLE_KEY` to the matching public key when building the frontend. Keep the secret key and database connection out of client variables. Leave `VITE_CLERK_PROXY_URL` blank for a standard Clerk application.

Set `DATABASE_URL`. For a new, empty database, initialize the existing schema:

```sh
pnpm --filter @workspace/db run push
```

For an existing production database, back it up and review any proposed schema changes before applying them. This change adds no database columns or tables.

## 2. Enable your administrator account

Sign up normally. Copy your account's `user_...` ID from Clerk and set the **server-only** environment variable:

```text
ADMIN_USER_IDS=user_your_id
```

Restart the API after changing this value. Multiple IDs can be comma-separated. Empty configuration grants nobody admin privileges. Do not use email addresses or expose this variable through a `VITE_` prefix.

- `/sign-in` and `/sign-up`: user authentication, including Clerk's configured recovery flows.
- `/account`: profile and security settings.
- `/admin/sign-in`: dedicated administrator login entry point.
- `/admin`: platform counts and paginated app-user usage. The API independently checks every admin request.
- `/resumes`: search, edit, preview, and delete saved resumes.

Admin access does not grant access to other users' resume content. User IDs and usage counts appear in the admin directory; accounts appear after their first authenticated API request. User suspension and identity deletion remain in Clerk's dashboard; they are not implemented in this app.

## 3. Build and start

Install Node 24 and pnpm 11.25.0. Environment variables must be exported in the shell or supplied by your host. Copy `.env.example` as a reference; the API does not automatically load `.env`.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run build
STATIC_DIR="$PWD/artifacts/ats-resume/dist/public" PORT=3001 node artifacts/api-server/dist/index.mjs
```

Alternatively, build the Docker image with the **public** Clerk key:

```sh
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_REPLACE_ME -t resumeforge .
docker run --env-file .env -p 3001:3001 resumeforge
```

Provide real values in `.env` before starting Docker. `DATABASE_URL` inside the container must point to a reachable database, not the container's localhost. Configure your web host to terminate HTTPS, forward traffic to `PORT`, and use `/api/healthz` as the process health endpoint. The health endpoint does not test database connectivity. The Docker image includes the build toolchain for simplicity; it runs the application as a non-root user.

Optional AI: set `OPENAI_API_KEY` and `OPENAI_MODEL` (default for direct OpenAI access: `gpt-4.1-mini`). Existing managed integration credentials also remain supported. With no AI credentials, deterministic scoring and resume features still start and work; AI requests report that suggestions are unavailable. [Model reference](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

## Local development

Use the same Clerk development instance in both processes. In one terminal, export server variables and run `PORT=3001 pnpm --filter @workspace/api-server run dev`. In another, export `VITE_CLERK_PUBLISHABLE_KEY` and run `PORT=5173 pnpm --filter @workspace/ats-resume run dev`. Vite forwards `/api` to localhost:3001.

## Verify before launch

Use two real test accounts to confirm that each sees only its own resumes and analyses. Verify a regular user receives 403 from `/api/admin/overview` and `/api/admin/users`; signed-out API requests must receive 401. Verify the designated admin can see the overview, and that removing their ID and restarting revokes access. Test sign-up, sign-in, sign-out, password recovery, saved-resume deletion, and refresh on `/resumes` and `/admin`. Configure host-level request limits and provider spending limits before opening an unrestricted public signup flow.

Live sign-in, database queries, and AI calls require your own configured services and must be checked in staging. No credentials, hosting service, or domain are provisioned by this repository change.
