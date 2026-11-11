type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; color: string; shape: 0 | 1; life: number };

const COLORS = ["#ff8fb8", "#ffd1e3", "#d9b25a", "#fff4d6", "#b497d6", "#ff5c9a", "#ffffff"];

/** Lightweight canvas confetti. `burst()` fires from both lower corners; everything is cleaned up by `stop()`. */
export function createConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let parts: P[] = [];
  let raf = 0;
  let running = false;
  let last = 0;

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener("resize", size);

  const tick = (now: number) => {
    const dt = Math.min(0.04, (now - (last || now)) / 1000);
    last = now;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight;
    ctx.clearRect(0, 0, W, Hh);
    for (const p of parts) {
      p.vy += 520 * dt;
      p.vx *= 1 - 0.9 * dt;
      p.vy *= 1 - 0.35 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.life -= dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    parts = parts.filter((p) => p.life > 0 && p.y < Hh + 40);
    if (parts.length) raf = requestAnimationFrame(tick);
    else {
      running = false;
      last = 0;
      ctx.clearRect(0, 0, W, Hh);
    }
  };

  function burst(count = 90) {
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight;
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      const ang = (left ? -1 : 1) * (0.25 + Math.random() * 0.55) - Math.PI / 2;
      const sp = 650 + Math.random() * 650;
      parts.push({
        x: left ? W * 0.04 : W * 0.96,
        y: Hh * 0.95,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        w: 6 + Math.random() * 8,
        h: 9 + Math.random() * 9,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 16,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.7 ? 1 : 0,
        life: 3.5 + Math.random() * 2.5,
      });
    }
    if (!running) {
      running = true;
      raf = requestAnimationFrame(tick);
    }
  }

  return {
    burst,
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      parts = [];
    },
  };
}
