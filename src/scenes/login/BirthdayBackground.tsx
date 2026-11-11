import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { seeded } from "@/lib/random";
import "./BirthdayBackground.css";

type Tone = "pink" | "blue" | "white";

/** The gate is two doors. Each door draws only its own half of the same scene. */
export type Side = "full" | "left" | "right";

/** True when something at x% (with a little margin for its width) is visible in this half. */
function inSide(x: number, side: Side, margin = 12) {
  if (side === "full") return true;
  return side === "left" ? x <= 50 + margin : x >= 50 - margin;
}

const HEART_PATH =
  "M50 86 C12 56 0 38 0 24 C0 9 12 0 26 0 C37 0 46 6 50 15 C54 6 63 0 74 0 C88 0 100 9 100 24 C100 38 88 56 50 86 Z";

/** One shared set of gradients. Every heart below references these by id. */
function HeartDefs() {
  return (
    <svg className="bg__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hg-pink" cx="32%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#ffe6f0" />
          <stop offset="55%" stopColor="#f7b1cd" />
          <stop offset="100%" stopColor="#ea8fb7" />
        </radialGradient>
        <radialGradient id="hg-blue" cx="32%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#e3f5ff" />
          <stop offset="55%" stopColor="#a9d8f5" />
          <stop offset="100%" stopColor="#82bfe8" />
        </radialGradient>
        <radialGradient id="hg-white" cx="32%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f6f1f7" />
          <stop offset="100%" stopColor="#ddd3e4" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Heart({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 88" aria-hidden="true">
      <path d={HEART_PATH} fill={`url(#hg-${tone})`} />
      {/* Soft highlight that makes the heart look puffy */}
      <ellipse cx="29" cy="22" rx="13" ry="7" fill="#fff" opacity="0.55" transform="rotate(-28 29 22)" />
    </svg>
  );
}

/* ---------- Hanging hearts ---------- */

type HangingHeart = {
  /** Horizontal position, % of screen width. */
  x: number;
  /** Where the top of the heart sits, in vh. Negative = partly cut off at the top. */
  drop: number;
  /** Base width in px (scaled with the screen). */
  size: number;
  tone: Tone;
  delay: number;
  duration: number;
  /** Swing angle in degrees. */
  swing: number;
};

const hangingHearts: HangingHeart[] = [
  { x: 50, drop: -6, size: 150, tone: "white", delay: 0, duration: 6.5, swing: 2.2 },
  { x: 15, drop: 12, size: 150, tone: "blue", delay: 0.8, duration: 5.6, swing: 3 },
  { x: 92, drop: 14, size: 140, tone: "pink", delay: 1.4, duration: 6.2, swing: 2.6 },
  { x: 30, drop: 42, size: 135, tone: "white", delay: 0.4, duration: 7, swing: 3.2 },
  { x: 58, drop: 43, size: 115, tone: "blue", delay: 1.9, duration: 5.2, swing: 3.4 },
  { x: 82, drop: 52, size: 125, tone: "blue", delay: 0.2, duration: 6.8, swing: 2.8 },
  { x: 47, drop: 66, size: 135, tone: "pink", delay: 1.1, duration: 5.9, swing: 3.1 },
  { x: 95, drop: 78, size: 115, tone: "pink", delay: 2.2, duration: 6.4, swing: 2.5 },
  { x: 4, drop: 80, size: 110, tone: "pink", delay: 0.6, duration: 6.1, swing: 3 },
  { x: 72, drop: 28, size: 70, tone: "white", delay: 1.6, duration: 4.8, swing: 4 },
];

function HangingHearts({ side }: { side: Side }) {
  return (
    <>
      {hangingHearts.map((h, i) =>
        !inSide(h.x, side) ? null : (
        <div
          key={i}
          className="bg__hang"
          style={
            {
              left: `${h.x}%`,
              top: h.drop < 0 ? `${h.drop}vh` : 0,
              "--heart-w": `clamp(${Math.round(h.size * 0.6)}px, ${(h.size / 7).toFixed(1)}vw, ${Math.round(h.size * 1.6)}px)`,
            } as CSSProperties
          }
        >
          <motion.div
            className="bg__swing"
            animate={{ rotate: [-h.swing, h.swing] }}
            transition={{
              duration: h.duration,
              delay: h.delay,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <span className="bg__string" style={{ height: `${Math.max(h.drop, 0)}vh` }} />
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{
                duration: h.duration * 0.7,
                delay: h.delay,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Heart tone={h.tone} className="bg__heart" />
            </motion.div>
          </motion.div>
        </div>
        ),
      )}
    </>
  );
}

/* ---------- Fairy light strands ---------- */

const strandXs = [4, 14, 31, 48, 68, 84, 96];

const strands = strandXs.map((x, s) => {
  const rand = seeded(100 + s * 17);
  const count = 7 + Math.floor(rand() * 3);
  const bulbs = Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.3 + rand() * 0.6) / count) * 100,
    nudge: (rand() - 0.5) * 3,
    size: 8 + rand() * 6,
    delay: rand() * 3,
    duration: 2.2 + rand() * 2.4,
  }));
  return { x, bulbs };
});

function FairyLights({ side }: { side: Side }) {
  return (
    <>
      {strands.filter((strand) => inSide(strand.x, side, 2)).map((strand) => (
        <div key={strand.x} className="bg__strand" style={{ left: `${strand.x}%` }}>
          {strand.bulbs.map((b, i) => (
            <motion.span
              key={i}
              className="bg__bulb"
              style={{ top: `${b.y}%`, marginLeft: `${b.nudge}px`, width: b.size, height: b.size }}
              animate={{ opacity: [0.45, 1, 0.55, 1, 0.45], scale: [0.9, 1.18, 0.95, 1.12, 0.9] }}
              transition={{ duration: b.duration, delay: b.delay, ease: "easeInOut", repeat: Infinity }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

/* ---------- Floating bokeh glow ---------- */

const rand = seeded(7);
const bokeh = Array.from({ length: 16 }, () => ({
  x: rand() * 100,
  y: rand() * 100,
  size: 24 + rand() * 70,
  delay: rand() * 4,
  duration: 7 + rand() * 6,
  drift: 14 + rand() * 24,
  tint: rand() > 0.5 ? "255,236,246" : "232,246,255",
}));

function Bokeh({ side }: { side: Side }) {
  return (
    <>
      {bokeh.filter((b) => inSide(b.x, side, 8)).map((b, i) => (
        <motion.span
          key={i}
          className="bg__bokeh"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(${b.tint},0.55) 40%, rgba(${b.tint},0) 70%)`,
          }}
          animate={{ y: [0, -b.drift, 0], opacity: [0.15, 0.7, 0.15], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: b.duration, delay: b.delay, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
    </>
  );
}

/* ---------- Tiny hearts floating upward ---------- */

const risingRand = seeded(21);
const tones: Tone[] = ["pink", "blue", "white"];
const rising = Array.from({ length: 9 }, (_, i) => ({
  x: 4 + risingRand() * 92,
  size: 14 + risingRand() * 16,
  delay: risingRand() * 12,
  duration: 14 + risingRand() * 10,
  sway: 14 + risingRand() * 22,
  tone: tones[i % tones.length],
}));

function RisingHearts({ side }: { side: Side }) {
  return (
    <>
      {rising.filter((r) => inSide(r.x, side, 4)).map((r, i) => (
        <motion.span
          key={i}
          className="bg__rising"
          style={{ left: `${r.x}%`, width: r.size }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: "-115vh",
            x: [0, r.sway, -r.sway, 0],
            rotate: [-12, 12, -12],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: r.duration,
            delay: r.delay,
            ease: "linear",
            repeat: Infinity,
            opacity: { times: [0, 0.12, 0.8, 1], duration: r.duration, delay: r.delay, repeat: Infinity },
          }}
        >
          <Heart tone={r.tone} />
        </motion.span>
      ))}
    </>
  );
}

/* ---------- Whole background ---------- */

export function BirthdayBackground({ side = "full" }: { side?: Side }) {
  return (
    <motion.div
      className={`bg bg--${side}`}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <HeartDefs />

      {/* Big soft colour glows that slowly breathe and drift */}
      <motion.div
        className="bg__glow bg__glow--pink"
        animate={{ x: ["-6%", "8%", "-6%"], y: ["-4%", "6%", "-4%"], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="bg__glow bg__glow--blue"
        animate={{ x: ["6%", "-8%", "6%"], y: ["5%", "-5%", "5%"], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Light beam that sweeps across the wall */}
      <motion.div
        className="bg__beam"
        initial={{ x: "-60vw" }}
        animate={{ x: "140vw" }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
      />

      <Bokeh side={side} />
      <FairyLights side={side} />
      <HangingHearts side={side} />
      <RisingHearts side={side} />
    </motion.div>
  );
}
