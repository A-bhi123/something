import "./MontageStage.css";
import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef } from "react";
import { computeLayer } from "./engine";
import type { MontageSpec } from "./types";

export type MontageStageHandle = {
  /** Draw the montage as it looks at `t` seconds. Cheap enough to call every frame. */
  render: (t: number) => void;
};

type Props = { spec: MontageSpec };

/**
 * Draws one montage. It owns no clock: whoever plays the music calls `render(t)` with the music's time,
 * so picture and sound can never drift apart, and pausing the music freezes the picture.
 */
export const MontageStage = forwardRef<MontageStageHandle, Props>(function MontageStage({ spec }, ref) {
  const uid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const blurs = useRef<(SVGFEGaussianBlurElement | null)[]>([]);
  const disps = useRef<(SVGFEDisplacementMapElement | null)[]>([]);
  const fade = useRef<HTMLDivElement>(null);
  const scale = useRef(1);

  // Layers sorted by time so a later layer is always painted on top of an earlier one.
  const layers = useMemo(() => spec.layers.map((l, i) => ({ l, i })).sort((a, b) => a.l.at - b.l.at || a.i - b.i).map((x) => x.l), [spec]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      scale.current = el.clientHeight / 856;
    });
    ro.observe(el);
    scale.current = el.clientHeight / 856;
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      render(t: number) {
        const S = scale.current;
        layers.forEach((l, i) => {
          const el = tiles.current[i];
          if (!el) return;
          const st = computeLayer(l, t);
          if (!st || st.opacity <= 0.001) {
            if (el.style.display !== "none") el.style.display = "none";
            return;
          }
          if (el.style.display !== "block") el.style.display = "block";
          el.style.opacity = String(st.opacity);
          el.style.transform = `translate(${st.tx}%, ${st.ty}%) scale(${st.scale})`;
          if (st.rectChanged) {
            el.style.left = `${st.rect[0]}%`;
            el.style.top = `${st.rect[1]}%`;
            el.style.width = `${st.rect[2]}%`;
            el.style.height = `${st.rect[3]}%`;
          }
          el.style.clipPath = st.clip;
          el.style.webkitMaskImage = st.mask;
          el.style.maskImage = st.mask;

          const blurOn = st.bx > 0.4 || st.by > 0.4;
          const dispOn = st.disp > 0.5;
          const b = blurs.current[i];
          if (b) b.setAttribute("stdDeviation", `${(st.bx * S).toFixed(2)} ${(st.by * S).toFixed(2)}`);
          const d = disps.current[i];
          if (d) d.setAttribute("scale", (st.disp * S).toFixed(2));
          const f = `${blurOn || dispOn ? `url(#mt-b-${uid}-${i})` : ""}${dispOn ? ` url(#mt-d-${uid}-${i})` : ""}`;
          const sat = l.sat !== undefined && l.sat < 1 ? ` saturate(${l.sat})` : "";
          el.style.filter = (f + sat).trim() || "none";
        });
        // quick fade to black at the very end of the montage
        if (fade.current) {
          const k = Math.min(1, Math.max(0, (t - (spec.duration - 0.3)) / 0.3));
          fade.current.style.opacity = String(k);
        }
      },
    }),
    [layers, spec.duration, uid],
  );

  return (
    <div className="mt" ref={stageRef}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          {layers.map((l, i) => (
            <g key={i}>
              <filter id={`mt-b-${uid}-${i}`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
                <feGaussianBlur ref={(n) => void (blurs.current[i] = n)} stdDeviation="0 0" />
              </filter>
              {l.enter === "stripes" && (
                <filter id={`mt-d-${uid}-${i}`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                  <feTurbulence type="turbulence" baseFrequency="0.16 0.0004" numOctaves="1" seed={i + 3} result="n" />
                  <feDisplacementMap ref={(n) => void (disps.current[i] = n)} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="R" />
                </filter>
              )}
            </g>
          ))}
        </defs>
      </svg>

      {layers.map((l, i) => {
        const rect = l.rect ?? [0, 0, 100, 100];
        const photo = l.photo >= 0 ? spec.photos[l.photo] : undefined;
        const focus = l.focus ?? photo?.focus ?? [50, 40];
        const zoom = l.zoom ?? 1;
        const imgStyle: React.CSSProperties = l.win
          ? {
              left: `${(-rect[0] / rect[2]) * 100}%`,
              top: `${(-rect[1] / rect[3]) * 100}%`,
              width: `${(100 / rect[2]) * 100}%`,
              height: `${(100 / rect[3]) * 100}%`,
            }
          : { inset: 0 };
        return (
          <div
            key={i}
            ref={(n) => void (tiles.current[i] = n)}
            className="mt__tile"
            style={{
              left: `${rect[0]}%`,
              top: `${rect[1]}%`,
              width: `${rect[2]}%`,
              height: `${rect[3]}%`,
              transformOrigin: `${focus[0]}% ${focus[1]}%`,
              display: "none",
              background: photo ? undefined : "#000",
            }}
          >
            {photo && (
              <div
                className="mt__img"
                style={{
                  ...imgStyle,
                  backgroundImage: `url(${photo.src})`,
                  backgroundPosition: `${focus[0]}% ${focus[1]}%`,
                  transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                  transformOrigin: `${focus[0]}% ${focus[1]}%`,
                }}
              />
            )}
          </div>
        );
      })}
      <div className="mt__fade" ref={fade} />
    </div>
  );
});
