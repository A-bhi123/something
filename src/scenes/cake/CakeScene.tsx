import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FlowerRain } from "@/scenes/home/FlowerRain";
import { CakeStage, type StageEvent } from "./CakeStage";
import { DiscoLights } from "./DiscoLights";
import { playBirthdaySynth, type SongHandle } from "./birthdaySynth";
import { cakeConfig } from "./cakeConfig";
import { createConfetti } from "./confetti";
import "./CakeScene.css";

type Phase = "video" | "table" | "ready" | "cutting" | "celebrate";

type Props = {
  /** When given, a "continue" button appears after the celebration. */
  onContinue?: () => void;
};

/**
 * Scene: the cake video plays full screen, then the same cake is rebuilt in 3D on the party table, its candles are
 * lit, and the visitor taps the ribboned knife, which lifts itself and cuts a slice.
 */
export function CakeScene({ onContinue }: Props) {
  const reduce = useReducedMotion() === true;
  const [phase, setPhase] = useState<Phase>("video");
  const [needsTap, setNeedsTap] = useState(false);
  const [videoGone, setVideoGone] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hover, setHover] = useState(false);
  const [petals, setPetals] = useState(0);
  const [disco, setDisco] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const blurVideoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<CakeStage | null>(null);
  const songRef = useRef<{ stop: () => void } | null>(null);
  const timers = useRef<number[]>([]);
  const confettiApi = useRef<ReturnType<typeof createConfetti> | null>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // ---- 3D stage: built right away (behind the video) so the reveal never stutters ----
  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = new CakeStage({
      canvas,
      bgEl: bgRef.current!,
      hintEl: hintRef.current!,
      reducedMotion: reduce,
      onKnifeHover: setHover,
      onEvent: handleStageEvent,
    });
    stageRef.current = stage;
    if (import.meta.env.DEV) (window as unknown as { __cake?: CakeStage }).__cake = stage;
    const fit = () => stage.layout(window.innerWidth, window.innerHeight);
    fit();
    window.addEventListener("resize", fit);
    const confetti = createConfetti(confettiRef.current!);
    confettiApi.current = confetti;
    return () => {
      window.removeEventListener("resize", fit);
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
      songRef.current?.stop();
      confetti.stop();
      stage.dispose();
      stageRef.current = null;
      confettiApi.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStageEvent(e: StageEvent) {
    switch (e) {
      case "revealed":
        setPhase("table");
        break;
      case "ready":
        setPhase("ready");
        break;
      case "cutStart":
        setPhase("cutting");
        break;
      case "sliceFree":
        celebrate();
        break;
      case "done":
        later(() => setShowContinue(true), 2500);
        break;
    }
  }

  function celebrate() {
    setPhase("celebrate");
    setDisco(true);
    stageRef.current?.setDisco(true);
    setPetals((n) => n + 1);
    const confetti = confettiApi.current;
    confetti?.burst(110);
    // The recorded voice if there is one; otherwise a soft synthesised tune.
    let handle: SongHandle | { stop: () => void };
    let ended = () => {};
    if (cakeConfig.birthdayAudioUrl) {
      const a = new Audio(cakeConfig.birthdayAudioUrl);
      a.addEventListener("ended", () => ended());
      void a.play().catch(() => {});
      handle = { stop: () => a.pause() };
      let n = 1;
      const every = window.setInterval(() => {
        confetti?.burst(70);
        if (++n > 6) window.clearInterval(every);
      }, 3200);
      timers.current.push(every);
    } else {
      const s = playBirthdaySynth();
      handle = s;
      ended = () => confetti?.burst(150);
      s.onEnd(() => ended());
      for (let i = 1; i < 4; i++) later(() => confetti?.burst(70), (s.duration / 4) * i * 1000);
    }
    songRef.current = handle;
  }

  // ---- the video ----
  const startVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play()
      .then(() => {
        setNeedsTap(false);
        void blurVideoRef.current?.play().catch(() => {});
      })
      .catch(() => setNeedsTap(true));
  }, []);

  useEffect(() => {
    startVideo();
    const v = videoRef.current;
    return () => {
      v?.pause();
      blurVideoRef.current?.pause();
    };
  }, [startVideo]);

  function onVideoEnded() {
    setPhase("table");
    // Cross-fade from the last frame of the video to the table, and start building the cake underneath.
    setVideoGone(true);
    void stageRef.current?.reveal();
    later(() => setPetals((n) => n + 1), 800);
  }

  function skipVideo() {
    videoRef.current?.pause();
    blurVideoRef.current?.pause();
    onVideoEnded();
  }

  function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function onTimeUpdate() {
    const v = videoRef.current;
    if (v && barRef.current && v.duration) barRef.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
    const b = blurVideoRef.current;
    if (v && b && Math.abs(b.currentTime - v.currentTime) > 0.4) b.currentTime = v.currentTime;
  }

  return (
    <main className="cake" ref={rootRef} data-phase={phase}>
      {/* The party table: a blurred copy fills the screen, the sharp photo is placed so the stand lines up with the 3D cake. */}
      <div className="cake__fill" style={{ backgroundImage: `url(${cakeConfig.tableImage})` }} />
      <div className="cake__bg" ref={bgRef} style={{ backgroundImage: `url(${cakeConfig.tableImage})` }} />
      <div className="cake__warm" />
      <canvas className="cake__canvas" ref={canvasRef} />
      {disco && <DiscoLights />}
      {petals > 0 && <FlowerRain key={`rain-${petals}`} count={petals === 1 ? 45 : 70} spawnSeconds={petals === 1 ? 5 : 8} startDelay={0.2} seed={petals * 7} />}
      <canvas className="cake__confetti" ref={confettiRef} />

      {/* The knife hint: a pulsing ring that also works as a real button for keyboard and screen readers. */}
      <button
        type="button"
        ref={hintRef}
        className={`cake__hint${hover ? " is-hover" : ""}`}
        data-show="0"
        aria-label="Pick up the ribbon knife and cut the cake"
        onClick={() => void stageRef.current?.cut()}
      >
        <span className="cake__hint-ring" />
        <span className="cake__hint-label">{cakeConfig.hintText}</span>
      </button>

      <AnimatePresence>
        {phase === "ready" && (
          <motion.p key="ready" className="cake__caption" style={{ x: "-50%" }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.8 }}>
            {cakeConfig.readyLine}
          </motion.p>
        )}
        {phase === "celebrate" && (
          <motion.div key="celebrate" className="cake__celebrate" style={{ x: "-50%" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}>
            <h2>{cakeConfig.celebrateTitle}</h2>
            <p>{cakeConfig.celebrateLine}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContinue && onContinue && (
          <motion.button key="go" type="button" className="cake__continue" style={{ x: "-50%" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onClick={onContinue}>
            Aage chalein
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full-screen video layer */}
      <div className={`cake__video${videoGone ? " is-gone" : ""}`} aria-hidden={videoGone}>
        <video ref={blurVideoRef} className="cake__video-blur" src={cakeConfig.videoSrc} poster={cakeConfig.videoPoster} muted playsInline preload="auto" />
        <video
          ref={videoRef}
          className="cake__video-main"
          src={cakeConfig.videoSrc}
          poster={cakeConfig.videoPoster}
          playsInline
          preload="auto"
          onEnded={onVideoEnded}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => void blurVideoRef.current?.play().catch(() => {})}
          onPause={() => blurVideoRef.current?.pause()}
        />
        {needsTap && (
          <button type="button" className="cake__tap" onClick={startVideo}>
            <span>▶</span> Tap to play
          </button>
        )}
        <div className="cake__vbar">
          <div ref={barRef} />
        </div>
        <div className="cake__vtools">
          <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
            {fullscreen ? "⤡" : "⛶"}
          </button>
          <button type="button" onClick={skipVideo}>
            Skip
          </button>
        </div>
      </div>
    </main>
  );
}
