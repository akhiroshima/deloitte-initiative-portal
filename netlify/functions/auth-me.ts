import type { Handler } from '@netlify/functions'
import { parseCookies, verifySession } from './_lib/auth'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const cookies = parseCookies(event.headers.cookie)
    const token = cookies['session']
    if (!token) return { statusCode: 401, body: JSON.stringify({ authenticated: false }) }

    const claims = await verifySession(token)
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Database not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', claims.sub)
      .single()

    if (error || !user) {
      return { statusCode: 401, body: JSON.stringify({ authenticated: false }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        authenticated: true, 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          location: user.location,
          skills: user.skills,
          weeklyCapacityHrs: user.weekly_capacity_hrs,
          avatarUrl: user.avatar_url
        }
      })
    }
  } catch (e: any) {
    return { statusCode: 401, body: JSON.stringify({ authenticated: false, error: e.message }) }
  }
}
