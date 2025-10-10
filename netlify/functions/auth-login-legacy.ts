import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { signSession, buildSessionCookie } from './_lib/auth'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({ username: z.string().min(1), password: z.string().min(1) })

const loginHandler: Handler = async (event) => {
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

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { username, password } = parsed.data
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'deloitte.com').toLowerCase()
    
    // Convert username to email format
    const emailLower = `${username.toLowerCase().trim()}@${allowedDomain}`

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailLower)
      .single()

    if (error || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) }
    }

    // Verify password
    const hashedPassword = await hashPassword(password)
    if (user.password_hash !== hashedPassword) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) }
    }

    const token = await signSession(emailLower, allowedDomain, 60 * 60 * 24) // 24h
    const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
    const cookie = buildSessionCookie(token, isSecure)

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true, 
        user: { 
          id: user.id,
          email: emailLower, 
          name: user.name,
          role: user.role,
          location: user.location,
          skills: user.skills,
          weeklyCapacityHrs: user.weekly_capacity_hrs,
          avatarUrl: user.avatar_url
        } 
      })
    }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

export const handler = withSecurity(loginHandler);

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
