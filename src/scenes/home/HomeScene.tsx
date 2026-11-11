import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { transitions, useDialogue } from "@/animation";
import { useGatePhase } from "@/features/auth/GateContext";
import { Character } from "./Character";
import { FlowerRain } from "./FlowerRain";
import { StoryBackground } from "./StoryBackground";
import { welcomeScript } from "./script";
import "./HomeScene.css";

/**
 * The first scene after the gate opens.
 * Flowers start raining as the doors begin to part; the host starts talking once they are fully open.
 */
export function HomeScene({ onReady }: { onReady?: () => void }) {
  const phase = useGatePhase();
  const gateStarted = phase === "opening" || phase === "open";
  const gateOpen = phase === "open";

  const dialogue = useDialogue(welcomeScript, gateOpen, { startDelay: 900 });
  const [bursts, setBursts] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  function handleReady() {
    if (leaving) return;
    setBursts((n) => n + 1);
    setLeaving(true);
    // Let the flower burst play for a moment, then the next scene blooms in.
    leaveTimer.current = window.setTimeout(() => onReady?.(), 1100);
  }

  const bubbleVisible = dialogue.full !== "";
  const ghost = dialogue.full.slice(dialogue.typed.length);

  return (
    <main className="story">
      <StoryBackground />

      {gateStarted && <FlowerRain key="welcome-rain" startDelay={0.6} />}
      {bursts > 0 && <FlowerRain key={`burst-${bursts}`} count={55} spawnSeconds={2.5} startDelay={0} seed={bursts * 13} />}

      <div className="story__stage">
        <AnimatePresence>
          {bubbleVisible && (
            <motion.div
              key="bubble"
              className="bubble"
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={transitions.spring}
            >
              <p className="bubble__text" aria-live="polite" aria-label={dialogue.full}>
                <span aria-hidden="true">{dialogue.typed}</span>
                {/* The rest of the line is invisible but takes up room, so the bubble never jumps in size. */}
                <span className="bubble__ghost" aria-hidden="true">
                  {ghost}
                </span>
              </p>

              <AnimatePresence>
                {dialogue.done && (
                  <motion.button
                    type="button"
                    className="bubble__button"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={transitions.spring}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={leaving}
                    onClick={handleReady}
                  >
                    Yes, I'm ready ✨
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="story__character"
          initial={{ opacity: 0, y: 90, scale: 0.9 }}
          animate={gateStarted ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 90, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.9 }}
        >
          <Character speaking={dialogue.speaking} mood={dialogue.mood} wave={dialogue.wave} />
        </motion.div>
      </div>
    </main>
  );
}
