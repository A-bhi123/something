import type { CSSProperties } from "react";

export type FlowerVariant = "blossom" | "sakura" | "daisy" | "petal";
export type FlowerPalette = { petal: string; edge: string; center: string };

export const flowerVariants: FlowerVariant[] = ["blossom", "sakura", "daisy", "petal"];

export const flowerPalettes: FlowerPalette[] = [
  { petal: "#ff8fb8", edge: "#e8628f", center: "#ffd45c" },
  { petal: "#ffc2d9", edge: "#f08fb4", center: "#ffe08a" },
  { petal: "#ffffff", edge: "#f3c6da", center: "#ffd45c" },
  { petal: "#d9b8ff", edge: "#b48be8", center: "#fff0a8" },
  { petal: "#ffc9a8", edge: "#f59f7a", center: "#fff0a8" },
  { petal: "#ff6f9f", edge: "#d94a7c", center: "#ffe08a" },
];

const spread = (n: number) => Array.from({ length: n }, (_, i) => (360 / n) * i);

/** The flower drawn on a 100x100 canvas, as an SVG group (so it can also sit inside bigger drawings). */
export function FlowerShape({ variant, palette }: { variant: FlowerVariant; palette: FlowerPalette }) {
  const stroke = { stroke: palette.edge, strokeWidth: 1.6, strokeLinejoin: "round" as const };

  switch (variant) {
    case "daisy":
      return (
        <g>
          {spread(10).map((a) => (
            <ellipse key={a} cx="50" cy="25" rx="7" ry="23" fill={palette.petal} {...stroke} transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="12" fill={palette.center} stroke="#e0a93a" strokeWidth="1.4" />
        </g>
      );
    case "sakura":
      return (
        <g>
          {spread(5).map((a) => (
            <path
              key={a}
              d="M50 52 C34 42 32 18 43 6 L50 14 L57 6 C68 18 66 42 50 52 Z"
              fill={palette.petal}
              {...stroke}
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="6" fill={palette.center} />
          {spread(5).map((a) => (
            <circle key={a} cx="50" cy="38" r="2" fill={palette.edge} transform={`rotate(${a + 36} 50 50)`} />
          ))}
        </g>
      );
    case "petal":
      return (
        <g>
          <path d="M50 6 C80 30 76 72 50 94 C24 72 20 30 50 6 Z" fill={palette.petal} {...stroke} />
          <path d="M50 16 C50 40 50 64 50 84" fill="none" stroke={palette.edge} strokeWidth="1.2" opacity="0.5" />
        </g>
      );
    case "blossom":
    default:
      return (
        <g>
          {spread(5).map((a) => (
            <ellipse key={a} cx="50" cy="27" rx="15" ry="24" fill={palette.petal} {...stroke} transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="10" fill={palette.center} stroke="#e0a93a" strokeWidth="1.4" />
        </g>
      );
  }
}

type FlowerProps = {
  variant?: FlowerVariant;
  palette?: FlowerPalette;
  className?: string;
  style?: CSSProperties;
};

export function Flower({ variant = "blossom", palette = flowerPalettes[0], className, style }: FlowerProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <FlowerShape variant={variant} palette={palette} />
    </svg>
  );
}
