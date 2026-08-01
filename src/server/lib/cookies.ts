type CookieOptions = {
  maxAge?: number
  expires?: Date
  domain?: string
  path?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
  httpOnly?: boolean
}

/** Parse an HTTP `Cookie` header into name/value pairs. */
export function parseCookieHeader(header: string | null | undefined) {
  const cookies: { name: string; value: string }[] = []
  if (!header) return cookies
  for (const part of header.split(/;\s*/)) {
    if (!part) continue
    const eq = part.indexOf('=')
    if (eq === -1) continue
    cookies.push({
      name: decodeURIComponent(part.slice(0, eq)),
      value: decodeURIComponent(part.slice(eq + 1)),
    })
  }
  return cookies
}

/** Serialize a single cookie to a `Set-Cookie` value. */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  const pairs = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  ]
  if (typeof options.maxAge === 'number') pairs.push(`Max-Age=${options.maxAge}`)
  if (options.domain) pairs.push(`Domain=${options.domain}`)
  pairs.push(`Path=${options.path ?? '/'}`)
  if (options.expires) pairs.push(`Expires=${options.expires.toUTCString()}`)
  if (options.httpOnly) pairs.push('HttpOnly')
  if (options.secure) pairs.push('Secure')
  const sameSite =
    typeof options.sameSite === 'boolean'
      ? options.sameSite
        ? 'Strict'
        : 'None'
      : options.sameSite
  if (sameSite) pairs.push(`SameSite=${sameSite}`)
  return pairs.join('; ')
}
