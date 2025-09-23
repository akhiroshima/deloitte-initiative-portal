import type { Handler } from '@netlify/functions'
import { z } from 'zod'
import { signSession, buildSessionCookie } from './_lib/auth'

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) })

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const parsed = bodySchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) }
    }

    const { email, password } = parsed.data
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || '').toLowerCase()
    if (!allowedDomain) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Auth not configured: missing ALLOWED_EMAIL_DOMAIN' }) }
    }

    const emailLower = email.toLowerCase().trim()
    const domain = emailLower.split('@')[1] || ''
    if (domain !== allowedDomain) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Email domain not allowed' }) }
    }

    const sharedPassword = process.env.AUTH_SHARED_PASSWORD
    if (!sharedPassword) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Auth not configured: missing AUTH_SHARED_PASSWORD' }) }
    }

    if (password !== sharedPassword) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) }
    }

    const token = await signSession(emailLower, domain, 60 * 60 * 24) // 24h
    const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
    const cookie = buildSessionCookie(token, isSecure)

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, user: { email: emailLower, domain } })
    }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Server error' }) }
  }
}
