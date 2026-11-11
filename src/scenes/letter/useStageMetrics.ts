import { useEffect, useState } from "react";

/** All sizes the scene needs, in pixels, derived from the viewport. Everything is computed once so the choreography uses plain numbers. */
export type StageMetrics = {
  vw: number;
  vh: number;
  /** Envelope width / height. */
  ew: number;
  eh: number;
  /** Letter width / full unfolded height. */
  pw: number;
  ph: number;
  /** Scale that makes the folded letter fit inside the envelope. */
  s0: number;
  /** Height of the folded letter at scale s0. */
  stackH: number;
  /** Envelope centre as a fraction of viewport height. */
  envCenter: number;
  /** Letter y (relative to the envelope's top) when hidden inside / peeking / fully out / reading. */
  yIn: number;
  yPeek: number;
  yOut: number;
  yFinal: number;
};

export function computeMetrics(vw: number, vh: number): StageMetrics {
  const envCenter = 0.55;
  const ew = Math.max(240, Math.min(vw * 0.82, vh * 0.6 * 1.35, 680));
  const eh = ew * 0.72;
  const pw = Math.max(230, Math.min(vw * 0.95, (vh * 0.84) / 1.5, 600));
  const ph = pw * 1.5;
  const s0 = (ew * 0.86) / pw;
  const stackH = (ph / 3) * s0;
  return {
    vw,
    vh,
    ew,
    eh,
    pw,
    ph,
    s0,
    stackH,
    envCenter,
    yIn: eh * 0.52 - stackH / 2,
    yPeek: -eh * 0.25,
    yOut: -(stackH + eh * 0.06),
    yFinal: eh / 2 - ph / 2 - (envCenter - 0.47) * vh,
  };
}

export function useStageMetrics(): StageMetrics {
  const [m, setM] = useState(() => computeMetrics(window.innerWidth, window.innerHeight));
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setM(computeMetrics(window.innerWidth, window.innerHeight)));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return m;
}
