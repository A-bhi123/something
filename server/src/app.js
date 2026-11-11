import express from "express";
import path from "node:path";
import { createAuthService } from "./services/auth.js";
import { createFailureLimiter } from "./middleware/failureLimiter.js";
import { createAuthRouter } from "./routes/auth.js";

export function createApp(config) {
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", config.trustProxy);

  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
    });
    next();
  });

  app.use(express.json({ limit: "1kb" }));

  const auth = createAuthService(config);
  const limiter = createFailureLimiter({
    maxFailures: config.maxFailedAttempts,
    windowMs: config.lockoutMinutes * 60 * 1000,
  });

  app.use("/api/auth", createAuthRouter({ config, auth, limiter }));
  app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

  // In production the same server also serves the built website.
  if (config.isProduction) {
    app.use(express.static(config.distDir));
    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(path.join(config.distDir, "index.html"));
    });
  }

  // Malformed JSON and other unexpected errors.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
      return res.status(400).json({ error: "invalid_request" });
    }
    console.error(error);
    res.status(500).json({ error: "server_error" });
  });

  return app;
}
