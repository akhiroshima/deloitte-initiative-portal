import type { Handler } from '@netlify/functions'

const checkEnvHandler: Handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
        supabaseKey: supabaseKey ? 'SET' : 'NOT SET',
        supabaseUrlLength: supabaseUrl?.length || 0,
        supabaseKeyLength: supabaseKey?.length || 0,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      })
    }
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    }
  }
}

export { checkEnvHandler as handler }
