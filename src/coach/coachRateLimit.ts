export type CoachRateLimitBucket = 'customer' | 'feedback' | 'milestone';

type RateLimitClient = {
  rpc(
    functionName: string,
    args: { p_bucket: CoachRateLimitBucket; p_limit: number; p_window_seconds: number },
  ): Promise<{ data: unknown; error: unknown }>;
};

/**
 * Uses an atomic, user-scoped Postgres counter. Unlike process memory, this
 * limit is shared across serverless instances and survives cold starts.
 * Fail closed when the database-side limiter is missing or unavailable.
 */
export async function consumeCoachRateLimit(
  client: RateLimitClient,
  bucket: CoachRateLimitBucket,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 120) {
    throw new Error('Invalid Coach rate-limit configuration.');
  }
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 3600) {
    throw new Error('Invalid Coach rate-limit window.');
  }

  const { data, error } = await client.rpc('coach_consume_rate_limit', {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error('The Coach rate-limit service is unavailable.');
  if (typeof data !== 'boolean') throw new Error('The Coach rate-limit service returned an invalid response.');
  return data;
}
