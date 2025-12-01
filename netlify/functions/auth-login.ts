import type { Handler } from '@netlify/functions'
import { z } from 'zod'
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

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password
    })

    if (error) {
      console.error('Supabase Auth login error:', error)
      
      // Handle specific errors
      if (error.message.includes('Email not confirmed')) {
        return { 
          statusCode: 403, 
          body: JSON.stringify({ 
            error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.' 
          }) 
        }
      }
      
      if (error.message.includes('Invalid login credentials')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) }
      }
      
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Authentication failed', details: error.message }) 
      }
    }

    if (!data.session || !data.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed' }) }
    }

    // Get additional user data from our custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      // If user doesn't exist in custom table yet, return basic info
      // The trigger should have created it, but there might be a race condition
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': buildSupabaseCookie(data.session.access_token, data.session.refresh_token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ok: true, 
          session: data.session,
          user: { 
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || username,
            role: data.user.user_metadata?.role || 'Developer',
            location: data.user.user_metadata?.location || 'Remote',
            skills: data.user.user_metadata?.skills || [],
            weeklyCapacityHrs: data.user.user_metadata?.weekly_capacity_hrs || 40,
            avatarUrl: data.user.user_metadata?.avatar_url
          } 
        })
      }
    }

    // Return success with session and user data
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': buildSupabaseCookie(data.session.access_token, data.session.refresh_token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true,
        session: data.session,
        user: { 
          id: userData.id,
          auth_user_id: userData.auth_user_id,
          email: userData.email,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          location: userData.location,
          skills: userData.skills,
          weeklyCapacityHrs: userData.weekly_capacity_hrs,
          avatarUrl: userData.avatar_url
        } 
      })
    }
  } catch (e: any) {
    console.error('Login error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

export const handler = withSecurity(loginHandler);

// Build Supabase auth cookies
function buildSupabaseCookie(accessToken: string, refreshToken: string): string {
  const isSecure = process.env.NODE_ENV === 'production'
  const parts = [
    `sb-access-token=${encodeURIComponent(accessToken)}`,
    `sb-refresh-token=${encodeURIComponent(refreshToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (isSecure) parts.push('Secure')
  parts.push('Max-Age=604800') // 7 days
  return parts.join('; ')
}
