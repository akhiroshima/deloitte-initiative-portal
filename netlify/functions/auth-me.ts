import type { Handler } from '@netlify/functions'
import { parseCookies, verifySession } from './_lib/auth'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const cookies = parseCookies(event.headers.cookie)
    const token = cookies['session']
    if (!token) return { statusCode: 401, body: JSON.stringify({ authenticated: false }) }

    const claims = await verifySession(token)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authenticated: true, email: claims.sub, domain: claims.dom })
    }
  } catch (e: any) {
    return { statusCode: 401, body: JSON.stringify({ authenticated: false, error: e.message }) }
  }
}
