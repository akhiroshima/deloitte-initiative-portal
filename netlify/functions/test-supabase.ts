import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const testSupabaseHandler: Handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Missing Supabase credentials',
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Supabase query failed',
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Supabase connection successful',
        data: data
      })
    }

  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Test failed',
        details: e.message,
        stack: e.stack
      })
    }
  }
}

export { testSupabaseHandler as handler }
