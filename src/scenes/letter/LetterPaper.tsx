import { motion, useTransform, type MotionValue } from "motion/react";
import { letterContent } from "./letterContent";
import { pageGeometry } from "./useLetterPages";

type Props = {
  pw: number;
  ph: number;
  /** Fold angles: second panel hangs from the first, third from the second. Start at 180 / -180 (folded), end at 0 / 0. */
  r2: MotionValue<number>;
  r3: MotionValue<number>;
  /** Handwriting starts when true. `instant` shows all the text at once (reduced motion). */
  writing: boolean;
  instant: boolean;
};

/** Word list with a global index so the handwriting reveal runs in one continuous sweep. */
function useWords() {
  let n = 0;
  return letterContent.body.map((b) => (b === "gap" ? "gap" : b.text.split(" ").map((w) => ({ w, i: n++ }))));
}

function Sheet({ idx, pw, ph, page = 0 }: { idx: number; pw: number; ph: number; page?: number }) {
  const blocks = useWords();
  const { lh, padTop, fontSize, lines } = pageGeometry(pw, ph);
  return (
    <div className="sheet" style={{ top: -idx * (ph / 3), height: ph }}>
      <div className="sheet__rules" style={{ top: padTop, backgroundSize: `100% ${lh}px` }} />
      <div className="sheet__header" style={{ top: padTop - lh * 0.25 }} />
      <div className="sheet__margin" />
      {/* Window of exactly `lines` ruled lines; `page` slides the text up so page 2, 3... continue where the last one ended. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: padTop, height: lines * lh, overflow: "hidden" }}>
        <div className="sheet__text" style={{ marginTop: -page * lines * lh, fontSize, lineHeight: `${lh}px` }}>
          {blocks.map((b, k) =>
            b === "gap" ? (
              <div key={k} style={{ height: lh }} />
            ) : (
              <p key={k}>
                {b.map((word, j) => (
                  <span key={j}>
                    <span className="sheet__w" style={{ ["--i" as string]: word.i }}>
                      {word.w}
                    </span>{" "}
                  </span>
                ))}
              </p>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Face({ idx, pw, ph }: { idx: number; pw: number; ph: number }) {
  return (
    <>
      <div className="fold__front" aria-hidden="true">
        <Sheet idx={idx} pw={pw} ph={ph} />
      </div>
      <div className="fold__back" />
    </>
  );
}

/**
 * A letter folded in three like a business letter. Panel 1 is fixed; panel 2 hangs from its bottom edge and panel 3
 * from panel 2's, so rotating them (nested 3D transforms) really unfolds the paper. Each panel shows its own third
 * of the same ruled sheet.
 */
export function LetterPaper({ pw, ph, r2, r3, writing, instant }: Props) {
  // Panels darken while they swing, like paper catching less light.
  const shade2 = useTransform(r2, [0, 90, 180], [0, 0.38, 0.12]);
  const shade3 = useTransform(r3, [-180, -90, 0], [0.12, 0.38, 0]);

  return (
    <div
      className={`paper ${writing ? "is-writing" : ""} ${instant ? "is-instant" : ""}`}
      style={{ width: pw, height: ph / 3 }}
    >
      <Face idx={0} pw={pw} ph={ph} />

      <motion.div className="fold" style={{ rotateX: r2, z: 1, transformOrigin: "50% 0%" }}>
        <Face idx={1} pw={pw} ph={ph} />
        <motion.div className="fold__shade" style={{ opacity: shade2 }} />
        <div className="fold__crease" />

        <motion.div className="fold" style={{ rotateX: r3, z: -1, transformOrigin: "50% 0%" }}>
          <Face idx={2} pw={pw} ph={ph} />
          <motion.div className="fold__shade" style={{ opacity: shade3 }} />
          <div className="fold__crease" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/** A flat, already-written page that continues the letter (page 1 = the second sheet). */
export function LetterExtraPage({ page, pw, ph, top }: { page: number; pw: number; ph: number; top: number }) {
  return (
    <div className="lt__extra is-instant" style={{ top, width: pw, height: ph }}>
      <Sheet idx={0} pw={pw} ph={ph} page={page} />
    </div>
  );
}
