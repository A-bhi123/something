import { useMemo } from "react";
import { motion } from "motion/react";
import { seeded } from "@/lib/random";

type Props = {
  /** Change this number to fire a new burst. */
  burst: number;
  count?: number;
  /** Maximum distance flown, in px. */
  spread?: number;
};

const colors = ["#ffe39a", "#fff7da", "#ffc2d6", "#ffffff", "#f7a8c4"];

/** Little stars, hearts and glints that fly out of a point and fade, like glitter leaving an envelope. */
export function Burst({ burst, count = 46, spread = 420 }: Props) {
  const parts = useMemo(() => {
    const r = seeded(burst * 97 + 3);
    return Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.5;
      const d = spread * (0.35 + r() * 0.65);
      return {
        id: i,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        fall: 60 + r() * 140,
        size: 8 + r() * 16,
        kind: r() < 0.5 ? "star" : r() < 0.75 ? "heart" : "dot",
        color: colors[Math.floor(r() * colors.length)],
        delay: r() * 0.35,
        duration: 1.5 + r() * 1.3,
        spin: (r() - 0.5) * 360,
      };
    });
  }, [burst, count, spread]);

  if (burst === 0) return null;
  return (
    <div className="burst" aria-hidden="true">
      {parts.map((p) => (
        <motion.svg
          key={`${burst}-${p.id}`}
          className="burst__p"
          viewBox="0 0 20 20"
          width={p.size}
          height={p.size}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + p.fall], scale: [0, 1, 0.8, 0], opacity: [0, 1, 1, 0], rotate: p.spin }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", times: [0, 0.4, 0.75, 1] }}
        >
          {p.kind === "star" && <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill={p.color} />}
          {p.kind === "heart" && <path d="M10 18 C-4 8 3 -1 10 5 C17 -1 24 8 10 18Z" fill={p.color} />}
          {p.kind === "dot" && <circle cx="10" cy="10" r="6" fill={p.color} />}
        </motion.svg>
      ))}
    </div>
  );
}
