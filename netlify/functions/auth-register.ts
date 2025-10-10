import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({ 
  username: z.string().min(2).max(50), 
  name: z.string().min(2),
  role: z.enum(['Designer', 'Developer', 'Lead', 'Manager']),
  location: z.string().min(2),
  skills: z.array(z.string()).min(1),
  weeklyCapacityHrs: z.number().min(1).max(40),
  password: z.string().min(8).optional() // Optional password, will be generated if not provided
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

    const { username, name, role, location, skills, weeklyCapacityHrs, password } = parsed.data
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'deloitte.com').toLowerCase()
    
    // Construct email from username and allowed domain
    const emailLower = `${username.toLowerCase().trim()}@${allowedDomain}`

    // Validate email domain
    if (!emailLower.endsWith(`@${allowedDomain}`)) {
      return { 
        statusCode: 403, 
        body: JSON.stringify({ error: `Only @${allowedDomain} email addresses are allowed` }) 
      }
    }

    // Initialize Supabase Admin client (needs service role key for admin operations)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate random password if not provided
    const userPassword = password || generatePassword()
    
    // Get the site URL for email redirect
    const siteUrl = process.env.URL || 'http://localhost:5173'

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: emailLower,
      password: userPassword,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          username: username.toLowerCase().trim(),
          name,
          role,
          location,
          skills,
          weekly_capacity_hrs: weeklyCapacityHrs,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        }
      }
    })

    if (error) {
      console.error('Supabase Auth signup error:', error)
      
      // Handle specific errors
      if (error.message.includes('already registered')) {
        return { statusCode: 409, body: JSON.stringify({ error: 'User already exists' }) }
      }
      
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: 'Failed to create user',
          details: error.message
        }) 
      }
    }

    // Note: The trigger function will automatically create the user in the public.users table
    // Email confirmation will be sent automatically by Supabase Auth
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true,
        message: 'Registration successful! Please check your email to confirm your account before logging in.',
        requiresEmailConfirmation: true,
        user: { 
          id: data.user?.id,
          email: emailLower,
          username: username.toLowerCase().trim(),
          name,
          role,
          location,
          skills,
          weeklyCapacityHrs
        } 
      })
    }
  } catch (e: any) {
    console.error('Registration error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Server error',
        details: e.message
      }) 
    }
  }
}

export const handler = withSecurity(registerHandler);

// Generate a secure random password
function generatePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  
  return password
}
