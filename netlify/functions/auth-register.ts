import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { signSession, buildSessionCookie } from './_lib/auth'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({ 
  username: z.string().min(2).max(50), 
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['Designer', 'Developer', 'Lead', 'Manager']),
  location: z.string().min(2),
  skills: z.array(z.string()).min(1),
  weeklyCapacityHrs: z.number().min(1).max(40)
})

const registerHandler: Handler = async (event) => {
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

    const { username, password, name, role, location, skills, weeklyCapacityHrs } = parsed.data
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'deloitte.com').toLowerCase()
    
    // Construct email from username and allowed domain
    const emailLower = `${username.toLowerCase().trim()}@${allowedDomain}`

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .single()

    if (existingUser) {
      return { statusCode: 409, body: JSON.stringify({ error: 'User already exists' }) }
    }

    // Hash password (in production, use proper password hashing)
    const hashedPassword = await hashPassword(password)

    // Create user in database
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: emailLower,
        username: username.toLowerCase().trim(),
        password_hash: hashedPassword,
        name,
        role,
        location,
        skills,
        weekly_capacity_hrs: weeklyCapacityHrs,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create user' }) }
    }

    // Create session
    const token = await signSession(emailLower, domain, 60 * 60 * 24) // 24h
    const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
    const cookie = buildSessionCookie(token, isSecure)

    return {
      statusCode: 201,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true, 
        user: { 
          id: newUser.id,
          email: emailLower,
          username: newUser.username,
          name,
          role,
          location,
          skills,
          weeklyCapacityHrs,
          avatarUrl: newUser.avatar_url
        } 
      })
    }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

export const handler = withSecurity(registerHandler);

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
