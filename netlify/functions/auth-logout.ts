import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { withSecurity } from './_lib/security'
import { parseCookies, clearCookie } from './_lib/cookies'

const logoutHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }

    // Parse cookies
    const cookies = parseCookies(event.headers.cookie)
    const accessToken = cookies['sb-access-token']

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Sign out using Supabase Auth (if we have a token)
    if (accessToken) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Supabase signout error:', error)
        // Continue to clear cookies even if signout fails
      }
    }

    // Clear auth cookies
    const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
    const clearCookies = [
      clearCookie('sb-access-token', isSecure),
      clearCookie('sb-refresh-token', isSecure),
      clearCookie('session', isSecure) // Clear old session cookie too
    ].join(', ')

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': clearCookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, message: 'Logged out successfully' })
    }
  } catch (e: any) {
    console.error('Logout error:', e)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

export const handler = withSecurity(logoutHandler);
