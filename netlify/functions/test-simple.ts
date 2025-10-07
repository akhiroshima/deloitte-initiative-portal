import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const testHandler: Handler = async (event) => {
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
    
    // Try to insert a simple user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'test-simple@deloitte.com',
        username: 'testsimple',
        password_hash: 'test-hash',
        name: 'Test Simple',
        role: 'Developer',
        location: 'Test',
        skills: ['Test'],
        weekly_capacity_hrs: 20
      })
      .select()
      .single()

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Database insert failed',
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
    }

    // Clean up
    await supabase
      .from('users')
      .delete()
      .eq('id', data.id)

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Simple test passed',
        userId: data.id
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

export { testHandler as handler }
