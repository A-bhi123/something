/** A soft, bell-like "Happy Birthday" tune made with Web Audio. Used only until a real recording is uploaded. */
const NOTES: [number, number][] = [
  // [semitones from C4, beats]
  [7, 0.75], [7, 0.25], [9, 1], [7, 1], [12, 1], [11, 2],
  [7, 0.75], [7, 0.25], [9, 1], [7, 1], [14, 1], [12, 2],
  [7, 0.75], [7, 0.25], [19, 1], [16, 1], [12, 1], [11, 1], [9, 1],
  [17, 0.75], [17, 0.25], [16, 1], [12, 1], [14, 1], [12, 2],
];

export type SongHandle = { stop: () => void; duration: number; onEnd: (fn: () => void) => void };

export function playBirthdaySynth(): SongHandle {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  const beat = 0.58;
  let t = ctx.currentTime + 0.15;
  for (const [semi, beats] of NOTES) {
    const f = 261.63 * Math.pow(2, semi / 12);
    const dur = beats * beat;
    for (const [mult, vol, type] of [
      [1, 0.8, "triangle"],
      [2, 0.25, "sine"],
      [3, 0.08, "sine"],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.98);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur);
    }
    t += dur;
  }
  const duration = t - ctx.currentTime;
  let endFn: (() => void) | null = null;
  const timer = window.setTimeout(() => endFn?.(), duration * 1000);
  return {
    duration,
    onEnd: (fn) => {
      endFn = fn;
    },
    stop: () => {
      window.clearTimeout(timer);
      master.gain.cancelScheduledValues(0);
      master.gain.value = 0;
      void ctx.close().catch(() => {});
    },
  };
}
