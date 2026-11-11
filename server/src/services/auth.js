import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const sha256 = (value) => createHash("sha256").update(value).digest();

/** Password checking and signed, expiring session tokens. */
export function createAuthService({ password, sessionSecret, sessionHours }) {
  const expectedDigest = sha256(password);
  const ttlMs = sessionHours * 60 * 60 * 1000;
  const sign = (payload) => createHmac("sha256", sessionSecret).update(payload).digest("base64url");

  return {
    sessionMaxAgeMs: ttlMs,

    /** Compares digests (equal length) in constant time so timing reveals nothing. */
    verifyPassword(input) {
      return timingSafeEqual(sha256(input), expectedDigest);
    },

    createSessionToken(now = Date.now()) {
      const payload = Buffer.from(JSON.stringify({ exp: now + ttlMs })).toString("base64url");
      return `${payload}.${sign(payload)}`;
    },

    verifySessionToken(token, now = Date.now()) {
      if (typeof token !== "string") return false;
      const parts = token.split(".");
      if (parts.length !== 2) return false;
      const [payload, signature] = parts;

      const given = Buffer.from(signature);
      const expected = Buffer.from(sign(payload));
      if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;

      try {
        const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
        return typeof exp === "number" && exp > now;
      } catch {
        return false;
      }
    },
  };
}
