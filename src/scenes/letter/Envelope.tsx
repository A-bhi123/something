import { motion, type MotionValue, type Variants } from "motion/react";

type Props = {
  ew: number;
  eh: number;
  /** Flap angle in degrees: 0 closed, about -168 open (swings away from the viewer). */
  flapRot: MotionValue<number>;
  /** Slides the whole envelope body down when it leaves the stage. */
  partsY: MotionValue<number>;
  /** Fades the envelope faces out (kept off the 3D parents on purpose: opacity there would flatten the 3D scene). */
  partsFade: MotionValue<number>;
  /** 0..1, how much of the flap's shadow on the front is visible. */
  flapShadow: MotionValue<number>;
  untied: boolean;
};

const FLAP = 0.36; // flap height as a fraction of envelope height
const BOW_Y = 0.3; // bow centre, fraction of envelope height

/** One ribbon piece: a full-size SVG so every piece shares the knot as its pivot. */
function Piece({ children, variants, className }: { children: React.ReactNode; variants?: Variants; className?: string }) {
  return (
    <motion.div className={`rb__piece ${className ?? ""}`} variants={variants} style={{ originX: 0.5, originY: 70 / 320 }}>
      <svg viewBox="0 0 200 320" preserveAspectRatio="none" aria-hidden="true">
        {children}
      </svg>
    </motion.div>
  );
}

const ease = [0.4, 0, 0.2, 1] as const;

/** The bronze envelope from the reference photo: back, front, curved flap, and a peach satin bow that unties. */
export function Envelope({ ew, eh, flapRot, partsY, partsFade, flapShadow, untied }: Props) {
  const fh = eh * FLAP;
  const rbW = ew * 0.34;
  const rbH = rbW * 1.6;
  const rbTop = eh * BOW_Y - rbH * (70 / 320);

  return (
    <motion.div className="env" style={{ width: ew, height: eh, y: partsY }}>
      {/* inside of the envelope: only the thin mouth at the top is ever visible */}
      <motion.div className="env__back" style={{ opacity: partsFade }} />

      {/* front face starts just below the mouth, so the letter can slide up behind it */}
      <motion.div className="env__front" style={{ top: eh * 0.055, height: eh * 0.945, opacity: partsFade }}>
        <div className="env__sheen" />
        <div className="env__grain" />
        <motion.div className="env__flapShadow" style={{ top: fh - eh * 0.055, opacity: flapShadow }} />
        <div className="env__edge" />
      </motion.div>

      {/* flap: hinged at the top edge, swings backwards */}
      <motion.div className="env__flap" style={{ height: fh, rotateX: flapRot, transformOrigin: "50% 0%", z: 1 }}>
        <motion.div className="env__flapFront" style={{ opacity: partsFade }}>
          <div className="env__sheen" />
          <div className="env__grain" />
          <div className="env__slot" style={{ top: fh * 0.8 }} />
        </motion.div>
        <motion.div className="env__flapBack" style={{ opacity: partsFade }} />
      </motion.div>

      {/* satin bow */}
      <motion.div
        className="rb"
        style={{ width: rbW, height: rbH, top: rbTop, z: 4 }}
        initial="tied"
        animate={untied ? "untied" : "tied"}
        variants={{ tied: {}, untied: { y: rbH * 0.06, transition: { duration: 1.5, ease } } }}
      >
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="satin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbe3c8" />
              <stop offset=".45" stopColor="#fff3e4" />
              <stop offset="1" stopColor="#e2b48b" />
            </linearGradient>
            <linearGradient id="satinDeep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#d9a67c" />
              <stop offset="1" stopColor="#f2cfa9" />
            </linearGradient>
          </defs>
        </svg>

        <Piece
          variants={{
            tied: { scaleX: 1, rotate: 0, opacity: 1 },
            untied: { scaleX: 0.08, rotate: -28, opacity: 0, transition: { duration: 0.8, delay: 0.35, ease } },
          }}
        >
          <path d="M100 70 C58 14 8 22 20 62 C30 88 78 82 100 70 Z" fill="url(#satin)" stroke="#d9a67c" strokeWidth="1" />
          <path d="M96 70 C64 40 38 38 34 56 C36 70 70 74 96 70 Z" fill="url(#satinDeep)" opacity=".55" />
          <path d="M92 56 C68 34 44 30 30 40" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        </Piece>
        <Piece
          variants={{
            tied: { scaleX: 1, rotate: 0, opacity: 1 },
            untied: { scaleX: 0.08, rotate: 28, opacity: 0, transition: { duration: 0.8, delay: 0.4, ease } },
          }}
        >
          <path d="M100 70 C142 14 192 22 180 62 C170 88 122 82 100 70 Z" fill="url(#satin)" stroke="#d9a67c" strokeWidth="1" />
          <path d="M104 70 C136 40 162 38 166 56 C164 70 130 74 104 70 Z" fill="url(#satinDeep)" opacity=".55" />
          <path d="M108 56 C132 34 156 30 170 40" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        </Piece>
        <Piece
          variants={{
            tied: { y: 0, rotate: 0, opacity: 1 },
            untied: { y: 70, rotate: -14, opacity: 0, transition: { duration: 1, delay: 0.5, ease } },
          }}
        >
          <path d="M88 72 L110 72 C104 140 92 215 86 308 L68 292 L50 310 C60 228 76 140 88 72 Z" fill="url(#satin)" stroke="#d9a67c" strokeWidth="1" />
          <path d="M96 80 C90 150 80 220 70 296" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.5" strokeLinecap="round" />
        </Piece>
        <Piece
          variants={{
            tied: { y: 0, rotate: 0, opacity: 1 },
            untied: { y: 80, rotate: 16, opacity: 0, transition: { duration: 1, delay: 0.55, ease } },
          }}
        >
          <path d="M92 72 L114 72 C128 130 144 200 156 280 L138 268 L120 286 C112 214 98 140 92 72 Z" fill="url(#satin)" stroke="#d9a67c" strokeWidth="1" />
          <path d="M106 82 C118 140 130 210 140 268" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.5" strokeLinecap="round" />
        </Piece>
        <Piece
          variants={{
            tied: { scale: 1, opacity: 1 },
            untied: { scale: [1, 0.78, 1.15, 0], opacity: [1, 1, 1, 0], transition: { duration: 0.9, ease } },
          }}
        >
          <rect x="86" y="56" width="28" height="30" rx="9" fill="url(#satin)" stroke="#d9a67c" strokeWidth="1.2" />
          <path d="M92 62 C98 58 106 58 110 64" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
        </Piece>
      </motion.div>
    </motion.div>
  );
}
