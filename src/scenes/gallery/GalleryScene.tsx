import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MontageStage, type MontageStageHandle } from "./montage/MontageStage";
import { montageA } from "./montage/montageA";
import { montageB } from "./montage/montageB";
import type { MontageSpec } from "./montage/types";
import "./GalleryScene.css";

const MONTAGES: MontageSpec[] = [montageA, montageB];
const GAP_MS = 450; // black beat between the two montages
const END_FADE = 0.4; // seconds of music fade-out at the end of each montage

type Status = "loading" | "motion" | "blocked" | "playing" | "paused" | "gap" | "finished";

type Props = {
  /** When given, an "Aage badho" button appears at the end. */
  onContinue?: () => void;
};

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    // never wait forever on a slow connection
    window.setTimeout(resolve, 9000);
  });
}

/**
 * Scene 4: the photo montages. Each montage is an animation driven by the time of its own music track, so
 * picture and music always stay together. Music plays only while this scene is open and is stopped when it closes.
 */
export function GalleryScene({ onContinue }: Props) {
  const reduce = useReducedMotion() === true;
  const [status, setStatus] = useState<Status>("loading");
  const [chapter, setChapter] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showUi, setShowUi] = useState(true);

  const statusRef = useRef<Status>("loading");
  const chapterRef = useRef(0);
  const volumeRef = useRef({ volume: 1, muted: false });
  const audios = useRef<HTMLAudioElement[]>([]);
  const stage = useRef<MontageStageHandle>(null);
  const clock = useRef({ audioT: 0, perf: 0 });
  const timers = useRef<number[]>([]);
  const uiTimer = useRef<number>(0);

  const set = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  volumeRef.current = { volume, muted };

  // ---- audio elements (created once, always stopped on the way out) ----
  useEffect(() => {
    const list = MONTAGES.map((m) => {
      const a = new Audio(m.audio);
      a.preload = "auto";
      return a;
    });
    audios.current = list;
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      list.forEach((a) => {
        a.pause();
        a.removeAttribute("src");
        a.load();
      });
    };
  }, []);

  const startChapter = useCallback(
    async (index: number) => {
      const a = audios.current[index];
      if (!a) return;
      chapterRef.current = index;
      setChapter(index);
      a.currentTime = 0;
      clock.current = { audioT: 0, perf: performance.now() };
      try {
        await a.play();
        set("playing");
      } catch {
        // The browser wants a tap before it lets sound start.
        set("blocked");
      }
    },
    [set],
  );

  // ---- preload photos, then start ----
  useEffect(() => {
    let cancelled = false;
    const photos = MONTAGES.flatMap((m) => m.photos.map((p) => p.src));
    Promise.all(photos.map(preloadImage)).then(() => {
      if (cancelled) return;
      if (reduce) set("motion");
      else void startChapter(0);
    });
    return () => {
      cancelled = true;
    };
  }, [reduce, set, startChapter]);

  // ---- the frame loop: the music's clock drives the picture ----
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const ci = chapterRef.current;
      const spec = MONTAGES[ci];
      const a = audios.current[ci];
      if (!a) return;
      const st = statusRef.current;

      if (st === "gap" || st === "finished") {
        stage.current?.render(spec.duration);
        return;
      }
      if (st === "loading" || st === "motion") {
        stage.current?.render(-1);
        return;
      }

      // smooth the audio clock (currentTime only moves in small steps)
      const now = performance.now();
      if (a.currentTime !== clock.current.audioT) clock.current = { audioT: a.currentTime, perf: now };
      const t = clock.current.audioT + (a.paused ? 0 : Math.min((now - clock.current.perf) / 1000, 0.12));
      stage.current?.render(t);

      // volume (with a short fade-out at the end of the track)
      const { volume: v, muted: m } = volumeRef.current;
      const fade = Math.min(1, Math.max(0, (spec.audioEnd - t) / END_FADE));
      a.volume = m ? 0 : Math.min(1, Math.max(0, v * fade));

      if (st === "playing" && (t >= spec.audioEnd || a.ended)) {
        a.pause();
        if (ci < MONTAGES.length - 1) {
          set("gap");
          timers.current.push(window.setTimeout(() => void startChapter(ci + 1), GAP_MS));
        } else {
          set("finished");
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [set, startChapter]);

  // ---- controls ----
  const togglePlay = () => {
    const a = audios.current[chapterRef.current];
    if (!a) return;
    if (statusRef.current === "playing") {
      a.pause();
      set("paused");
    } else if (statusRef.current === "paused" || statusRef.current === "blocked") {
      void a.play().then(
        () => set("playing"),
        () => set("blocked"),
      );
    }
  };

  const skip = () => {
    const ci = chapterRef.current;
    audios.current[ci]?.pause();
    timers.current.forEach((t) => window.clearTimeout(t));
    if (ci < MONTAGES.length - 1) {
      set("gap");
      timers.current.push(window.setTimeout(() => void startChapter(ci + 1), GAP_MS));
    } else {
      set("finished");
    }
  };

  const replay = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    audios.current.forEach((a) => a.pause());
    void startChapter(0);
  };

  // controls fade away after a few seconds of no movement while playing
  const wake = useCallback(() => {
    setShowUi(true);
    window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => {
      if (statusRef.current === "playing") setShowUi(false);
    }, 3000);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(uiTimer.current);
  }, [wake, status]);

  const playing = status === "playing";
  const canControl = status === "playing" || status === "paused";

  return (
    <main className="gl" onPointerMove={wake} onPointerDown={wake}>
      <div className="gl__glow" aria-hidden="true" />

      <div className="gl__frame">
        <MontageStage key={chapter} ref={stage} spec={MONTAGES[chapter]} />

        <AnimatePresence>
          {status === "loading" && (
            <motion.div key="loading" className="gl__overlay" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="gl__spinner" />
              <p>Photos aur music taiyaar ho rahe hain…</p>
            </motion.div>
          )}

          {status === "blocked" && (
            <motion.div key="blocked" className="gl__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button type="button" className="gl__big" onClick={togglePlay} aria-label="Music ke saath shuru karo">
                <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </button>
              <p>Music ke saath shuru karne ke liye tap karo</p>
            </motion.div>
          )}

          {status === "motion" && (
            <motion.div key="motion" className="gl__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="gl__note">Is scene mein tez blur aur flashing wali animation hai, aur aapki device par “reduce motion” on hai.</p>
              <div className="gl__row">
                <button type="button" className="gl__btn" onClick={() => void startChapter(0)}>
                  Phir bhi dekho
                </button>
                <button type="button" className="gl__btn gl__btn--ghost" onClick={() => (onContinue ? onContinue() : set("finished"))}>
                  Chhod do
                </button>
              </div>
            </motion.div>
          )}

          {status === "finished" && (
            <motion.div key="finished" className="gl__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
              <div className="gl__row">
                <button type="button" className="gl__btn gl__btn--ghost" onClick={replay}>
                  Dobara dekho
                </button>
                {onContinue && (
                  <button type="button" className="gl__btn" onClick={onContinue}>
                    Aage badho
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {canControl && showUi && (
          <motion.div className="gl__bar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.3 }}>
            <button type="button" className="gl__icon" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button type="button" className="gl__icon" onClick={() => setMuted((m) => !m)} aria-label={muted || volume === 0 ? "Unmute" : "Mute"}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
                {muted || volume === 0 ? (
                  <path d="M15 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                ) : (
                  <path d="M15 9a4 4 0 010 6M17.5 6.5a8 8 0 010 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                )}
              </svg>
            </button>
            <input
              className="gl__vol"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              aria-label="Volume"
            />
            <span className="gl__count" aria-hidden="true">
              {chapter + 1} / {MONTAGES.length}
            </span>
            <button type="button" className="gl__icon" onClick={skip} aria-label="Agla hissa">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M6 5.5v13l9-6.5zM17 5.5h2.5v13H17z" fill="currentColor" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
