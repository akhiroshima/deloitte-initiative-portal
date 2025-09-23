import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { verifySession } from './_lib/auth'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
})

const changePasswordHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    // Apply rate limiting
    const rateLimitResult = authRateLimit(event);
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify session
    const session = await verifySession(event);
    if (!session) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { currentPassword, newPassword } = parsed.data

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.email)
      .single()

    if (userError || !user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) }
    }

    // Verify current password
    const currentPasswordHash = await hashPassword(currentPassword)
    if (user.password_hash !== currentPasswordHash) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Current password is incorrect' }) }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password and clear needs_password_change flag
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        needs_password_change: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Password update error:', updateError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update password' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Password updated successfully' })
    }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

export const handler = withSecurity(changePasswordHandler);

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
