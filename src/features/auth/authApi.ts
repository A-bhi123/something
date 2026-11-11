/** Talks to the backend auth routes. The password is only ever sent to the server, never stored here. */

export type LoginFailure =
  | { ok: false; reason: "invalid_password" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; reason: "unavailable" };

export type LoginResult = { ok: true } | LoginFailure;

export async function getSession(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", { signal, cache: "no-store" });
    if (!response.ok) return false;
    const data: { authenticated?: boolean } = await response.json();
    return data.authenticated === true;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) return { ok: true };
    if (response.status === 401) return { ok: false, reason: "invalid_password" };
    if (response.status === 429) {
      const data: { retryAfterSeconds?: number } = await response.json().catch(() => ({}));
      return { ok: false, reason: "rate_limited", retryAfterSeconds: data.retryAfterSeconds ?? 900 };
    }
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
