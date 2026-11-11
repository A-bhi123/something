import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.dirname(serverDir);

export class ConfigError extends Error {}

/** Reads server/.env (if present) and validates settings. Throws ConfigError with a readable message. */
export function loadConfig() {
  try {
    process.loadEnvFile(path.join(serverDir, ".env"));
  } catch (error) {
    // No .env file is fine when the host provides environment variables directly.
    if (error.code !== "ENOENT") throw error;
  }

  const password = process.env.APP_PASSWORD ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";

  const problems = [];
  if (!password) {
    problems.push("APP_PASSWORD is missing. Set the password visitors must enter in server/.env");
  }
  if (sessionSecret.length < 32) {
    problems.push(
      "SESSION_SECRET must be at least 32 characters. Generate one with:\n" +
        `    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  if (problems.length > 0) {
    throw new ConfigError(
      `Server settings are incomplete:\n  - ${problems.join("\n  - ")}\n\n` +
        "Copy server/.env.example to server/.env and fill it in.",
    );
  }

  return Object.freeze({
    isProduction: process.env.NODE_ENV === "production" || process.argv.includes("--production"),
    port: Number(process.env.PORT) || 3001,
    password,
    sessionSecret,
    sessionHours: Number(process.env.SESSION_HOURS) || 12,
    cookieName: "site_session",
    cookieSecure: process.env.COOKIE_SECURE === "true",
    trustProxy: Number(process.env.TRUST_PROXY) || 0,
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
    distDir: path.join(rootDir, "dist"),
  });
}
