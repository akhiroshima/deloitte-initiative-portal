import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { authRateLimit, createRateLimitResponse } from './_lib/rateLimit'
import { withSecurity } from './_lib/security'

const bodySchema = z.object({ 
  username: z.string().min(1).optional(),
  email: z.string().email().optional()
}).refine(data => data.username || data.email, {
  message: "Either username or email must be provided"
})

const resetPasswordHandler: Handler = async (event) => {
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

    const { username, email } = parsed.data
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'deloitte.com').toLowerCase()
    
    // Convert username to email format if provided
    let emailToReset = email?.toLowerCase().trim()
    if (username && !email) {
      emailToReset = `${username.toLowerCase().trim()}@${allowedDomain}`
    }

    if (!emailToReset) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) }
    }

    // Validate email domain
    if (!emailToReset.endsWith(`@${allowedDomain}`)) {
      return { 
        statusCode: 403, 
        body: JSON.stringify({ error: `Only @${allowedDomain} email addresses are allowed` }) 
      }
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the site URL for password reset redirect
    const siteUrl = process.env.URL || 'http://localhost:5173'

    // Request password reset email from Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${siteUrl}/auth/reset-password`
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists or not (security)
      // Return success anyway to prevent email enumeration
    }

    // Always return success to prevent email enumeration attacks
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true,
        message: 'If an account exists with this email, you will receive password reset instructions shortly.'
      })
    }
  } catch (e: any) {
    console.error('Password reset error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Server error',
        details: e.message
      }) 
    }
  }
}

export const handler = withSecurity(resetPasswordHandler);

