# Deloitte Initiative Portal

Internal initiative and talent-matching portal: bulletin, opportunities, workspace, and AI-powered search.

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Copy `env-template.txt` to `.env.local` and set:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (from your Supabase project)
   - For local Netlify dev: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAIL_DOMAIN`, `GROQ_API_KEY`, etc.
3. Run: `npm run dev`

## Environment & deployment

- **Full deployment and env setup:** [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) (Netlify, Supabase, env vars, CI/CD, MCP).
- **Backend (functions, DB, auth):** [BACKEND.md](BACKEND.md).
- **Design system:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Scripts

- `npm run dev` – Vite dev server
- `npm run build` – Production build
- `npm run test` – Unit tests (Vitest)
- `npm run setup:mcp` – Prepare MCP env file for Cursor + Supabase

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind
- **Backend:** Netlify Functions, Supabase (Postgres + Auth)
- **AI:** Groq (LLM), Hugging Face (embeddings), pgvector
