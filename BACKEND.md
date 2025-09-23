# Backend setup (Netlify Functions + Supabase + pgvector)

This backend adds intelligent search using embeddings + pgvector and Groq for intent/reasoning.

Overview
- Functions: Netlify Functions in `netlify/functions/`
  - `ai-search.ts`: POST /api/ai-search { query, maxInitiatives?, maxRoles? }
- Database: Postgres (Supabase recommended) with `pgvector` for semantic search
- Embeddings provider: Hugging Face Inference (MiniLM-L6-v2) by default
- Reasoning/summarization: Groq (LLM)
- Authentication: Netlify Functions with email-domain allowlist + shared password (temporary)

Prerequisites
- Supabase project with Postgres (or any Postgres with pgvector)
- Netlify account and site

1) Database schema
Run `server/schema.sql` in your Postgres:
- Enables pgvector
- Creates `initiatives`, `help_wanted`, and `initiative_team_members`
- Adds IVFFLAT vector indexes

2) Environment variables (Netlify)
Set these in Netlify site settings → Environment variables:
- DATABASE_URL = postgres://... (Supabase connection string)
- GROQ_API_KEY = your Groq key
- EMBEDDINGS_API_URL = https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2
- EMBEDDINGS_API_KEY = hf_...
- ALLOWED_EMAIL_DOMAIN = deloitte.com (or your corporate domain)
- AUTH_SHARED_PASSWORD = (set to a temporary password; do NOT commit plaintext to code)
- AUTH_JWT_SECRET = a long random secret for signing session cookies

(You can add them locally via `netlify env:set` for dev.)

3) Populate data and embeddings
- Insert your initiatives/help_wanted rows.
- For each row, compute embeddings once and store in the `embedding` column.
  - Option A: temporarily call POST /api/ai-search with a small script to get the embedding call, or
  - Option B: write a small one-off script (Node + pg) to iterate rows and POST to EMBEDDINGS_API_URL, then `update ... set embedding = $1`.

Example (pseudo):
- For initiatives: text = `${title}. ${description}. tags: ${tags?.join(',')} skills: ${skills_needed?.join(',')}`
- For help_wanted: text = `${skill}. role for initiative ${initiative.title}`

4) Deploy on Netlify
- Commit files
- Connect repository in Netlify
- Ensure `netlify.toml` exists (this repo has it)
- Set env vars in the site
- Deploy (Netlify will build and expose functions under /.netlify/functions/*)

5) Auth endpoints
- POST /api/auth-login { email, password }
  - sets HttpOnly session cookie on success.
- GET /api/auth-me
  - returns { authenticated, email, domain }
- POST /api/auth-logout
  - clears cookie

6) Using the endpoint from the frontend
Call:
  fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'new design system' })
  })

Response shape:
{
  query: string,
  initiatives: [{ id, title, description, tags, skillsNeeded, status, similarity, reasoning? }],
  roles: [{ id, initiativeId, skill, hoursPerWeek, similarity }],
  suggestCreate: boolean
}

7) Tuning
- Similarity threshold: in ai-search.ts (`threshold = 0.55`) – increase/decrease to control when we show the create-initiative suggestion.
- Model choice: switch EMBEDDINGS_API_URL to a different embedding model; update `vector(384)` to match the new model dimension.
- Index lists: adjust IVFFLAT `lists = 100` depending on dataset size and performance.

8) Security & costs
- Secrets live in Netlify env, not in the client.
- Embeddings computed on write (one-time) keeps read queries fast and cheap.

9) Next endpoints (optional)
- /api/ai-extract: create prefill from text (uses Groq)
- /api/recommendations: personalized initiatives/roles based on user skills
- /api/doc-index: parse & embed docs for richer search
