import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { LoginScene } from "@/scenes/login/LoginScene";
import { getSession, login, type LoginResult } from "./authApi";
import { GateContext, type GatePhase } from "./GateContext";

/**
 * Shows the entrance gate until the backend confirms the password.
 * The protected content is not rendered at all while locked. It starts rendering only
 * when the doors begin to swing open, so the visitor sees it appear behind the gate.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("checking");

  useEffect(() => {
    const controller = new AbortController();
    getSession(controller.signal).then((authenticated) => {
      // Already signed in: no ceremony, the gate just fades away.
      if (!controller.signal.aborted) setPhase(authenticated ? "open" : "locked");
    });
    return () => controller.abort();
  }, []);

  async function handleLogin(password: string): Promise<LoginResult> {
    const result = await login(password);
    if (result.ok) setPhase("unlocking");
    return result;
  }

  const handleOpening = useCallback(() => setPhase("opening"), []);
  const handleOpened = useCallback(() => setPhase("open"), []);

  const showContent = phase === "opening" || phase === "open";

  return (
    <GateContext.Provider value={phase}>
      {showContent && children}
      <AnimatePresence>
        {phase !== "open" && (
          <LoginScene key="login" phase={phase} onSubmit={handleLogin} onOpening={handleOpening} onOpened={handleOpened} />
        )}
      </AnimatePresence>
    </GateContext.Provider>
  );
}
