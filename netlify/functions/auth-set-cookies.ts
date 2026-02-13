import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { withSecurity } from './_lib/security'
import { buildSupabaseAuthCookie } from './_lib/cookies'

const bodySchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
})

const setCookiesHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { access_token, refresh_token } = parsed.data
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error } = await supabase.auth.getUser(access_token)
    if (error || !user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid or expired session' }) }
    }

    const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': buildSupabaseAuthCookie(access_token, refresh_token, isSecure),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ok: true }),
    }
  } catch (e: unknown) {
    console.error('auth-set-cookies error:', e)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }),
    }
  }
}

export const handler = withSecurity(setCookiesHandler)
