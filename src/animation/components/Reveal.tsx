import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { slideUp } from "../variants";

type RevealProps = {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
  /** Animate only the first time it enters the viewport. */
  once?: boolean;
};

/** Reusable scroll-triggered entrance. Use where the reveal has a purpose, not on everything. */
export function Reveal({
  children,
  variants = slideUp,
  className,
  amount = 0.3,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}
