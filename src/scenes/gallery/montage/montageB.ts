import type { Layer, MontageSpec, Rect } from "./types";

/**
 * MONTAGE 2 — the bright strip montage with the second song.
 * Uses 8 photos. Put your own pictures in /public/gallery/montage-b/ with the same file names
 * (photo-1.jpg … photo-8.jpg). The animation never changes, only the pictures do.
 *
 *  photo-1  strip + opening full photo (2.9s) + closing photo (9.8s)
 *  photo-2  strip, full photo (3.5s), full photo (5.9s), spotlight (9.1s)
 *  photo-3  strip, full photo (5.4s), full photo (8.5s), spotlight (9.35s)
 *  photo-4  strip, spotlight (4.7s), full photo (6.5s)
 *  photo-5  strip, spotlight (4.2s), full photo (7.1s)
 *  photo-6  strip, full photo (7.9s)
 *  photo-7  strip, full photo (4.85s)
 *  photo-8  strip, spotlight (4.35s)
 */
const strip = (photo: number, rect: Rect, at: number): Layer => ({ photo, rect, at, enter: "strip", dur: 0.25, drift: 0.004 });
const stripes = (photo: number, at: number, extra: Partial<Layer> = {}): Layer => ({ photo, at, enter: "stripes", dur: 0.32, ...extra });
const full = (photo: number, at: number, extra: Partial<Layer> = {}): Layer => ({ photo, at, enter: "blurIn", dur: 0.35, dir: "y", from: 1.25, ...extra });
const spot = (photo: number, at: number, until: number, cx = 50, cy = 46): Layer => ({
  photo,
  at,
  until,
  enter: "spot",
  dur: until - at,
  spot: { cx, cy, r0: [16, 12], r1: [50, 40] },
});

export const montageB: MontageSpec = {
  id: "b",
  duration: 10.6,
  audio: "/gallery/music/montage-b.m4a",
  audioEnd: 10.6,
  photos: [
    { src: "/gallery/montage-b/photo-1.jpeg", focus: [60, 35] },
    { src: "/gallery/montage-b/photo-2.jpeg", focus: [50, 30] },
    { src: "/gallery/montage-b/photo-3.jpeg", focus: [50, 30] },
    { src: "/gallery/montage-b/photo-4.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-b/photo-5.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-b/photo-6.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-b/photo-7.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-b/photo-8.jpeg", focus: [50, 35] },
  ],
  layers: [
    // 0.12s — narrow photo strips open one after another and form a cluster
    strip(0, [14.3, 21, 11.4, 34.5], 0.12),
    strip(7, [26, 46.5, 11.3, 35.3], 0.25),
    strip(5, [28.7, 6, 11, 37.7], 0.37),
    strip(2, [41, 29, 11, 36], 0.5),
    strip(3, [54.7, 8.6, 12, 42], 0.62),
    strip(6, [54.7, 52, 12, 42], 0.75),
    strip(4, [68.7, 33.4, 13.6, 39], 0.87),
    // 2.85s — scan-line dissolve into the first full photo
    stripes(0, 2.85, { dur: 0.35 }),
    stripes(1, 3.5, { dur: 0.3 }),
    // 4.2s — three quick spotlights growing out of the dark
    { photo: -1, at: 4.2, until: 4.85 },
    spot(4, 4.2, 4.35),
    spot(7, 4.35, 4.7),
    spot(3, 4.7, 4.85),
    stripes(6, 4.85),
    full(2, 5.4),
    full(1, 5.92, { dir: "x", dur: 0.3, from: 1.15 }),
    full(3, 6.48, { dur: 0.3, from: 1.3 }),
    full(4, 7.1, { dur: 0.3, from: 1.3 }),
    stripes(5, 7.88),
    stripes(2, 8.48),
    // 9.1s — spotlights again, then the closing photo
    { photo: -1, at: 9.1, until: 9.75 },
    spot(1, 9.1, 9.35),
    spot(3, 9.35, 9.75),
    stripes(0, 9.75, { dur: 0.35 }),
  ],
};
