import type { Variants } from "motion/react";
import { transitions } from "./transitions";

/** Reusable variants. Use with <motion.div variants={...} initial="hidden" animate="visible" />. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.base },
};

/** Parent variant that staggers its children. Children must use matching variant names. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});
