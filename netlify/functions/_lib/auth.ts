import { SignJWT, jwtVerify } from 'jose'

const encoder = new TextEncoder()

export interface SessionClaims {
  sub: string // email
  dom: string // domain
  iat?: number
  exp?: number
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) throw new Error('Missing AUTH_JWT_SECRET')
  return encoder.encode(secret)
}

export async function signSession(email: string, domain: string, ttlSeconds = 60 * 60 * 24): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const claims: SessionClaims = { sub: email, dom: domain, iat: now, exp: now + ttlSeconds }
  return await new SignJWT(claims as any)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(claims.exp!)
    .sign(getJwtSecret())
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] })
  return payload as unknown as SessionClaims
}

export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(';').forEach(part => {
    const idx = part.indexOf('=')
    if (idx > -1) {
      const k = part.slice(0, idx).trim()
      const v = decodeURIComponent(part.slice(idx + 1))
      out[k] = v
    }
  })
  return out
}

export function buildSessionCookie(token: string, secure: boolean): string {
  // Note: Secure only on HTTPS; SameSite=Lax to allow top-level POSTs
  const parts = [
    `session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  // 7 day max age matches default TTL above if extended
  parts.push('Max-Age=604800')
  return parts.join('; ')
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [
    'session=deleted',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
