import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

type Props = {
  /** A scene change is in progress while this is true. */
  active: boolean;
  /** Called when the screen is completely covered: swap the scene now. */
  onCovered: () => void;
  /** Called when the cover has fully faded away. */
  onDone: () => void;
};

/**
 * A soft rose-white bloom that grows from the bottom centre until it covers the screen, lets the scene change
 * underneath, then dissolves to reveal the new scene.
 */
export function SceneTransition({ active, onCovered, onDone }: Props) {
  const radius = useMotionValue(0);
  const opacity = useMotionValue(1);
  const clip = useTransform(radius, (r) => `circle(${r}% at 50% 90%)`);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    radius.set(0);
    opacity.set(1);
    const grow = animate(radius, 150, {
      duration: 1.0,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        if (cancelled) return;
        onCovered();
        window.setTimeout(() => {
          if (cancelled) return;
          animate(opacity, 0, { duration: 0.9, ease: "easeOut", onComplete: () => !cancelled && onDone() });
        }, 250);
      },
    });
    return () => {
      cancelled = true;
      grow.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        clipPath: clip,
        opacity,
        pointerEvents: "all",
        background: "radial-gradient(circle at 50% 90%, #fff6f9 0%, #ffd9e8 45%, #f7b4cf 100%)",
      }}
    />
  );
}
