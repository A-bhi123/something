import type { Transition } from "motion/react";

/** Shared easing curves and transition presets. Tune here to change the whole site's feel. */
export const easings = {
  /** Fast start, gentle landing. Good default for entrances. */
  out: [0.22, 1, 0.36, 1],
  /** Smooth both ends. Good for movement across the screen. */
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const durations = {
  fast: 0.2,
  base: 0.5,
  slow: 0.9,
} as const;

export const transitions = {
  base: { duration: durations.base, ease: easings.out } satisfies Transition,
  slow: { duration: durations.slow, ease: easings.out } satisfies Transition,
  spring: { type: "spring", stiffness: 260, damping: 26 } satisfies Transition,
  softSpring: { type: "spring", stiffness: 120, damping: 20 } satisfies Transition,
} as const;
