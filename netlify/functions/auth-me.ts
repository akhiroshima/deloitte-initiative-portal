import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    // Parse cookies
    const cookies = parseCookies(event.headers.cookie)
    const accessToken = cookies['sb-access-token']
    const refreshToken = cookies['sb-refresh-token']
    
    if (!accessToken) {
      console.log('No access token found in cookies');
      return { statusCode: 401, body: JSON.stringify({ authenticated: false }) }
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify session using access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      console.log('Invalid or expired session:', error?.message);
      return { statusCode: 401, body: JSON.stringify({ authenticated: false }) }
    }

    console.log('Session verified for:', user.email);

    // Get additional user data from custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user
    }

    if (userError || !userData) {
      console.log('User data not found in custom table:', userError?.message);
      
      // Return basic info from auth.users if custom table data not found
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authenticated: true, 
          session,
          user: {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0],
            name: user.user_metadata?.name || 'User',
            role: user.user_metadata?.role || 'Developer',
            location: user.user_metadata?.location || 'Remote',
            skills: user.user_metadata?.skills || [],
            weeklyCapacityHrs: user.user_metadata?.weekly_capacity_hrs || 40,
            avatarUrl: user.user_metadata?.avatar_url
          }
        })
      }
    }

    // Return full user data from custom table
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        authenticated: true, 
        session,
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
    console.error('Auth check error:', e);
    return { statusCode: 401, body: JSON.stringify({ authenticated: false, error: e.message }) }
  }
}

// Parse cookie header
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
