import { motion } from "motion/react";
import { Flower, flowerPalettes, flowerVariants } from "@/components/ui/Flower";
import { seeded } from "@/lib/random";

const starRand = seeded(11);
const stars = Array.from({ length: 44 }, () => ({
  x: starRand() * 100,
  y: starRand() * 52,
  size: 1.5 + starRand() * 2.5,
  delay: starRand() * 4,
  duration: 2 + starRand() * 3,
}));

const flyRand = seeded(23);
const fireflies = Array.from({ length: 18 }, () => ({
  x: flyRand() * 100,
  y: 45 + flyRand() * 45,
  dx: (flyRand() - 0.5) * 120,
  dy: -(20 + flyRand() * 80),
  size: 4 + flyRand() * 4,
  delay: flyRand() * 5,
  duration: 6 + flyRand() * 6,
}));

const sproutRand = seeded(37);
const sprouts = [4, 13, 22, 31, 69, 78, 87, 95].map((x, i) => ({
  x,
  bottom: 2 + sproutRand() * 5,
  height: 46 + sproutRand() * 50,
  size: 30 + sproutRand() * 18,
  variant: flowerVariants[i % flowerVariants.length],
  palette: flowerPalettes[(i * 2 + 1) % flowerPalettes.length],
  delay: 1.4 + i * 0.22,
  sway: 2.5 + sproutRand() * 2,
  duration: 3 + sproutRand() * 2.5,
}));

/** Dreamy sunset garden: soft aurora, stars, a glowing moon, fireflies, hills and flowers that grow. */
export function StoryBackground() {
  return (
    <div className="story__bg" aria-hidden="true">
      {/* Slow drifting colour clouds */}
      <motion.div
        className="story__aurora story__aurora--pink"
        animate={{ x: ["-8%", "10%", "-8%"], y: ["0%", "8%", "0%"], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="story__aurora story__aurora--violet"
        animate={{ x: ["8%", "-10%", "8%"], y: ["6%", "-4%", "6%"], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 19, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="story__aurora story__aurora--teal"
        animate={{ x: ["0%", "-12%", "0%"], y: ["-4%", "6%", "-4%"], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Stars */}
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="story__star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, ease: "easeInOut", repeat: Infinity }}
        />
      ))}

      {/* Moon */}
      <motion.div
        className="story__moon"
        animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Fireflies */}
      {fireflies.map((f, i) => (
        <motion.span
          key={i}
          className="story__firefly"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.size, height: f.size }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0.1, 1, 0.1] }}
          transition={{ duration: f.duration, delay: f.delay, ease: "easeInOut", repeat: Infinity }}
        />
      ))}

      {/* Hills */}
      <svg className="story__hills" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a2a7e" />
            <stop offset="100%" stopColor="#3b1457" />
          </linearGradient>
          <linearGradient id="hill-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d1a66" />
            <stop offset="100%" stopColor="#24093d" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 170 C240 110 480 215 720 165 C960 115 1200 205 1440 145 L1440 320 L0 320 Z"
          fill="url(#hill-back)"
          animate={{ x: [0, -14, 0] }}
          transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
        />
        <path
          d="M0 245 C300 190 560 275 820 228 C1080 182 1260 252 1440 218 L1440 320 L0 320 Z"
          fill="url(#hill-front)"
        />
      </svg>

      {/* Flowers that grow out of the grass */}
      {sprouts.map((p, i) => (
        <motion.div
          key={i}
          className="story__sprout"
          style={{ left: `${p.x}%`, bottom: `${p.bottom}vh`, height: p.height, originY: 1 }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 70, damping: 11, delay: p.delay }}
        >
          <motion.div
            className="story__sway"
            style={{ originY: 1 }}
            animate={{ rotate: [-p.sway, p.sway] }}
            transition={{ duration: p.duration, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          >
            <Flower variant={p.variant} palette={p.palette} className="story__bloom" style={{ width: p.size }} />
            <span className="story__stem" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
