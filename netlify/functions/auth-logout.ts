import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    // Parse cookies
    const cookies = parseCookies(event.headers.cookie)
    const accessToken = cookies['sb-access-token']

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
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
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}

// Helper to parse cookies
function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(';').forEach(part => {
    const idx = part.indexOf('=')
    if (idx > -1) {
      const k = part.slice(0, idx).trim()
      const v = decodeURIComponent(part.slice(idx + 1))
      out[k] = v
    }
  })
  return out
}

// Helper to clear a cookie
function clearCookie(name: string, secure: boolean): string {
  const parts = [
    `${name}=deleted`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
