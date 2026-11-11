import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export type Mood = "happy" | "smile";

/** One step of a conversation: either a spoken line or a silent pause. */
export type Beat =
  | { say: string; wave?: boolean; mood?: Mood; hold?: number }
  | { pause: number; mood?: Mood };

export type DialogueState = {
  /** Index of the beat playing now (-1 before it starts). */
  beat: number;
  /** The whole current line (empty during a pause). */
  full: string;
  /** The part of the line typed so far. */
  typed: string;
  speaking: boolean;
  mood: Mood;
  wave: boolean;
  done: boolean;
};

const initial: DialogueState = {
  beat: -1,
  full: "",
  typed: "",
  speaking: false,
  mood: "happy",
  wave: false,
  done: false,
};

type Options = {
  /** Milliseconds per typed character. */
  charDelay?: number;
  /** Wait before the first line. */
  startDelay?: number;
};

/** Plays a script one beat at a time with a typewriter effect. Starts when `start` becomes true. */
export function useDialogue(script: readonly Beat[], start: boolean, options: Options = {}): DialogueState {
  const { charDelay = 38, startDelay = 500 } = options;
  const reduceMotion = useReducedMotion();
  const reduceRef = useRef(false);
  reduceRef.current = reduceMotion === true;

  const [state, setState] = useState<DialogueState>(initial);

  useEffect(() => {
    if (!start) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    (async () => {
      await wait(startDelay);

      for (let i = 0; i < script.length; i++) {
        if (cancelled) return;
        const beat = script[i];

        if ("pause" in beat) {
          setState((s) => ({ ...s, beat: i, full: "", typed: "", speaking: false, mood: beat.mood ?? "smile", wave: false }));
          await wait(beat.pause);
          continue;
        }

        const chars = Array.from(beat.say);
        setState((s) => ({
          ...s,
          beat: i,
          full: beat.say,
          typed: reduceRef.current ? beat.say : "",
          speaking: !reduceRef.current,
          mood: beat.mood ?? "happy",
          wave: beat.wave ?? false,
        }));

        if (!reduceRef.current) {
          for (let c = 1; c <= chars.length; c++) {
            setState((s) => ({ ...s, typed: chars.slice(0, c).join("") }));
            const ch = chars[c - 1];
            const next = chars[c];
            const endOfSentence = ".?!".includes(ch) && (next === undefined || next === " ");
            await wait(charDelay + (endOfSentence ? 380 : ch === "," ? 160 : 0));
            if (cancelled) return;
          }
        }

        setState((s) => ({ ...s, typed: beat.say, speaking: false }));
        await wait(beat.hold ?? 1000);
      }

      if (!cancelled) setState((s) => ({ ...s, speaking: false, wave: false, done: true }));
    })();

    return () => {
      cancelled = true;
    };
  }, [start, script, startDelay, charDelay]);

  return state;
}
