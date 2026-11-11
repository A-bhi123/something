import type { Layer, MontageSpec, Rect } from "./types";

/**
 * MONTAGE 1 — the dark, fast collage with the first song.
 * Uses 6 photos. Put your own pictures in /public/gallery/montage-a/ with the same file names
 * (photo-1.jpg … photo-6.jpg). The animation never changes, only the pictures do.
 *
 *  photo-1  opens the montage (split into two bands), later small tiles and quick flashes
 *  photo-2  strips at 2s, small tiles, flashes
 *  photo-3  narrow window strip at 2s, small tiles
 *  photo-4  full screen at 3.5s, then tiles and flashes
 *  photo-5  tile that grows to full screen at 5.5s, flashes
 *  photo-6  tile that grows to full screen at 8s
 */
const pop = (photo: number, rect: Rect, at: number, extra: Partial<Layer> = {}): Layer => ({ photo, rect, at, enter: "pop", ...extra });
const full = (photo: number, at: number, extra: Partial<Layer> = {}): Layer => ({ photo, at, enter: "blurIn", dur: 0.35, ...extra });

export const montageA: MontageSpec = {
  id: "a",
  duration: 13.3,
  audio: "/gallery/music/montage-a.m4a",
  audioEnd: 13.3,
  photos: [
    { src: "/gallery/montage-a/photo-1.jpeg", focus: [45, 30] },
    { src: "/gallery/montage-a/photo-2.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-a/photo-3.jpeg", focus: [50, 40] },
    { src: "/gallery/montage-a/photo-4.jpeg", focus: [55, 35] },
    { src: "/gallery/montage-a/photo-5.jpeg", focus: [50, 35] },
    { src: "/gallery/montage-a/photo-6.jpeg", focus: [55, 35] },
  ],
  layers: [
    // 0.25s — photo 1 arrives split in two bands, both sliding in out of a horizontal blur
    { photo: 0, at: 0.25, rect: [0, 25.5, 100, 74.5], win: true, enter: "blurIn", dir: "x", dur: 0.55, from: 1.12, drift: 0.01 },
    { photo: 0, at: 0.4, rect: [0, 0, 100, 25.5], enter: "blurIn", dir: "x", dur: 0.5, zoom: 1.5, focus: [40, 15], sat: 0.35, from: 1.1 },
    // 1.65s — vertical strips of other photos slide over it
    { photo: 1, at: 1.65, rect: [0, 0, 62, 100], win: true, enter: "blurIn", dir: "x", dur: 0.45, from: 1.05 },
    { photo: 2, at: 1.85, rect: [62, 0, 12, 100], win: true, enter: "blurIn", dir: "y", dur: 0.35, from: 1.05 },
    { photo: 0, at: 1.95, rect: [74, 0, 26, 100], enter: "blurIn", dir: "x", dur: 0.4, zoom: 2.2, from: 1.05 },
    // 3.5s — photo 4 zooms in full screen
    full(3, 3.5, { dir: "y", dur: 0.45, from: 1.3 }),
    // 4.3s — first collage builds up, then photo 5 grows to fill the screen (5.5s)
    pop(1, [0, 10.5, 56, 19.5], 4.3),
    pop(0, [56, 11.5, 44, 21], 4.42, { zoom: 1.3 }),
    pop(2, [0, 54.5, 45, 35.5], 4.6),
    pop(5, [56, 54.5, 44, 35.5], 4.78),
    pop(4, [28, 33, 44, 34], 4.95, { grow: [5.7, 6.05] }),
    // 6.75s — second collage over photo 5, then photo 6 grows to full screen (8s)
    pop(2, [0, 10.5, 44, 44], 6.75),
    pop(1, [57, 10.5, 43, 45], 6.85),
    pop(3, [0, 54.5, 43, 34], 7.0),
    pop(0, [43, 59, 57, 34], 7.2),
    pop(5, [28, 30, 42, 56], 7.95, { grow: [8.0, 8.45] }),
    // 9.1s — third collage over photo 6, then photo 3 grows to full screen (10.15s)
    pop(3, [0, 10.5, 43, 38], 9.1),
    pop(0, [44, 11, 56, 38], 9.25),
    pop(4, [56, 55, 44, 35], 9.45),
    pop(1, [0, 54.5, 44, 34], 9.6),
    pop(2, [30, 32, 40, 38], 9.85, { grow: [10.15, 10.55] }),
    // 11s — rapid flashes of the photos
    full(3, 11.05, { dir: "x", from: 1.15 }),
    full(1, 11.45, { dir: "x", from: 1.1 }),
    full(5, 11.95, { dir: "y", dur: 0.25 }),
    full(4, 12.08, { dir: "x", dur: 0.25 }),
    full(0, 12.3, { dir: "y", dur: 0.3 }),
    full(3, 12.62, { dir: "x", dur: 0.3 }),
    full(1, 13.0, { dir: "x", dur: 0.25 }),
  ],
};
