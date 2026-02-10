# Deployment & Environment Guide – Deloitte Initiative Portal

This guide covers deployment to Netlify, environment setup (dev/prod), database (Supabase), and CI/CD.

## Prerequisites

- Netlify account
- Supabase account
- Groq API account (AI)
- Hugging Face account (embeddings)
- GitHub repository access

## Environment variables

### Required (Netlify / local)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
ALLOWED_EMAIL_DOMAIN=deloitte.com
URL=https://your-site.netlify.app

# AI
GROQ_API_KEY=your-groq-api-key
EMBEDDINGS_API_URL=https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
EMBEDDINGS_API_KEY=your-huggingface-token
```

Set these in **Netlify → Site settings → Environment variables** (or use `netlify env:set` for local dev).

## Database (Supabase)

1. Create a Supabase project.
2. Run schema and migrations:
   - `server/schema.sql`
   - `server/rls-policies.sql`
   - Apply files in `supabase/migrations/` (e.g. via Supabase CLI or Dashboard SQL).
3. In production, CORS is set in `netlify/functions/_lib/security.ts` for your production origin (e.g. `https://deloitte-initiative-portal.netlify.app`).

## Netlify build

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions:** `netlify/functions` (Node 18.x)

Configured in `netlify.toml`. SPA redirects and API redirects to `/.netlify/functions/*` are already set.

## CI/CD (GitHub Actions)

The repo uses `.github/workflows/deploy.yml`:

- **main:** type check, tests, build; deploys to production Netlify site.
- **develop:** same checks; deploys to development Netlify site.
- **Pull requests:** type check, tests, build; Netlify deploy preview.

**Secrets (GitHub → Settings → Secrets and variables → Actions):**

- `NETLIFY_AUTH_TOKEN` – Netlify personal access token
- `NETLIFY_PROD_SITE_ID` – Production Netlify site ID
- `NETLIFY_DEV_SITE_ID` – Development Netlify site ID

Get the token from [Netlify User Settings → Applications → Personal access tokens](https://app.netlify.com/user/applications#personal-access-tokens).

## Separate dev/prod environments

- Use **two Supabase projects** (e.g. one for dev, one for prod).
- Use **two Netlify sites** (e.g. dev branch → dev site, main → prod site).
- Set the env vars above per site so each points to its own Supabase and URLs.

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
