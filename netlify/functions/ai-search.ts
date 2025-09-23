import type { Handler } from '@netlify/functions'
import { Pool } from 'pg'
import { z } from 'zod'

// Env: set these in Netlify UI or netlify.toml [functions.environment]
const DATABASE_URL = process.env.DATABASE_URL
const GROQ_API_KEY = process.env.GROQ_API_KEY
const EMBEDDINGS_API_URL = process.env.EMBEDDINGS_API_URL || 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2'
const EMBEDDINGS_API_KEY = process.env.EMBEDDINGS_API_KEY // Hugging Face token or other provider

if (!DATABASE_URL) console.warn('DATABASE_URL is not set')
if (!GROQ_API_KEY) console.warn('GROQ_API_KEY is not set')
if (!EMBEDDINGS_API_KEY) console.warn('EMBEDDINGS_API_KEY is not set')

const pool = new Pool({ connectionString: DATABASE_URL })

const requestSchema = z.object({
  query: z.string().min(1),
  maxInitiatives: z.number().int().min(1).max(20).optional(),
  maxRoles: z.number().int().min(0).max(20).optional(),
})

// --- Helpers ---
async function getQueryEmbedding(text: string): Promise<number[]> {
  const r = await fetch(EMBEDDINGS_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(EMBEDDINGS_API_KEY ? { 'Authorization': `Bearer ${EMBEDDINGS_API_KEY}` } : {}),
    },
    body: JSON.stringify({ inputs: text })
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`Embeddings API error ${r.status}: ${t}`)
  }
  const data = await r.json()
  // HF returns array for a single input
  const vec = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data
  if (!Array.isArray(vec)) throw new Error('Invalid embeddings response shape')
  return vec as number[]
}

async function groqReasoning(prompt: string, system?: string): Promise<string> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3-8b-8192',
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.4
    })
  })
  if (!r.ok) throw new Error(`Groq error ${r.status}: ${await r.text()}`)
  const data = await r.json()
  return data.choices?.[0]?.message?.content || ''
}

function toSqlArray(arr?: string[]){
  if (!arr || arr.length === 0) return '{}'
  return `{${arr.map(s => '"' + s.replaceAll('"','\"') + '"').join(',')}}`
}

// --- Handler ---
export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const parsed = requestSchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) }
    }
    const { query, maxInitiatives = 6, maxRoles = 6 } = parsed.data

    // 1) Get intent/keywords (optional). We can skip for now and rely on vector search
    // 2) Compute embedding for the query
    const qvec = await getQueryEmbedding(query)

    // 3) Vector search over initiatives and roles (help_wanted)
    // Assumes pgvector extension and embedding columns exist (vector(384) for MiniLM)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const initiativesSql = `
        WITH q AS (
          SELECT $1::vector AS v
        )
        SELECT i.id,
               i.title,
               i.description,
               i.tags,
               i.skills_needed,
               i.status,
               (1 - (i.embedding <=> q.v)) AS similarity
        FROM initiatives i, q
        WHERE i.embedding IS NOT NULL
        ORDER BY i.embedding <=> q.v
        LIMIT $2;
      `
      const initiativesRes = await client.query(initiativesSql, [qvec, maxInitiatives])

      const rolesSql = `
        WITH q AS (
          SELECT $1::vector AS v
        )
        SELECT h.id,
               h.initiative_id,
               h.skill,
               h.hours_per_week,
               (1 - (h.embedding <=> q.v)) AS similarity
        FROM help_wanted h, q
        WHERE h.status = 'Open' AND h.embedding IS NOT NULL
        ORDER BY h.embedding <=> q.v
        LIMIT $2;
      `
      const rolesRes = await client.query(rolesSql, [qvec, maxRoles])

      await client.query('COMMIT')

      // 4) Reasoning text (why similar) using Groq, based on top matches
      const topInits = initiativesRes.rows.map(r => ({ id: r.id, title: r.title, desc: r.description, tags: r.tags, skills: r.skills_needed }))
      const reasoningPrompt = `You will receive a user query and a list of initiatives. For each, give a one-sentence reason why it matches. Respond as JSON: {"reasons": [{"id": string, "reason": string}...] }.
Query: ${query}
Initiatives:\n${topInits.map(i => `- ${i.id}: ${i.title} | ${i.desc?.slice(0,160)} | tags:${(i.tags||[]).join(',')} | skills:${(i.skills||[]).join(',')}`).join('\n')}`

      let reasons: Record<string,string> = {}
      try {
        const raw = await groqReasoning(reasoningPrompt, 'Return JSON ONLY with an array reasons keyed by id.')
        const json = (() => { try { return JSON.parse(raw) } catch { return null } })()
        if (json && Array.isArray(json.reasons)) {
          for (const r of json.reasons) if (r.id && r.reason) reasons[r.id] = r.reason
        }
      } catch {
        // ignore; reasons remain empty
      }

      // 5) If no initiatives above minimal similarity, return create suggestion
      const threshold = 0.55 // tune
      const anyGood = initiativesRes.rows.some(r => Number(r.similarity) >= threshold)

      const response = {
        query,
        initiatives: initiativesRes.rows.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          tags: r.tags,
          skillsNeeded: r.skills_needed,
          status: r.status,
          similarity: Number(r.similarity),
          reasoning: reasons[r.id] || undefined,
        })),
        roles: rolesRes.rows.map(r => ({
          id: r.id,
          initiativeId: r.initiative_id,
          skill: r.skill,
          hoursPerWeek: r.hours_per_week,
          similarity: Number(r.similarity)
        })),
        suggestCreate: !anyGood,
      }

      return { statusCode: 200, body: JSON.stringify(response) }
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error' }) }
  }
}
