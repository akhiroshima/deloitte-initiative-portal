import type { Handler } from '@netlify/functions'
import { clearSessionCookie } from './_lib/auth'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  const isSecure = (event.headers['x-forwarded-proto'] || '').includes('https')
  const cookie = clearSessionCookie(isSecure)
  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': cookie,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ok: true })
  }
}
