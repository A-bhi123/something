import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { FlowerRain } from "@/scenes/home/FlowerRain";
import { Burst } from "./Burst";
import { Envelope } from "./Envelope";
import { LetterExtraPage, LetterPaper } from "./LetterPaper";
import { MarbleBackground } from "./MarbleBackground";
import { letterContent } from "./letterContent";
import { useLetterPages } from "./useLetterPages";
import { useStageMetrics } from "./useStageMetrics";
import "./LetterScene.css";

const WORD_COUNT = letterContent.body.reduce((n, b) => (b === "gap" ? n : n + b.text.split(" ").length), 0);
const WORD_STAGGER_MS = 48;
const inOut = [0.45, 0, 0.2, 1] as const;

type Props = {
  /** When given, a "continue" button appears after the letter is read. */
  onContinue?: () => void;
};

/**
 * Scene 3: a bronze envelope lands on a marble table, a 3-2-1 countdown builds, the ribbon unties, the flap swings open
 * with golden light, the folded letter slides out, comes to the front, unfolds and is written out in handwriting.
 */
export function LetterScene({ onContinue }: Props) {
  const m = useStageMetrics();
  const mRef = useRef(m);
  mRef.current = m;
  const reduce = useReducedMotion() === true;
  const pages = useLetterPages(m.pw, m.ph);
  const pageGap = m.pw * 0.04;

  const [runKey, setRunKey] = useState(0);
  const [captionOn, setCaptionOn] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [untied, setUntied] = useState(false);
  const [writing, setWriting] = useState(false);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const [rain, setRain] = useState(0);

  // Envelope entrance / idle motion
  const entY = useMotionValue(-900);
  const entRot = useMotionValue(-12);
  const entScale = useMotionValue(0.9);
  const floatY = useMotionValue(0);
  const shakeRot = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const envY = useTransform([entY, floatY], ([a, b]: number[]) => a + b);
  const envRot = useTransform([entRot, shakeRot], ([a, b]: number[]) => a + b);
  // Envelope parts
  const flapRot = useMotionValue(0);
  const flapShadow = useMotionValue(1);
  const partsY = useMotionValue(0);
  const partsFade = useMotionValue(1);
  // Letter
  const letterY = useMotionValue(m.yIn);
  const letterScale = useMotionValue(m.s0);
  const letterRot = useMotionValue(0);
  const letterZ = useMotionValue(-6);
  const scrollY = useMotionValue(0);
  const letterYScrolled = useTransform([letterY, scrollY], ([a, b]: number[]) => a + b);
  const r2 = useMotionValue(180);
  const r3 = useMotionValue(-180);
  // Light, shadow
  const glow = useMotionValue(0);
  const glowScale = useTransform(glow, [0, 1], [0.6, 1.5]);
  const shadowO = useMotionValue(0);
  const shadowScale = useTransform(entY, [-900, 0], [0.5, 1]);

  // Pointer parallax: the whole table tilts a few degrees towards the cursor.
  const px = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const tiltY = useTransform(px, [-1, 1], [-5, 5]);
  const tiltX = useTransform(py, [-1, 1], [4, -4]);
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduce) return;
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    },
    [px, py, reduce],
  );

  // Letter likh jaane ke baad: wheel / touch se letter ko upar-neeche sarkao.
  const touchY = useRef(0);
  const contentBottom = 0.47 * m.vh - m.ph / 2 + pages * m.ph + (pages - 1) * pageGap;
  const maxUp = Math.max(0, contentBottom - (m.vh - 90)) + 24;
  const scrollBy = useCallback(
    (dy: number) => {
      if (!done) return;
      scrollY.set(Math.min(0, Math.max(-maxUp, scrollY.get() - dy)));
    },
    [done, maxUp, scrollY],
  );
  const onWheel = (e: React.WheelEvent) => scrollBy(e.deltaY);
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    scrollBy(touchY.current - y);
    touchY.current = y;
  };

  // ---- The choreography ----
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const controls: { stop: () => void }[] = [];
    const wait = (ms: number) => new Promise<void>((res) => timers.push(window.setTimeout(res, ms)));
    const play = (mv: { get: () => number }, to: number | number[], opts: Record<string, unknown>) =>
      new Promise<void>((res) => {
        controls.push(animate(mv as never, to as never, { ...opts, onComplete: () => res() } as never));
      });
    const alive = () => !cancelled;

    const g = mRef.current;
    entY.set(-g.vh * 0.9);
    entRot.set(-12);
    entScale.set(0.9);
    floatY.set(0);
    shakeRot.set(0);
    flapRot.set(0);
    flapShadow.set(1);
    partsY.set(0);
    partsFade.set(1);
    letterY.set(g.yIn);
    letterScale.set(g.s0);
    letterRot.set(0);
    letterZ.set(-6);
    scrollY.set(0);
    r2.set(180);
    r3.set(-180);
    glow.set(0);
    shadowO.set(0);
    setCaptionOn(false);
    setCount(null);
    setUntied(false);
    setWriting(false);
    setDone(false);
    setBurst(0);
    setRain(0);

    (async () => {
      if (reduce) {
        // Reduced motion: no travelling, no flying. The letter simply appears open and readable.
        entY.set(0);
        entRot.set(0);
        entScale.set(1);
        partsFade.set(0);
        letterZ.set(6);
        letterScale.set(1);
        letterY.set(g.yFinal);
        r2.set(0);
        r3.set(0);
        await wait(400);
        if (!alive()) return;
        setWriting(true);
        setDone(true);
        return;
      }

      await wait(500);
      if (!alive()) return;

      // 1. The envelope drops in and settles on the table.
      controls.push(animate(shadowO, 1, { duration: 1.6 }));
      controls.push(animate(entRot, 0, { type: "spring", stiffness: 50, damping: 9 }));
      controls.push(animate(entScale, 1, { duration: 1.4, ease: "easeOut" }));
      await play(entY, 0, { type: "spring", stiffness: 55, damping: 11, mass: 1.1 });
      if (!alive()) return;
      setCaptionOn(true);
      const float = animate(floatY, [0, -9, 0], { duration: 4.2, ease: "easeInOut", repeat: Infinity });
      controls.push(float);
      await wait(2300);
      if (!alive()) return;

      // 2. Countdown: every number the envelope trembles harder and glows more.
      for (const n of [3, 2, 1]) {
        setCount(n);
        const k = 4 - n;
        controls.push(animate(shakeRot, [0, -1.1 * k, 1.1 * k, -0.8 * k, 0.6 * k, 0], { duration: 0.85 }));
        controls.push(animate(shakeX, [0, -3 * k, 3 * k, -2 * k, 0], { duration: 0.85 }));
        controls.push(animate(glow, k * 0.22, { duration: 0.9 }));
        await wait(1050);
        if (!alive()) return;
      }
      setCount(null);
      setCaptionOn(false);
      float.stop();
      controls.push(animate(floatY, 0, { duration: 0.4 }));

      // 3. The ribbon unties itself.
      setUntied(true);
      await wait(1500);
      if (!alive()) return;

      // 4. The flap opens, gold light and glitter pour out, petals begin to fall.
      setBurst(1);
      setRain(1);
      controls.push(animate(flapShadow, 0, { duration: 0.6 }));
      controls.push(animate(glow, 1, { duration: 1.2 }));
      await play(flapRot, -168, { duration: 1.2, ease: [0.25, 0.8, 0.25, 1] });
      if (!alive()) return;
      await wait(500);
      if (!alive()) return;

      // 5. The folded letter peeks out, waits a heartbeat, then slides fully out.
      await play(letterY, g.yPeek, { duration: 1.0, ease: "easeOut" });
      if (!alive()) return;
      await wait(450);
      if (!alive()) return;
      controls.push(animate(letterRot, [0, -2.5, 0], { duration: 1.1 }));
      await play(letterY, g.yOut, { duration: 1.0, ease: inOut });
      if (!alive()) return;
      letterZ.set(6); // now clear of the envelope, so it can pass in front of it unseen

      // 6. It comes forward and grows to reading size while the envelope slips away.
      controls.push(animate(partsY, g.eh * 1.15, { duration: 1.4, ease: inOut }));
      controls.push(animate(partsFade, 0, { duration: 1.2, delay: 0.1 }));
      controls.push(animate(shadowO, 0, { duration: 1.2 }));
      controls.push(animate(glow, 0.35, { duration: 1.8 }));
      controls.push(animate(letterScale, 1, { duration: 1.7, ease: inOut }));
      controls.push(animate(letterRot, [0, 2, 0], { duration: 1.7 }));
      await play(letterY, g.yFinal, { duration: 1.7, ease: inOut });
      if (!alive()) return;
      await wait(350);

      // 7. It unfolds: top fold first, then the bottom one.
      await play(r2, 0, { duration: 1.5, ease: inOut });
      if (!alive()) return;
      await wait(120);
      await play(r3, 0, { duration: 1.5, ease: inOut });
      if (!alive()) return;
      await wait(450);
      if (!alive()) return;

      // 8. The words are written out.
      setWriting(true);
      await wait(WORD_COUNT * WORD_STAGGER_MS + 800);
      if (!alive()) return;
      setDone(true);
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      controls.forEach((c) => c.stop());
    };
    // The choreography restarts only on replay (runKey) or when the reduced-motion setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, reduce]);

  // If the window is resized once the letter is on show, keep it centred.
  useEffect(() => {
    if (done) {
      letterY.set(m.yFinal);
    }
  }, [done, m.yFinal, letterY]);

  const mouthTop = m.envCenter * m.vh - m.eh / 2;
  const envLeft = (m.vw - m.ew) / 2;
  const envTop = m.envCenter * m.vh - m.eh / 2;
  const discSize = m.ew * 0.38;

  return (
    <main className="lt" onPointerMove={onPointerMove} onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
      <MarbleBackground />

      {/* golden light spilling from the envelope's mouth */}
      <motion.div className="lt__glow" style={{ left: m.vw / 2, top: mouthTop + m.eh * 0.05, opacity: glow, scale: glowScale }}>
        <div className="lt__rays" />
      </motion.div>

      <div className="lt__stage">
        <motion.div
          className="lt__shadow"
          style={{ left: envLeft + m.ew * 0.04, top: envTop + m.eh * 0.97, width: m.ew * 0.92, height: m.ew * 0.1, opacity: shadowO, scale: shadowScale }}
        />

        <motion.div className="lt__tilt" style={{ rotateX: tiltX, rotateY: tiltY }}>
          <motion.div
            className="lt__env"
            style={{ left: envLeft, top: envTop, width: m.ew, height: m.eh, x: shakeX, y: envY, rotate: envRot, scale: entScale }}
          >
            <Envelope ew={m.ew} eh={m.eh} flapRot={flapRot} partsY={partsY} partsFade={partsFade} flapShadow={flapShadow} untied={untied} />
            <motion.div
              className="lt__letter"
              style={{ left: (m.ew - m.pw) / 2, width: m.pw, y: letterYScrolled, scale: letterScale, rotate: letterRot, z: letterZ, originX: 0.5, originY: 0 }}
            >
              <LetterPaper pw={m.pw} ph={m.ph} r2={r2} r3={r3} writing={writing} instant={reduce} />
              {/* continuation pages: appear once the first page is written */}
              {done &&
                Array.from({ length: pages - 1 }, (_, k) => (
                  <motion.div key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <LetterExtraPage page={k + 1} pw={m.pw} ph={m.ph} top={(k + 1) * (m.ph + pageGap)} />
                  </motion.div>
                ))}
              {/* readable copy for screen readers */}
              <div className="sr-only">
                {letterContent.body.map((b, i) => (b === "gap" ? null : <p key={i}>{b.text}</p>))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {count !== null && (
          <motion.div
            key={count}
            className="lt__count"
            style={{ left: m.vw / 2, top: envTop + m.eh / 2, width: discSize, height: discSize }}
            initial={{ opacity: 0, scale: 1.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="lt__ring"
              initial={{ scale: 1, opacity: 0.75 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.95, ease: "easeOut" }}
            />
            <span className="lt__num" style={{ fontSize: discSize * 0.7 }}>
              {count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lt__burstAnchor" style={{ left: m.vw / 2, top: mouthTop + m.eh * 0.04 }}>
        <Burst burst={burst} spread={Math.min(m.vw, 760) * 0.55} />
      </div>
      {rain > 0 && <FlowerRain key={`lt-rain-${rain}`} count={48} spawnSeconds={3.5} startDelay={0.1} seed={31} />}

      <AnimatePresence>
        {captionOn && (
          <motion.p
            className="lt__caption"
            style={{ top: envTop + m.eh + 34 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.9 }}
          >
            {letterContent.caption}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {done && (
          <motion.div className="lt__actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <button type="button" className="lt__btn lt__btn--ghost" onClick={() => setRunKey((k) => k + 1)}>
              Dobara dekho
            </button>
            {onContinue && (
              <button type="button" className="lt__btn" onClick={onContinue}>
                Aage badho
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
