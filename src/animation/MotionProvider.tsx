import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { transitions } from "./transitions";

/**
 * Wraps the app once. `reducedMotion="user"` makes Motion respect the visitor's
 * "reduce motion" system setting (transform animations are disabled automatically).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transitions.base}>
      {children}
    </MotionConfig>
  );
}
