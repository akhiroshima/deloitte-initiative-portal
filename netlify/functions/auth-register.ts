import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(['Designer', 'Developer', 'Lead', 'Manager']).optional(),
  location: z.string().min(1).max(100).optional(),
  skills: z.array(z.string().max(50)).min(0).max(20).optional(),
  weeklyCapacityHrs: z.number().min(1).max(40).optional(),
})

const registerHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const rateLimitResult = authRateLimit(event)
    const rateLimitResponse = createRateLimitResponse(rateLimitResult)
    if (rateLimitResponse) return rateLimitResponse

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { email, password, name, role, location, skills, weeklyCapacityHrs } = parsed.data
    const emailLower = email.toLowerCase().trim()
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'deloitte.com').toLowerCase()

    if (!emailLower.endsWith(`@${allowedDomain}`)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: `Only @${allowedDomain} email addresses are allowed` })
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Database not configured',
          hint: 'SUPABASE_SERVICE_ROLE_KEY is required for registration'
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const siteUrl = process.env.URL || 'http://localhost:5173'
    const username = emailLower.split('@')[0] ?? 'user'
    const displayName = name?.trim() || username
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`

    const { data, error } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          username,
          name: displayName,
          role: role ?? 'Developer',
          location: location ?? 'Remote',
          skills: skills ?? [],
          weekly_capacity_hrs: weeklyCapacityHrs ?? 40,
          avatar_url: avatarUrl
        }
      }
    })

    if (error) {
      console.error('Supabase Auth signup error:', error)
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { statusCode: 409, body: JSON.stringify({ error: 'User already exists' }) }
      }
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create user', details: error.message })
      }
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Registration successful! Please check your email to confirm your account before logging in.',
        requiresEmailConfirmation: true,
        user: {
          id: data.user?.id,
          email: emailLower,
          username,
          name: displayName,
          role: role ?? 'Developer',
          location: location ?? 'Remote',
          skills: skills ?? [],
          weeklyCapacityHrs: weeklyCapacityHrs ?? 40
        }
      })
    }
  } catch (e: unknown) {
    console.error('Registration error:', e)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Server error',
        details: e instanceof Error ? e.message : String(e)
      })
    }
  }
}

export const handler = withSecurity(registerHandler)
