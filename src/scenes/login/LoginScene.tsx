import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useAnimate, useReducedMotion, type Variants } from "motion/react";
import { durations, easings, slideUp, staggerContainer } from "@/animation";
import type { LoginFailure, LoginResult } from "@/features/auth/authApi";
import type { GatePhase } from "@/features/auth/GateContext";
import { BirthdayBackground } from "./BirthdayBackground";
import { EntryDoor } from "./EntryDoor";
import "./LoginScene.css";

type LoginSceneProps = {
  phase: GatePhase;
  onSubmit: (password: string) => Promise<LoginResult>;
  /** Called when the light fills the screen, so the site behind it can start. */
  onOpening: () => void;
  /** Called when the entrance has faded away completely. */
  onOpened: () => void;
};

/** Only used when a signed-in visitor skips the gate: the screen simply fades. */
const loginExit: Variants = {
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

function messageFor(failure: LoginFailure): string {
  switch (failure.reason) {
    case "invalid_password":
      return "Wrong password. Check it and try again.";
    case "rate_limited": {
      const minutes = Math.max(1, Math.ceil(failure.retryAfterSeconds / 60));
      return `Too many wrong attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
    }
    case "unavailable":
      return "Can't reach the server. Check that it is running, then try again.";
  }
}

export function LoginScene({ phase, onSubmit, onOpening, onOpened }: LoginSceneProps) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [formScope, animateForm] = useAnimate<HTMLFormElement>();
  const reduceMotion = useReducedMotion() === true;

  const checking = phase === "checking";
  /** True from the moment the password is accepted until the doors are gone. */
  const entered = phase === "unlocking" || phase === "opening";

  // Keep the latest callbacks without restarting the gate sequence when the parent re-renders.
  const callbacks = useRef({ onOpening, onOpened });
  callbacks.current = { onOpening, onOpened };

  useEffect(() => {
    if (!checking) inputRef.current?.focus();
  }, [checking]);

  /**
   * The entrance sequence after a correct password:
   * card dissolves -> pastel scene fades into the door picture -> camera drifts up to the door ->
   * the door unlocks and swings open -> warm light floods the screen -> the site appears out of the light.
   */
  useEffect(() => {
    if (!entered) return;
    let cancelled = false;
    const pause = (seconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, seconds * 1000));

    (async () => {
      await animate(".login__panel", { opacity: 0, scale: 0.94, y: -14 }, { duration: 0.5, ease: easings.out });
      if (cancelled) return;

      if (!reduceMotion) {
        // Start walking toward the door while the pastel scene melts away.
        const approach = animate(
          ".entry__world",
          { scale: 2.3, x: "4.25%", y: "-2.95%" },
          { duration: 4.2, ease: [0.45, 0, 0.2, 1] },
        );
        await animate(".login__hearts", { opacity: 0, scale: 1.08 }, { duration: 1.1, ease: "easeInOut" });
        await approach;
        if (cancelled) return;

        // The lock clicks...
        await animate(".entry__leaf", { rotateY: [0, -2.5, 0, -1.5, 0] }, { duration: 0.6, ease: "easeInOut" });
        if (cancelled) return;
        await pause(0.2);

        // ...and the door opens by itself while the camera keeps moving in.
        await Promise.all([
          animate(".entry__leaf", { rotateY: -88 }, { duration: 2, ease: easings.inOut }),
          animate(".entry__shade", { opacity: 0.65 }, { duration: 1.9, ease: "easeIn" }),
          animate(".entry__world", { scale: 3.6 }, { duration: 3, ease: [0.5, 0, 0.7, 1] }),
          animate(".entry__glow", { opacity: [0, 1], scale: [0.6, 1.5] }, { duration: 2.4, ease: "easeOut" }),
          pause(1.1).then(() => animate(".entry__flood", { opacity: 1 }, { duration: 1.3, ease: "easeIn" })),
        ]);
        if (cancelled) return;
      }

      // The screen is full of light: the site can start behind it, then the light clears.
      callbacks.current.onOpening();
      await animate(scope.current, { opacity: 0 }, { duration: reduceMotion ? 0.5 : 1.6, ease: "easeInOut" });
      if (cancelled) return;

      callbacks.current.onOpened();
    })();

    return () => {
      cancelled = true;
    };
  }, [entered, animate, scope, reduceMotion]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || password.length === 0) return;

    setBusy(true);
    setMessage(null);
    const result = await onSubmit(password);
    if (result.ok) return; // The gate sequence above takes over.

    setBusy(false);
    setMessage(messageFor(result));
    if (result.reason === "invalid_password") {
      setPassword("");
      animateForm(formScope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
    }
    inputRef.current?.focus();
  }

  return (
    <motion.div ref={scope} className="login" variants={loginExit} exit="exit">
      <EntryDoor live={entered} />

      <div className="login__hearts" aria-hidden="true">
        <BirthdayBackground />
      </div>

      <div className="login__center">
        <motion.div
          className="login__panel"
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate={checking ? "hidden" : "visible"}
          inert={checking || entered}
        >
          <motion.div className="login__intro" variants={slideUp}>
            <h1 className="login__title">Private site</h1>
            <p className="login__hint">Enter the password to continue.</p>
          </motion.div>

          <motion.form
            ref={formScope}
            className="login__form"
            variants={slideUp}
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="login__field">
              <label htmlFor="password" className="login__label">
                Password
              </label>
              <input
                ref={inputRef}
                id="password"
                name="password"
                type="password"
                className="login__input"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                readOnly={busy}
                aria-invalid={message !== null}
                aria-describedby="login-message"
              />
            </div>

            <p id="login-message" className="login__message" role="alert">
              {message}
            </p>

            <button type="submit" className="login__button" disabled={busy || password.length === 0}>
              {busy ? "Checking…" : "Open site"}
            </button>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
}
