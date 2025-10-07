import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const debugHandler: Handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('Supabase Key:', supabaseKey ? 'SET' : 'NOT SET')
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database not configured' })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: error.message 
        })
      }
    }

    // Test user creation with minimal data
    const testUser = {
      email: 'debug-test@deloitte.com',
      username: 'debugtest',
      password_hash: 'test-hash',
      name: 'Debug Test',
      role: 'Developer',
      location: 'Test',
      skills: ['Test'],
      weekly_capacity_hrs: 20,
      avatar_url: 'https://ui-avatars.com/api/?name=Debug%20Test&background=random',
      needs_password_change: true,
      created_at: new Date().toISOString()
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()

    if (insertError) {
      console.error('User creation error:', insertError)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create user',
          details: insertError.message,
          code: insertError.code
        })
      }
    }

    // Clean up test user
    await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id)

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Database connection and user creation test successful',
        testUser: newUser
      })
    }

  } catch (e: any) {
    console.error('Debug error:', e)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Debug failed',
        details: e.message,
        stack: e.stack
      })
    }
  }
}

export { debugHandler as handler }
