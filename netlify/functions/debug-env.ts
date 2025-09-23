import type { Handler } from '@netlify/functions'

const debugHandler: Handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN ? 'SET' : 'NOT SET',
      AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    })
  }
}

export const handler = debugHandler
