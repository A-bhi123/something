import { motion } from "motion/react";
import { seeded } from "@/lib/random";
import doorImage from "@/assets/scenes/login/images/entry-door.jpg";
import "./EntryDoor.css";

/**
 * The cartoon house door the visitor walks up to after entering the password.
 *
 * Everything inside `.entry__world` is drawn in "picture space" (percent of the picture), so the
 * camera (scale + move on `.entry__world`) and the door cut-out always line up.
 * LoginScene drives the sequence through these class names:
 *   .entry__world  - the camera
 *   .entry__leaf   - the door itself, swings on its right-hand hinge
 *   .entry__shade  - darkens the leaf as it turns away
 *   .entry__glow   - warm light that grows out of the doorway
 *   .entry__flood  - full-screen warm light the camera walks into
 */

const rand = seeded(61);
const drops = Array.from({ length: 70 }, () => ({
  x: rand() * 110 - 5,
  height: 36 + rand() * 70,
  duration: 0.7 + rand() * 0.6,
  delay: rand() * 1.5,
}));

export function EntryDoor({ live }: { live: boolean }) {
  return (
    <div className={`entry${live ? " entry--live" : ""}`} aria-hidden="true">
      {/* Door outline, used to cut the door out of the picture. Units are 0 to 1 of the door's own box. */}
      <svg className="entry__defs" width="0" height="0" focusable="false">
        <defs>
          <clipPath id="entry-door-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.014 0.018 L0.83 0.032 C0.93 0.046 1 0.085 1 0.13 L1 1 L0.014 1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Soft blurred copy of the picture fills the sides on wide screens. */}
      <div className="entry__backdrop" style={{ backgroundImage: `url(${doorImage})` }} />

      <div className="entry__world">
        <img className="entry__img" src={doorImage} alt="" decoding="async" draggable={false} />

        {/* Lantern glow that flickers like a flame */}
        <motion.span
          className="entry__lamp"
          style={{ left: "26.5%", top: "39.5%" }}
          animate={{ opacity: [0.55, 1, 0.7, 1, 0.6], scale: [0.95, 1.08, 0.98, 1.1, 0.95] }}
          transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.span
          className="entry__lamp"
          style={{ left: "81%", top: "40%" }}
          animate={{ opacity: [0.7, 1, 0.6, 1, 0.7], scale: [1, 1.1, 0.96, 1.08, 1] }}
          transition={{ duration: 3.9, ease: "easeInOut", repeat: Infinity, delay: 0.6 }}
        />

        <div className="entry__door">
          <div className="entry__interior" />
          <div className="entry__leaf">
            <img className="entry__leafimg" src={doorImage} alt="" decoding="async" draggable={false} />
            <span className="entry__shade" />
          </div>
        </div>

        <span className="entry__glow" />
      </div>

      {/* Rain that stays the same size however close the camera gets */}
      <div className="entry__rain">
        {drops.map((d, i) => (
          <span
            key={i}
            className="entry__drop"
            style={{
              left: `${d.x}%`,
              height: d.height,
              animationDuration: `${d.duration}s`,
              animationDelay: `-${d.delay}s`,
            }}
          />
        ))}
      </div>

      <span className="entry__flood" />
    </div>
  );
}
