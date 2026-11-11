import { Router } from "express";
import { readCookie } from "../lib/cookies.js";

const MAX_PASSWORD_LENGTH = 200;

export function createAuthRouter({ config, auth, limiter }) {
  const router = Router();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: config.cookieSecure,
    path: "/",
  };

  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  router.get("/session", (req, res) => {
    const token = readCookie(req, config.cookieName);
    res.json({ authenticated: auth.verifySessionToken(token) });
  });

  router.post("/login", limiter.guard, (req, res) => {
    const password = req.body?.password;
    if (typeof password !== "string" || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ error: "invalid_request" });
    }

    if (!auth.verifyPassword(password)) {
      limiter.recordFailure(req.ip);
      return res.status(401).json({ error: "invalid_password" });
    }

    limiter.reset(req.ip);
    res.cookie(config.cookieName, auth.createSessionToken(), {
      ...cookieOptions,
      maxAge: auth.sessionMaxAgeMs,
    });
    res.json({ ok: true });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(config.cookieName, cookieOptions);
    res.json({ ok: true });
  });

  return router;
}
