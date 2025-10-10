// Supabase Edge Function to validate email domain on signup
// This function is called as a webhook during user registration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALLOWED_DOMAIN = Deno.env.get('ALLOWED_EMAIL_DOMAIN') || 'deloitte.com'

interface SignupPayload {
  type: 'signup'
  table: 'users'
  record: {
    email: string
    [key: string]: any
  }
  schema: string
}

serve(async (req) => {
  try {
    const payload: SignupPayload = await req.json()
    
    console.log('Validating email domain for:', payload.record.email)
    
    // Check if this is a signup event
    if (payload.type !== 'signup') {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const email = payload.record.email?.toLowerCase()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate email domain
    const emailDomain = email.split('@')[1]
    
    if (emailDomain !== ALLOWED_DOMAIN.toLowerCase()) {
      console.log(`Rejected signup: ${email} (domain: ${emailDomain})`)
      return new Response(
        JSON.stringify({ 
          error: `Only @${ALLOWED_DOMAIN} email addresses are allowed` 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Approved signup: ${email}`)
    
    // Return success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error validating email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

