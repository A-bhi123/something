import { AnimatePresence, motion } from "motion/react";
import { FlowerShape, flowerPalettes } from "@/components/ui/Flower";
import type { Mood } from "@/animation";

type CharacterProps = {
  speaking: boolean;
  mood: Mood;
  /** Waves with the raised hand. */
  wave: boolean;
};

/* Mouth shapes share one path structure so Motion can morph smoothly between them. */
const mouth = {
  smile: "M103 118 Q120 138 137 118 Q120 130 103 118 Z",
  grin: "M100 117 Q120 148 140 117 Q120 125 100 117 Z",
  talk: [
    "M106 120 Q120 126 134 120 Q120 124 106 120 Z",
    "M105 119 Q120 123 135 119 Q120 144 105 119 Z",
    "M108 120 Q120 124 132 120 Q120 134 108 120 Z",
    "M105 119 Q120 123 135 119 Q120 140 105 119 Z",
    "M106 120 Q120 126 134 120 Q120 124 106 120 Z",
  ],
} as const;

const mouthVariants = {
  smile: { d: mouth.smile, transition: { duration: 0.25 } },
  grin: { d: mouth.grin, transition: { duration: 0.3 } },
  talk: { d: [...mouth.talk], transition: { duration: 0.6, repeat: Infinity, ease: "linear" as const } },
};

const sparkle = "M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z";

/** A friendly host drawn in SVG. He blinks, breathes, talks, waves and smiles. */
export function Character({ speaking, mood, wave }: CharacterProps) {
  const smiling = !speaking && mood === "smile";
  const mouthState = speaking ? "talk" : smiling ? "grin" : "smile";
  const skin = "#ffd9bf";
  const jacket = "#fff1e2";
  const bouquet = [
    { variant: "daisy", palette: flowerPalettes[2], x: 24, y: 166, s: 34 },
    { variant: "blossom", palette: flowerPalettes[0], x: 44, y: 152, s: 38 },
    { variant: "sakura", palette: flowerPalettes[1], x: 66, y: 168, s: 32 },
  ] as const;

  return (
    <motion.svg
      className="character"
      viewBox="0 0 240 320"
      role="img"
      aria-label="A smiling host with a bouquet of flowers"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Shadow on the ground */}
      <ellipse cx="120" cy="308" rx="70" ry="9" fill="rgba(30,0,50,0.35)" />

      {/* Legs and shoes */}
      <rect x="92" y="232" width="22" height="66" rx="10" fill="#2d2a5e" />
      <rect x="126" y="232" width="22" height="66" rx="10" fill="#2d2a5e" />
      <ellipse cx="100" cy="300" rx="18" ry="9" fill="#ff9ec4" />
      <ellipse cx="140" cy="300" rx="18" ry="9" fill="#ff9ec4" />

      {/* Body */}
      <path
        d="M80 152 Q80 140 96 138 L144 138 Q160 140 160 152 L164 238 Q164 248 154 248 L86 248 Q76 248 76 238 Z"
        fill={jacket}
      />
      <path d="M120 140 L120 248" stroke="#f0d5bd" strokeWidth="2" />
      <circle cx="112" cy="186" r="3.2" fill="#f5c76a" />
      <circle cx="112" cy="210" r="3.2" fill="#f5c76a" />
      {/* Bow tie */}
      <path d="M120 144 L100 134 L100 156 Z M120 144 L140 134 L140 156 Z" fill="#ff7fae" />
      <circle cx="120" cy="144" r="5" fill="#e8528a" />

      {/* Left arm holds the bouquet */}
      <path d="M82 150 Q58 178 58 214" stroke={jacket} strokeWidth="20" strokeLinecap="round" fill="none" />
      <g>
        {bouquet.map((f, i) => (
          <line key={`stem-${i}`} x1={f.x + f.s / 2} y1={f.y + f.s * 0.7} x2="58" y2="214" stroke="#4fbf8a" strokeWidth="3.5" strokeLinecap="round" />
        ))}
        {bouquet.map((f, i) => (
          <svg key={`flower-${i}`} x={f.x} y={f.y} width={f.s} height={f.s} viewBox="0 0 100 100">
            <FlowerShape variant={f.variant} palette={f.palette} />
          </svg>
        ))}
        <path d="M44 204 L72 204 L66 226 L50 226 Z" fill="#ff9ec4" />
      </g>
      <circle cx="58" cy="216" r="10" fill={skin} />

      {/* Right arm: the shoulder is the pivot, so it can swing up to wave */}
      <g transform="translate(158 152)">
        <motion.g
          style={{ originX: 0, originY: 0 }}
          initial={false}
          animate={wave ? { rotate: [-130, -150, -122, -150, -122, -150, -130] } : { rotate: 0 }}
          transition={wave ? { duration: 1.4, ease: "easeInOut", repeat: Infinity } : { duration: 0.5 }}
        >
          <path d="M0 0 L26 58" stroke={jacket} strokeWidth="20" strokeLinecap="round" fill="none" />
          <circle cx="27" cy="62" r="10" fill={skin} />
        </motion.g>
      </g>

      {/* Neck and head */}
      <rect x="108" y="124" width="24" height="20" rx="8" fill="#f5c6a5" />
      <circle cx="74" cy="100" r="8" fill={skin} />
      <circle cx="166" cy="100" r="8" fill={skin} />
      <circle cx="120" cy="96" r="46" fill={skin} />

      {/* Hair */}
      <path
        d="M72 96 C66 50 98 32 124 36 C154 38 174 60 168 96 C160 76 142 66 120 66 C98 66 80 76 72 96 Z"
        fill="#3b2a3f"
      />
      <path d="M96 52 C108 42 130 40 146 50" stroke="#5a4260" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Eyes (they blink) */}
      <motion.g
        style={{ originY: 0.5 }}
        animate={{ opacity: smiling ? 0 : 1, scaleY: [1, 1, 0.08, 1, 1] }}
        transition={{
          opacity: { duration: 0.2 },
          scaleY: { duration: 4, times: [0, 0.9, 0.94, 0.98, 1], repeat: Infinity, ease: "linear" },
        }}
      >
        <ellipse cx="104" cy="100" rx="5.5" ry="7.5" fill="#2b2140" />
        <ellipse cx="136" cy="100" rx="5.5" ry="7.5" fill="#2b2140" />
        <circle cx="106" cy="97" r="2" fill="#fff" />
        <circle cx="138" cy="97" r="2" fill="#fff" />
      </motion.g>
      {/* Happy closed eyes when he smiles */}
      <motion.g animate={{ opacity: smiling ? 1 : 0 }} transition={{ duration: 0.2 }}>
        <path d="M96 102 Q104 92 112 102" stroke="#2b2140" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M128 102 Q136 92 144 102" stroke="#2b2140" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* Eyebrows */}
      <path d="M96 86 Q104 81 112 85" stroke="#3b2a3f" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M128 85 Q136 81 144 86" stroke="#3b2a3f" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Cheeks get pinker when he smiles */}
      <motion.g animate={{ opacity: smiling ? 0.85 : 0.5 }}>
        <ellipse cx="90" cy="116" rx="10" ry="5.5" fill="#ff8fa8" />
        <ellipse cx="150" cy="116" rx="10" ry="5.5" fill="#ff8fa8" />
      </motion.g>

      {/* Mouth */}
      <motion.path
        variants={mouthVariants}
        initial={false}
        animate={mouthState}
        fill="#8a2f55"
        stroke="#8a2f55"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Sparkles around his head while he smiles */}
      <AnimatePresence>
        {smiling &&
          [
            { x: 48, y: 52, d: 0 },
            { x: 192, y: 60, d: 0.25 },
            { x: 64, y: 22, d: 0.5 },
            { x: 178, y: 28, d: 0.15 },
          ].map((p) => (
            <g key={`${p.x}-${p.y}`} transform={`translate(${p.x} ${p.y})`}>
              <motion.path
                d={sparkle}
                fill="#ffe27a"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1], scale: [0, 1.3, 0.9, 1.2], rotate: [0, 45] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 1.1, delay: p.d, repeat: Infinity, repeatType: "mirror" }}
              />
            </g>
          ))}
      </AnimatePresence>
    </motion.svg>
  );
}
