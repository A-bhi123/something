import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Flower, flowerPalettes, flowerVariants } from "@/components/ui/Flower";
import { seeded } from "@/lib/random";
import "./FlowerRain.css";

type FlowerRainProps = {
  /** How many flowers fall in total. */
  count?: number;
  /** Flowers start falling spread over this many seconds. */
  spawnSeconds?: number;
  /** Wait before the first flower. */
  startDelay?: number;
  seed?: number;
};

/** Flowers falling from the top of the screen. The shower lasts `spawnSeconds`, then the last ones land. */
export function FlowerRain({ count = 95, spawnSeconds = 6, startDelay = 0.3, seed = 5 }: FlowerRainProps) {
  const drops = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: count }, (_, i) => {
      const direction = rand() > 0.5 ? 1 : -1;
      return {
        id: i,
        x: rand() * 100,
        size: 26 + rand() * 38,
        delay: startDelay + rand() * spawnSeconds,
        duration: 4.6 + rand() * 3.2,
        sway: (18 + rand() * 46) * direction,
        spin: direction * (180 + rand() * 540),
        flip: direction * (360 + rand() * 360),
        variant: flowerVariants[Math.floor(rand() * flowerVariants.length)],
        palette: flowerPalettes[Math.floor(rand() * flowerPalettes.length)],
      };
    });
  }, [count, spawnSeconds, startDelay, seed]);

  // Once the last flower has landed, remove the whole layer.
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const longest = Math.max(...drops.map((d) => d.delay + d.duration));
    const timer = window.setTimeout(() => setFinished(true), (longest + 0.5) * 1000);
    return () => window.clearTimeout(timer);
  }, [drops]);

  if (finished) return null;

  return (
    <div className="rain" aria-hidden="true">
      {drops.map((d) => (
        <motion.div
          key={d.id}
          className="rain__drop"
          style={{
            left: `${d.x}%`,
            width: `clamp(18px, ${(d.size / 7).toFixed(1)}vw, ${Math.round(d.size)}px)`,
            transformPerspective: 600,
          }}
          initial={{ y: "-18vh", opacity: 0 }}
          animate={{
            y: "118vh",
            x: [0, d.sway, -d.sway * 0.7, d.sway * 0.5, 0],
            rotate: d.spin,
            rotateY: d.flip,
            opacity: [0, 1, 1, 0.95],
          }}
          transition={{
            y: { duration: d.duration, delay: d.delay, ease: "linear" },
            x: { duration: d.duration, delay: d.delay, ease: "easeInOut" },
            rotate: { duration: d.duration, delay: d.delay, ease: "linear" },
            rotateY: { duration: d.duration, delay: d.delay, ease: "linear" },
            opacity: { duration: d.duration, delay: d.delay, times: [0, 0.06, 0.86, 1], ease: "linear" },
          }}
        >
          <Flower variant={d.variant} palette={d.palette} />
        </motion.div>
      ))}
    </div>
  );
}
