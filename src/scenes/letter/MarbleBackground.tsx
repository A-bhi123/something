import { useMemo } from "react";
import { motion } from "motion/react";
import { Flower, type FlowerPalette } from "@/components/ui/Flower";
import { seeded } from "@/lib/random";

const dustRand = seeded(71);
const motes = Array.from({ length: 26 }, () => ({
  x: dustRand() * 100,
  y: 8 + dustRand() * 80,
  size: 2 + dustRand() * 5,
  dx: (dustRand() - 0.5) * 60,
  dy: -(30 + dustRand() * 90),
  delay: dustRand() * 6,
  duration: 8 + dustRand() * 8,
}));

const paleRose: FlowerPalette = { petal: "#ffd9e6", edge: "#f3a9c4", center: "#fff0c0" };
const petalRand = seeded(19);
const drifters = Array.from({ length: 9 }, () => ({
  x: petalRand() * 100,
  size: 16 + petalRand() * 14,
  delay: petalRand() * 14,
  duration: 16 + petalRand() * 10,
  sway: 30 + petalRand() * 60,
  spin: 200 + petalRand() * 360,
}));

const quad = (t: number, p0: number, p1: number, p2: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

/** Dried stems in a glass jar, drawn from a seeded generator so it is identical on every render. */
function DriedFlowers() {
  const stems = useMemo(() => {
    const r = seeded(5);
    return Array.from({ length: 11 }, (_, i) => {
      const t = i / 10 - 0.5;
      const tipX = 130 + t * 150 + (r() - 0.5) * 20;
      const tipY = 20 + r() * 60 + Math.abs(t) * 50;
      const midX = 130 + t * 40;
      const grains = Array.from({ length: 7 + Math.floor(r() * 5) }, (_, g) => ({
        k: 0.35 + (g / 11) * 0.65,
        side: g % 2 ? 1 : -1,
        len: 9 + r() * 7,
      }));
      return { tipX, tipY, midX, grains, hue: r() > 0.5 ? "#c9a273" : "#b8895c" };
    });
  }, []);
  return (
    <svg className="lt__flowers" viewBox="0 0 260 420" aria-hidden="true">
      <defs>
        <linearGradient id="jar-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity=".6" />
        </linearGradient>
      </defs>
      {stems.map((s, i) => (
        <g key={i}>
          <path d={`M130 330 Q${s.midX} 200 ${s.tipX} ${s.tipY}`} fill="none" stroke={s.hue} strokeWidth="1.7" strokeLinecap="round" />
          {s.grains.map((g, j) => {
            const x = quad(g.k, 130, s.midX, s.tipX);
            const y = quad(g.k, 330, 200, s.tipY);
            return <ellipse key={j} cx={x + g.side * 4} cy={y} rx="2.4" ry={g.len / 2} fill="#d9b98c" transform={`rotate(${g.side * 38} ${x} ${y})`} />;
          })}
        </g>
      ))}
      <g transform="translate(176 140)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-15" rx="10" ry="17" fill="#f7b9cf" stroke="#e48ead" strokeWidth=".8" transform={`rotate(${a})`} />
        ))}
        <circle r="7" fill="#8b5a3c" />
      </g>
      <path d="M176 156 Q168 240 134 330" fill="none" stroke="#a9835a" strokeWidth="1.8" />
      <path d="M72 300 Q70 296 80 292 L180 292 Q190 296 188 300 L196 390 Q196 408 178 408 L82 408 Q64 408 64 390 Z" fill="url(#jar-glass)" stroke="#fff" strokeOpacity=".8" strokeWidth="1.4" />
      <rect x="72" y="338" width="116" height="42" rx="3" fill="#fff" opacity=".78" />
      <path d="M72 326 Q130 340 188 326" fill="none" stroke="#f3a3be" strokeWidth="5" />
      <path d="M86 300 L84 400" stroke="#fff" strokeWidth="3" strokeOpacity=".7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Bright white-and-rose marble tabletop with a jar of dried flowers, a soft window light, dust motes and a few
 * pale petals drifting. Calm on purpose: the envelope and the letter are the stars.
 */
export function MarbleBackground() {
  return (
    <div className="lt__bg" aria-hidden="true">
      <svg className="lt__marble" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mb-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbf3f5" />
            <stop offset=".55" stopColor="#f7ebef" />
            <stop offset="1" stopColor="#fdf8f8" />
          </linearGradient>
          <linearGradient id="mb-table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2e6e6" />
            <stop offset=".08" stopColor="#fffdfc" />
            <stop offset="1" stopColor="#f7efee" />
          </linearGradient>
          <filter id="mb-veins" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005 0.011" numOctaves="3" seed="12" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="190" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="9" />
          </filter>
          <filter id="mb-soft">
            <feGaussianBlur stdDeviation="46" />
          </filter>
        </defs>
        <rect width="1600" height="1000" fill="url(#mb-base)" />
        <g filter="url(#mb-soft)" opacity=".75">
          <ellipse cx="260" cy="130" rx="360" ry="150" fill="#f6a9c2" />
          <ellipse cx="1330" cy="90" rx="320" ry="110" fill="#f9c3d4" />
          <ellipse cx="760" cy="380" rx="280" ry="90" fill="#fadbe6" />
        </g>
        <g filter="url(#mb-veins)" fill="none" strokeLinecap="round">
          <path d="M-60 120 C260 30 420 210 760 110 S1250 40 1700 170" stroke="#ef8fb0" strokeWidth="26" opacity=".38" />
          <path d="M-80 360 C300 250 520 470 900 330 S1380 330 1700 250" stroke="#f3b2c8" strokeWidth="14" opacity=".42" />
          <path d="M100 -20 C190 150 80 280 240 430" stroke="#e9779f" strokeWidth="9" opacity=".3" />
          <path d="M1100 -30 C1000 130 1190 260 1120 440" stroke="#f08db0" strokeWidth="8" opacity=".25" />
        </g>
        <rect y="560" width="1600" height="440" fill="url(#mb-table)" />
        <rect y="556" width="1600" height="7" fill="#fff" opacity=".9" />
        <rect y="563" width="1600" height="26" fill="#d8bfc0" opacity=".12" />
        {[640, 720, 810, 910].map((y, i) => (
          <path key={y} d={`M0 ${y} C400 ${y - 12 + i * 4} 900 ${y + 10} 1600 ${y - 6}`} stroke="#e7d4cf" strokeWidth="1.4" fill="none" opacity=".55" />
        ))}
      </svg>

      <motion.div className="lt__beam" animate={{ opacity: [0.55, 0.85, 0.55] }} transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }} />
      <DriedFlowers />

      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="lt__mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.size, height: m.size }}
          animate={{ x: [0, m.dx, 0], y: [0, m.dy, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: m.duration, delay: m.delay, ease: "easeInOut", repeat: Infinity }}
        />
      ))}

      {drifters.map((d, i) => (
        <motion.div
          key={i}
          className="lt__drift"
          style={{ left: `${d.x}%`, width: d.size }}
          initial={{ y: "-12vh", opacity: 0 }}
          animate={{ y: "112vh", x: [0, d.sway, -d.sway, 0], rotate: d.spin, opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: d.duration, delay: d.delay, ease: "linear", repeat: Infinity }}
        >
          <Flower variant="petal" palette={paleRose} />
        </motion.div>
      ))}
      <div className="lt__vignette" />
    </div>
  );
}
