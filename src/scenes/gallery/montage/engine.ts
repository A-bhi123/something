import type { Layer, Rect } from "./types";

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut3 = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut3 = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const FULL: Rect = [0, 0, 100, 100];

const defaultDur = { cut: 0.01, pop: 0.28, blurIn: 0.35, strip: 0.22, stripes: 0.32, spot: 0.22 } as const;

export type LayerState = {
  opacity: number;
  scale: number;
  /** translation in % of the layer's own size */
  tx: number;
  ty: number;
  /** blur in "authored px" (multiply by stage scale) */
  bx: number;
  by: number;
  /** vertical scan-line displacement in "authored px" */
  disp: number;
  clip: string;
  mask: string;
  rect: Rect;
  /** current rect differs from the authored one (the tile is growing) */
  rectChanged: boolean;
};

/** Pure function: how one layer looks at time `t`. Returns null while it should not be on screen. */
export function computeLayer(l: Layer, t: number): LayerState | null {
  const local = t - l.at;
  if (local < 0) return null;
  if (l.until !== undefined && t >= l.until) return null;

  const enter = l.enter ?? "cut";
  const dur = l.dur ?? defaultDur[enter];
  const p = clamp01(local / dur);
  const rect0 = l.rect ?? FULL;

  const s: LayerState = { opacity: 1, scale: 1, tx: 0, ty: 0, bx: 0, by: 0, disp: 0, clip: "", mask: "", rect: rect0, rectChanged: false };

  switch (enter) {
    case "pop": {
      const e = easeOut3(p);
      s.opacity = clamp01(p * 3.5);
      s.scale = 0.86 + 0.14 * e;
      s.bx = s.by = (1 - e) * 10;
      break;
    }
    case "blurIn": {
      const e = easeOut3(p);
      const from = l.from ?? 1.2;
      s.opacity = clamp01(p * 4);
      s.scale = lerp(from, 1, e);
      const heavy = (1 - e) * 30;
      const light = (1 - e) * 4;
      if (l.dir === "x") {
        s.bx = heavy;
        s.by = light;
        s.tx = -6 * (1 - e);
      } else {
        s.bx = light;
        s.by = heavy;
        s.ty = 5 * (1 - e);
      }
      break;
    }
    case "strip": {
      const e = easeOut3(p);
      s.opacity = clamp01(p * 4);
      const cut = (1 - e) * 50;
      s.clip = `inset(${cut}% 0 ${cut}% 0)`;
      break;
    }
    case "stripes": {
      const e = easeOut3(p);
      s.opacity = clamp01(p * 2.6);
      s.disp = Math.sin(p * Math.PI) * 60 + (1 - p) * 26;
      s.bx = (1 - e) * 4;
      s.by = (1 - e) * 6;
      s.scale = lerp(1.08, 1, e);
      break;
    }
    case "spot": {
      const sp = l.spot ?? { cx: 50, cy: 46, r0: [18, 14], r1: [52, 42] };
      const e = easeOut3(clamp01(local / Math.max(dur, 0.01)));
      const rx = lerp(sp.r0[0], sp.r1[0], e);
      const ry = lerp(sp.r0[1], sp.r1[1], e);
      s.opacity = clamp01(p * 5);
      s.scale = lerp(1.12, 1, e);
      const m = `radial-gradient(ellipse ${rx}% ${ry}% at ${sp.cx}% ${sp.cy}%, #000 30%, rgba(0,0,0,0) 100%)`;
      s.mask = m;
      break;
    }
    default:
      break;
  }

  // slow drift (Ken Burns) while it is on screen
  s.scale *= 1 + (l.drift ?? 0.012) * local;

  if (l.grow) {
    const [g0, g1] = l.grow;
    const g = easeInOut3(clamp01((t - g0) / (g1 - g0)));
    if (g > 0) {
      s.rect = [lerp(rect0[0], 0, g), lerp(rect0[1], 0, g), lerp(rect0[2], 100, g), lerp(rect0[3], 100, g)];
      s.rectChanged = true;
      // the move is fast, so it picks up a little motion blur
      s.by += Math.sin(g * Math.PI) * 9;
      s.bx += Math.sin(g * Math.PI) * 3;
    }
  }
  return s;
}
