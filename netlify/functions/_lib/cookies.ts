/** Parse Cookie header into a record of name -> value. */
export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx > -1) {
      const k = part.slice(0, idx).trim()
      const v = decodeURIComponent(part.slice(idx + 1))
      out[k] = v
    }
  })
  return out
}

/** Build Set-Cookie value for Supabase auth tokens (used by auth-login and auth-set-cookies). */
export function buildSupabaseAuthCookie(accessToken: string, refreshToken: string, secure: boolean): string {
  const parts = [
    `sb-access-token=${encodeURIComponent(accessToken)}`,
    `sb-refresh-token=${encodeURIComponent(refreshToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

/** Build a Set-Cookie value that clears the named cookie. */
export function clearCookie(name: string, secure: boolean): string {
  const parts = [
    `${name}=deleted`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
