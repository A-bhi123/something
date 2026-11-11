/**
 * Blocks an IP address after too many wrong passwords (in-memory; resets when the server restarts).
 */
export function createFailureLimiter({ maxFailures, windowMs }) {
  const entries = new Map(); // ip -> { count, resetAt }

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of entries) if (entry.resetAt <= now) entries.delete(ip);
  }, 60_000);
  cleanup.unref();

  function current(ip) {
    const entry = entries.get(ip);
    if (entry && entry.resetAt <= Date.now()) {
      entries.delete(ip);
      return undefined;
    }
    return entry;
  }

  return {
    /** Express middleware: answers 429 while the IP is locked out. */
    guard(req, res, next) {
      const entry = current(req.ip);
      if (entry && entry.count >= maxFailures) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - Date.now()) / 1000);
        res.set("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({ error: "rate_limited", retryAfterSeconds });
      }
      next();
    },
    recordFailure(ip) {
      const entry = current(ip);
      if (entry) entry.count += 1;
      else entries.set(ip, { count: 1, resetAt: Date.now() + windowMs });
    },
    reset(ip) {
      entries.delete(ip);
    },
  };
}
