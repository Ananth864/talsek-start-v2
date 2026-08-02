import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { serverEnv } from './env'

export type RateLimitBucket = 'form-submit' | 'interview'

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

const BUCKET_LIMITS: Record<
  RateLimitBucket,
  { limit: number; windowMs: number }
> = {
  // Source form-submit: Upstash sliding window 3 / 1m.
  'form-submit': { limit: 3, windowMs: 60_000 },
  // Source interview-conversation: 15 / 1m (wired when #12 lands).
  interview: { limit: 15, windowMs: 60_000 },
}

let upstashLimiters: Partial<Record<RateLimitBucket, Ratelimit>> | null = null

function getUpstashLimiters(): Partial<Record<RateLimitBucket, Ratelimit>> | null {
  const url = serverEnv.UPSTASH_REDIS_REST_URL
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (upstashLimiters) return upstashLimiters

  const redis = new Redis({ url, token })
  upstashLimiters = {
    'form-submit': new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: 'talsek:rl:form-submit',
    }),
    interview: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, '1 m'),
      analytics: true,
      prefix: 'talsek:rl:interview',
    }),
  }
  return upstashLimiters
}

/** In-process sliding window — used when Upstash env is absent (local/E2E). */
const memoryBuckets = new Map<string, number[]>()

function checkMemoryRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): RateLimitResult {
  const { limit, windowMs } = BUCKET_LIMITS[bucket]
  const key = `${bucket}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs
  const stamps = (memoryBuckets.get(key) ?? []).filter((t) => t > windowStart)

  if (stamps.length >= limit) {
    const oldest = stamps[0] ?? now
    memoryBuckets.set(key, stamps)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: oldest + windowMs,
    }
  }

  stamps.push(now)
  memoryBuckets.set(key, stamps)
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - stamps.length),
    reset: now + windowMs,
  }
}

/**
 * IP-scoped rate limit for Applicant token flows. Prefer Upstash when
 * configured (production parity with source edge fns); otherwise fall back to
 * an in-process window so local/E2E still reject overruns (ADR-0015).
 */
export async function checkIpRateLimit(
  bucket: RateLimitBucket,
  clientIp: string,
): Promise<RateLimitResult> {
  const identifier = clientIp || 'unknown'
  const upstash = getUpstashLimiters()?.[bucket]
  if (upstash) {
    const result = await upstash.limit(`${bucket}:${identifier}`)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }
  return checkMemoryRateLimit(bucket, identifier)
}
