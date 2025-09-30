import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { signSession, buildSessionCookie } from './_lib/auth'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'
import { sendEmail, generatePassword, createPasswordEmail } from './_lib/email'

const bodySchema = z.object({ 
  username: z.string().min(2).max(50), 
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

    const { username, name, role, location, skills, weeklyCapacityHrs } = parsed.data
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

    // Generate random password
    const generatedPassword = generatePassword()
    const hashedPassword = await hashPassword(generatedPassword)

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
        needs_password_change: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create user' }) }
    }

    // Send password via email
    let emailSent = false;
    try {
      await sendEmail({
        to: emailLower,
        subject: 'Welcome to Deloitte Initiative Portal - Your Login Credentials',
        html: createPasswordEmail(username, generatedPassword)
      });
      emailSent = true;
      console.log('Email sent successfully to:', emailLower);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Return success without creating session - user must login with received password
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true,
        message: emailSent 
          ? 'Registration successful! Please check your email for login credentials and log in manually.'
          : 'Registration successful! However, there was an issue sending your password via email. Please contact support.',
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
