import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '../lib/supabase'

export const signIn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    // Flush auth cookies in the handler's synchronous frame so they reach the
    // browser on the server-function response.
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return { ok: true } as const
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const { client, flushCookies } = getSupabaseServerClient()
  await client.auth.signOut()
  flushCookies()
  return { ok: true } as const
})

/** Lightweight session probe used by route guards. */
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { client } = getSupabaseServerClient()
  const {
    data: { session },
  } = await client.auth.getSession()
  return {
    session: session
      ? { user: { id: session.user.id, email: session.user.email ?? '' } }
      : null,
  }
})
