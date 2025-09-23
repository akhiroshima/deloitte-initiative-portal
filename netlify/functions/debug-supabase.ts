import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const debugSupabaseHandler: Handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing environment variables',
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_ANON_KEY: !!supabaseKey
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        connection: 'OK',
        error: error?.message || null,
        data: data
      })
    }
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Supabase connection failed',
        message: e.message,
        stack: e.stack
      })
    }
  }
}

export const handler = debugSupabaseHandler
