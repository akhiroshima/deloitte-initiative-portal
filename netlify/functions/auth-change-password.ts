import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'
import { parseCookies } from './_lib/cookies'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
})

const changePasswordHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }

    const rateLimitResult = authRateLimit(event)
    const rateLimitResponse = createRateLimitResponse(rateLimitResult)
    if (rateLimitResponse) return rateLimitResponse

    const cookies = parseCookies(event.headers.cookie)
    const accessToken = cookies['sb-access-token']
    const refreshToken = cookies['sb-refresh-token']
    if (!accessToken) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid or expired session' }) }
    }

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { newPassword } = parsed.data

    // Update password via Supabase Auth (current password is not re-checked server-side; Supabase validates session)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      console.error('Password update error:', updateError)
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: updateError.message }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Password updated successfully' })
    }
  } catch (e: unknown) {
    console.error(e)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }) }
  }
}

export const handler = withSecurity(changePasswordHandler)
