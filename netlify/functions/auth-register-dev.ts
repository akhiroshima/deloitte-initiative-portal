import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'
import { createHash } from 'crypto'

const bodySchema = z.object({ 
  email: z.string().email(),
  password: z.string().min(6)
})

// Simple password hashing using Node.js crypto module
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

const registerDevHandler: Handler = async (event) => {
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

    const { email, password } = parsed.data
    const emailLower = email.toLowerCase().trim()

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

    // Generate username from email
    const username = emailLower.split('@')[0]
    
    const hashedPassword = hashPassword(password)
    console.log('Dev registration - creating user with email:', emailLower)

    // Create user in database with default values for dev
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: emailLower,
        username: username,
        password_hash: hashedPassword,
        name: username.charAt(0).toUpperCase() + username.slice(1), // Capitalize first letter
        role: 'Developer', // Default role for dev
        location: 'Remote', // Default location
        skills: ['Development'], // Default skills
        weekly_capacity_hrs: 40, // Default capacity
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        needs_password_change: false, // No password change needed in dev
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: 'Failed to create user',
          details: error.message || 'Unknown error',
          code: error.code || 'NO_CODE'
        }) 
      }
    }

    // Return success - user can login immediately in dev
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true,
        message: 'Dev registration successful! You can now login with your email and password.',
        user: { 
          id: newUser.id,
          email: emailLower,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          location: newUser.location,
          skills: newUser.skills,
          weeklyCapacityHrs: newUser.weekly_capacity_hrs,
          avatarUrl: newUser.avatar_url
        } 
      })
    }
  } catch (e: any) {
    console.error('Dev registration error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Server error',
        details: e.message,
        stack: e.stack
      }) 
    }
  }
}

export const handler = withSecurity(registerDevHandler);
