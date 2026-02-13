# Deployment & Environment Guide – Deloitte Initiative Portal

This guide covers deployment to Netlify, environment setup, database (Supabase), and CI/CD. The app uses a **single** Netlify site and a **single** Supabase project.

## Prerequisites

- Netlify account
- Supabase account (project ref: `ifrakipwdjrphyhkfupv`)
- Groq API account (AI)
- Hugging Face account (embeddings)
- GitHub repository access

## Environment variables

### Required (Netlify / local)

Copy `env-template.txt` to `.env` (or `.env.local`) and set any missing values. The template includes the Supabase URL and anon key for the single project. You must add:

```bash
# Supabase (URL/anon in env-template.txt; add service role key for server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
ALLOWED_EMAIL_DOMAIN=deloitte.com
URL=https://your-site.netlify.app

# AI
GROQ_API_KEY=your-groq-api-key
EMBEDDINGS_API_URL=https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
EMBEDDINGS_API_KEY=your-huggingface-token
```

Set these in **Netlify → Site settings → Environment variables** (and in `.env` for local dev). CORS uses `URL` or `NETLIFY_SITE_URL` as the allowed origin.

## Database setup (Supabase)

The app uses a **single** Supabase project (`ifrakipwdjrphyhkfupv`). For a fresh project or to align an existing one with this repo, run these **6 steps in order**:

1. **server/schema.sql** – Base schema (users, initiatives, help_wanted, join_requests, tasks, notifications, feedback, etc.).
2. **server/rls-policies.sql** – RLS policies.
3. **supabase/migrations/add_supabase_auth.sql** – `auth_user_id`, trigger to sync `auth.users` → `public.users`, nullable `password_hash`.
4. **supabase/migrations/20260210000000_add_invited_status_to_join_requests.sql** – `Invited` status on `join_requests`.
5. **supabase/migrations/20260210100000_add_initiative_id_to_notifications.sql** – `initiative_id` on `notifications`.
6. **supabase/migrations/20260210110000_add_feedback_table.sql** – `feedback` table (idempotent).

### Option A: Supabase MCP (Cursor)

If the Supabase MCP server is configured in Cursor (see **MCP (Cursor + Supabase)** below), you can run each step using the MCP **execute_sql** tool:

1. Open each file above in order, copy its full SQL content, and run it via the Supabase MCP **execute_sql** action (or **apply_migration** if your MCP supports it).
2. No local DB URL or `psql` is required; the MCP uses your Supabase access token and project ref.

### Option B: CLI (psql)

From the repo root, with a Postgres connection string and `psql` installed:

```bash
# Get connection string: Supabase Dashboard → Settings → Database → Connection string (URI)
export SUPABASE_DB_URL='postgresql://postgres.[project-ref]:[PASSWORD]@...pooler.supabase.com:6543/postgres'
./scripts/apply-database-setup.sh
```

Requires: `SUPABASE_DB_URL` and `psql` on PATH (e.g. `brew install libpq`).

### Option C: Supabase Dashboard

In [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the contents of each of the 6 files above in order.

### Cleaning all users

To wipe all users (e.g. for a fresh start): run **scripts/purge-all-users.sql** (Supabase Dashboard → SQL Editor, or `psql "$SUPABASE_DB_URL" -f scripts/purge-all-users.sql`). This truncates `public.users` and deletes `auth.users`. To then create a single admin, run **scripts/setup-admin-and-purge-users.sql** (purge + admin in one go) or **scripts/setup-admin-via-sql.sh** after the purge.

CORS for the app is set in `netlify/functions/_lib/security.ts` to your single Netlify site URL.

## Netlify build

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions:** `netlify/functions` (Node 18.x)

Configured in `netlify.toml`. SPA redirects and API redirects to `/.netlify/functions/*` are already set.

## CI/CD (GitHub Actions)

The repo uses `.github/workflows/deploy.yml`:

- **main:** on push, type check, tests, build; deploys to the single Netlify site.
- **Pull requests:** type check, tests, build; Netlify deploy preview.

**Secrets (GitHub → Settings → Secrets and variables → Actions):**

- `NETLIFY_AUTH_TOKEN` – Netlify personal access token
- `NETLIFY_SITE_ID` – Your Netlify site ID (the single site for this app)

Get the token from [Netlify User Settings → Applications → Personal access tokens](https://app.netlify.com/user/applications#personal-access-tokens).

## Security checklist

- [ ] All required env vars set in Netlify
- [ ] CORS in `security.ts` matches production domain
- [ ] RLS policies applied and tested
- [ ] Rate limiting enabled (see `netlify/functions/_lib/rateLimit.ts`)
- [ ] No secrets in client bundle (API keys only in server/env)

## MCP (Cursor + Supabase)

To use the Supabase MCP server in Cursor:

1. Run: `npm run setup:mcp`
2. Copy Supabase **project reference** (Dashboard → Settings → General) and **access token** (Account → Access Tokens) into `.env.mcp` as instructed by the script.
3. Restart Cursor so it picks up the MCP config.

## Troubleshooting

- **Build failures:** Ensure Node 18.x, run `npm ci` and `npm run build` locally.
- **Auth/DB errors:** Check Supabase URL/keys and RLS; confirm `SUPABASE_SERVICE_ROLE_KEY` is set where needed.
- **AI search:** Verify `GROQ_API_KEY` and embedding env vars; check Netlify function logs.
