import * as THREE from "three";
import { seeded } from "@/lib/random";

/** Colours sampled from the final frame of the uploaded cake video. */
export const cakeColors = {
  pinkTop: "#f294be",
  pinkMid: "#e096c6",
  lavender: "#ac8fd6",
  pearl: "#fbf2ee",
  gold: "#d8b055",
  sponge: "#f3c8a6",
  cream: "#fff1e8",
};

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Wavy contour ridges, like the palette-knife lines on the real cake. */
function drawWaves(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, light: string, dark: string, width: number) {
  const rand = seeded(11);
  for (let i = 0; i < count; i++) {
    const y0 = ((i + 0.6) / count) * h;
    const amp = 10 + rand() * 16;
    const k = 3 + Math.floor(rand() * 3); // integer cycles: the texture wraps seamlessly around the cake
    const ph = rand() * Math.PI * 2;
    for (const [col, dy] of [
      [dark, width * 0.9],
      [light, 0],
    ] as const) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + dy + Math.sin((x / w) * Math.PI * 2 * k + ph) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number) {
  const rand = seeded(3);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(90,40,90,${alpha})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

export function makeSideTextures() {
  const w = 2048;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, cakeColors.pinkTop);
  g.addColorStop(0.38, cakeColors.pinkMid);
  g.addColorStop(0.7, "#c79ed2");
  g.addColorStop(1, cakeColors.lavender);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawWaves(ctx, w, h, 9, "rgba(255,235,248,0.22)", "rgba(110,60,130,0.06)", 5);
  grain(ctx, w, h, 5000, 0.06);

  const b = makeCanvas(w, h);
  const bctx = b.getContext("2d")!;
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, w, h);
  drawWaves(bctx, w, h, 9, "#ffffff", "#303030", 5);
  grain(bctx, w, h, 8000, 0.25);

  const map = toTexture(c);
  const bump = toTexture(b, false);
  for (const t of [map, bump]) t.wrapS = THREE.RepeatWrapping;
  return { map, bump };
}

export function makeTopTextures() {
  const s = 1024;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "#f2aecb");
  g.addColorStop(1, cakeColors.pinkTop);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);

  const b = makeCanvas(s, s);
  const bctx = b.getContext("2d")!;
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, s, s);

  // Archimedean spiral, the swirl on top of the real cake
  for (const [cx, col, off, lw] of [
    [ctx, "rgba(110,60,130,0.28)", 3, 5],
    [ctx, "rgba(255,238,248,0.38)", 0, 5],
    [bctx, "#303030", 4, 8],
    [bctx, "#ffffff", 0, 8],
  ] as const) {
    cx.beginPath();
    const turns = 6.5;
    for (let t = 0; t <= turns * Math.PI * 2; t += 0.04) {
      const r = (t / (turns * Math.PI * 2)) * (s / 2) * 0.98;
      const wob = 1 + Math.sin(t * 3) * 0.015;
      const x = s / 2 + Math.cos(t) * r * wob + off;
      const y = s / 2 + Math.sin(t) * r * wob + off;
      if (t === 0) cx.moveTo(x, y);
      else cx.lineTo(x, y);
    }
    cx.strokeStyle = col;
    cx.lineWidth = lw;
    cx.stroke();
  }
  grain(ctx, s, s, 4000, 0.05);
  return { map: toTexture(c), bump: toTexture(b, false) };
}

/** The inside of the cake: sponge and cream layers, shown on the cut faces. */
export function makeCrossSectionTexture(heightRatio: number) {
  const w = 512;
  const h = Math.round(w * heightRatio);
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  // fractions of the cake height, from the top down
  const layers: [string, number][] = [
    [cakeColors.pinkTop, 0.05],
    [cakeColors.sponge, 0.27],
    [cakeColors.cream, 0.045],
    [cakeColors.sponge, 0.27],
    [cakeColors.cream, 0.045],
    [cakeColors.sponge, 0.32],
  ];
  let y = 0;
  for (const [col, f] of layers) {
    ctx.fillStyle = col;
    ctx.fillRect(0, y, w, f * h + 1);
    y += f * h;
  }
  // crumb texture
  const rand = seeded(8);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(170,110,80,0.13)";
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2.5, 1 + rand() * 2.5);
  }
  // outer icing edge (right side of the texture is the rim)
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, cakeColors.pinkTop);
  edge.addColorStop(0.7, "#c79ed2");
  edge.addColorStop(1, cakeColors.lavender);
  ctx.fillStyle = edge;
  ctx.fillRect(w - 16, 0, 16, h);
  return toTexture(c);
}

type Scheme = { a: string; b: string; edge: string; vein: string };
export const butterflySchemes: Record<"lavender" | "pink", Scheme> = {
  lavender: { a: "#cfc3ee", b: "#8f88cc", edge: "#c9a24a", vein: "#5d4f8a" },
  pink: { a: "#f9c4d8", b: "#ee86ab", edge: "#c9a24a", vein: "#b04a6f" },
};

/** One full butterfly (both wings) on a transparent canvas, with the gold rim and dark veins of the paper toppers. */
export function makeButterflyTexture(kind: "lavender" | "pink"): THREE.CanvasTexture {
  const sc = butterflySchemes[kind];
  const w = 512;
  const h = 360;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.translate(w / 2, h * 0.46);

  const upper = (m: number) => {
    const p = new Path2D();
    p.moveTo(0, -4);
    p.bezierCurveTo(-55 * m, -140, -200 * m, -165, -240 * m, -100);
    p.bezierCurveTo(-262 * m, -50, -190 * m, 18, -14 * m, 12);
    p.closePath();
    return p;
  };
  const lower = (m: number) => {
    const p = new Path2D();
    p.moveTo(-4 * m, 12);
    p.bezierCurveTo(-80 * m, 0, -190 * m, 28, -205 * m, 90);
    p.bezierCurveTo(-212 * m, 140, -120 * m, 158, -60 * m, 124);
    p.bezierCurveTo(-30 * m, 104, -10 * m, 64, 0, 28);
    p.closePath();
    return p;
  };

  for (const m of [-1, 1]) {
    for (const path of [upper(m), lower(m)]) {
      const g = ctx.createLinearGradient(0, 0, -240 * m, 0);
      g.addColorStop(0, sc.a);
      g.addColorStop(1, sc.b);
      ctx.fillStyle = g;
      ctx.fill(path);
      ctx.lineWidth = 7;
      ctx.strokeStyle = sc.edge;
      ctx.stroke(path);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = sc.vein;
      ctx.save();
      ctx.clip(path);
      for (let i = 0; i < 6; i++) {
        const a = -0.9 + i * 0.32;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.quadraticCurveTo(-90 * m, Math.sin(a) * 60, -240 * m * Math.cos(a * 0.6), Math.sin(a) * 170);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // body
  ctx.fillStyle = sc.edge;
  ctx.beginPath();
  ctx.ellipse(0, 20, 7, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  const t = toTexture(c);
  return t;
}

/** The gold acrylic "Happy Birthday" topper. Waits for the script font so the text is not drawn in a fallback. */
export async function makeTopperTexture(): Promise<THREE.CanvasTexture> {
  const font = '"Great Vibes", "Allura", "Snell Roundhand", cursive';
  try {
    await Promise.race([document.fonts.load(`120px ${font}`), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    /* fall back to cursive */
  }
  const w = 1024;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#f6dc8a");
  g.addColorStop(0.5, "#c99a3c");
  g.addColorStop(1, "#f3d57e");
  ctx.fillStyle = g;
  ctx.strokeStyle = "#8a6420";
  ctx.lineWidth = 3;
  ctx.font = `190px ${font}`;
  ctx.fillText("Happy", w * 0.42, h * 0.3);
  ctx.strokeText("Happy", w * 0.42, h * 0.3);
  ctx.font = `230px ${font}`;
  ctx.fillText("Birthday", w * 0.5, h * 0.7);
  ctx.strokeText("Birthday", w * 0.5, h * 0.7);
  return toTexture(c);
}

export function makeFlameTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(w / 2, h * 0.68, 2, w / 2, h * 0.62, h * 0.42);
  g.addColorStop(0, "rgba(255,255,235,1)");
  g.addColorStop(0.25, "rgba(255,226,140,0.95)");
  g.addColorStop(0.6, "rgba(255,150,50,0.55)");
  g.addColorStop(1, "rgba(255,90,20,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(w / 2, 6);
  ctx.bezierCurveTo(w * 0.95, h * 0.45, w * 0.95, h * 0.95, w / 2, h * 0.96);
  ctx.bezierCurveTo(w * 0.05, h * 0.95, w * 0.05, h * 0.45, w / 2, 6);
  ctx.fill();
  return toTexture(c);
}

export function makeGlowTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,230,200,0.55)");
  g.addColorStop(1, "rgba(255,200,160,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return toTexture(c);
}

/** Jute twine wrapped around the knife handle (as in the reference photo). */
export function makeTwineTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c8a572";
  ctx.fillRect(0, 0, w, h);
  for (let i = -h; i < h * 2; i += 16) {
    const g = ctx.createLinearGradient(0, i, 0, i + 16);
    g.addColorStop(0, "#8c6b3b");
    g.addColorStop(0.45, "#dcbb86");
    g.addColorStop(1, "#9c7a47");
    ctx.fillStyle = g;
    ctx.fillRect(0, i, w, 14);
  }
  const rand = seeded(5);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(70,45,20,${0.1 + rand() * 0.15})`;
    ctx.fillRect(rand() * w, rand() * h, 6, 1);
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 7);
  return t;
}

export function makeLaceTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fbf7f2";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#cdbfb0";
  ctx.lineWidth = 3;
  for (let x = 16; x < w; x += 32) {
    ctx.beginPath();
    ctx.arc(x, h / 2, 12, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 18, h / 2 + Math.sin(a) * 18, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

export function makeTagTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e9c9a6";
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#7a4a2a";
  ctx.font = "62px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♥", s / 2, s / 2 + 4);
  return toTexture(c);
}

export function makeSparkTexture(): THREE.CanvasTexture {
  const s = 64;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s / 2, 4);
  ctx.lineTo(s / 2, s - 4);
  ctx.moveTo(4, s / 2);
  ctx.lineTo(s - 4, s / 2);
  ctx.stroke();
  return toTexture(c);
}

/** A soft dark disc used as a contact shadow under the cake. */
export function makeShadowTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.25, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(60,20,40,0.55)");
  g.addColorStop(1, "rgba(60,20,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return toTexture(c);
}
